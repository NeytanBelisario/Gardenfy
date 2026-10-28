import assert from 'node:assert/strict';
import test from 'node:test';

import { PlantAnalysisError, normalizeAnalysisError } from '../src/features/plant-analysis/analysisErrors';
import { createPhotoRequestService, normalizeAnalysisPhoto } from '../src/features/plant-analysis/analysisService';
import { selectAnalysisPhoto, type PhotoPicker } from '../src/features/plant-analysis/photoSelection';
import { createSupabasePhotoTransport } from '../src/features/plant-analysis/supabaseAnalysis';
import { getClientAddress, hashQuotaKey } from '../supabase/functions/_shared/core';

const response = 'Nome: Jiboia (Epipremnum aureum)\nSaúde: Boa\nVitalidade: 80%\nRega: 4\nLuz: 6\nCrescimento: 30';
const photo = { uri: 'file:///cache/plant.jpg', base64: 'YWJj', mimeType: 'image/jpeg' };
const errorCode = (code: string) => (error: unknown) => error instanceof PlantAnalysisError && error.code === code;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (value: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}


test('image normalization strips data URI and whitespace and infers its mime type', () => {
  assert.deepEqual(normalizeAnalysisPhoto({ uri: photo.uri, base64: 'data:image/png;base64,YW\nJj' }), { ...photo, mimeType: 'image/png' });
  for (const invalid of [{}, { ...photo, uri: '' }, { ...photo, base64: '!!!' }, { ...photo, base64: 'a' }, { ...photo, mimeType: 'text/plain' }]) {
    assert.throws(() => normalizeAnalysisPhoto(invalid), errorCode('image'));
  }
});

test('image normalization uses encoded bytes when Android retains a PNG source MIME after JPEG compression', () => {
  const jpeg = '/9j/4AAQSkZJRg==';
  assert.equal(normalizeAnalysisPhoto({ uri: 'file:///cache/cropped.png', base64: jpeg, mimeType: 'image/png' }).mimeType, 'image/jpeg');
  for (const png of ['iVBORw0KGgo=', 'iVBORw0KGgqA', 'iVBORw0KGgrA']) {
    assert.equal(normalizeAnalysisPhoto({ uri: photo.uri, base64: png, mimeType: 'image/jpeg' }).mimeType, 'image/png');
  }
});

test('one transport call returns the shared parsed result and receives cancellation signal', async () => {
  let calls = 0;
  const analyze = createPhotoRequestService(async (received, signal) => {
    calls++;
    assert.deepEqual(received, photo);
    assert.equal(signal.aborted, false);
    return response;
  });
  assert.equal(await analyze(photo), response);
  assert.equal(calls, 1);
});

for (const [status, code] of [[400, 'configuration'], [401, 'configuration'], [402, 'configuration'], [403, 'configuration'], [404, 'configuration'], [429, 'rate-limit'], [503, 'unavailable']] as const) {
  test(`service maps HTTP ${status} to safe ${code} feedback without retrying other models`, async () => {
    let calls = 0;
    const analyze = createPhotoRequestService(async () => { calls++; throw { status, message: 'provider response and secret URL' }; });
    await assert.rejects(analyze(photo), errorCode(code));
    assert.equal(calls, 1);
  });
}

test('configuration and invalid response errors retain their categories; network errors never expose raw details', async () => {
  const configured = createPhotoRequestService(async () => { throw new PlantAnalysisError('configuration'); });
  await assert.rejects(configured(photo), errorCode('configuration'));
  const network = createPhotoRequestService(async () => { throw new TypeError('Network request failed with secret URL'); });
  await assert.rejects(network(photo), (error) => errorCode('network')(error) && !(error as Error).message.includes('secret'));
  assert.equal(normalizeAnalysisError(null).code, 'network');
});

test('timeout aborts transport, rejects promptly and ignores a late successful response', async () => {
  const pending = deferred<typeof response>();
  let received: AbortSignal | undefined;
  const analyze = createPhotoRequestService(async (_, signal) => { received = signal; return pending.promise; }, 10);
  await assert.rejects(analyze(photo), errorCode('timeout'));
  assert.equal(received?.aborted, true);
  pending.resolve(response);
});

test('user cancellation aborts transport and a late rejection cannot become a saved result', async () => {
  const pending = deferred<typeof response>();
  const entered = deferred<void>();
  let received: AbortSignal | undefined;
  const controller = new AbortController();
  const analyze = createPhotoRequestService(async (_, signal) => { received = signal; entered.resolve(); return pending.promise; });
  const task = analyze(photo, controller.signal);
  await entered.promise;
  controller.abort();
  await assert.rejects(task, errorCode('cancelled'));
  assert.equal(received?.aborted, true);
  pending.reject(new TypeError('late network rejection'));
});

test('already cancelled and immediately cancelled requests never dispatch to transport', async () => {
  let calls = 0;
  const analyze = createPhotoRequestService(async () => { calls++; return response; });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(analyze(photo, controller.signal), errorCode('cancelled'));
  const immediate = new AbortController();
  const task = analyze(photo, immediate.signal);
  immediate.abort();
  await assert.rejects(task, errorCode('cancelled'));
  assert.equal(calls, 0);
});

test('picker asks the correct permission before opening and cancellation produces no photo', async () => {
  const events: string[] = [];
  const picker: PhotoPicker = {
    async requestPermission(source) { events.push('permission:' + source); return { granted: true }; },
    async launch(source) { events.push('launch:' + source); return { canceled: true }; },
  };
  assert.equal(await selectAnalysisPhoto(picker, 'camera'), null);
  assert.deepEqual(events, ['permission:camera', 'launch:camera']);
  picker.launch = async () => ({ canceled: false, assets: [photo] });
  assert.deepEqual(await selectAnalysisPhoto(picker, 'gallery'), photo);
});

test('denied permission never opens picker and provides camera/gallery alternatives', async () => {
  let calls = 0;
  const picker: PhotoPicker = { async requestPermission() { return { granted: false }; }, async launch() { calls++; return { canceled: true }; } };
  await assert.rejects(selectAnalysisPhoto(picker, 'camera'), /câmera.*galeria/);
  await assert.rejects(selectAnalysisPhoto(picker, 'gallery'), /fotos.*câmera/);
  assert.equal(calls, 0);
});

test('permission errors, unavailable camera, missing asset and unreadable base64 have safe feedback', async () => {
  const picker: PhotoPicker = { async requestPermission() { throw new Error('private'); }, async launch() { return { canceled: false }; } };
  await assert.rejects(selectAnalysisPhoto(picker, 'camera'), /pedir acesso/);
  picker.requestPermission = async () => ({ granted: true });
  picker.launch = async () => { throw new Error('private'); };
  await assert.rejects(selectAnalysisPhoto(picker, 'camera'), /abrir a câmera/);
  picker.launch = async () => ({ canceled: false, assets: [] });
  await assert.rejects(selectAnalysisPhoto(picker, 'gallery'), errorCode('image'));
  picker.launch = async () => ({ canceled: false, assets: [{ uri: photo.uri }] });
  await assert.rejects(selectAnalysisPhoto(picker, 'gallery'), errorCode('image'));
});


test('server hashes the last forwarded address and never stores its raw value', async () => {
  const request = new Request('https://example.test', {
    headers: { 'x-forwarded-for': 'spoofed, 203.0.113.8' },
  });
  assert.equal(getClientAddress(request), '203.0.113.8');
  const hash = await hashQuotaKey(getClientAddress(request), 'test-salt');
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(hash.includes('203.0.113.8'), false);
  assert.equal(hash, await hashQuotaKey('203.0.113.8', 'test-salt'));
});

test('client transport sends only image data with the publishable key and forwards cancellation', async () => {
  const controller = new AbortController();
  let receivedInit: RequestInit | undefined;
  const transport = createSupabasePhotoTransport(
    { url: 'https://gardenfy.supabase.co/', publishableKey: 'public-key' },
    'identify-plant',
    (payload) => payload,
    async (_, init) => {
      receivedInit = init;
      return Response.json(response);
    },
  );
  assert.deepEqual(await transport(photo, controller.signal), response);
  assert.equal((receivedInit?.headers as Record<string, string>).apikey, 'public-key');
  assert.equal(receivedInit?.signal, controller.signal);
  assert.deepEqual(JSON.parse(receivedInit?.body as string), { base64: photo.base64, mimeType: photo.mimeType });
});

test('client transport preserves safe server errors and rejects malformed responses', async () => {
  const parse = (payload: unknown) => {
    if (!payload || typeof payload !== 'object' || !('suggestions' in payload)) throw new PlantAnalysisError('invalid-response');
    return payload;
  };
  const call = (result: Response) => createPhotoRequestService(createSupabasePhotoTransport(
    { url: 'https://gardenfy.supabase.co', publishableKey: 'public-key' },
    'identify-plant',
    parse,
    async () => result,
  ))(photo, new AbortController().signal);
  await assert.rejects(call(Response.json({ error: 'rate-limit' }, { status: 429 })), errorCode('rate-limit'));
  await assert.rejects(call(Response.json({ error: 'private detail' }, { status: 500 })), errorCode('unavailable'));
  await assert.rejects(call(Response.json({ value: 'missing suggestions' })), errorCode('invalid-response'));
  await assert.rejects(
    createSupabasePhotoTransport({}, 'identify-plant', parse, async () => Response.json(response))(photo, new AbortController().signal),
    errorCode('configuration'),
  );
});

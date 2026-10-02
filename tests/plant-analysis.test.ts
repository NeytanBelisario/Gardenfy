import assert from 'node:assert/strict';
import test from 'node:test';

import { PlantAnalysisError, normalizeAnalysisError } from '../src/features/plant-analysis/analysisErrors';
import { parseGeminiAnalysisResponse } from '../src/features/plant-analysis/analysisParser';
import { createPlantAnalysisService, normalizeAnalysisPhoto } from '../src/features/plant-analysis/analysisService';
import { selectAnalysisPhoto, type PhotoPicker } from '../src/features/plant-analysis/photoSelection';
import { plantMatchesCatalogChoice } from '../src/features/plant-analysis/plantMatch';

const response = 'Nome: Jiboia (Epipremnum aureum)\nSaúde: Boa\nVitalidade: 80%\nRega: 4\nLuz: 6\nCrescimento: 30';
const photo = { uri: 'file:///cache/plant.jpg', base64: 'YWJj', mimeType: 'image/jpeg' };
const errorCode = (code: string) => (error: unknown) => error instanceof PlantAnalysisError && error.code === code;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (value: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('parser normalizes common name, health casing and accents while preserving valid zeros', () => {
  const parsed = parseGeminiAnalysisResponse(response.replace('Boa', 'CRÍTICA').replace('80%', '0%').replace('Rega: 4', 'Rega: 0/10').replace('Luz: 6', 'Luz: 0/10').replace('30', '0 dias'));
  assert.deepEqual(parsed, { plantName: 'Jiboia', health: 'Critica', vitality: 0, water: 0, light: 0, growthDays: 0 });
});

test('parser accepts CRLF, blank lines and units and does not truncate numbers', () => {
  const parsed = parseGeminiAnalysisResponse('\n' + response.replace('Rega: 4', 'Rega: 10/10').replace('Luz: 6', 'Luz: 10').replace('30', '120 dias').replace(/\n/g, '\r\n\r\n') + '\n');
  assert.equal(parsed.water, 10);
  assert.equal(parsed.light, 10);
  assert.equal(parsed.growthDays, 120);
});

for (const [name, invalid] of [
  ['missing field', response.replace('Nome: Jiboia (Epipremnum aureum)\n', '')],
  ['empty common name', response.replace('Jiboia (Epipremnum aureum)', '(Epipremnum aureum)')],
  ['duplicate field', response + '\nLuz: 6'],
  ['unknown health', response.replace('Boa', 'Saudável')],
  ['partial health match', response.replace('Boa', 'Boa demais')],
  ['negative number', response.replace('Rega: 4', 'Rega: -1')],
  ['out of range water', response.replace('Rega: 4', 'Rega: 11')],
  ['out of range light', response.replace('Luz: 6', 'Luz: 1000')],
  ['out of range vitality', response.replace('80%', '101%')],
  ['decimal', response.replace('Rega: 4', 'Rega: 4.5')],
  ['unexpected suffix', response.replace('Rega: 4', 'Rega: 4 recomendado')],
  ['unsafe growth integer', response.replace('30', '9007199254740992')],
  ['extra prose', response + '\nEsta é uma estimativa.'],
  ['empty response', ''],
] as const) {
  test(`parser rejects ${name} without exposing provider response`, () => {
    assert.throws(() => parseGeminiAnalysisResponse(invalid), errorCode('invalid-response'));
  });
}

test('image normalization strips data URI and whitespace and infers its mime type', () => {
  assert.deepEqual(normalizeAnalysisPhoto({ uri: photo.uri, base64: 'data:image/png;base64,YW\nJj' }), { ...photo, mimeType: 'image/png' });
  for (const invalid of [{}, { ...photo, uri: '' }, { ...photo, base64: '!!!' }, { ...photo, base64: 'a' }, { ...photo, mimeType: 'text/plain' }]) {
    assert.throws(() => normalizeAnalysisPhoto(invalid), errorCode('image'));
  }
});

test('one transport call returns the shared parsed result and receives cancellation signal', async () => {
  let calls = 0;
  const analyze = createPlantAnalysisService(async (received, signal) => {
    calls++;
    assert.deepEqual(received, photo);
    assert.equal(signal.aborted, false);
    return response;
  });
  assert.equal((await analyze(photo)).plantName, 'Jiboia');
  assert.equal(calls, 1);
});

for (const [status, code] of [[400, 'configuration'], [401, 'configuration'], [403, 'configuration'], [404, 'configuration'], [429, 'rate-limit'], [503, 'unavailable']] as const) {
  test(`service maps HTTP ${status} to safe ${code} feedback without retrying other models`, async () => {
    let calls = 0;
    const analyze = createPlantAnalysisService(async () => { calls++; throw { status, message: 'provider response and secret URL' }; });
    await assert.rejects(analyze(photo), errorCode(code));
    assert.equal(calls, 1);
  });
}

test('configuration and invalid response errors retain their categories; network errors never expose raw details', async () => {
  const configured = createPlantAnalysisService(async () => { throw new PlantAnalysisError('configuration'); });
  await assert.rejects(configured(photo), errorCode('configuration'));
  const malformed = createPlantAnalysisService(async () => 'not a plant');
  await assert.rejects(malformed(photo), errorCode('invalid-response'));
  const network = createPlantAnalysisService(async () => { throw new TypeError('Network request failed with secret URL'); });
  await assert.rejects(network(photo), (error) => errorCode('network')(error) && !(error as Error).message.includes('secret'));
  assert.equal(normalizeAnalysisError(null).code, 'network');
});

test('timeout aborts transport, rejects promptly and ignores a late successful response', async () => {
  const pending = deferred<string>();
  let received: AbortSignal | undefined;
  const analyze = createPlantAnalysisService(async (_, signal) => { received = signal; return pending.promise; }, 10);
  await assert.rejects(analyze(photo), errorCode('timeout'));
  assert.equal(received?.aborted, true);
  pending.resolve(response);
});

test('user cancellation aborts transport and a late rejection cannot become a saved result', async () => {
  const pending = deferred<string>();
  const entered = deferred<void>();
  let received: AbortSignal | undefined;
  const controller = new AbortController();
  const analyze = createPlantAnalysisService(async (_, signal) => { received = signal; entered.resolve(); return pending.promise; });
  const task = analyze(photo, controller.signal);
  await entered.promise;
  controller.abort();
  await assert.rejects(task, errorCode('cancelled'));
  assert.equal(received?.aborted, true);
  pending.reject(new TypeError('late network rejection'));
});

test('already cancelled and immediately cancelled requests never dispatch to transport', async () => {
  let calls = 0;
  const analyze = createPlantAnalysisService(async () => { calls++; return response; });
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

test('catalog matching handles accents and a different identification is surfaced for review', () => {
  const analysis = parseGeminiAnalysisResponse(response);
  assert.equal(plantMatchesCatalogChoice({ name: 'Jibóia', subtitle: '' }, analysis), true);
  assert.equal(plantMatchesCatalogChoice({ name: 'Samambaia', subtitle: '' }, analysis), false);
});

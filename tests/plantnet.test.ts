import assert from 'node:assert/strict';
import test from 'node:test';
import { IdentificationError, MAX_IDENTIFICATION_BASE64, mapPlantNetStatus, parseIdentificationRequest, parsePlantNetResponse, requestPlantNet, stripImageMetadata } from '../supabase/functions/identify-plant/core';
import { createPhotoRequestService } from '../src/features/plant-analysis/analysisService';
import { createSupabasePhotoTransport } from '../src/features/plant-analysis/supabaseAnalysis';
import { PlantAnalysisError } from '../src/features/plant-analysis/analysisErrors';
import { isPlantCandidate } from '../src/features/plant-identification/types';
import { parseIdentificationPayload } from '../src/features/plant-identification/identificationService';

const jpeg = { base64: '/9j/AAAA', mimeType: 'image/jpeg' };
const provider = { results: [
  { score: 0.3, species: { scientificNameWithoutAuthor: 'Pilea peperomioides', commonNames: [] } },
  { score: 0.8, species: { scientificNameWithoutAuthor: 'Monstera deliciosa', commonNames: ['Costela-de-adão'] } },
] };

test('PlantNet parser sorts suggestions and uses scientific name when no common name exists', () => {
  const { candidates } = parsePlantNetResponse(provider);
  assert.equal(candidates[0].scientificName, 'Monstera deliciosa');
  assert.equal(candidates[1].commonName, 'Pilea peperomioides');
  assert.ok(candidates.every(isPlantCandidate));
});

test('PlantNet empty and malformed results have distinct safe errors', () => {
  assert.throws(() => parsePlantNetResponse({ results: [] }), (error) => error instanceof IdentificationError && error.code === 'not-found');
  for (const malformed of [null, {}, { results: [{}] }, { results: [{ ...provider.results[0], score: 3 }] }]) {
    assert.throws(() => parsePlantNetResponse(malformed), (error) => error instanceof IdentificationError && error.code === 'invalid-response');
  }
});

test('identification rejects unsupported, oversized or mislabeled image bytes before contacting provider', () => {
  assert.equal(parseIdentificationRequest(jpeg).bytes[0], 255);
  assert.equal(parseIdentificationRequest({ base64: 'iVBORw0KGgo=', mimeType: 'image/png' }).bytes[0], 137);
  for (const invalid of [null, { ...jpeg, mimeType: 'image/webp' }, { ...jpeg, base64: 'YWJj' }, { ...jpeg, mimeType: 'image/png' }, { ...jpeg, base64: 'A'.repeat(MAX_IDENTIFICATION_BASE64 + 4) }]) {
    assert.throws(() => parseIdentificationRequest(invalid), (error) => error instanceof IdentificationError && error.code === 'image');
  }
});

test('PlantNet transport sends multipart photo and secret only to official server endpoint', async () => {
  let calls = 0;
  const signal = new AbortController().signal;
  const result = await requestPlantNet(parseIdentificationRequest(jpeg), 'test-secret', signal, async (url, init) => {
    calls++;
    const endpoint = new URL(String(url));
    assert.equal(endpoint.origin, 'https://my-api.plantnet.org');
    assert.equal(endpoint.searchParams.get('api-key'), 'test-secret');
    assert.equal(endpoint.searchParams.get('lang'), 'pt');
    assert.equal(init?.signal, signal);
    assert.ok(init?.body instanceof FormData);
    assert.equal(init.body.get('organs'), 'auto');
    assert.ok(init.body.get('images') instanceof Blob);
    return Response.json(provider);
  });
  assert.equal(calls, 1);
  assert.equal(result.candidates[0].confidence, 0.8);
});

test('provider errors and network exceptions never expose API key or response', async () => {
  for (const [status, code] of [[403, 'configuration'], [404, 'not-found'], [429, 'rate-limit'], [503, 'unavailable']] as const) {
    assert.equal(mapPlantNetStatus(status).code, code);
    await assert.rejects(requestPlantNet(parseIdentificationRequest(jpeg), 'secret', new AbortController().signal,
      async () => new Response('private', { status })), (error) => error instanceof IdentificationError && error.code === code && !error.message.includes('private'));
  }
  await assert.rejects(requestPlantNet(parseIdentificationRequest(jpeg), 'secret', new AbortController().signal,
    async () => { throw new Error('https://private?api-key=secret'); }), (error) => error instanceof IdentificationError && !error.message.includes('secret'));
});

test('client identification uses new function and sends no nickname, species choice or provider token', async () => {
  const response = parsePlantNetResponse(provider);
  const transport = createSupabasePhotoTransport({ url: 'https://example.supabase.co', publishableKey: 'public-key' }, 'identify-plant', (payload) => payload, async (url, init) => {
    assert.equal(url, 'https://example.supabase.co/functions/v1/identify-plant');
    assert.deepEqual(JSON.parse(init.body as string), jpeg);
    return Response.json(response);
  });
  assert.deepEqual(await createPhotoRequestService(transport)({ uri: 'file:///plant.jpg', ...jpeg }), response);
  const failed = createSupabasePhotoTransport({ url: 'https://example.supabase.co', publishableKey: 'public-key' }, 'identify-plant', (payload) => payload,
    async () => Response.json({ error: 'not-found' }, { status: 422 }));
  await assert.rejects(createPhotoRequestService(failed)({ uri: 'file:///plant.jpg', ...jpeg }), (error) => error instanceof PlantAnalysisError && error.code === 'not-found');
});

test('client refuses malformed, duplicate and oversized suggestion lists before species review', () => {
  const valid = parsePlantNetResponse(provider).candidates;
  assert.deepEqual(parseIdentificationPayload({ candidates: [...valid].reverse() }), valid);
  for (const payload of [null, {}, { candidates: [valid[0], valid[0]] },
    { candidates: [...valid, ...valid] }, { candidates: [{ ...valid[0], confidence: -1 }] },
    { candidates: [{ ...valid[0], scientificName: ' ' }] }]) {
    assert.throws(() => parseIdentificationPayload(payload), (error) => error instanceof PlantAnalysisError && error.code === 'invalid-response');
  }
  assert.throws(() => parseIdentificationPayload({ candidates: [] }), (error) => error instanceof PlantAnalysisError && error.code === 'not-found');
});

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));
const segment = (marker: number, payload: number[]) => [0xff, marker, (payload.length + 2) >> 8, (payload.length + 2) & 0xff, ...payload];
const includesText = (bytes: Uint8Array, text: string) => Buffer.from(bytes).includes(Buffer.from(text));

test('photo metadata (GPS, device, comments) is removed before reaching Pl@ntNet', () => {
  const jfif = segment(0xe0, ascii('JFIF\0\x01\x01\0\0\x01\0\x01\0\0'));
  const exif = segment(0xe1, ascii('Exif\0\0GPS-22.9,-43.2 Pixel'));
  const comment = segment(0xfe, ascii('casa da Ana'));
  const scan = [0xff, 0xda, 0x00, 0x08, 1, 2, 3, 4, 5, 6, 0x11, 0x22, 0xff, 0xd9];
  const bytes = Uint8Array.from([0xff, 0xd8, ...jfif, ...exif, ...comment, ...scan]);
  const parsed = parseIdentificationRequest({ base64: Buffer.from(bytes).toString('base64'), mimeType: 'image/jpeg' });
  assert.deepEqual([...parsed.bytes], [0xff, 0xd8, ...jfif, ...scan]);
  assert.ok(!includesText(parsed.bytes, 'GPS') && !includesText(parsed.bytes, 'Ana'));

  const chunk = (type: string, data: number[]) => [0, 0, data.length >> 8, data.length & 0xff, ...ascii(type), ...data, 0, 0, 0, 0];
  const header = [137, 80, 78, 71, 13, 10, 26, 10];
  const ihdr = chunk('IHDR', new Array(13).fill(1));
  const idat = chunk('IDAT', [9, 9, 9]);
  const iend = chunk('IEND', []);
  const png = Uint8Array.from([...header, ...ihdr, ...chunk('tEXt', ascii('Author\0Ana')), ...chunk('eXIf', ascii('GPS')), ...idat, ...iend]);
  assert.deepEqual([...stripImageMetadata(png, 'image/png')], [...header, ...ihdr, ...idat, ...iend]);
});

test('photos without metadata or with an unexpected structure are sent unchanged', () => {
  const clean = Uint8Array.from([0xff, 0xd8, ...segment(0xdb, [0, 1, 2]), 0xff, 0xda, 0x00, 0x02, 7, 0xff, 0xd9]);
  assert.equal(stripImageMetadata(clean, 'image/jpeg'), clean);
  const truncated = Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0x40, 0x00, 1, 2]);
  assert.equal(stripImageMetadata(truncated, 'image/jpeg'), truncated);
  assert.equal(parseIdentificationRequest(jpeg).bytes.length, 6);
});

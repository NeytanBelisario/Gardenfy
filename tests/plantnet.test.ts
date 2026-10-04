import assert from 'node:assert/strict';
import test from 'node:test';
import { IdentificationError, MAX_IDENTIFICATION_BASE64, mapPlantNetStatus, parseIdentificationRequest, parsePlantNetResponse, requestPlantNet } from '../supabase/functions/identify-plant/core';
import { createPhotoRequestService } from '../src/features/plant-analysis/analysisService';
import { createSupabasePhotoTransport } from '../src/features/plant-analysis/supabaseAnalysis';
import { PlantAnalysisError } from '../src/features/plant-analysis/analysisErrors';
import { isPlantCandidate } from '../src/features/plant-identification/types';

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

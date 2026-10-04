import { normalizeAnalysisError, PlantAnalysisError } from './analysisErrors';
import { parseGeminiAnalysisResponse } from './analysisParser';

export type AnalysisPhoto = { uri: string; base64: string; mimeType: string };
export type AnalysisTransport = (photo: AnalysisPhoto, signal: AbortSignal) => Promise<string>;

export function normalizeAnalysisPhoto(photo: { uri?: string; base64?: string | null; mimeType?: string | null }): AnalysisPhoto {
  const dataUrl = photo.base64?.match(/^data:(image\/[\w.+-]+);base64,/);
  const base64 = photo.base64?.replace(/^data:image\/[\w.+-]+;base64,/, '').replace(/\s/g, '') ?? '';
  const mimeType = photo.mimeType ?? dataUrl?.[1] ?? 'image/jpeg';
  if (!photo.uri || !base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0 || !/^image\/[\w.+-]+$/.test(mimeType)) {
    throw new PlantAnalysisError('image');
  }
  return { uri: photo.uri, base64, mimeType };
}

export function createPhotoRequestService<T>(transport: (photo: AnalysisPhoto, signal: AbortSignal) => Promise<T>, timeoutMs = 30_000) {
  return async (photo: AnalysisPhoto, signal?: AbortSignal) => {
    if (signal?.aborted) throw new PlantAnalysisError('cancelled');
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let abort = () => {};
    const interrupted = new Promise<never>((_, reject) => {
      abort = () => { reject(new PlantAnalysisError('cancelled')); controller.abort(); };
      signal?.addEventListener('abort', abort, { once: true });
      timer = setTimeout(() => { reject(new PlantAnalysisError('timeout')); controller.abort(); }, timeoutMs);
    });
    try {
      const response = await Promise.race([Promise.resolve().then(() => {
        if (controller.signal.aborted) throw new PlantAnalysisError('cancelled');
        return transport(photo, controller.signal);
      }), interrupted]);
      if (controller.signal.aborted) throw new PlantAnalysisError('cancelled');
      return response;
    } catch (error) {
      throw normalizeAnalysisError(error);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  };
}

export function createPlantAnalysisService(transport: AnalysisTransport, timeoutMs = 30_000) {
  const request = createPhotoRequestService(transport, timeoutMs);
  return async (photo: AnalysisPhoto, signal?: AbortSignal) => parseGeminiAnalysisResponse(await request(photo, signal));
}

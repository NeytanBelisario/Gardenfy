import { ENV } from '../../constants/env';
import { PlantAnalysisError } from '../plant-analysis/analysisErrors';
import { createPhotoRequestService, type AnalysisPhoto } from '../plant-analysis/analysisService';
import { createSupabasePhotoTransport } from '../plant-analysis/supabaseAnalysis';
import { isPlantCandidate, type PlantCandidate } from './types';

export function parseIdentificationPayload(payload: unknown): PlantCandidate[] {
  const candidates = (payload as { candidates?: unknown } | null)?.candidates;
  if (!Array.isArray(candidates) || candidates.length > 3 || !candidates.every(isPlantCandidate) ||
    new Set(candidates.map((candidate) => candidate.scientificName)).size !== candidates.length) throw new PlantAnalysisError('invalid-response');
  if (!candidates.length) throw new PlantAnalysisError('not-found');
  return candidates.sort((a, b) => b.confidence - a.confidence);
}

const request = createPhotoRequestService(createSupabasePhotoTransport(
  { url: ENV.supabaseUrl, publishableKey: ENV.supabasePublishableKey }, 'identify-plant', parseIdentificationPayload,
));

export function identifyPlantPhoto(photo: AnalysisPhoto, signal?: AbortSignal) {
  if (!['image/jpeg', 'image/png'].includes(photo.mimeType)) return Promise.reject(new PlantAnalysisError('image'));
  return request(photo, signal);
}

export function identificationErrorMessage(error: unknown) {
  if (!(error instanceof PlantAnalysisError)) return error instanceof Error ? error.message : 'Não foi possível identificar. Tente novamente.';
  const messages = {
    configuration: 'A identificação por foto ainda não está disponível. Você pode adicionar pelo catálogo.',
    image: 'Escolha uma foto JPG ou PNG de uma única planta.',
    network: 'Não conseguimos conectar. Confira a internet ou adicione pelo catálogo.',
    timeout: 'A identificação demorou demais. Tente novamente ou use o catálogo.',
    cancelled: 'Identificação cancelada. Nenhuma alteração foi salva.',
    'invalid-response': 'Não recebemos uma identificação válida. Tente outra foto de perto, com boa luz.',
    'not-found': 'Não encontramos uma planta. Fotografe uma folha ou flor de perto, com boa luz.',
    'rate-limit': 'O limite de identificação foi atingido. Tente mais tarde ou use o catálogo.',
    unavailable: 'O serviço está indisponível agora. Você pode continuar pelo catálogo.',
  };
  return messages[error.code];
}

import { analyzePlantPhoto } from './geminiAnalysis';
import { usePlantPhotoRequest } from './usePlantPhotoRequest';

export function usePlantPhotoAnalysis() {
  const flow = usePlantPhotoRequest(analyzePlantPhoto, (error) => error instanceof Error ? error.message : 'Não foi possível analisar a foto. Tente novamente.');
  return { ...flow, draft: flow.draft ? { photo: flow.draft.photo, analysis: flow.draft.result } : null };
}

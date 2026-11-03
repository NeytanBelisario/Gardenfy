import { normalizeAnalysisPhoto, type AnalysisPhoto } from './analysisService';

export type PhotoSource = 'camera' | 'gallery';
export interface PhotoPicker {
  requestPermission(source: PhotoSource): Promise<{ granted: boolean }>;
  launch(source: PhotoSource): Promise<{ canceled: boolean; assets?: { uri?: string; base64?: string | null; mimeType?: string | null }[] | null }>;
}

export class PhotoSelectionError extends Error {}

export async function selectAnalysisPhoto(picker: PhotoPicker, source: PhotoSource): Promise<AnalysisPhoto | null> {
  let permission;
  try { permission = await picker.requestPermission(source); }
  catch { throw new PhotoSelectionError('Não foi possível pedir acesso às fotos. Tente novamente.'); }
  if (!permission.granted) {
    throw new PhotoSelectionError(source === 'camera'
      ? 'A câmera não foi autorizada. Autorize nas configurações do aparelho ou escolha uma foto da galeria.'
      : 'O acesso às fotos não foi autorizado. Autorize nas configurações do aparelho ou use a câmera.');
  }
  let result;
  try { result = await picker.launch(source); }
  catch { throw new PhotoSelectionError(source === 'camera' ? 'Não foi possível abrir a câmera. Tente a galeria.' : 'Não foi possível abrir a galeria. Tente novamente.'); }
  if (result.canceled) return null;
  return normalizeAnalysisPhoto(result.assets?.[0] ?? {});
}

import { useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ENV } from '../../constants/env';
import { PlantAnalysisError } from './analysisErrors';
import type { AnalysisPhoto } from './analysisService';
import { selectAnalysisPhoto, type PhotoPicker, type PhotoSource } from './photoSelection';

const picker: PhotoPicker = {
  requestPermission: (source) => source === 'camera' ? ImagePicker.requestCameraPermissionsAsync() : ImagePicker.requestMediaLibraryPermissionsAsync(),
  launch: (source) => {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, base64: true, quality: 0.8 };
    return source === 'camera' ? ImagePicker.launchCameraAsync(options) : ImagePicker.launchImageLibraryAsync(options);
  },
};

export function usePlantPhotoRequest<T>(request: (photo: AnalysisPhoto, signal?: AbortSignal) => Promise<T>, getErrorMessage: (error: unknown) => string) {
  const [phase, setPhase] = useState<'idle' | 'selecting' | 'analyzing' | 'saving'>('idle');
  const [draft, setDraft] = useState<{ photo: AnalysisPhoto; result: T } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [retryPhoto, setRetryPhoto] = useState<AnalysisPhoto | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);

  const run = async (source?: PhotoSource) => {
    if (busy.current) return;
    busy.current = true;
    setError(null); setNotice(null); setDraft(null);
    const abort = new AbortController();
    controller.current = abort;
    setPhase(source ? 'selecting' : 'analyzing');
    try {
      if (!ENV.supabaseUrl?.trim() || !ENV.supabasePublishableKey?.trim()) throw new PlantAnalysisError('configuration');
      const photo = source ? await selectAnalysisPhoto(picker, source) : retryPhoto;
      if (!mounted.current) return;
      if (abort.signal.aborted) throw new PlantAnalysisError('cancelled');
      if (!photo) { setNotice('Seleção cancelada. Nenhuma alteração foi salva.'); return; }
      setRetryPhoto(photo);
      setPhase('analyzing');
      const result = await request(photo, abort.signal);
      if (mounted.current && !abort.signal.aborted) { setDraft({ photo, result }); setRetryPhoto(null); }
    } catch (cause) {
      if (mounted.current) setError(getErrorMessage(cause));
    } finally {
      busy.current = false; controller.current = null;
      if (mounted.current) setPhase('idle');
    }
  };

  const save = async (operation: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true; setPhase('saving'); setError(null); setNotice(null);
    try {
      await operation();
      if (mounted.current) { setDraft(null); setRetryPhoto(null); setNotice('Identificação salva no jardim.'); }
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Não foi possível salvar. Tente novamente.');
    } finally {
      busy.current = false;
      if (mounted.current) setPhase('idle');
    }
  };

  return { phase, draft, error, notice, canRetry: !!retryPhoto, select: run, retry: () => run(), cancel: () => controller.current?.abort(), save,
    discard: () => { if (!busy.current) { setDraft(null); setRetryPhoto(null); setError(null); setNotice('Resultado descartado. Nenhuma alteração foi salva.'); } } };
}

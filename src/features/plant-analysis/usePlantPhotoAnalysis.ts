import { useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

import { ENV } from '../../constants/env';
import type { PlantAnalysisResult } from '../gardens/types';
import { PlantAnalysisError } from './analysisErrors';
import { type AnalysisPhoto } from './analysisService';
import { analyzePlantPhoto } from './geminiAnalysis';
import { selectAnalysisPhoto, type PhotoPicker, type PhotoSource } from './photoSelection';

const picker: PhotoPicker = {
  requestPermission: (source) => source === 'camera'
    ? ImagePicker.requestCameraPermissionsAsync() : ImagePicker.requestMediaLibraryPermissionsAsync(),
  launch: (source) => {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, base64: true, quality: 0.82 };
    return source === 'camera' ? ImagePicker.launchCameraAsync(options) : ImagePicker.launchImageLibraryAsync(options);
  },
};

export function usePlantPhotoAnalysis() {
  const [phase, setPhase] = useState<'idle' | 'selecting' | 'analyzing' | 'saving'>('idle');
  const [draft, setDraft] = useState<{ photo: AnalysisPhoto; analysis: PlantAnalysisResult } | null>(null);
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
    setError(null);
    setNotice(null);
    const abort = new AbortController();
    controller.current = abort;
    setPhase(source ? 'selecting' : 'analyzing');
    try {
      if (!ENV.supabaseUrl?.trim() || !ENV.supabasePublishableKey?.trim()) {
        throw new PlantAnalysisError('configuration');
      }
      const photo = source ? await selectAnalysisPhoto(picker, source) : retryPhoto;
      if (!mounted.current) return;
      if (!photo) { setNotice('Seleção cancelada. Os dados anteriores foram mantidos.'); return; }
      setRetryPhoto(photo);
      setPhase('analyzing');
      const analysis = await analyzePlantPhoto(photo, abort.signal);
      if (mounted.current) { setDraft({ photo, analysis }); setRetryPhoto(null); }
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Não foi possível analisar a foto. Tente novamente.');
    } finally {
      busy.current = false;
      controller.current = null;
      if (mounted.current) setPhase('idle');
    }
  };

  const save = async (operation: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setPhase('saving');
    setError(null);
    setNotice(null);
    try {
      await operation();
      if (mounted.current) { setDraft(null); setRetryPhoto(null); setNotice('Análise salva no jardim.'); }
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Não foi possível salvar. Tente novamente.');
    } finally {
      busy.current = false;
      if (mounted.current) setPhase('idle');
    }
  };

  return { phase, draft, error, notice, canRetry: !!retryPhoto, select: run, retry: () => run(),
    cancel: () => controller.current?.abort(), save,
    discard: () => { if (!busy.current) { setDraft(null); setRetryPhoto(null); setError(null); setNotice('Resultado descartado. Nenhuma alteração foi salva.'); } },
  };
}

import { ENV } from '../../constants/env';
import { createPlantAnalysisService } from './analysisService';
import { createSupabaseAnalysisTransport } from './supabaseAnalysis';

export { parseGeminiAnalysisResponse } from './analysisParser';

export const analyzePlantPhoto = createPlantAnalysisService(createSupabaseAnalysisTransport({
  url: ENV.supabaseUrl,
  publishableKey: ENV.supabasePublishableKey,
}));

import { GoogleGenerativeAI, GoogleGenerativeAIResponseError } from '@google/generative-ai';

import { ENV } from '../../constants/env';
import { PlantAnalysisError } from './analysisErrors';
import { createPlantAnalysisService } from './analysisService';

export { parseGeminiAnalysisResponse } from './analysisParser';

const prompt = `Analise uma foto de uma única planta. Identificação e indicadores são estimativas visuais, não medições de sensores. Se não houver planta ou não for possível analisar, não invente dados.
Retorne exatamente seis linhas, sem Markdown ou comentários:
Nome: [nome comum mais provável em português]
Saude: [Excelente, Boa, Regular, Ruim ou Critica]
Vitalidade: [inteiro de 0 a 100]%
Rega: [inteiro de 0 a 10]
Luz: [inteiro de 0 a 10]
Crescimento: [inteiro de dias estimados]
Rega e Luz representam estimativas visuais de água e exposição à luz de 0 (mínimo) a 10 (máximo), sem afirmar medições reais. Use apenas um nome comum; não inclua o científico entre parênteses.`;

export const analyzePlantPhoto = createPlantAnalysisService(async (photo, signal) => {
  if (!ENV.geminiApiKey?.trim()) throw new PlantAnalysisError('configuration');
  const client = new GoogleGenerativeAI(ENV.geminiApiKey);
  const model = client.getGenerativeModel({ model: ENV.geminiModel });
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { data: photo.base64, mimeType: photo.mimeType } }] }],
    }, { signal });
    return result.response.text();
  } catch (error) {
    if (error instanceof GoogleGenerativeAIResponseError) throw new PlantAnalysisError('invalid-response');
    throw error;
  }
});

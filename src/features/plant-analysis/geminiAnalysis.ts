import { GoogleGenerativeAI } from '@google/generative-ai';

import { ENV } from '../../constants/env';
import { PlantAnalysisResult } from '../gardens/types';

const genAI = ENV.geminiApiKey ? new GoogleGenerativeAI(ENV.geminiApiKey) : null;

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function cleanCommonPlantName(value: string) {
  return value
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .split(/\s+-\s+|\s+\/\s+|\s+\|\s+/)[0]
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseGeminiAnalysisResponse(responseText: string): PlantAnalysisResult {
  const nameMatch = responseText.match(/Nome:\s*(.+)/i);
  const healthMatch = responseText.match(
    /Sa[\u00fau]de:\s*(Excelente|Boa|Regular|Ruim|Cr[\u00ed\u00cdi]tica|Critica)/i
  );
  const vitalityMatch = responseText.match(/Vitalidade:\s*(\d{1,3})\s*%/i);
  const waterMatch = responseText.match(/Rega:\s*(\d{1,2})/i);
  const lightMatch = responseText.match(/Luz:\s*(\d{1,2})/i);
  const growthMatch = responseText.match(/Crescimento:\s*(\d+)/i);

  if (
    !nameMatch ||
    !healthMatch ||
    !vitalityMatch ||
    !waterMatch ||
    !lightMatch ||
    !growthMatch
  ) {
    throw new Error(`Resposta do Gemini fora do padrao esperado: ${responseText}`);
  }

  const normalizedHealth = healthMatch[1]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const healthMap: Record<string, PlantAnalysisResult['health']> = {
    excelente: 'Excelente',
    boa: 'Boa',
    regular: 'Regular',
    ruim: 'Ruim',
    critica: 'Critica',
  };
  const health = healthMap[normalizedHealth];

  if (!health) {
    throw new Error(`Nivel de saude desconhecido: ${healthMatch[1]}`);
  }

  return {
    plantName: cleanCommonPlantName(nameMatch[1]),
    health,
    vitality: clamp(Number(vitalityMatch[1]), 0, 100),
    water: clamp(Number(waterMatch[1]), 1, 10),
    light: clamp(Number(lightMatch[1]), 1, 10),
    growthDays: Math.max(0, Number(growthMatch[1])),
  };
}

export async function analyzePlantPhoto(
  base64String: string,
  mimeType = 'image/jpeg'
): Promise<PlantAnalysisResult> {
  if (!genAI) {
    throw new Error('EXPO_PUBLIC_GEMINI_API_KEY nao configurada.');
  }

  const prompt = `Atue como um especialista em botanica e analise de imagem. Ao receber uma imagem de uma planta, retorne estritamente os dados seguindo o padrao abaixo, sem textos introdutorios ou conclusivos.

Padrao de Resposta:

Nome: [Nome comum mais provavel da planta em portugues, sem nome cientifico]

Saude: [Escolha apenas um: Excelente, Boa, Regular, Ruim ou Critica]

Vitalidade: [Numero de 0 a 100]%

Rega: [Escala de 1 a 10]

Luz: [Escala de 1 a 10]

Crescimento: [Numero medio de dias]

Regras Adicionais:

No campo Nome, use um nome popular/comum, como "Espada de Sao Jorge", "Costela de Adao" ou "Jiboia". Nao retorne nome cientifico em latim, a menos que nao exista nome comum conhecido.

Se a planta estiver com manchas ou seca, reduza a Vitalidade e ajuste o nivel de Saude.

A escala de Rega 1 significa quase nada de agua e 10 solo sempre encharcado.

A escala de Luz 1 significa sombra total e 10 sol pleno direto.

Retorne exatamente 6 linhas, usando os mesmos rotulos do padrao.`;

  const imageParts = [
    {
      inlineData: {
        data: base64String,
        mimeType,
      },
    },
  ];

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }, ...imageParts] }],
      });

      console.log('Modelo Gemini utilizado:', modelName);
      return parseGeminiAnalysisResponse(result.response.text());
    } catch (error) {
      console.error(`Erro na chamada com ${modelName}:`, error);
    }
  }

  throw new Error('Nao foi possivel analisar a planta com Gemini.');
}

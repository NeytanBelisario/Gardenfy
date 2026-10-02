import type { PlantAnalysisResult } from '../gardens/types';
import { PlantAnalysisError } from './analysisErrors';

export function parseGeminiAnalysisResponse(text: string): PlantAnalysisResult {
  const lines = text.trim().split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const fields = new Map<string, string>();
  for (const line of lines) {
    const match = line.match(/^(Nome|Sa[úu]de|Vitalidade|Rega|Luz|Crescimento):\s*(.+)$/i);
    if (!match) throw new PlantAnalysisError('invalid-response');
    const key = match[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (fields.has(key)) throw new PlantAnalysisError('invalid-response');
    fields.set(key, match[2]);
  }
  if (fields.size !== 6) throw new PlantAnalysisError('invalid-response');
  const healthNames: Record<string, PlantAnalysisResult['health']> = {
    excelente: 'Excelente', boa: 'Boa', regular: 'Regular', ruim: 'Ruim', critica: 'Critica',
  };
  const healthKey = fields.get('saude')!.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const health = healthNames[healthKey];
  const plantName = fields.get('nome')!.replace(/\s*\([^)]*\)\s*/g, ' ').split(/\s+-\s+|\s+\/\s+|\s+\|\s+/)[0].replace(/\s+/g, ' ').trim();
  if (!health || !plantName) throw new PlantAnalysisError('invalid-response');
  const number = (key: string, pattern: RegExp, max: number) => {
    const match = fields.get(key)!.match(pattern);
    const value = match ? Number(match[1]) : NaN;
    if (!Number.isSafeInteger(value) || value < 0 || value > max) throw new PlantAnalysisError('invalid-response');
    return value;
  };
  return {
    plantName, health,
    vitality: number('vitalidade', /^(\d+)\s*%$/, 100),
    water: number('rega', /^(\d+)(?:\s*\/\s*10)?$/, 10),
    light: number('luz', /^(\d+)(?:\s*\/\s*10)?$/, 10),
    growthDays: number('crescimento', /^(\d+)(?:\s*dias?)?$/i, Number.MAX_SAFE_INTEGER),
  };
}

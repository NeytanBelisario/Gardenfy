export type AnalysisErrorCode = 'configuration' | 'image' | 'network' | 'timeout' | 'cancelled' | 'invalid-response' | 'rate-limit' | 'unavailable';

const messages: Record<AnalysisErrorCode, string> = {
  configuration: 'A análise por foto está indisponível nesta instalação. Confira a configuração do serviço.',
  image: 'Não foi possível ler esta foto. Escolha outra imagem.',
  network: 'Não foi possível conectar ao serviço. Confira a conexão e tente novamente.',
  timeout: 'A análise demorou demais. Tente novamente.',
  cancelled: 'Análise cancelada. Nenhuma alteração foi salva.',
  'invalid-response': 'O serviço não retornou uma análise válida. Tente outra foto bem iluminada.',
  'rate-limit': 'O limite de análises foi atingido. Aguarde e tente novamente.',
  unavailable: 'O serviço de análise está indisponível no momento. Tente novamente.',
};

export class PlantAnalysisError extends Error {
  constructor(public readonly code: AnalysisErrorCode) {
    super(messages[code]);
    this.name = 'PlantAnalysisError';
  }
}

export function normalizeAnalysisError(error: unknown): PlantAnalysisError {
  if (error instanceof PlantAnalysisError) return error;
  const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined;
  if (status === 429) return new PlantAnalysisError('rate-limit');
  if (status === 400 || status === 401 || status === 403 || status === 404) return new PlantAnalysisError('configuration');
  if (typeof status === 'number' && status >= 500) return new PlantAnalysisError('unavailable');
  return new PlantAnalysisError('network');
}

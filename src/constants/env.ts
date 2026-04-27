const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!geminiApiKey) {
  console.warn(
    'EXPO_PUBLIC_GEMINI_API_KEY nao definida. Configure o arquivo .env para habilitar a analise com Gemini.'
  );
}

export const ENV = {
  geminiApiKey,
} as const;

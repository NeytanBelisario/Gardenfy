export const ENV = {
  geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  geminiModel: process.env.EXPO_PUBLIC_GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite',
} as const;

export const ENV = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
} as const;

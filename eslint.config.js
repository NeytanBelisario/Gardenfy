const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  { ignores: ['dist/**', '.expo/**', 'android/**', 'ios/**', 'example/**', 'supabase/functions/*/index.ts'] },
  expoConfig,
]);

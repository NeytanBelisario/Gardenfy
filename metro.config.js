const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// Padrão do Expo, mais os identificadores que ligam cada erro ao source map.
const config = getSentryExpoConfig(__dirname);

if (!config.resolver.assetExts.includes('glb')) {
  config.resolver.assetExts.push('glb');
}

module.exports = config;

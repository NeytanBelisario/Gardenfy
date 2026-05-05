const { withProjectBuildGradle } = require('@expo/config-plugins');

const MARKER =
  '// ViroReact reads this generated file during Expo prebuild; the real setting is in gradle.properties: newArchEnabled=true';
const TOP_LEVEL_COMMENT =
  '// Top-level build file where you can add configuration options common to all sub-projects/modules.';

module.exports = function withViroNewArchMarker(config) {
  return withProjectBuildGradle(config, (config) => {
    const { contents } = config.modResults;

    if (contents.includes('newArchEnabled=true')) {
      return config;
    }

    config.modResults.contents = contents.includes(TOP_LEVEL_COMMENT)
      ? contents.replace(TOP_LEVEL_COMMENT, `${TOP_LEVEL_COMMENT}\n${MARKER}`)
      : `${MARKER}\n${contents}`;

    return config;
  });
};

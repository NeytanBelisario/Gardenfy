// query-string 7 uses a CommonJS decoder; the security fix in decoder 0.5 is ESM.
// Adapt that single import after npm ci, without replacing Expo/Router majors.
const fs = require('node:fs');
const path = require('node:path');

const consumers = ['expo-router', '@react-navigation/core'];
const entries = new Set(consumers.map((name) => require.resolve('query-string', {
  paths: [path.dirname(require.resolve(`${name}/package.json`))],
})));

for (const entry of entries) {
  const version = JSON.parse(fs.readFileSync(path.join(path.dirname(entry), 'package.json'), 'utf8')).version;
  if (!/^7\.1\./.test(version)) throw new Error(`Review the query-string decoder adapter for version ${version}`);
  const before = "const decodeComponent = require('decode-uri-component');";
  const after = "const decodeComponent = require('decode-uri-component').default;";
  const source = fs.readFileSync(entry, 'utf8');
  if (source.includes(after)) continue;
  if (!source.includes(before)) throw new Error('The query-string decoder import changed; review the adapter.');
  fs.writeFileSync(entry, source.replace(before, after));
}

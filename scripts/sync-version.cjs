const fs = require('fs');
const path = require('path');

const versionInput = process.argv[2];
if (!versionInput) {
  console.error('Usage: node scripts/sync-version.cjs <version>');
  process.exit(1);
}

const version = versionInput.replace(/^v/i, '');
const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
if (!match) {
  console.error(`Invalid version format: ${versionInput}`);
  process.exit(1);
}

const [, major, minor, patch] = match.map(Number);
const versionCode = major * 10000 + minor * 100 + patch;

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(path.join(process.cwd(), file), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

const app = readJson('app.json');
app.expo.version = version;
app.expo.android = app.expo.android || {};
app.expo.android.versionCode = versionCode;
app.expo.ios = app.expo.ios || {};
app.expo.ios.buildNumber = String(versionCode);
writeJson('app.json', app);

const pkg = readJson('package.json');
pkg.version = version;
writeJson('package.json', pkg);

if (fs.existsSync(path.join(process.cwd(), 'package-lock.json'))) {
  const lock = readJson('package-lock.json');
  lock.version = version;
  if (lock.packages && lock.packages['']) {
    lock.packages[''].version = version;
  }
  writeJson('package-lock.json', lock);
}

console.log(`Synced version ${version} (${versionCode})`);

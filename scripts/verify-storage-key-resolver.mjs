import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';

const outDir = '.tmp/storage-key-resolver-test';
if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true, force: true });
}

execFileSync(
  process.execPath,
  [
    'node_modules/typescript/bin/tsc',
    'src/api/storageKeyResolver.ts',
    '--outDir',
    outDir,
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    '--target',
    'ES2022',
    '--skipLibCheck',
    '--strict',
  ],
  { stdio: 'inherit' }
);

const resolver = await import(`../${outDir}/storageKeyResolver.js`);
const { LEGACY_FALLBACK_ENCRYPTION_KEY, resolveFallbackEncryptionKey } = resolver;

{
  const persisted = [];
  const key = resolveFallbackEncryptionKey({
    storedFallbackKey: null,
    hasLegacyFallbackData: () => true,
    generateKey: () => 'new-random-key',
    persistFallbackKey: (value) => persisted.push(value),
  });

  assert.equal(key, LEGACY_FALLBACK_ENCRYPTION_KEY);
  assert.deepEqual(persisted, [LEGACY_FALLBACK_ENCRYPTION_KEY]);
}

{
  const persisted = [];
  const key = resolveFallbackEncryptionKey({
    storedFallbackKey: 'existing-device-key',
    hasLegacyFallbackData: () => true,
    generateKey: () => 'new-random-key',
    persistFallbackKey: (value) => persisted.push(value),
  });

  assert.equal(key, 'existing-device-key');
  assert.deepEqual(persisted, []);
}

{
  const persisted = [];
  const key = resolveFallbackEncryptionKey({
    storedFallbackKey: null,
    hasLegacyFallbackData: () => false,
    generateKey: () => 'new-random-key',
    persistFallbackKey: (value) => persisted.push(value),
  });

  assert.equal(key, 'new-random-key');
  assert.deepEqual(persisted, ['new-random-key']);
}

console.log('storage key resolver checks passed');

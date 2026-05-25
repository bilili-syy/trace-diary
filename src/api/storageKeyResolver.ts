export const LEGACY_FALLBACK_ENCRYPTION_KEY = 'mind-garden-fallback-key';

interface FallbackKeyResolverOptions {
  storedFallbackKey: string | null;
  hasLegacyFallbackData: () => boolean;
  generateKey: () => string;
  persistFallbackKey: (key: string) => void;
}

export function resolveFallbackEncryptionKey({
  storedFallbackKey,
  hasLegacyFallbackData,
  generateKey,
  persistFallbackKey,
}: FallbackKeyResolverOptions): string {
  if (storedFallbackKey) {
    return storedFallbackKey;
  }

  if (hasLegacyFallbackData()) {
    persistFallbackKey(LEGACY_FALLBACK_ENCRYPTION_KEY);
    return LEGACY_FALLBACK_ENCRYPTION_KEY;
  }

  const newKey = generateKey();
  persistFallbackKey(newKey);
  return newKey;
}

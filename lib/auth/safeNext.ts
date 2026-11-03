const SAFE_NEXT_PATTERN = /^\/(?!\/)[A-Za-z0-9\-._~/%?=&#:@+,]{0,199}$/;

export function safeNext(value?: string | null): string {
  return value && SAFE_NEXT_PATTERN.test(value) ? value : "/";
}

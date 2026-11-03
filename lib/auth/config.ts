const envApiBase = process.env.NEXT_PUBLIC_API_BASE;

export const isMockMode =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" ||
  (!envApiBase && process.env.NODE_ENV !== "production");

export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

export const turnstileSiteKey = isMockMode
  ? null
  : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    (process.env.NODE_ENV !== "production" ? TURNSTILE_TEST_SITE_KEY : null);

export const turnstileUnavailable = !isMockMode && turnstileSiteKey === null;

import type {
  Detail,
  LoginBody,
  LoginResponse,
  RegisterBody,
  User,
  CalendarPrefs,
  UserPreferences,
} from "../api/types";
import { ApiError } from "../api/errors";
import { MOCK_MAIL_EVENT } from "../auth/mockEvents";

/*
 * Mock-only auth state is stored in localStorage under `skku-mock-auth`.
 * `rate@example.com` triggers 429 responses: login Retry-After 20 seconds,
 * mail requests Retry-After 30 seconds. A registration name of `captcha`
 * triggers captcha_failed.
 */

const STORAGE_KEY = "skku-mock-auth";
const DETAIL_MESSAGE =
  "요청을 받았습니다. 메일이 오지 않으면 스팸함을 확인하거나 잠시 후 다시 시도해 주세요.";
const VERIFY_DETAIL = "이메일이 인증되었습니다. 이제 로그인할 수 있습니다.";
const RESET_DETAIL = "비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;
const VERIFY_TOKEN_DURATION = 24 * 60 * 60 * 1000;
const RESET_TOKEN_DURATION = 60 * 60 * 1000;
const GOOGLE_REAUTH_WINDOW = 10 * 60 * 1000;

type MockAccount = User & {
  password: string | null;
  calendarPrefs: CalendarPrefs | null;
};

type MockToken = {
  token: string;
  userId: string;
  expiresAt: string;
};

type MockSession = {
  userId: string;
  createdAt: string;
  expiresAt: string;
};

type MockState = {
  accounts: MockAccount[];
  session: MockSession | null;
  verificationTokens: MockToken[];
  resetTokens: MockToken[];
};

type MockMail = {
  subject: string;
  href: string;
};

function emptyState(): MockState {
  return {
    accounts: [],
    session: null,
    verificationTokens: [],
    resetTokens: [],
  };
}

function readState(): MockState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyState();
    const state = parsed as Partial<MockState>;
    return {
      accounts: Array.isArray(state.accounts) ? state.accounts : [],
      session: state.session ?? null,
      verificationTokens: Array.isArray(state.verificationTokens)
        ? state.verificationTokens
        : [],
      resetTokens: Array.isArray(state.resetTokens) ? state.resetTokens : [],
    };
  } catch {
    return emptyState();
  }
}

function writeState(state: MockState): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now(): number {
  return Date.now();
}

function isoFromNow(milliseconds: number): string {
  return new Date(now() + milliseconds).toISOString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validationError(field: string, message: string): never {
  throw new ApiError(
    `요청 값이 올바르지 않습니다 (${field}): ${message}`,
    422,
  );
}

function validateEmail(email: string): string {
  const normalized = normalizeEmail(email);
  if (normalized.length === 0 || normalized.length > 320) {
    validationError("email", "이메일 주소를 확인해 주세요.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    validationError("email", "이메일 주소를 확인해 주세요.");
  }
  return normalized;
}

function validatePassword(password: string): void {
  if (password.length < 8 || password.length > 128) {
    validationError("password", "비밀번호는 8~128자로 입력해 주세요.");
  }
}

function validateName(name: string | undefined): string | null {
  if (name === undefined) return null;
  if (name.length > 100) validationError("name", "이름은 100자 이하로 입력해 주세요.");
  return name;
}

function toUser(account: MockAccount): User {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    email_verified: account.email_verified,
    has_password: account.has_password,
    google_linked: account.google_linked,
    created_at: account.created_at,
    preferences: {
      calendar: account.calendarPrefs,
    },
  };
}

function findSessionAccount(state: MockState): MockAccount {
  const session = state.session;
  if (!session || new Date(session.expiresAt).getTime() <= now()) {
    state.session = null;
    writeState(state);
    throw new ApiError("로그인이 필요합니다.", 401, "not_authenticated");
  }
  const account = state.accounts.find(({ id }) => id === session.userId);
  if (!account) {
    state.session = null;
    writeState(state);
    throw new ApiError("로그인이 필요합니다.", 401, "not_authenticated");
  }
  return account;
}

function emitMockMail(mail: MockMail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<MockMail>(MOCK_MAIL_EVENT, { detail: mail }),
  );
}

function createToken(): string {
  return createId();
}

function addVerificationToken(state: MockState, account: MockAccount): string {
  const token = createToken();
  state.verificationTokens = state.verificationTokens.filter(
    ({ userId }) => userId !== account.id,
  );
  state.verificationTokens.push({
    token,
    userId: account.id,
    expiresAt: isoFromNow(VERIFY_TOKEN_DURATION),
  });
  return token;
}

function addResetToken(state: MockState, account: MockAccount): string {
  const token = createToken();
  state.resetTokens = state.resetTokens.filter(
    ({ userId }) => userId !== account.id,
  );
  state.resetTokens.push({
    token,
    userId: account.id,
    expiresAt: isoFromNow(RESET_TOKEN_DURATION),
  });
  return token;
}

function rateLimitMail(email: string): void {
  if (email === "rate@example.com") {
    throw new ApiError(
      "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      429,
      "rate_limited",
      30,
    );
  }
}

function responseDetail(): Detail {
  return { detail: DETAIL_MESSAGE };
}

export async function mockRegister(body: RegisterBody): Promise<Detail> {
  const email = validateEmail(body.email);
  rateLimitMail(email);
  validatePassword(body.password);
  const name = validateName(body.name);
  if (name === "captcha") {
    throw new ApiError(
      "사람인지 확인하지 못했습니다. 다시 시도해 주세요.",
      400,
      "captcha_failed",
    );
  }

  const state = readState();
  const existing = state.accounts.find((account) => account.email === email);
  if (existing) {
    emitMockMail({ subject: "가입 안내", href: "/login" });
    return responseDetail();
  }

  const account: MockAccount = {
    id: createId(),
    email,
    name,
    email_verified: false,
    has_password: true,
    google_linked: false,
    created_at: new Date().toISOString(),
    password: body.password,
    calendarPrefs: null,
  };
  const token = addVerificationToken(state, account);
  state.accounts.push(account);
  writeState(state);
  emitMockMail({
    subject: "이메일 인증 안내",
    href: `/verify-email?token=${encodeURIComponent(token)}`,
  });
  return responseDetail();
}

export async function mockVerifyEmail(token: string): Promise<Detail> {
  const state = readState();
  const tokenIndex = state.verificationTokens.findIndex(
    (item) => item.token === token,
  );
  const storedToken = state.verificationTokens[tokenIndex];
  if (
    !storedToken ||
    new Date(storedToken.expiresAt).getTime() <= now()
  ) {
    throw new ApiError("유효하지 않거나 만료된 링크입니다.", 400, "invalid_token");
  }
  const account = state.accounts.find(({ id }) => id === storedToken.userId);
  if (!account) {
    throw new ApiError("유효하지 않거나 만료된 링크입니다.", 400, "invalid_token");
  }
  account.email_verified = true;
  state.verificationTokens.splice(tokenIndex, 1);
  writeState(state);
  return { detail: VERIFY_DETAIL };
}

export async function mockResendVerification(emailInput: string): Promise<Detail> {
  const email = validateEmail(emailInput);
  rateLimitMail(email);
  const state = readState();
  const account = state.accounts.find((item) => item.email === email);
  if (account && !account.email_verified) {
    const token = addVerificationToken(state, account);
    writeState(state);
    emitMockMail({
      subject: "이메일 인증 안내",
      href: `/verify-email?token=${encodeURIComponent(token)}`,
    });
  } else {
    emitMockMail({ subject: "이메일 인증 안내", href: "/login" });
  }
  return responseDetail();
}

export async function mockLogin(body: LoginBody): Promise<LoginResponse> {
  const email = normalizeEmail(body.email);
  if (email === "rate@example.com") {
    throw new ApiError(
      "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      429,
      "rate_limited",
      20,
    );
  }
  const state = readState();
  const account = state.accounts.find((item) => item.email === email);
  if (!account || account.password !== body.password) {
    throw new ApiError(
      "이메일 또는 비밀번호가 올바르지 않습니다.",
      401,
      "invalid_credentials",
    );
  }
  if (!account.email_verified) {
    throw new ApiError(
      "이메일 인증이 필요합니다. 받은 메일의 링크를 열어 주세요.",
      403,
      "email_not_verified",
    );
  }
  const createdAt = new Date().toISOString();
  state.session = {
    userId: account.id,
    createdAt,
    expiresAt: isoFromNow(SESSION_DURATION),
  };
  writeState(state);
  return {
    user: toUser(account),
    token: null,
    expires_at: state.session.expiresAt,
  };
}

export async function mockLogout(): Promise<void> {
  const state = readState();
  state.session = null;
  writeState(state);
}

export async function mockForgotPassword(emailInput: string): Promise<Detail> {
  const email = validateEmail(emailInput);
  rateLimitMail(email);
  const state = readState();
  const account = state.accounts.find((item) => item.email === email);
  if (account) {
    const token = addResetToken(state, account);
    writeState(state);
    emitMockMail({
      subject: "비밀번호 재설정 안내",
      href: `/reset-password?token=${encodeURIComponent(token)}`,
    });
  } else {
    emitMockMail({ subject: "비밀번호 재설정 안내", href: "/login" });
  }
  return responseDetail();
}

export async function mockResetPassword(
  token: string,
  password: string,
): Promise<Detail> {
  validatePassword(password);
  const state = readState();
  const tokenIndex = state.resetTokens.findIndex((item) => item.token === token);
  const storedToken = state.resetTokens[tokenIndex];
  if (
    !storedToken ||
    new Date(storedToken.expiresAt).getTime() <= now()
  ) {
    throw new ApiError("유효하지 않거나 만료된 링크입니다.", 400, "invalid_token");
  }
  const account = state.accounts.find(({ id }) => id === storedToken.userId);
  if (!account) {
    throw new ApiError("유효하지 않거나 만료된 링크입니다.", 400, "invalid_token");
  }
  account.password = password;
  account.has_password = true;
  state.resetTokens.splice(tokenIndex, 1);
  state.session = null;
  writeState(state);
  return { detail: RESET_DETAIL };
}

export async function mockGetMe(): Promise<User> {
  const state = readState();
  return toUser(findSessionAccount(state));
}

export async function mockDeleteMe(password?: string): Promise<void> {
  const state = readState();
  const account = findSessionAccount(state);
  const session = state.session;
  if (account.has_password) {
    if (!password || account.password !== password) {
      throw new ApiError("비밀번호가 올바르지 않습니다.", 403, "invalid_credentials");
    }
  } else if (
    !session ||
    now() - new Date(session.createdAt).getTime() > GOOGLE_REAUTH_WINDOW
  ) {
    throw new ApiError(
      "계정을 삭제하려면 다시 로그인해 주세요.",
      403,
      "reauth_required",
    );
  }
  state.accounts = state.accounts.filter(({ id }) => id !== account.id);
  state.session = null;
  state.verificationTokens = state.verificationTokens.filter(
    ({ userId }) => userId !== account.id,
  );
  state.resetTokens = state.resetTokens.filter(
    ({ userId }) => userId !== account.id,
  );
  writeState(state);
}

export async function mockUpdatePreferences(patch: {
  calendar?: CalendarPrefs | null;
}): Promise<UserPreferences> {
  const state = readState();
  const account = findSessionAccount(state);
  if (patch.calendar !== undefined) {
    account.calendarPrefs = patch.calendar;
  }
  writeState(state);
  return { calendar: account.calendarPrefs };
}

export async function mockGoogleLogin(): Promise<LoginResponse> {
  const state = readState();
  const email = "google@example.com";
  let account = state.accounts.find((item) => item.email === email);
  if (!account) {
    account = {
      id: createId(),
      email,
      name: "Google 사용자",
      email_verified: true,
      has_password: false,
      google_linked: true,
      created_at: new Date().toISOString(),
      password: null,
      calendarPrefs: null,
    };
    state.accounts.push(account);
  }
  const createdAt = new Date().toISOString();
  state.session = {
    userId: account.id,
    createdAt,
    expiresAt: isoFromNow(SESSION_DURATION),
  };
  writeState(state);
  return {
    user: toUser(account),
    token: null,
    expires_at: state.session.expiresAt,
  };
}

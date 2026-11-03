import type { AuthErrorCode } from "./types";

export class ApiError extends Error {
  status: number;
  code?: AuthErrorCode | string;
  retryAfter?: number;

  constructor(
    message: string,
    status: number,
    code?: AuthErrorCode | string,
    retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

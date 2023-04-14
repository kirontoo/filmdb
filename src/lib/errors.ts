type APIRequestErrorType =
  | "UnauthorizedError"
  | "QueryError"
  | "ValidationError";
export const ValidationError: APIRequestErrorType = "ValidationError";
export const UnauthorizedError: APIRequestErrorType = "UnauthorizedError";
export const QueryError: APIRequestErrorType = "QueryError";

export class APIError extends Error {
  __proto__ = Error;

  type: APIRequestErrorType;
  context?: Record<string, any>;

  constructor(
    message: string,
    type: APIRequestErrorType = QueryError,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = "APIRequestError";
    this.type = type;
    this.context = context;
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

type APIRequestErrorType =
  | "GenericError"
  | "UnauthorizedError"
  | "QueryError"
  | "ValidationError";
export const ValidationError: APIRequestErrorType = "ValidationError";
export const UnauthorizedError: APIRequestErrorType = "UnauthorizedError";
export const QueryError: APIRequestErrorType = "QueryError";
export const GenericError: APIRequestErrorType = "GenericError";

export class APIError extends Error {
  __proto__ = Error;

  type: APIRequestErrorType;
  context?: Record<string, any>;

  constructor(
    message: string,
    type: APIRequestErrorType = GenericError,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = "APIRequestError";
    this.type = type;
    this.context = context;
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

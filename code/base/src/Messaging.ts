import * as TC from "./TypeChecking";

export interface ICallRequest {
  clientIpAddress: string,
  url: string,
  data: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  headers: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  // LATER: Add other desired properties here
}

export interface ICallResult<T> {
  readonly success: boolean,
  readonly message: string,
  readonly payload: T | undefined,
}

/**
 * @constant
 * @type {string}
 * @default
 */
export const UNRECOGNIZED_ERROR_MESSAGE = "An unknown Error occurred"; // eslint-disable-line camelcase

/**
 * @constant
 * @type {boolean}
 * @default
 */
export const DEFAULT_RESULT_INCLUDES_ERROR = false; // eslint-disable-line camelcase

/**
 * Creates a result object representing a successful call.
 * @param {T | undefined} [payload=undefined] The payload to return for the call.
 * @param {string} [message=""] A descriptive message about the state of the call.
 * @return {ICallResult<T>} The result of the call.
 */
export function getSuccessResult<T>(payload: T | undefined = undefined, message = ""): ICallResult<T> {
  const result: ICallResult<T> = {
    success: true,
    message: message,
    payload: payload,
  };
  return result;
}

/**
 * Creates a result object representing a successful call.
 * @param {string} [message=""] A descriptive message about the state of the call.
 * @return {ICallResult<unknown>} The result of the call.
 */
export function getSuccessResultForMessage(message = ""): ICallResult<unknown> {
  const result = getSuccessResult<unknown>(undefined, message);
  return result;
}

/**
 * Creates a result object representing a failed call.
 * @param {unknown} caught The caught object encountered.
 * @param {boolean} [includeErrorInResult=Default_IncludeErrorInResult] Whether to return the actual error object as the payload or not.
 * @return {ICallResult<unknown>} The result of the call.
 */
export function getFailureResult(caught: unknown, includeErrorInResult: boolean = DEFAULT_RESULT_INCLUDES_ERROR): ICallResult<unknown> {
  if (TC.isNullishOrWhitespace(caught)) {
    const result: ICallResult<string | null | undefined> = {
      success: false,
      message: UNRECOGNIZED_ERROR_MESSAGE,
      payload: (includeErrorInResult) ? (caught as (string | null | undefined)) : undefined,
    };
    return result;
  } else if (TC.isString(caught)) {
    const result: ICallResult<string> = {
      success: false,
      message: (caught as string),
      payload: (includeErrorInResult) ? (caught as string) : undefined,
    };
    return result;
  } else if (TC.isOf<Error>(caught, (value) => (!TC.isNullishOrWhitespace(value.message)))) {
    const result = getErrorResult(caught as Error, includeErrorInResult);
    return result;
  } else {
    const result: ICallResult<unknown> = {
      success: false,
      message: UNRECOGNIZED_ERROR_MESSAGE,
      payload: (includeErrorInResult) ? caught : undefined,
    };
    return result;
  }
}

/**
 * Creates a result object representing the error from a failed call.
 * @param {Error} error The error encountered.
 * @param {boolean} [includeErrorInResult=Default_IncludeErrorInResult] Whether to return the actual error object as the payload or not.
 * @return {ICallResult<Error>} The result of the call.
 */
export function getErrorResult(error: Error, includeErrorInResult: boolean = DEFAULT_RESULT_INCLUDES_ERROR): ICallResult<Error> {
  const result: ICallResult<Error> = {
    success: false,
    message: error.message,
    payload: (includeErrorInResult) ? error : undefined,
  };
  return result;
}

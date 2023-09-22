export interface ICallResult<T> {
  readonly success: boolean,
  readonly message: string,
  readonly data: T | undefined
}

/**
 * @constant
 * @type {boolean}
 * @default
 */
export const Default_IncludeErrorInResult = false; // eslint-disable-line camelcase

/**
 * Creates a result object representing a successful call.
 * @param {string} message A descriptive message about the state of the call.
 * @param {T | undefined} [data=undefined] The data to return for the call.
 * @return {ICallResult<T>} The result of the call.
 */
export function getSuccessResult<T>(message: string, data: T | undefined = undefined): ICallResult<T> {
  const result: ICallResult<T> = {
    success: true,
    message: message,
    data: data,
  };
  return result;
}

/**
 * Creates a result object representing a failed call.
 * @param {Error} error The error encountered.
 * @param {boolean} [includeErrorInResult=Default_IncludeErrorInResult] Whether to return the actual error object as data or not.
 * @return {ICallResult<Error>} The result of the call.
 */
export function getFailureResult(error: Error, includeErrorInResult: boolean = Default_IncludeErrorInResult): ICallResult<Error> {
  const result: ICallResult<Error> = {
    success: false,
    message: error.message,
    data: (includeErrorInResult) ? error : undefined,
  };
  return result;
}

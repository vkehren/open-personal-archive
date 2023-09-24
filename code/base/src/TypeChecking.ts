import * as BT from "./BaseTypes";
import * as JGT from "jest-get-type";
import * as VC from "./ValueChecking";

// NOTE: The reason for this module is to draw sharp distinctions between types, which the "typeof" operator does NOT do,
//       as the "typeof" operator will return "object" for Array, Object, Date, and null.
const UndefinedType = "undefined";
const NullType = "null";
const FunctionType = "function";
const ArrayType = "array";
const ObjectType = "object";
const RegExpType = "regexp";
const MapType = "map";
const SetType = "set";
const DateType = "date";
const StringType = "string";
const BigIntType = "bigint";
const NumberType = "number";
const BooleanType = "boolean";

/**
 * Checks whether a given argument is undefined or not.
 * @param {unknown} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isUndefined(value: unknown): boolean {
  return (JGT.getType(value) == UndefinedType);
}

/**
 * Checks whether a given argument is null or not.
 * @param {unknown} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isNull(value: unknown): boolean {
  return (JGT.getType(value) == NullType);
}

/**
 * Checks whether a given argument is EITHER (null or undefined) OR not.
 * @param {unknown} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isNullish(value: unknown): boolean {
  if (isUndefined(value)) {
    return true;
  }
  if (isNull(value)) {
    return true;
  }
  return false;
}

/**
 * Checks whether a given argument is EITHER (null or undefined or "") OR not.
 * @param {unknown} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isNullishOrEmpty(value: unknown): boolean {
  if (isNullish(value)) {
    return true;
  }
  if (!isString(value)) {
    return false;
  }
  return VC.isEmpty(value + "");
}

/**
 * Checks whether a given argument is EITHER (null or undefined or "" or " ") OR not.
 * @param {unknown} value The value to check.
 * @param {boolean} [includeEmptyAsWhitespace=VC.Default_IncludeEmptyAsWhitespace] Whether to include the empty string as whitespace.
 * @return {boolean} The result of checking.
 */
export function isNullishOrWhitespace(value: unknown, includeEmptyAsWhitespace: boolean = VC.DEFAULT_WHITESPACE_INCLUDES_EMPTY_STRING): boolean {
  if (isNullish(value)) {
    return true;
  }
  if (!isString(value)) {
    return false;
  }
  return VC.isWhitespace(value + "", includeEmptyAsWhitespace);
}

/**
 * Checks whether a given argument is a function or not.
 * @param {unknown} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isFunction(value: unknown): boolean {
  return (JGT.getType(value) == FunctionType);
}

/**
 * Checks whether a given argument is an array or not.
 * @param {unknown} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isArray(value: unknown): boolean {
  return (JGT.getType(value) == ArrayType);
}

/**
 * Checks whether a given argument is an object (i.e. not a function, array, or date) or not.
 * @param {unknown} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isObject(value: unknown): boolean {
  return (JGT.getType(value) == ObjectType);
}

/**
 * Checks whether a given argument is a RegExp or not.
 * @param {unknown} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isRegExp(value: unknown): boolean {
  return (JGT.getType(value) == RegExpType);
}

/**
 * Checks whether a given argument is a Map or not.
 * @param {unknown} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isMap(value: unknown): boolean {
  return (JGT.getType(value) == MapType);
}

/**
 * Checks whether a given argument is a Set or not.
 * @param {unknown} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isSet(value: unknown): boolean {
  return (JGT.getType(value) == SetType);
}

/**
 * Checks whether a given argument is a Date or not.
 * @param {unknown} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isDate(value: unknown): boolean {
  return (JGT.getType(value) == DateType);
}

/**
 * Checks whether a given argument is a String or not.
 * @param {unknown} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isString(value: unknown): boolean {
  return (JGT.getType(value) == StringType);
}

/**
 * Checks whether a given argument is a BigInt or not.
 * @param {unknown} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isBigInt(value: unknown): boolean {
  return (JGT.getType(value) == BigIntType);
}

/**
 * Checks whether a given argument is a Number or not.
 * @param {unknown} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isNumber(value: unknown): boolean {
  return (JGT.getType(value) == NumberType);
}

/**
 * Checks whether a given argument is a Boolean or not.
 * @param {unknown} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isBoolean(value: unknown): boolean {
  return (JGT.getType(value) == BooleanType);
}

/**
 * Checks whether a given argument is of generic type T or not by applying a type guard (see https://www.typescriptlang.org/docs/handbook/advanced-types.html).
 * @param {unknown} value The value to check.
 * @param {BT.GuardFunc<T>} guardFunc The guard function to apply.
 * @return {boolean} The result of checking.
 */
export function isOf<T>(value: unknown, guardFunc: BT.GuardFunc<T>): value is T {
  if (isNullish(value)) {
    throw new Error("The value to check the type of must not be null or undefined.");
  }
  return guardFunc(value as T);
}

/**
 * Converts a value of unknown type to a value of type T.
 * @param {unknown} value The value to convert.
 * @param {BT.GuardFunc<T> | undefined} [guardFunc=undefined] The optional guard function to apply.
 * @return {T} The result of conversion.
 */
export function convertTo<T>(value: unknown, guardFunc: BT.GuardFunc<T> | undefined = undefined): T {
  if (isNullish(value)) {
    throw new Error("The value to convert must NOT be null or undefined.");
  }
  if (!isNullish(guardFunc)) {
    if (!isOf<T>(value, convertNonNullish(guardFunc))) {
      throw new Error("The value provided must be of type T.");
    }
  }
  return (value as T);
}

/**
 * Converts a nullish-able value of type T to a non-nullish value.
 * @param {T | null | undefined} value The value to convert.
 * @param {BT.DefaultFunc<T> | T | undefined} [defaultValue=undefined] The optional default value. If not specifed, providing a nullish value for the value will cause error.
 * @return {T} The result of conversion.
 */
export function convertNonNullish<T>(value: T | null | undefined, defaultValue: BT.DefaultFunc<T> | T | undefined = undefined): T {
  if (isNullish(value)) {
    if (isNullish(defaultValue)) {
      throw new Error("The value to convert must NOT be null or undefined, unless a default value is provided.");
    } else if (!isFunction(defaultValue)) {
      value = (defaultValue as T);
    } else {
      const defaultValueResult = (defaultValue as BT.DefaultFunc<T>)();
      if (isNullish(defaultValueResult)) {
        throw new Error("The value to convert must NOT be null or undefined, unless a default value is provided.");
      }
      value = defaultValueResult;
    }
  }
  return (value as T);
}

/**
 * Asserts that a value is NOT nullish.
 * @param {unknown} value The value to check.
 * @param {string} [message="A non-null value must be provided."] The message to display on failure of assertion.
 * @return {void}
 */
export function assertNonNullish(value: unknown, message = "A non-null value must be provided."): void {
  if (isNullish(value)) {
    throw new Error(message);
  }
}

/**
 * Asserts that a value is NOT nullish or whitespace.
 * @param {unknown} value The value to check.
 * @param {string} [message="A non-null, non-whitespace value must be provided."] The message to display on failure of assertion.
 * @return {void}
 */
export function assertNonNullishOrWhitespace(value: unknown, message = "A non-null, non-whitespace value must be provided."): void {
  if (isNullishOrWhitespace(value)) {
    throw new Error(message);
  }
}

/**
 * Asserts that a value IS nullish.
 * @param {unknown} value The value to check.
 * @param {string} [message="A null value was expected."] The message to display on failure of assertion.
 * @return {void}
 */
export function assertIsNullish(value: unknown, message = "A null value was expected."): void {
  if (!isNullish(value)) {
    throw new Error(message);
  }
}

/**
 * Asserts that a value IS nullish or whitespace.
 * @param {unknown} value The value to check.
 * @param {string} [message="A null, empty, or whitespace value was expected."] The message to display on failure of assertion.
 * @return {void}
 */
export function assertIsNullishOrWhitespace(value: unknown, message = "A null, empty, or whitespace value was expected."): void {
  if (!isNullishOrWhitespace(value)) {
    throw new Error(message);
  }
}

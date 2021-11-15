import * as JGT from "jest-get-type";
import * as VC from "./ValueChecking";

// NOTE: The reason for this module is to draw sharp distinctions between types, which the "typeof" operator does NOT do,
//       as the "typeof" operator will return "object" for Array, Object, Date, and null.
// export const name = "TypeChecking";
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
export function isNullishOrWhitespace(value: unknown, includeEmptyAsWhitespace: boolean = VC.Default_IncludeEmptyAsWhitespace): boolean {
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

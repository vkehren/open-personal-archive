import * as firestore from "@google-cloud/firestore";
import * as BT from "./BaseTypes";
import * as TC from "./TypeChecking";

/**
 * @constant
 * @type {string}
 * @default
 */
export const DEFAULT_WHITESPACE_INCLUDES_EMPTY_STRING = true; // eslint-disable-line camelcase

/**
 * Gets the size of (i.e. number of elements in) the value.
 * @param {string | Object | Array<any> | Map<any, any> | Set<any>} value The value to check.
 * @return {number} The size of the value.
 */
export function getSize(value: string | Object | Array<any> | Map<any, any> | Set<any>): number { // eslint-disable-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
  if (TC.isNullish(value)) {
    throw new Error("The value passed to getSize(...) must NOT be null or undefined.");
  }
  if (TC.isString(value)) {
    return (value as string).length;
  }
  if (TC.isObject(value)) {
    return (Object.getOwnPropertyNames(value).length + Object.getOwnPropertySymbols(value).length);
  }
  if (TC.isArray(value)) {
    return (value as Array<any>).length; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  if (TC.isMap(value)) {
    return (value as Map<any, any>).size; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  if (TC.isSet(value)) {
    return (value as Set<any>).size; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  return 0;
}

/**
 * Checks whether a given value contains any elements.
 * @param {string | Object | Array<any> | Map<any, any> | Set<any>} value The value to check.
 * @return {boolean} The result of checking.
 */
export function isEmpty(value: string | Object | Array<any> | Map<any, any> | Set<any>): boolean { // eslint-disable-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
  if (TC.isNullish(value)) {
    return false;
  }
  return (getSize(value) <= 0);
}

/**
 * Checks whether a given value is whitespace.
 * @param {string} value The value to check.
 * @param {boolean} [includeEmptyAsWhitespace=Default_IncludeEmptyAsWhitespace] Whether to include the empty string as whitespace.
 * @return {boolean} The result of checking.
 */
export function isWhitespace(value: string, includeEmptyAsWhitespace: boolean = DEFAULT_WHITESPACE_INCLUDES_EMPTY_STRING): boolean {
  if (TC.isNullish(value)) {
    return false;
  }
  if (includeEmptyAsWhitespace && isEmpty(value)) {
    return true;
  }
  return (value.trim().length <= 0);
}

/**
 * Gets the property keys specified directly on an object.
 * @param {unknown} obj The incoming object.
 * @return {Array<BT.KeyText>} The property keys for the object.
 */
export function getOwnPropertyKeys(obj: unknown): Array<BT.KeyText> {
  const ownNames = Object.getOwnPropertyNames(obj);
  const ownSymbolsAsNames = Object.getOwnPropertySymbols(obj).map((value) => value.toString());
  const ownCombined = (ownNames as Array<BT.KeyText>).concat(ownSymbolsAsNames);
  return ownCombined;
}

/**
 * Gets the property value specified directly on an object.
 * @param {unknown} obj The incoming object.
 * @param {BT.KeyText} propName The property name to get.
 * @return {T} The value for the property stored in the object.
 */
export function getOwnPropertyValue<T>(obj: unknown, propName: BT.KeyText): T {
  const propertyValue = (obj as Record<BT.KeyText, T>)[propName];
  return propertyValue;
}

/**
 * Gets the property key specified directly on type T as text.
 * @param {BT.TypedKeyText<T>} typedKey A property key that exists on type T.
 * @param {T | undefined} [obj=undefined] An object of type T.
 * @return {BT.KeyText} The property key as text.
 */
export function getTypedPropertyKeyAsText<T>(typedKey: BT.TypedKeyText<T>, obj: T | undefined = undefined): BT.KeyText { // eslint-disable-line @typescript-eslint/no-unused-vars
  const propertyKeyAsText = (typedKey as BT.KeyText);
  return propertyKeyAsText;
}

/**
 * Gets the property keys specified directly on type T as text.
 * @param {T} obj An object of type T.
 * @return {BT.ContainerOfTypedKeyText<T>} The object containing the property keys as text.
 */
export function getTypedPropertyKeysAsText<T>(obj: T): BT.ContainerOfTypedKeyText<T> {
  const propertyKeys = getOwnPropertyKeys(obj);
  const containerOfKeyText = {};
  propertyKeys.forEach((propertyKey) => {
    Object.defineProperty(containerOfKeyText, propertyKey, {value: (propertyKey as BT.TypedKeyText<T>), writable: false});
  });
  const containerOfTypedKeyText = (containerOfKeyText as BT.ContainerOfTypedKeyText<T>);
  return containerOfTypedKeyText;
}

/**
 * Gets a boolean from an uptyped value (i.e. a value of type "unknown").
 * @param {unknown} untypedValue The incoming value.
 * @param {boolean | undefined} defaultTypedValue The default value to use when the incoming value is null or undefined.
 * @return {boolean} The result of converting the untyped value to a boolean.
 */
export function getBoolean(untypedValue: unknown, defaultTypedValue: boolean | undefined = undefined): boolean | null | undefined {
  if (TC.isUndefined(untypedValue)) {
    if (!TC.isUndefined(defaultTypedValue)) {
      return defaultTypedValue;
    }
    return undefined;
  }
  if (TC.isNull(untypedValue) || isWhitespace(untypedValue + "", true)) {
    if (!TC.isUndefined(defaultTypedValue)) {
      return defaultTypedValue;
    }
    return null;
  }

  const untypedValueAsString = (untypedValue + "").toLowerCase();
  if (untypedValueAsString === (true + "")) {
    return true;
  } else if (untypedValueAsString === (false + "")) {
    return false;
  }

  const untypedValueAsNumber = Number.parseFloat(untypedValueAsString);
  if (!Number.isNaN(untypedValueAsNumber)) {
    return !!untypedValueAsNumber;
  } else if (!TC.isUndefined(defaultTypedValue)) {
    return defaultTypedValue;
  } else {
    return null;
  }
}

/**
 * Asserts that a value is true.
 * @param {boolean} value The value to check.
 * @param {string} [message="The value expected to be true was actually false."] The message to display on failure of assertion.
 * @return {void}
 */
export function assertIsTrue(value: boolean, message = "The value expected to be true was actually false."): void {
  if (!value) {
    throw new Error(message);
  }
}

/**
 * Asserts that a value is false.
 * @param {boolean} value The value to check.
 * @param {string} [message="The value expected to be false was actually true."] The message to display on failure of assertion.
 * @return {void}
 */
export function assertIsFalse(value: boolean, message = "The value expected to be false was actually true."): void {
  if (value) {
    throw new Error(message);
  }
}

/**
 * Returns whether two Dates or Timestamps are value-wise equivalent.
 * @param {firestore.Timestamp | Date | null | undefined} date1 The first date.
 * @param {firestore.Timestamp | Date | null | undefined} date2 The second date.
 * @return {boolean}
 */
export function areDatesEqual(date1: firestore.Timestamp | Date | null | undefined, date2: firestore.Timestamp | Date | null | undefined): boolean {
  const isDate1Nullish = TC.isNullish(date1);
  const isDate2Nullish = TC.isNullish(date2);
  if (isDate1Nullish && isDate2Nullish) {
    return true;
  }
  if (isDate1Nullish != isDate2Nullish) {
    return false;
  }

  const date1NonNull = TC.convertNonNullish(date1);
  const date2NonNull = TC.convertNonNullish(date2);
  const date1IsDate = TC.isDate(date1NonNull);
  const date2IsDate = TC.isDate(date2NonNull);

  if (date1IsDate && date2IsDate) {
    // NOTE: For Dates, operators "<", ">", "<=", ">=" seem to provide value-wise results, but "==" seems to test objects are the same instance
    const areEqual = ((date1NonNull <= date2NonNull) && (date1NonNull >= date2NonNull));
    return areEqual;
  } else {
    const date1AsTimestamp = (date1IsDate) ? firestore.Timestamp.fromDate(date1NonNull as Date) : (date1NonNull as firestore.Timestamp);
    const date2AsTimestamp = (date2IsDate) ? firestore.Timestamp.fromDate(date2NonNull as Date) : (date2NonNull as firestore.Timestamp);

    const areEqual = date1AsTimestamp.isEqual(date2AsTimestamp);
    return areEqual;
  }
}

/**
 * Asserts that two Dates or Timestamps are value-wise equivalent.
 * @param {firestore.Timestamp | Date | null | undefined} date1 The first date.
 * @param {firestore.Timestamp | Date | null | undefined} date2 The second date.
 * @param {string} [message="The two dates are not value-wise equivalent."] The message to display on failure of assertion.
 * @return {void}
 */
export function assertDatesAreEqual(date1: firestore.Timestamp | Date | null | undefined, date2: firestore.Timestamp | Date | null | undefined, message = "The two dates are not value-wise equivalent."): void { // eslint-disable-line max-len
  if (!areDatesEqual(date1, date2)) {
    throw new Error(message);
  }
}

/**
 * Returns whether a number is of another value.
 * @param {number | null | undefined} actual The actual value.
 * @param {number} desired The desired value.
 * @param {boolean} [checkBitWise=true] Whether to check bit-wise or logically.
 * @return {boolean}
 */
export function isOfValue(actual: number | null | undefined, desired: number, checkBitWise = true): boolean {
  if (TC.isNullish(actual)) {
    return false;
  }
  if (!checkBitWise) {
    return (actual == desired);
  }

  const actualNonNull = TC.convertNonNullish(actual);
  const containsValue = (actualNonNull & desired);
  return (actualNonNull == containsValue);
}

/**
 * Asserts that a number is of another value.
 * @param {number | null | undefined} actual The actual value.
 * @param {number} desired The desired value.
 * @param {boolean} [checkBitWise=true] Whether to check bit-wise or logically.
 * @param {string} [message="The actual value is not of the desired value."] The message to display on failure of assertion.
 * @return {void}
 */
export function assertIsOfValue(actual: number | null | undefined, desired: number, checkBitWise = true, message = "The actual value is not of the desired value."): void {
  if (!isOfValue(actual, desired, checkBitWise)) {
    throw new Error(message);
  }
}

/**
 * Parses the input as JSON only if parsing is necessary.
 * @param {string | unknown | null | undefined} input The input value.
 * @return {any}
 */
export function parseJsonIfNeeded(input: string | unknown | null | undefined): any { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (TC.isNullishOrWhitespace(input)) {
    return input;
  }
  if (TC.isObject(input)) {
    return input;
  }
  if (TC.isArray(input)) {
    return input;
  }

  const inputAsString = ("" + input);
  if (input != inputAsString) {
    return input;
  }

  const lastIndex = (inputAsString.length - 1);
  if (!((inputAsString[0] == "{") || (inputAsString[0] == "["))) {
    return input;
  }
  if (!((inputAsString[lastIndex] == "}") || (inputAsString[lastIndex] == "]"))) {
    return input;
  }

  const inputAsObject = JSON.parse(inputAsString);
  return inputAsObject;
}

import * as BT from "./BaseTypes";
import * as TC from "./TypeChecking";

// export const name = "ValueChecking";

/**
 * @constant
 * @type {string}
 * @default
 */
export const Default_IncludeEmptyAsWhitespace = true; // eslint-disable-line camelcase

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
export function isWhitespace(value: string, includeEmptyAsWhitespace: boolean = Default_IncludeEmptyAsWhitespace): boolean {
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

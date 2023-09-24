import * as TC from "./TypeChecking";

/**
 * The maximum character value to use for ordering query results.
 * @constant
 * @type {string}
 * @default
 */
export const MAX_QUERY_CHAR_VALUE = "\uf8ff"; // eslint-disable-line camelcase

/**
 * Deep-checks if two objects of type T as value-wise equivalent.
 * @param {T | null | undefined} obj1 The first object.
 * @param {T | null | undefined} obj2 The second object.
 * @return {boolean}
 */
export function areEqual<T>(obj1: T | null | undefined, obj2: T | null | undefined): boolean {
  if (TC.isUndefined(obj1)) {
    return TC.isUndefined(obj2);
  }

  const obj1AsString = JSON.stringify(obj1);
  const obj2AsString = JSON.stringify(obj2);
  return (obj1AsString == obj2AsString);
}

/**
 * Deep-copies an object of type T.
 * @param {T} obj The object to copy.
 * @return {T}
 */
export function copyObject<T>(obj: T): T {
  if (TC.isUndefined(obj)) {
    return (undefined as T);
  }

  const objAsString = JSON.stringify(obj);
  const objAsObject = JSON.parse(objAsString);
  return objAsObject;
}

/**
 * @constant
 * @type {boolean}
 * @default
 */
export const DEFAULT_LITERAL_TYPE_USES_LOWERCASE = true; // eslint-disable-line camelcase

/**
 * @constant
 * @type {string}
 * @default
 */
export const DEFAULT_LITERAL_TYPE_PART_SEPARATOR = "_"; // eslint-disable-line camelcase

/**
 * Converts a string value into a string literal type of type T.
 * @param {string} valueAsString The string literal type as a string.
 * @param {T} defaultValue The default string literal type to use.
 * @param {boolean} literalTypeUsesLowercase Whether the string literal type is lower-cased (default is "true").
 * @param {string} literalTypePartSeparator The string used to separate words in a string literal type (default is "_").
 * @return {T} The converted string literal type.
 */
export function convertStringToLiteralType<T>(valueAsString: string, defaultValue: T, literalTypeUsesLowercase = DEFAULT_LITERAL_TYPE_USES_LOWERCASE, literalTypePartSeparator = DEFAULT_LITERAL_TYPE_PART_SEPARATOR): T {
  if (TC.isNullishOrWhitespace(valueAsString)) {
    return defaultValue;
  }

  let valueAsStringToConvert = valueAsString.replace(" ", literalTypePartSeparator); // NOTE: 1 space
  valueAsStringToConvert = valueAsStringToConvert.replace("  ", literalTypePartSeparator); // NOTE: 2 space

  if (literalTypeUsesLowercase) {
    valueAsStringToConvert = valueAsStringToConvert.toLowerCase();
  }

  const value = TC.convertTo<T>(valueAsStringToConvert);
  return value;
}

/**
 * @constant
 * @type {string}
 * @default
 */
export const DEFAULT_VERSION_PART_SEPARATOR = "."; // eslint-disable-line camelcase

/**
 * Converts a version number string to an array of version number parts.
 * @param {string} versionNumberAsString The version number as a string.
 * @param {string} partSeparator The string used to separate parts of a version number.
 * @return {Array<number>} The parts of the version number as an array of numbers.
 */
export function convertVersionNumberStringToNumberParts(versionNumberAsString: string, partSeparator = DEFAULT_VERSION_PART_SEPARATOR): Array<number> {
  if (TC.isNullishOrWhitespace(versionNumberAsString)) {
    throw new Error("The version number string provided does not contain any text.");
  }

  const versionPartsAsStrings = versionNumberAsString.split(partSeparator);
  const versionParts = ([] as Array<number>);

  if (versionPartsAsStrings.length < 1) {
    throw new Error("The version number string provided does not contain any version number parts.");
  }

  for (let i = 0; i < versionPartsAsStrings.length; i++) {
    const versionPartAsString = versionPartsAsStrings[i];
    const versionPart = Number.parseInt(versionPartAsString);
    versionParts.push(versionPart);
  }
  return versionParts;
}

/**
 * @constant
 * @type {number}
 * @default
 */
export const DEFAULT_VERSION_MISSING_NUMBER_VALUE = 0; // eslint-disable-line camelcase

/**
 * Compares two version numbers encoded as arrays of numbers.
 * @param {Array<number>} firstVersionNumber The first version number.
 * @param {Array<number>} secondVersionNumber The second version number.
 * @param {number} missingNumberValue The number to use when a number part is missing a value relative to the other version number (default is "0").
 * @return {number} The result of comparison (i.e. -1, 0, or 1).
 */
export function compareVersionNumbers(firstVersionNumber: Array<number>, secondVersionNumber: Array<number>, missingNumberValue = DEFAULT_VERSION_MISSING_NUMBER_VALUE): number {
  if (TC.isNullish(firstVersionNumber)) {
    throw new Error("The first version number array provided has not been initialized.");
  }
  if (firstVersionNumber.length < 1) {
    throw new Error("The first version number array provided does not contain any version number parts.");
  }
  if (TC.isNullish(secondVersionNumber)) {
    throw new Error("The second version number array provided has not been initialized.");
  }
  if (secondVersionNumber.length < 1) {
    throw new Error("The second version number array provided does not contain any version number parts.");
  }

  const maxLength = Math.max(firstVersionNumber.length, secondVersionNumber.length);

  for (let i = 0; i < maxLength; i++) {
    const firstPart = (firstVersionNumber.length > i) ? firstVersionNumber[i] : missingNumberValue;
    const secondPart = (secondVersionNumber.length > i) ? secondVersionNumber[i] : missingNumberValue;

    if (firstPart > secondPart) {
      return -1;
    } else if (firstPart < secondPart) {
      return 1;
    }
  }
  return 0;
}

/**
 * Compares two version numbers encoded as strings containing number parts.
 * @param {string} firstVersionNumber The first version number.
 * @param {string} secondVersionNumber The second version number.
 * @param {string} partSeparator The string used to separate parts of a version number.
 * @param {number} missingNumberValue The number to use when a version number part is missing a value relative to the other version number (default is "0").
 * @return {number} The result of comparison (i.e. -1, 0, or 1).
 */
export function compareVersionNumberStrings(firstVersionNumber: string, secondVersionNumber: string, partSeparator = DEFAULT_VERSION_PART_SEPARATOR, missingNumberValue = DEFAULT_VERSION_MISSING_NUMBER_VALUE): number { // eslint-disable-line max-len
  const firstVersionNumberParts = convertVersionNumberStringToNumberParts(firstVersionNumber, partSeparator);
  const secondVersionNumberParts = convertVersionNumberStringToNumberParts(secondVersionNumber, partSeparator);
  const compareResult = compareVersionNumbers(firstVersionNumberParts, secondVersionNumberParts, missingNumberValue);
  return compareResult;
}

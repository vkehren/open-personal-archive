import * as TC from "./TypeChecking";

/**
 * @constant
 * @type {string}
 * @default
 */
export const Query_OrderBy_CharHighest = "\uf8ff"; // eslint-disable-line camelcase

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
export const Default_Enum_NamesAreLowercase = true; // eslint-disable-line camelcase

/**
 * @constant
 * @type {string}
 * @default
 */
export const Default_Enum_PartSeparator = "_"; // eslint-disable-line camelcase

/**
 * Converts an enum value string to an enum value of type T.
 * @param {string} valueAsString The enum value as a string.
 * @param {T} defaultValue The default enum value to use.
 * @param {boolean} namesAreLowercase Whether enum named values are all lower-cased (default is "true").
 * @param {string} partSeparator The string used to separate words in an enum named value (default is "_").
 * @return {T} The converted enum value.
 */
export function convertStringToEnumValue<T>(valueAsString: string, defaultValue: T, namesAreLowercase = Default_Enum_NamesAreLowercase, partSeparator = Default_Enum_PartSeparator): T {
  if (TC.isNullishOrWhitespace(valueAsString)) {
    return defaultValue;
  }

  let valueAsStringToConvert = valueAsString.replace(" ", partSeparator);
  valueAsStringToConvert = valueAsStringToConvert.replace("  ", partSeparator);

  if (namesAreLowercase) {
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
export const Default_Version_PartSeparator = "."; // eslint-disable-line camelcase

/**
 * Converts a version number string to an array of version number parts.
 * @param {string} versionNumberAsString The version number as a string.
 * @param {string} partSeparator The string used to separate words in an enum named value (default is "_").
 * @return {Array<number>} The parts of the version number as an array of numbers.
 */
export function convertVersionNumberStringToNumberParts(versionNumberAsString: string, partSeparator = Default_Version_PartSeparator): Array<number> {
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
export const Default_Version_MissingNumberValue = 0; // eslint-disable-line camelcase

/**
 * Compares two version numbers encoded as arrays of numbers.
 * @param {Array<number>} firstVersionNumber The first version number.
 * @param {Array<number>} secondVersionNumber The second version number.
 * @param {number} missingNumberValue The number to use when a number part is missing a value relative to the other version number (default is "0").
 * @return {number} The result of comparison (i.e. -1, 0, or 1).
 */
export function compareVersionNumbers(firstVersionNumber: Array<number>, secondVersionNumber: Array<number>, missingNumberValue = Default_Version_MissingNumberValue): number {
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
 * @param {string} partSeparator The string used to separate words in an enum named value (default is "_").
 * @param {number} missingNumberValue The number to use when a number part is missing a value relative to the other version number (default is "0").
 * @return {number} The result of comparison (i.e. -1, 0, or 1).
 */
export function compareVersionNumberStrings(firstVersionNumber: string, secondVersionNumber: string, partSeparator = Default_Version_PartSeparator, missingNumberValue = Default_Version_MissingNumberValue): number {
  const firstVersionNumberParts = convertVersionNumberStringToNumberParts(firstVersionNumber, partSeparator);
  const secondVersionNumberParts = convertVersionNumberStringToNumberParts(secondVersionNumber, partSeparator);
  const compareResult = compareVersionNumbers(firstVersionNumberParts, secondVersionNumberParts, missingNumberValue);
  return compareResult;
}

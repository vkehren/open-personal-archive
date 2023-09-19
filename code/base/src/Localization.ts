import * as BT from "./BaseTypes";
import * as TC from "./TypeChecking";
import * as VC from "./ValueChecking";

const LocaleValidityRegExp = /^[a-zA-Z]{2}/;

/**
 * @constant
 * @type {boolean}
 * @default
 */
export const Default_AllowUndefinedValue = false; // eslint-disable-line camelcase

/**
 * @constant
 * @type {boolean}
 * @default
 */
export const Default_AllowNullValue = true; // eslint-disable-line camelcase

/**
 * @constant
 * @type {boolean}
 * @default
 */
export const Default_AllowWhitespaceValue = true; // eslint-disable-line camelcase

/**
 * @constant
 * @type {string}
 * @default
 */
export const Default_Locale = "en"; // eslint-disable-line camelcase

/**
 * Takes in a Localizable object and checks that it is valid.
 * @param {Interfaces.Localizable<T>} localizable The Localizable object.
 * @param {boolean} [allowUndefinedValue=Default_AllowUndefinedValue] Whether to interpret "undefined" as a valid value for a given locale.
 * @param {boolean} [allowNullValue=Default_AllowNullValue] Whether to interpret "null" as a valid value for a given locale.
 * @return {[boolean, string]} Whether the Localizable object is valid and if not, a message describing the reason why not.
 */
function isValidLocalizableInternal<T>(localizable: BT.ILocalizable<T>, allowUndefinedValue = Default_AllowUndefinedValue, allowNullValue = Default_AllowNullValue): [boolean, string] {
  if (TC.isNullish(localizable)) {
    return [false, "The Localizable object must NOT be undefined or null."];
  }

  const defaultValue = localizable[Default_Locale];
  if ((!allowUndefinedValue && TC.isUndefined(defaultValue))) {
    return [false, "The Localizable object must contain a defined value for the default locale (i.e. \"" + Default_Locale + "\")."]; // eslint-disable-line camelcase
  }
  if ((!allowNullValue && TC.isNull(defaultValue))) {
    return [false, "The Localizable object must contain a non-null value for the default locale (i.e. \"" + Default_Locale + "\")."]; // eslint-disable-line camelcase
  }
  return [true, ""];
}

/**
 * Takes in a Localizable object and checks that it is valid.
 * @param {Interfaces.Localizable<T>} localizable The Localizable object.
 * @param {boolean} [allowUndefinedValue=Default_AllowUndefinedValue] Whether to interpret "undefined" as a valid value for a given locale.
 * @param {boolean} [allowNullValue=Default_AllowNullValue] Whether to interpret "null" as a valid value for a given locale.
 * @return {boolean} Whether the Localizable object is valid.
 */
export function isValidLocalizable<T>(localizable: BT.ILocalizable<T>, allowUndefinedValue = Default_AllowUndefinedValue, allowNullValue = Default_AllowNullValue): boolean {
  const result = isValidLocalizableInternal(localizable, allowUndefinedValue, allowNullValue);
  return result[0];
}

/**
 * Takes in a Localizable object and asserts that it is valid.
 * @param {Interfaces.Localizable<T>} localizable The Localizable object.
 * @param {boolean} [allowUndefinedValue=Default_AllowUndefinedValue] Whether to interpret "undefined" as a valid value for a given locale.
 * @param {boolean} [allowNullValue=Default_AllowNullValue] Whether to interpret "null" as a valid value for a given locale.
 * @return {void}
 */
export function assertIsValidLocalizable<T>(localizable: BT.ILocalizable<T>, allowUndefinedValue = Default_AllowUndefinedValue, allowNullValue = Default_AllowNullValue): void {
  const result = isValidLocalizableInternal(localizable, allowUndefinedValue, allowNullValue);
  if (!result[0]) {
    throw new Error(result[1]);
  }
}

/**
 * Takes in a locale and checks that it is valid.
 * @param {string} locale The locale.
 * @return {[boolean, string]} Whether the locale is valid and if not, a message describing the reason why not.
 */
function isValidLocaleInternal(locale: string): [boolean, string] {
  if (TC.isNullishOrWhitespace(locale)) {
    return [false, "The locale must be a valid value (i.e. NOT undefined, null, empty, or whitespace)."];
  }

  const matches = locale.match(LocaleValidityRegExp);
  if (TC.isNullish(matches) || ((matches as RegExpMatchArray).length <= 0)) {
    return [false, "The locale must start with at least two (2) letters."];
  }
  return [true, ""];
}

/**
 * Takes in a locale and checks that it is valid.
 * @param {string} locale The locale.
 * @return {boolean} Whether the locale is valid.
 */
export function isValidLocale(locale: string): boolean {
  const result = isValidLocaleInternal(locale);
  return result[0];
}

/**
 * Takes in a locale and asserts that it is valid.
 * @param {string} locale The locale.
 * @return {void}
 */
export function assertIsValidLocale(locale: string): void {
  const result = isValidLocaleInternal(locale);
  if (!result[0]) {
    throw new Error(result[1]);
  }
}

/**
 * Takes in a Localizable object and applies a locale to yield a specific localized value.
 * @param {Interfaces.Localizable<T>} localizable The Localizable object.
 * @param {string} locale The locale to try use (then its base locale, then the default locale).
 * @param {boolean} [allowUndefinedValue=Default_AllowUndefinedValue] Whether to interpret "undefined" as a valid value for a given locale.
 * @param {boolean} [allowNullValue=Default_AllowNullValue] Whether to interpret "null" as a valid value for a given locale.
 * @return {string} The localized value.
 */
export function getLocalizedValue<T>(localizable: BT.ILocalizable<T>, locale: string, allowUndefinedValue = Default_AllowUndefinedValue, allowNullValue = Default_AllowNullValue): T {
  assertIsValidLocalizable(localizable, allowUndefinedValue, allowNullValue);
  assertIsValidLocale(locale);

  const valueIsValidFunc = (value: T) => ((allowUndefinedValue || !TC.isUndefined(value)) && (allowNullValue || !TC.isNull(value)));

  const localizedValue = localizable[locale];
  if (valueIsValidFunc(localizedValue)) {
    return localizedValue;
  }

  const baseLocale = (locale[0] + locale[1]);
  const baseLocalizedValue = localizable[baseLocale];
  if (valueIsValidFunc(baseLocalizedValue)) {
    return baseLocalizedValue;
  }

  const defaultLocalizedValue = localizable[Default_Locale];
  return defaultLocalizedValue;
}

/**
 * Takes in a Localizable object and applies a locale to yield specific localized text.
 * @param {Interfaces.Localizable<T>} localizable The Localizable object.
 * @param {string} locale The locale to try use (then its base locale, then the default locale).
 * @param {boolean} [allowUndefinedValue=Default_AllowUndefinedValue] Whether to interpret "undefined" as a valid value for a given locale.
 * @param {boolean} [allowNullValue=Default_AllowNullValue] Whether to interpret "null" as a valid value for a given locale.
 * @param {boolean} [allowWhitespaceValue=Default_AllowWhitespaceValue] Whether to interpret whitespace (e.g. " ") as a valid value for a given locale.
 * @return {string} The localized text.
 */
export function getLocalizedText(localizable: BT.ILocalizable<string>, locale: string, allowUndefinedValue = Default_AllowUndefinedValue, allowNullValue = Default_AllowNullValue, allowWhitespaceValue = Default_AllowWhitespaceValue): string { // eslint-disable-line max-len
  assertIsValidLocalizable(localizable, allowUndefinedValue, allowNullValue);
  assertIsValidLocale(locale);

  const valueIsValidFunc = (text: string) => ((allowUndefinedValue || !TC.isUndefined(text)) && (allowNullValue || !TC.isNull(text)) && (allowWhitespaceValue || !VC.isWhitespace(text)));

  const localizedText = localizable[locale];
  if (valueIsValidFunc(localizedText)) {
    return localizedText;
  }

  const baseLocale = (locale[0] + locale[1]);
  const baseLocalizedText = localizable[baseLocale];
  if (valueIsValidFunc(baseLocalizedText)) {
    return baseLocalizedText;
  }

  const defaultLocalizedText = localizable[Default_Locale];
  return defaultLocalizedText;
}

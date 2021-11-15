import * as BT from "./BaseTypes";
import * as LOC from "./Localization";

/* eslint-disable camelcase, @typescript-eslint/no-explicit-any */
export const name = "LocalizationTests";

const EN_Hello = "Hello!";
const EN_US_Hello = "Hello from the U.S.!";
const ES_Hello = "¡Hola!";
const ES_MX_Hello = "¡Hola desde Mexico!";
const Localizable_Invalid_Undefined = ((undefined as any) as BT.ILocalizable<string>);
const Localizable_Invalid_Null = ((null as any) as BT.ILocalizable<string>);
const Localizable_Invalid_MissingDefault = ({} as BT.ILocalizable<string>);
const Localizable_Maybe_Undefined = ({"en": ((undefined as any) as string)} as BT.ILocalizable<string>);
const Localizable_Maybe_Null = ({"en": ((null as any) as string)} as BT.ILocalizable<string>);
const Localizable_Valid_Minimal = ({"en": EN_Hello} as BT.ILocalizable<string>);
const Localizable_Valid_EnglishUS = ({"en": EN_Hello, "en-US": EN_US_Hello} as BT.ILocalizable<string>);
const Localizable_Valid_EnglishUS_Undefined = ({"en": EN_Hello, "en-US": ((undefined as any) as string)} as BT.ILocalizable<string>);
const Localizable_Valid_EnglishUS_Null = ({"en": EN_Hello, "en-US": ((null as any) as string)} as BT.ILocalizable<string>);
const Localizable_Valid_EnglishUS_Empty = ({"en": EN_Hello, "en-US": ""} as BT.ILocalizable<string>);
const Localizable_Valid_EnglishUS_Whitespace = ({"en": EN_Hello, "en-US": " "} as BT.ILocalizable<string>);
const Localizable_Valid_SpanishMexico = ({"en": EN_Hello, "es": ES_Hello, "es-MX": ES_MX_Hello} as BT.ILocalizable<string>);
const Locale_Invalid_Undefined = ((undefined as any) as string);
const Locale_Invalid_Null = ((null as any) as string);
const Locale_Invalid_Empty = "";
const Locale_Invalid_E = "e";
const Locale_Invalid_E1 = "e1";
const Locale_Valid_EN = "en";
const Locale_Valid_EN_US = "en-US";
const Locale_Valid_ES = "es";
const Locale_Valid_ES_MX = "es-MX";

// TESTS for isValidLocalizable(...)
test("checks that passing 'undefined' to isValidLocalizable(...) returns 'false'", () => {
  expect(LOC.isValidLocalizable(Localizable_Invalid_Undefined)).toBe(false);
});

test("checks that passing 'null' to isValidLocalizable(...) returns 'false'", () => {
  expect(LOC.isValidLocalizable(Localizable_Invalid_Null)).toBe(false);
});

test("checks that passing empty object to isValidLocalizable(...) returns 'false'", () => {
  expect(LOC.isValidLocalizable(Localizable_Invalid_MissingDefault)).toBe(false);
});

test("checks that passing object with default of 'undefined' to isValidLocalizable(...) returns 'false'", () => {
  expect(LOC.isValidLocalizable(Localizable_Maybe_Undefined)).toBe(false);
});

test("checks that passing object with default of 'null' to isValidLocalizable(...) returns 'true'", () => {
  expect(LOC.isValidLocalizable(Localizable_Maybe_Null)).toBe(true);
});

test("checks that passing minimally valid object to isValidLocalizable(...) returns 'true'", () => {
  expect(LOC.isValidLocalizable(Localizable_Valid_Minimal)).toBe(true);
});

test("checks that passing valid English object to isValidLocalizable(...) returns 'true'", () => {
  expect(LOC.isValidLocalizable(Localizable_Valid_EnglishUS)).toBe(true);
});

test("checks that passing valid Spanish object to isValidLocalizable(...) returns 'true'", () => {
  expect(LOC.isValidLocalizable(Localizable_Valid_SpanishMexico)).toBe(true);
});

// TESTS for assertIsValidLocalizable(...)
test("checks that passing 'undefined' to assertIsValidLocalizable(...) throws error", () => {
  expect(() => LOC.assertIsValidLocalizable(Localizable_Invalid_Undefined)).toThrow();
});

test("checks that passing 'null' to assertIsValidLocalizable(...) throws error", () => {
  expect(() => LOC.assertIsValidLocalizable(Localizable_Invalid_Null)).toThrow();
});

test("checks that passing empty object to assertIsValidLocalizable(...) throws error", () => {
  expect(() => LOC.assertIsValidLocalizable(Localizable_Invalid_MissingDefault)).toThrow();
});

test("checks that passing object with default of 'undefined' to assertIsValidLocalizable(...) throws error", () => {
  expect(() => LOC.assertIsValidLocalizable(Localizable_Maybe_Undefined)).toThrow();
});

test("checks that passing object with default of 'null' to assertIsValidLocalizable(...) does NOT throw error", () => {
  expect(() => LOC.assertIsValidLocalizable(Localizable_Maybe_Null)).not.toThrow();
});

test("checks that passing minimally valid object to assertIsValidLocalizable(...) does NOT throw error", () => {
  expect(() => LOC.assertIsValidLocalizable(Localizable_Valid_Minimal)).not.toThrow();
});

test("checks that passing valid English object to assertIsValidLocalizable(...) does NOT throw error", () => {
  expect(() => LOC.assertIsValidLocalizable(Localizable_Valid_EnglishUS)).not.toThrow();
});

test("checks that passing valid Spanish object to assertIsValidLocalizable(...) does NOT throw error", () => {
  expect(() => LOC.assertIsValidLocalizable(Localizable_Valid_SpanishMexico)).not.toThrow();
});

// TESTS for isValidLocale(...)
test("checks that passing 'undefined' to isValidLocale(...) returns 'false'", () => {
  expect(LOC.isValidLocale(Locale_Invalid_Undefined)).toBe(false);
});

test("checks that passing 'null' to isValidLocale(...) returns 'false'", () => {
  expect(LOC.isValidLocale(Locale_Invalid_Null)).toBe(false);
});

test("checks that passing '' to isValidLocale(...) returns 'false'", () => {
  expect(LOC.isValidLocale(Locale_Invalid_Empty)).toBe(false);
});

test("checks that passing 'e' to isValidLocale(...) returns 'false'", () => {
  expect(LOC.isValidLocale(Locale_Invalid_E)).toBe(false);
});

test("checks that passing 'e1' to isValidLocale(...) returns 'false'", () => {
  expect(LOC.isValidLocale(Locale_Invalid_E1)).toBe(false);
});

test("checks that passing 'en' to isValidLocale(...) returns 'true'", () => {
  expect(LOC.isValidLocale(Locale_Valid_EN)).toBe(true);
});

test("checks that passing 'en-US' to isValidLocale(...) returns 'true'", () => {
  expect(LOC.isValidLocale(Locale_Valid_EN_US)).toBe(true);
});

test("checks that passing 'es' to isValidLocale(...) returns 'true'", () => {
  expect(LOC.isValidLocale(Locale_Valid_ES)).toBe(true);
});

test("checks that passing 'es-MX' to isValidLocale(...) returns 'true'", () => {
  expect(LOC.isValidLocale(Locale_Valid_ES_MX)).toBe(true);
});

// TESTS for assertIsValidLocale(...)
test("checks that passing 'undefined' to assertIsValidLocale(...) throws error", () => {
  expect(() => LOC.assertIsValidLocale(Locale_Invalid_Undefined)).toThrow();
});

test("checks that passing 'null' to assertIsValidLocale(...) throws error", () => {
  expect(() => LOC.assertIsValidLocale(Locale_Invalid_Null)).toThrow();
});

test("checks that passing '' to assertIsValidLocale(...) throws error", () => {
  expect(() => LOC.assertIsValidLocale(Locale_Invalid_Empty)).toThrow();
});

test("checks that passing 'e' to assertIsValidLocale(...) throws error", () => {
  expect(() => LOC.assertIsValidLocale(Locale_Invalid_E)).toThrow();
});

test("checks that passing 'e1' to assertIsValidLocale(...) throws error", () => {
  expect(() => LOC.assertIsValidLocale(Locale_Invalid_E1)).toThrow();
});

test("checks that passing 'en' to assertIsValidLocale(...) does NOT throw error", () => {
  expect(() => LOC.assertIsValidLocale(Locale_Valid_EN)).not.toThrow();
});

test("checks that passing 'en-US' to assertIsValidLocale(...) does NOT throw error", () => {
  expect(() => LOC.assertIsValidLocale(Locale_Valid_EN_US)).not.toThrow();
});

test("checks that passing 'es' to assertIsValidLocale(...) does NOT throw error", () => {
  expect(() => LOC.assertIsValidLocale(Locale_Valid_ES)).not.toThrow();
});

test("checks that passing 'es-MX' to assertIsValidLocale(...) does NOT throw error", () => {
  expect(() => LOC.assertIsValidLocale(Locale_Valid_ES_MX)).not.toThrow();
});

// TESTS for getLocalizedValue(...)
test("checks that passing 'undefined' to getLocalizedValue(...) throws error", () => {
  expect(() => LOC.getLocalizedValue(Localizable_Invalid_Undefined, Locale_Valid_EN)).toThrow();
});

test("checks that passing 'null' to getLocalizedValue(...) throws error", () => {
  expect(() => LOC.getLocalizedValue(Localizable_Invalid_Null, Locale_Valid_EN)).toThrow();
});

test("checks that passing empty object to getLocalizedValue(...) throws error", () => {
  expect(() => LOC.getLocalizedValue(Localizable_Invalid_MissingDefault, Locale_Valid_EN)).toThrow();
});

test("checks that passing minimal object with undefined value to getLocalizedValue(..., false, false) throws error", () => {
  expect(() => LOC.getLocalizedValue(Localizable_Maybe_Undefined, Locale_Valid_EN, false, false)).toThrow();
});

test("checks that passing minimal object with undefined to getLocalizedValue(..., true, false) returns 'undefined'", () => {
  expect(LOC.getLocalizedValue(Localizable_Maybe_Undefined, Locale_Valid_EN, true, false)).toBe(undefined);
});

test("checks that passing minimal object with null value to getLocalizedValue(..., false, false) throws error", () => {
  expect(() => LOC.getLocalizedValue(Localizable_Maybe_Null, Locale_Valid_EN, false, false)).toThrow();
});

test("checks that passing minimal object with null to getLocalizedValue(..., false, true) returns 'null'", () => {
  expect(LOC.getLocalizedValue(Localizable_Maybe_Null, Locale_Valid_EN, false, true)).toBe(null);
});

test("checks that passing minimal object with valid text to getLocalizedValue(..., false, false) returns EN_Hello", () => {
  expect(LOC.getLocalizedValue(Localizable_Valid_Minimal, Locale_Valid_EN, false, false)).toBe(EN_Hello);
});

test("checks that passing minimal object with valid text to getLocalizedValue(..., false, false) returns EN_Hello", () => {
  expect(LOC.getLocalizedValue(Localizable_Valid_EnglishUS, Locale_Valid_EN, false, false)).toBe(EN_Hello);
});

test("checks that passing minimal object with valid text to getLocalizedValue(..., false, false) returns EN_US_Hello", () => {
  expect(LOC.getLocalizedValue(Localizable_Valid_EnglishUS, Locale_Valid_EN_US, false, false)).toBe(EN_US_Hello);
});

test("checks that passing minimal object with valid text to getLocalizedValue(..., false, false) returns EN_Hello", () => {
  expect(LOC.getLocalizedValue(Localizable_Valid_EnglishUS_Undefined, Locale_Valid_EN_US, false, false)).toBe(EN_Hello);
});

test("checks that passing minimal object with valid text to getLocalizedValue(..., true, false) returns 'undefined'", () => {
  expect(LOC.getLocalizedValue(Localizable_Valid_EnglishUS_Undefined, Locale_Valid_EN_US, true, false)).toBe(undefined);
});

test("checks that passing minimal object with valid text to getLocalizedValue(..., false, false) returns EN_Hello", () => {
  expect(LOC.getLocalizedValue(Localizable_Valid_EnglishUS_Null, Locale_Valid_EN_US, false, false)).toBe(EN_Hello);
});

test("checks that passing minimal object with valid text to getLocalizedValue(..., false, true) returns 'null'", () => {
  expect(LOC.getLocalizedValue(Localizable_Valid_EnglishUS_Null, Locale_Valid_EN_US, false, true)).toBe(null);
});

// TESTS for getLocalizedText(...)
test("checks that passing 'undefined' to getLocalizedText(...) throws error", () => {
  expect(() => LOC.getLocalizedText(Localizable_Invalid_Undefined, Locale_Valid_EN)).toThrow();
});

test("checks that passing 'null' to getLocalizedText(...) throws error", () => {
  expect(() => LOC.getLocalizedText(Localizable_Invalid_Null, Locale_Valid_EN)).toThrow();
});

test("checks that passing empty object to getLocalizedText(...) throws error", () => {
  expect(() => LOC.getLocalizedText(Localizable_Invalid_MissingDefault, Locale_Valid_EN)).toThrow();
});

test("checks that passing minimal object with undefined value to getLocalizedText(..., false, false) throws error", () => {
  expect(() => LOC.getLocalizedText(Localizable_Maybe_Undefined, Locale_Valid_EN, false, false)).toThrow();
});

test("checks that passing minimal object with undefined to getLocalizedText(..., true, false) returns 'undefined'", () => {
  expect(LOC.getLocalizedText(Localizable_Maybe_Undefined, Locale_Valid_EN, true, false)).toBe(undefined);
});

test("checks that passing minimal object with null value to getLocalizedText(..., false, false) throws error", () => {
  expect(() => LOC.getLocalizedText(Localizable_Maybe_Null, Locale_Valid_EN, false, false)).toThrow();
});

test("checks that passing minimal object with null to getLocalizedText(..., false, true) returns 'null'", () => {
  expect(LOC.getLocalizedText(Localizable_Maybe_Null, Locale_Valid_EN, false, true)).toBe(null);
});

test("checks that passing minimal object with valid text to getLocalizedText(..., false, false) returns EN_Hello", () => {
  expect(LOC.getLocalizedText(Localizable_Valid_Minimal, Locale_Valid_EN, false, false)).toBe(EN_Hello);
});

test("checks that passing minimal object with valid text to getLocalizedText(..., false, false) returns EN_Hello", () => {
  expect(LOC.getLocalizedText(Localizable_Valid_EnglishUS, Locale_Valid_EN, false, false)).toBe(EN_Hello);
});

test("checks that passing minimal object with valid text to getLocalizedText(..., false, false) returns EN_US_Hello", () => {
  expect(LOC.getLocalizedText(Localizable_Valid_EnglishUS, Locale_Valid_EN_US, false, false)).toBe(EN_US_Hello);
});

test("checks that passing minimal object with valid text to getLocalizedText(..., false, false) returns EN_Hello", () => {
  expect(LOC.getLocalizedText(Localizable_Valid_EnglishUS_Undefined, Locale_Valid_EN_US, false, false)).toBe(EN_Hello);
});

test("checks that passing minimal object with valid text to getLocalizedText(..., true, false) returns 'undefined'", () => {
  expect(LOC.getLocalizedText(Localizable_Valid_EnglishUS_Undefined, Locale_Valid_EN_US, true, false)).toBe(undefined);
});

test("checks that passing minimal object with valid text to getLocalizedText(..., false, false) returns EN_Hello", () => {
  expect(LOC.getLocalizedText(Localizable_Valid_EnglishUS_Null, Locale_Valid_EN_US, false, false)).toBe(EN_Hello);
});

test("checks that passing minimal object with valid text to getLocalizedText(..., false, true) returns 'null'", () => {
  expect(LOC.getLocalizedText(Localizable_Valid_EnglishUS_Null, Locale_Valid_EN_US, false, true)).toBe(null);
});

test("checks that passing minimal object with valid text to getLocalizedText(..., false, false, false) returns EN_Hello", () => {
  expect(LOC.getLocalizedText(Localizable_Valid_EnglishUS_Empty, Locale_Valid_EN_US, false, false, false)).toBe(EN_Hello);
});

test("checks that passing minimal object with valid text to getLocalizedText(..., false, false, true) returns ''", () => {
  expect(LOC.getLocalizedText(Localizable_Valid_EnglishUS_Empty, Locale_Valid_EN_US, false, false, true)).toBe("");
});

test("checks that passing minimal object with valid text to getLocalizedText(..., false, false, false) returns EN_Hello", () => {
  expect(LOC.getLocalizedText(Localizable_Valid_EnglishUS_Whitespace, Locale_Valid_EN_US, false, false, false)).toBe(EN_Hello);
});

test("checks that passing minimal object with valid text to getLocalizedText(..., false, false, true) returns ' '", () => {
  expect(LOC.getLocalizedText(Localizable_Valid_EnglishUS_Whitespace, Locale_Valid_EN_US, false, false, true)).toBe(" ");
});

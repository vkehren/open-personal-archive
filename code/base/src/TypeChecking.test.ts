import * as firestore from "@google-cloud/firestore";
import * as TC from "./TypeChecking";

/* eslint-disable camelcase, brace-style */
export const name = "TypeCheckingTests";

// TESTS for isUndefined(...)
test("checks that passing 'undefined' to isUndefined(...) returns 'true'", () => {
  expect(TC.isUndefined(undefined)).toBe(true);
});

test("checks that passing 'null' to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined(null)).toBe(false);
});

test("checks that passing 'false' to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined(false)).toBe(false);
});

test("checks that passing 'true' to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined(true)).toBe(false);
});

test("checks that passing '0' to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined(0)).toBe(false);
});

test("checks that passing '1' to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined(1)).toBe(false);
});

test("checks that passing '0n' to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined(BigInt(1))).toBe(false);
});

test("checks that passing '' to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined("")).toBe(false);
});

test("checks that passing ' ' to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined(" ")).toBe(false);
});

test("checks that passing 'a' to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined("a")).toBe(false);
});

test("checks that passing a date to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined(new Date())).toBe(false);
});

test("checks that passing empty object to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined({})).toBe(false);
});

test("checks that passing non-empty object to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined({num: 1})).toBe(false);
});

test("checks that passing empty array to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined([])).toBe(false);
});

test("checks that passing non-empty array to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined([1])).toBe(false);
});

test("checks that passing regexp to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined(new Map())).toBe(false);
});

test("checks that passing set to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined(new Set())).toBe(false);
});

test("checks that passing named function to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isUndefined(...) returns 'false'", () => {
  expect(TC.isUndefined(() => {return 12345;})).toBe(false);
});

// TESTS for isNull(...)
test("checks that passing 'undefined' to isNull(...) returns 'false'", () => {
  expect(TC.isNull(undefined)).toBe(false);
});

test("checks that passing 'null' to isNull(...) returns 'true'", () => {
  expect(TC.isNull(null)).toBe(true);
});

test("checks that passing 'false' to isNull(...) returns 'false'", () => {
  expect(TC.isNull(false)).toBe(false);
});

test("checks that passing 'true' to isNull(...) returns 'false'", () => {
  expect(TC.isNull(true)).toBe(false);
});

test("checks that passing '0' to isNull(...) returns 'false'", () => {
  expect(TC.isNull(0)).toBe(false);
});

test("checks that passing '1' to isNull(...) returns 'false'", () => {
  expect(TC.isNull(1)).toBe(false);
});

test("checks that passing '0n' to isNull(...) returns 'false'", () => {
  expect(TC.isNull(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isNull(...) returns 'false'", () => {
  expect(TC.isNull(BigInt(1))).toBe(false);
});

test("checks that passing '' to isNull(...) returns 'false'", () => {
  expect(TC.isNull("")).toBe(false);
});

test("checks that passing ' ' to isNull(...) returns 'false'", () => {
  expect(TC.isNull(" ")).toBe(false);
});

test("checks that passing 'a' to isNull(...) returns 'false'", () => {
  expect(TC.isNull("a")).toBe(false);
});

test("checks that passing a date to isNull(...) returns 'false'", () => {
  expect(TC.isNull(new Date())).toBe(false);
});

test("checks that passing empty object to isNull(...) returns 'false'", () => {
  expect(TC.isNull({})).toBe(false);
});

test("checks that passing non-empty object to isNull(...) returns 'false'", () => {
  expect(TC.isNull({num: 1})).toBe(false);
});

test("checks that passing empty array to isNull(...) returns 'false'", () => {
  expect(TC.isNull([])).toBe(false);
});

test("checks that passing non-empty array to isNull(...) returns 'false'", () => {
  expect(TC.isNull([1])).toBe(false);
});

test("checks that passing regexp to isNull(...) returns 'false'", () => {
  expect(TC.isNull(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isNull(...) returns 'false'", () => {
  expect(TC.isNull(new Map())).toBe(false);
});

test("checks that passing set to isNull(...) returns 'false'", () => {
  expect(TC.isNull(new Set())).toBe(false);
});

test("checks that passing named function to isNull(...) returns 'false'", () => {
  expect(TC.isNull(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isNull(...) returns 'false'", () => {
  expect(TC.isNull(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isNull(...) returns 'false'", () => {
  expect(TC.isNull(() => {return 12345;})).toBe(false);
});

// TESTS for isNullish(...)
test("checks that passing 'undefined' to isNullish(...) returns 'true'", () => {
  expect(TC.isNullish(undefined)).toBe(true);
});

test("checks that passing 'null' to isNullish(...) returns 'true'", () => {
  expect(TC.isNullish(null)).toBe(true);
});

test("checks that passing 'false' to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish(false)).toBe(false);
});

test("checks that passing 'true' to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish(true)).toBe(false);
});

test("checks that passing '0' to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish(0)).toBe(false);
});

test("checks that passing '1' to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish(1)).toBe(false);
});

test("checks that passing '0n' to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish(BigInt(1))).toBe(false);
});

test("checks that passing '' to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish("")).toBe(false);
});

test("checks that passing ' ' to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish(" ")).toBe(false);
});

test("checks that passing 'a' to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish("a")).toBe(false);
});

test("checks that passing a date to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish(new Date())).toBe(false);
});

test("checks that passing empty object to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish({})).toBe(false);
});

test("checks that passing non-empty object to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish({num: 1})).toBe(false);
});

test("checks that passing empty array to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish([])).toBe(false);
});

test("checks that passing non-empty array to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish([1])).toBe(false);
});

test("checks that passing regexp to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish(new Map())).toBe(false);
});

test("checks that passing set to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish(new Set())).toBe(false);
});

test("checks that passing named function to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isNullish(...) returns 'false'", () => {
  expect(TC.isNullish(() => {return 12345;})).toBe(false);
});

// TESTS for isNullishOrEmpty(...)
test("checks that passing 'undefined' to isNullishOrEmpty(...) returns 'true'", () => {
  expect(TC.isNullishOrEmpty(undefined)).toBe(true);
});

test("checks that passing 'null' to isNullishOrEmpty(...) returns 'true'", () => {
  expect(TC.isNullishOrEmpty(null)).toBe(true);
});

test("checks that passing 'false' to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty(false)).toBe(false);
});

test("checks that passing 'true' to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty(true)).toBe(false);
});

test("checks that passing '0' to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty(0)).toBe(false);
});

test("checks that passing '1' to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty(1)).toBe(false);
});

test("checks that passing '0n' to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty(BigInt(1))).toBe(false);
});

test("checks that passing '' to isNullishOrEmpty(...) returns 'true'", () => {
  expect(TC.isNullishOrEmpty("")).toBe(true);
});

test("checks that passing ' ' to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty(" ")).toBe(false);
});

test("checks that passing 'a' to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty("a")).toBe(false);
});

test("checks that passing a date to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty(new Date())).toBe(false);
});

test("checks that passing empty object to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty({})).toBe(false);
});

test("checks that passing non-empty object to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty({num: 1})).toBe(false);
});

test("checks that passing empty array to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty([])).toBe(false);
});

test("checks that passing non-empty array to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty([1])).toBe(false);
});

test("checks that passing regexp to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty(new Map())).toBe(false);
});

test("checks that passing set to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty(new Set())).toBe(false);
});

test("checks that passing named function to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isNullishOrEmpty(...) returns 'false'", () => {
  expect(TC.isNullishOrEmpty(() => {return 12345;})).toBe(false);
});

// TESTS for isNullishOrWhitespace(...)
test("checks that passing 'undefined' to isNullishOrWhitespace(...) returns 'true'", () => {
  expect(TC.isNullishOrWhitespace(undefined)).toBe(true);
});

test("checks that passing 'null' to isNullishOrWhitespace(...) returns 'true'", () => {
  expect(TC.isNullishOrWhitespace(null)).toBe(true);
});

test("checks that passing 'false' to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace(false)).toBe(false);
});

test("checks that passing 'true' to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace(true)).toBe(false);
});

test("checks that passing '0' to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace(0)).toBe(false);
});

test("checks that passing '1' to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace(1)).toBe(false);
});

test("checks that passing '0n' to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace(BigInt(1))).toBe(false);
});

test("checks that passing '' to isNullishOrWhitespace(...) returns 'true'", () => {
  expect(TC.isNullishOrWhitespace("")).toBe(true);
});

test("checks that passing ' ' to isNullishOrWhitespace(...) returns 'true'", () => {
  expect(TC.isNullishOrWhitespace(" ")).toBe(true);
});

test("checks that passing 'a' to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace("a")).toBe(false);
});

test("checks that passing a date to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace(new Date())).toBe(false);
});

test("checks that passing empty object to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace({})).toBe(false);
});

test("checks that passing non-empty object to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace({num: 1})).toBe(false);
});

test("checks that passing empty array to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace([])).toBe(false);
});

test("checks that passing non-empty array to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace([1])).toBe(false);
});

test("checks that passing regexp to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace(new Map())).toBe(false);
});

test("checks that passing set to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace(new Set())).toBe(false);
});

test("checks that passing named function to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isNullishOrWhitespace(...) returns 'false'", () => {
  expect(TC.isNullishOrWhitespace(() => {return 12345;})).toBe(false);
});

// TESTS for isFunction(...)
test("checks that passing 'undefined' to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction(undefined)).toBe(false);
});

test("checks that passing 'null' to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction(null)).toBe(false);
});

test("checks that passing 'false' to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction(false)).toBe(false);
});

test("checks that passing 'true' to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction(true)).toBe(false);
});

test("checks that passing '0' to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction(0)).toBe(false);
});

test("checks that passing '1' to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction(1)).toBe(false);
});

test("checks that passing '0n' to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction(BigInt(1))).toBe(false);
});

test("checks that passing '' to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction("")).toBe(false);
});

test("checks that passing ' ' to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction(" ")).toBe(false);
});

test("checks that passing 'a' to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction("a")).toBe(false);
});

test("checks that passing a date to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction(new Date())).toBe(false);
});

test("checks that passing empty object to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction({})).toBe(false);
});

test("checks that passing non-empty object to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction({num: 1})).toBe(false);
});

test("checks that passing empty array to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction([])).toBe(false);
});

test("checks that passing non-empty array to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction([1])).toBe(false);
});

test("checks that passing regexp to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction(new Map())).toBe(false);
});

test("checks that passing set to isFunction(...) returns 'false'", () => {
  expect(TC.isFunction(new Set())).toBe(false);
});

test("checks that passing named function to isFunction(...) returns 'true'", () => {
  expect(TC.isFunction(function getTestValue() {return 12345;})).toBe(true);
});

test("checks that passing unnamed function to isFunction(...) returns 'true'", () => {
  expect(TC.isFunction(function() {return 12345;})).toBe(true);
});

test("checks that passing arrow function to isFunction(...) returns 'true'", () => {
  expect(TC.isFunction(() => {return 12345;})).toBe(true);
});

// TESTS for isArray(...)
test("checks that passing 'undefined' to isArray(...) returns 'false'", () => {
  expect(TC.isArray(undefined)).toBe(false);
});

test("checks that passing 'null' to isArray(...) returns 'false'", () => {
  expect(TC.isArray(null)).toBe(false);
});

test("checks that passing 'false' to isArray(...) returns 'false'", () => {
  expect(TC.isArray(false)).toBe(false);
});

test("checks that passing 'true' to isArray(...) returns 'false'", () => {
  expect(TC.isArray(true)).toBe(false);
});

test("checks that passing '0' to isArray(...) returns 'false'", () => {
  expect(TC.isArray(0)).toBe(false);
});

test("checks that passing '1' to isArray(...) returns 'false'", () => {
  expect(TC.isArray(1)).toBe(false);
});

test("checks that passing '0n' to isArray(...) returns 'false'", () => {
  expect(TC.isArray(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isArray(...) returns 'false'", () => {
  expect(TC.isArray(BigInt(1))).toBe(false);
});

test("checks that passing '' to isArray(...) returns 'false'", () => {
  expect(TC.isArray("")).toBe(false);
});

test("checks that passing ' ' to isArray(...) returns 'false'", () => {
  expect(TC.isArray(" ")).toBe(false);
});

test("checks that passing 'a' to isArray(...) returns 'false'", () => {
  expect(TC.isArray("a")).toBe(false);
});

test("checks that passing a date to isArray(...) returns 'false'", () => {
  expect(TC.isArray(new Date())).toBe(false);
});

test("checks that passing empty object to isArray(...) returns 'false'", () => {
  expect(TC.isArray({})).toBe(false);
});

test("checks that passing non-empty object to isArray(...) returns 'false'", () => {
  expect(TC.isArray({num: 1})).toBe(false);
});

test("checks that passing empty array to isArray(...) returns 'true'", () => {
  expect(TC.isArray([])).toBe(true);
});

test("checks that passing non-empty array to isArray(...) returns 'true'", () => {
  expect(TC.isArray([1])).toBe(true);
});

test("checks that passing regexp to isArray(...) returns 'false'", () => {
  expect(TC.isArray(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isArray(...) returns 'false'", () => {
  expect(TC.isArray(new Map())).toBe(false);
});

test("checks that passing set to isArray(...) returns 'false'", () => {
  expect(TC.isArray(new Set())).toBe(false);
});

test("checks that passing named function to isArray(...) returns 'false'", () => {
  expect(TC.isArray(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isArray(...) returns 'false'", () => {
  expect(TC.isArray(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isArray(...) returns 'false'", () => {
  expect(TC.isArray(() => {return 12345;})).toBe(false);
});

// TESTS for isObject(...)
test("checks that passing 'undefined' to isObject(...) returns 'false'", () => {
  expect(TC.isObject(undefined)).toBe(false);
});

test("checks that passing 'null' to isObject(...) returns 'false'", () => {
  expect(TC.isObject(null)).toBe(false);
});

test("checks that passing 'false' to isObject(...) returns 'false'", () => {
  expect(TC.isObject(false)).toBe(false);
});

test("checks that passing 'true' to isObject(...) returns 'false'", () => {
  expect(TC.isObject(true)).toBe(false);
});

test("checks that passing '0' to isObject(...) returns 'false'", () => {
  expect(TC.isObject(0)).toBe(false);
});

test("checks that passing '1' to isObject(...) returns 'false'", () => {
  expect(TC.isObject(1)).toBe(false);
});

test("checks that passing '0n' to isObject(...) returns 'false'", () => {
  expect(TC.isObject(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isObject(...) returns 'false'", () => {
  expect(TC.isObject(BigInt(1))).toBe(false);
});

test("checks that passing '' to isObject(...) returns 'false'", () => {
  expect(TC.isObject("")).toBe(false);
});

test("checks that passing ' ' to isObject(...) returns 'false'", () => {
  expect(TC.isObject(" ")).toBe(false);
});

test("checks that passing 'a' to isObject(...) returns 'false'", () => {
  expect(TC.isObject("a")).toBe(false);
});

test("checks that passing a date to isObject(...) returns 'false'", () => {
  expect(TC.isObject(new Date())).toBe(false);
});

test("checks that passing empty object to isObject(...) returns 'true'", () => {
  expect(TC.isObject({})).toBe(true);
});

test("checks that passing non-empty object to isObject(...) returns 'true'", () => {
  expect(TC.isObject({num: 1})).toBe(true);
});

test("checks that passing empty array to isObject(...) returns 'false'", () => {
  expect(TC.isObject([])).toBe(false);
});

test("checks that passing non-empty array to isObject(...) returns 'false'", () => {
  expect(TC.isObject([1])).toBe(false);
});

test("checks that passing regexp to isObject(...) returns 'false'", () => {
  expect(TC.isObject(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isObject(...) returns 'false'", () => {
  expect(TC.isObject(new Map())).toBe(false);
});

test("checks that passing set to isObject(...) returns 'false'", () => {
  expect(TC.isObject(new Set())).toBe(false);
});

test("checks that passing named function to isObject(...) returns 'false'", () => {
  expect(TC.isObject(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isObject(...) returns 'false'", () => {
  expect(TC.isObject(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isObject(...) returns 'false'", () => {
  expect(TC.isObject(() => {return 12345;})).toBe(false);
});

// TESTS for isRegExp(...)
test("checks that passing 'undefined' to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp(undefined)).toBe(false);
});

test("checks that passing 'null' to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp(null)).toBe(false);
});

test("checks that passing 'false' to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp(false)).toBe(false);
});

test("checks that passing 'true' to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp(true)).toBe(false);
});

test("checks that passing '0' to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp(0)).toBe(false);
});

test("checks that passing '1' to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp(1)).toBe(false);
});

test("checks that passing '0n' to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp(BigInt(1))).toBe(false);
});

test("checks that passing '' to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp("")).toBe(false);
});

test("checks that passing ' ' to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp(" ")).toBe(false);
});

test("checks that passing 'a' to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp("a")).toBe(false);
});

test("checks that passing a date to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp(new Date())).toBe(false);
});

test("checks that passing empty object to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp({})).toBe(false);
});

test("checks that passing non-empty object to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp({num: 1})).toBe(false);
});

test("checks that passing empty array to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp([])).toBe(false);
});

test("checks that passing non-empty array to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp([1])).toBe(false);
});

test("checks that passing regexp to isRegExp(...) returns 'true'", () => {
  expect(TC.isRegExp(new RegExp(/\*/))).toBe(true);
});

test("checks that passing map to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp(new Map())).toBe(false);
});

test("checks that passing set to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp(new Set())).toBe(false);
});

test("checks that passing named function to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isRegExp(...) returns 'false'", () => {
  expect(TC.isRegExp(() => {return 12345;})).toBe(false);
});

// TESTS for isMap(...)
test("checks that passing 'undefined' to isMap(...) returns 'false'", () => {
  expect(TC.isMap(undefined)).toBe(false);
});

test("checks that passing 'null' to isMap(...) returns 'false'", () => {
  expect(TC.isMap(null)).toBe(false);
});

test("checks that passing 'false' to isMap(...) returns 'false'", () => {
  expect(TC.isMap(false)).toBe(false);
});

test("checks that passing 'true' to isMap(...) returns 'false'", () => {
  expect(TC.isMap(true)).toBe(false);
});

test("checks that passing '0' to isMap(...) returns 'false'", () => {
  expect(TC.isMap(0)).toBe(false);
});

test("checks that passing '1' to isMap(...) returns 'false'", () => {
  expect(TC.isMap(1)).toBe(false);
});

test("checks that passing '0n' to isMap(...) returns 'false'", () => {
  expect(TC.isMap(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isMap(...) returns 'false'", () => {
  expect(TC.isMap(BigInt(1))).toBe(false);
});

test("checks that passing '' to isMap(...) returns 'false'", () => {
  expect(TC.isMap("")).toBe(false);
});

test("checks that passing ' ' to isMap(...) returns 'false'", () => {
  expect(TC.isMap(" ")).toBe(false);
});

test("checks that passing 'a' to isMap(...) returns 'false'", () => {
  expect(TC.isMap("a")).toBe(false);
});

test("checks that passing a date to isMap(...) returns 'false'", () => {
  expect(TC.isMap(new Date())).toBe(false);
});

test("checks that passing empty object to isMap(...) returns 'false'", () => {
  expect(TC.isMap({})).toBe(false);
});

test("checks that passing non-empty object to isMap(...) returns 'false'", () => {
  expect(TC.isMap({num: 1})).toBe(false);
});

test("checks that passing empty array to isMap(...) returns 'false'", () => {
  expect(TC.isMap([])).toBe(false);
});

test("checks that passing non-empty array to isMap(...) returns 'false'", () => {
  expect(TC.isMap([1])).toBe(false);
});

test("checks that passing regexp to isMap(...) returns 'false'", () => {
  expect(TC.isMap(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isMap(...) returns 'true'", () => {
  expect(TC.isMap(new Map())).toBe(true);
});

test("checks that passing set to isMap(...) returns 'false'", () => {
  expect(TC.isMap(new Set())).toBe(false);
});

test("checks that passing named function to isMap(...) returns 'false'", () => {
  expect(TC.isMap(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isMap(...) returns 'false'", () => {
  expect(TC.isMap(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isMap(...) returns 'false'", () => {
  expect(TC.isMap(() => {return 12345;})).toBe(false);
});

// TESTS for isSet(...)
test("checks that passing 'undefined' to isSet(...) returns 'false'", () => {
  expect(TC.isSet(undefined)).toBe(false);
});

test("checks that passing 'null' to isSet(...) returns 'false'", () => {
  expect(TC.isSet(null)).toBe(false);
});

test("checks that passing 'false' to isSet(...) returns 'false'", () => {
  expect(TC.isSet(false)).toBe(false);
});

test("checks that passing 'true' to isSet(...) returns 'false'", () => {
  expect(TC.isSet(true)).toBe(false);
});

test("checks that passing '0' to isSet(...) returns 'false'", () => {
  expect(TC.isSet(0)).toBe(false);
});

test("checks that passing '1' to isSet(...) returns 'false'", () => {
  expect(TC.isSet(1)).toBe(false);
});

test("checks that passing '0n' to isSet(...) returns 'false'", () => {
  expect(TC.isSet(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isSet(...) returns 'false'", () => {
  expect(TC.isSet(BigInt(1))).toBe(false);
});

test("checks that passing '' to isSet(...) returns 'false'", () => {
  expect(TC.isSet("")).toBe(false);
});

test("checks that passing ' ' to isSet(...) returns 'false'", () => {
  expect(TC.isSet(" ")).toBe(false);
});

test("checks that passing 'a' to isSet(...) returns 'false'", () => {
  expect(TC.isSet("a")).toBe(false);
});

test("checks that passing a date to isSet(...) returns 'false'", () => {
  expect(TC.isSet(new Date())).toBe(false);
});

test("checks that passing empty object to isSet(...) returns 'false'", () => {
  expect(TC.isSet({})).toBe(false);
});

test("checks that passing non-empty object to isSet(...) returns 'false'", () => {
  expect(TC.isSet({num: 1})).toBe(false);
});

test("checks that passing empty array to isSet(...) returns 'false'", () => {
  expect(TC.isSet([])).toBe(false);
});

test("checks that passing non-empty array to isSet(...) returns 'false'", () => {
  expect(TC.isSet([1])).toBe(false);
});

test("checks that passing regexp to isSet(...) returns 'false'", () => {
  expect(TC.isSet(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isSet(...) returns 'false'", () => {
  expect(TC.isSet(new Map())).toBe(false);
});

test("checks that passing set to isSet(...) returns 'true'", () => {
  expect(TC.isSet(new Set())).toBe(true);
});

test("checks that passing named function to isSet(...) returns 'false'", () => {
  expect(TC.isSet(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isSet(...) returns 'false'", () => {
  expect(TC.isSet(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isSet(...) returns 'false'", () => {
  expect(TC.isSet(() => {return 12345;})).toBe(false);
});

// TESTS for isDate(...)
test("checks that passing 'undefined' to isDate(...) returns 'false'", () => {
  expect(TC.isDate(undefined)).toBe(false);
});

test("checks that passing 'null' to isDate(...) returns 'false'", () => {
  expect(TC.isDate(null)).toBe(false);
});

test("checks that passing 'false' to isDate(...) returns 'false'", () => {
  expect(TC.isDate(false)).toBe(false);
});

test("checks that passing 'true' to isDate(...) returns 'false'", () => {
  expect(TC.isDate(true)).toBe(false);
});

test("checks that passing '0' to isDate(...) returns 'false'", () => {
  expect(TC.isDate(0)).toBe(false);
});

test("checks that passing '1' to isDate(...) returns 'false'", () => {
  expect(TC.isDate(1)).toBe(false);
});

test("checks that passing '0n' to isDate(...) returns 'false'", () => {
  expect(TC.isDate(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isDate(...) returns 'false'", () => {
  expect(TC.isDate(BigInt(1))).toBe(false);
});

test("checks that passing '' to isDate(...) returns 'false'", () => {
  expect(TC.isDate("")).toBe(false);
});

test("checks that passing ' ' to isDate(...) returns 'false'", () => {
  expect(TC.isDate(" ")).toBe(false);
});

test("checks that passing 'a' to isDate(...) returns 'false'", () => {
  expect(TC.isDate("a")).toBe(false);
});

test("checks that passing a date to isDate(...) returns 'true'", () => {
  expect(TC.isDate(new Date())).toBe(true);
});

test("checks that passing empty object to isDate(...) returns 'false'", () => {
  expect(TC.isDate({})).toBe(false);
});

test("checks that passing non-empty object to isDate(...) returns 'false'", () => {
  expect(TC.isDate({num: 1})).toBe(false);
});

test("checks that passing empty array to isDate(...) returns 'false'", () => {
  expect(TC.isDate([])).toBe(false);
});

test("checks that passing non-empty array to isDate(...) returns 'false'", () => {
  expect(TC.isDate([1])).toBe(false);
});

test("checks that passing regexp to isDate(...) returns 'false'", () => {
  expect(TC.isDate(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isDate(...) returns 'false'", () => {
  expect(TC.isDate(new Map())).toBe(false);
});

test("checks that passing set to isDate(...) returns 'false'", () => {
  expect(TC.isDate(new Set())).toBe(false);
});

test("checks that passing named function to isDate(...) returns 'false'", () => {
  expect(TC.isDate(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isDate(...) returns 'false'", () => {
  expect(TC.isDate(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isDate(...) returns 'false'", () => {
  expect(TC.isDate(() => {return 12345;})).toBe(false);
});

// TESTS for isString(...)
test("checks that passing 'undefined' to isString(...) returns 'false'", () => {
  expect(TC.isString(undefined)).toBe(false);
});

test("checks that passing 'null' to isString(...) returns 'false'", () => {
  expect(TC.isString(null)).toBe(false);
});

test("checks that passing 'false' to isString(...) returns 'false'", () => {
  expect(TC.isString(false)).toBe(false);
});

test("checks that passing 'true' to isString(...) returns 'false'", () => {
  expect(TC.isString(true)).toBe(false);
});

test("checks that passing '0' to isString(...) returns 'false'", () => {
  expect(TC.isString(0)).toBe(false);
});

test("checks that passing '1' to isString(...) returns 'false'", () => {
  expect(TC.isString(1)).toBe(false);
});

test("checks that passing '0n' to isString(...) returns 'false'", () => {
  expect(TC.isString(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isString(...) returns 'false'", () => {
  expect(TC.isString(BigInt(1))).toBe(false);
});

test("checks that passing '' to isString(...) returns 'true'", () => {
  expect(TC.isString("")).toBe(true);
});

test("checks that passing ' ' to isString(...) returns 'true'", () => {
  expect(TC.isString(" ")).toBe(true);
});

test("checks that passing 'a' to isString(...) returns 'true'", () => {
  expect(TC.isString("a")).toBe(true);
});

test("checks that passing a date to isString(...) returns 'false'", () => {
  expect(TC.isString(new Date())).toBe(false);
});

test("checks that passing empty object to isString(...) returns 'false'", () => {
  expect(TC.isString({})).toBe(false);
});

test("checks that passing non-empty object to isString(...) returns 'false'", () => {
  expect(TC.isString({num: 1})).toBe(false);
});

test("checks that passing empty array to isString(...) returns 'false'", () => {
  expect(TC.isString([])).toBe(false);
});

test("checks that passing non-empty array to isString(...) returns 'false'", () => {
  expect(TC.isString([1])).toBe(false);
});

test("checks that passing regexp to isString(...) returns 'false'", () => {
  expect(TC.isString(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isString(...) returns 'false'", () => {
  expect(TC.isString(new Map())).toBe(false);
});

test("checks that passing set to isString(...) returns 'false'", () => {
  expect(TC.isString(new Set())).toBe(false);
});

test("checks that passing named function to isString(...) returns 'false'", () => {
  expect(TC.isString(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isString(...) returns 'false'", () => {
  expect(TC.isString(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isString(...) returns 'false'", () => {
  expect(TC.isString(() => {return 12345;})).toBe(false);
});

// TESTS for isBigInt(...)
test("checks that passing 'undefined' to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt(undefined)).toBe(false);
});

test("checks that passing 'null' to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt(null)).toBe(false);
});

test("checks that passing 'false' to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt(false)).toBe(false);
});

test("checks that passing 'true' to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt(true)).toBe(false);
});

test("checks that passing '0' to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt(0)).toBe(false);
});

test("checks that passing '1' to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt(1)).toBe(false);
});

test("checks that passing '0n' to isBigInt(...) returns 'true'", () => {
  expect(TC.isBigInt(BigInt(0))).toBe(true);
});

test("checks that passing '1n' to isBigInt(...) returns 'true'", () => {
  expect(TC.isBigInt(BigInt(1))).toBe(true);
});

test("checks that passing '' to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt("")).toBe(false);
});

test("checks that passing ' ' to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt(" ")).toBe(false);
});

test("checks that passing 'a' to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt("a")).toBe(false);
});

test("checks that passing a date to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt(new Date())).toBe(false);
});

test("checks that passing empty object to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt({})).toBe(false);
});

test("checks that passing non-empty object to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt({num: 1})).toBe(false);
});

test("checks that passing empty array to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt([])).toBe(false);
});

test("checks that passing non-empty array to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt([1])).toBe(false);
});

test("checks that passing regexp to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt(new Map())).toBe(false);
});

test("checks that passing set to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt(new Set())).toBe(false);
});

test("checks that passing named function to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isBigInt(...) returns 'false'", () => {
  expect(TC.isBigInt(() => {return 12345;})).toBe(false);
});

// TESTS for isNumber(...)
test("checks that passing 'undefined' to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber(undefined)).toBe(false);
});

test("checks that passing 'null' to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber(null)).toBe(false);
});

test("checks that passing 'false' to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber(false)).toBe(false);
});

test("checks that passing 'true' to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber(true)).toBe(false);
});

test("checks that passing '0' to isNumber(...) returns 'true'", () => {
  expect(TC.isNumber(0)).toBe(true);
});

test("checks that passing '1' to isNumber(...) returns 'true'", () => {
  expect(TC.isNumber(1)).toBe(true);
});

test("checks that passing '0n' to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber(BigInt(1))).toBe(false);
});

test("checks that passing '' to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber("")).toBe(false);
});

test("checks that passing ' ' to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber(" ")).toBe(false);
});

test("checks that passing 'a' to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber("a")).toBe(false);
});

test("checks that passing a date to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber(new Date())).toBe(false);
});

test("checks that passing empty object to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber({})).toBe(false);
});

test("checks that passing non-empty object to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber({num: 1})).toBe(false);
});

test("checks that passing empty array to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber([])).toBe(false);
});

test("checks that passing non-empty array to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber([1])).toBe(false);
});

test("checks that passing regexp to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber(new Map())).toBe(false);
});

test("checks that passing set to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber(new Set())).toBe(false);
});

test("checks that passing named function to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isNumber(...) returns 'false'", () => {
  expect(TC.isNumber(() => {return 12345;})).toBe(false);
});

// TESTS for isBoolean(...)
test("checks that passing 'undefined' to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean(undefined)).toBe(false);
});

test("checks that passing 'null' to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean(null)).toBe(false);
});

test("checks that passing 'false' to isBoolean(...) returns 'true'", () => {
  expect(TC.isBoolean(false)).toBe(true);
});

test("checks that passing 'true' to isBoolean(...) returns 'true'", () => {
  expect(TC.isBoolean(true)).toBe(true);
});

test("checks that passing '0' to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean(0)).toBe(false);
});

test("checks that passing '1' to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean(1)).toBe(false);
});

test("checks that passing '0n' to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean(BigInt(1))).toBe(false);
});

test("checks that passing '' to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean("")).toBe(false);
});

test("checks that passing ' ' to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean(" ")).toBe(false);
});

test("checks that passing 'a' to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean("a")).toBe(false);
});

test("checks that passing a date to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean(new Date())).toBe(false);
});

test("checks that passing empty object to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean({})).toBe(false);
});

test("checks that passing non-empty object to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean({num: 1})).toBe(false);
});

test("checks that passing empty array to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean([])).toBe(false);
});

test("checks that passing non-empty array to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean([1])).toBe(false);
});

test("checks that passing regexp to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean(new Map())).toBe(false);
});

test("checks that passing set to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean(new Set())).toBe(false);
});

test("checks that passing named function to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isBoolean(...) returns 'false'", () => {
  expect(TC.isBoolean(() => {return 12345;})).toBe(false);
});

// TESTS for isTimestamp(...)
test("checks that passing 'undefined' to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp(undefined)).toBe(false);
});

test("checks that passing 'null' to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp(null)).toBe(false);
});

test("checks that passing 'false' to isTimestamp(...) returns 'true'", () => {
  expect(TC.isTimestamp(false)).toBe(false);
});

test("checks that passing 'true' to isTimestamp(...) returns 'true'", () => {
  expect(TC.isTimestamp(true)).toBe(false);
});

test("checks that passing '0' to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp(0)).toBe(false);
});

test("checks that passing '1' to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp(1)).toBe(false);
});

test("checks that passing '0n' to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp(BigInt(0))).toBe(false);
});

test("checks that passing '1n' to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp(BigInt(1))).toBe(false);
});

test("checks that passing '' to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp("")).toBe(false);
});

test("checks that passing ' ' to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp(" ")).toBe(false);
});

test("checks that passing 'a' to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp("a")).toBe(false);
});

test("checks that passing a date to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp(new Date())).toBe(false);
});

test("checks that passing empty object to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp({})).toBe(false);
});

test("checks that passing non-empty object to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp({num: 1})).toBe(false);
});

test("checks that passing empty array to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp([])).toBe(false);
});

test("checks that passing non-empty array to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp([1])).toBe(false);
});

test("checks that passing regexp to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp(new RegExp(/\*/))).toBe(false);
});

test("checks that passing map to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp(new Map())).toBe(false);
});

test("checks that passing set to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp(new Set())).toBe(false);
});

test("checks that passing named function to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp(function getTestValue() {return 12345;})).toBe(false);
});

test("checks that passing unnamed function to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp(function() {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp(() => {return 12345;})).toBe(false);
});

test("checks that passing arrow function to isTimestamp(...) returns 'false'", () => {
  expect(TC.isTimestamp(firestore.Timestamp.now())).toBe(true);
});

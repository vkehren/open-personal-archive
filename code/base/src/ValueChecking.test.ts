import * as firestore from "@google-cloud/firestore";
import * as VC from "./ValueChecking";

/* eslint-disable camelcase */
export const name = "ValueCheckingTests";

// TESTS for getSize(...)
test("checks that passing non-empty string to getSize(...) returns '1'", () => {
  expect(VC.getSize("a")).toBe(1);
});

test("checks that passing non-empty whitespace string to getSize(...) returns '1'", () => {
  expect(VC.getSize(" ")).toBe(1);
});

test("checks that passing empty string to getSize(...) returns '0'", () => {
  expect(VC.getSize("")).toBe(0);
});

test("checks that passing non-empty Object to getSize(...) returns '1'", () => {
  expect(VC.getSize({p: 1})).toBe(1);
});

test("checks that passing empty Object to getSize(...) returns '0'", () => {
  expect(VC.getSize({})).toBe(0);
});

test("checks that passing non-empty Array to getSize(...) returns '1'", () => {
  expect(VC.getSize([1])).toBe(1);
});

test("checks that passing empty Array to getSize(...) returns '0'", () => {
  expect(VC.getSize([])).toBe(0);
});

test("checks that passing non-empty Map to getSize(...) returns '3'", () => {
  expect(VC.getSize(new Map([["a", "A"], ["b", "B"], ["c", "C"]]))).toBe(3);
});

test("checks that passing empty Map to getSize(...) returns '0'", () => {
  expect(VC.getSize(new Map())).toBe(0);
});

test("checks that passing non-empty Set to getSize(...) returns '3'", () => {
  expect(VC.getSize(new Set(["a", "b", "c"]))).toBe(3);
});

test("checks that passing empty Set to getSize(...) returns '0'", () => {
  expect(VC.getSize(new Set())).toBe(0);
});

// TESTS for isEmpty(...)
test("checks that passing non-empty string to isEmpty(...) returns 'false'", () => {
  expect(VC.isEmpty("a")).toBe(false);
});

test("checks that passing non-empty whitespace string to isEmpty(...) returns 'false'", () => {
  expect(VC.isEmpty(" ")).toBe(false);
});

test("checks that passing empty string to isEmpty(...) returns 'true'", () => {
  expect(VC.isEmpty("")).toBe(true);
});

test("checks that passing non-empty Object to isEmpty(...) returns 'false'", () => {
  expect(VC.isEmpty({p: 1})).toBe(false);
});

test("checks that passing empty Object to isEmpty(...) returns 'true'", () => {
  expect(VC.isEmpty({})).toBe(true);
});

test("checks that passing non-empty Array to isEmpty(...) returns 'false'", () => {
  expect(VC.isEmpty([1])).toBe(false);
});

test("checks that passing empty Array to isEmpty(...) returns 'true'", () => {
  expect(VC.isEmpty([])).toBe(true);
});

test("checks that passing non-empty Map to isEmpty(...) returns 'false'", () => {
  expect(VC.isEmpty(new Map([["a", "A"], ["b", "B"], ["c", "C"]]))).toBe(false);
});

test("checks that passing empty Map to isEmpty(...) returns 'true'", () => {
  expect(VC.isEmpty(new Map())).toBe(true);
});

test("checks that passing non-empty Set to isEmpty(...) returns 'false'", () => {
  expect(VC.isEmpty(new Set(["a", "b", "c"]))).toBe(false);
});

test("checks that passing empty Set to isEmpty(...) returns 'true'", () => {
  expect(VC.isEmpty(new Set())).toBe(true);
});

// TESTS for isWhitespace(...)
test("checks that passing non-empty string to isWhitespace(...) returns 'false'", () => {
  expect(VC.isWhitespace("a")).toBe(false);
});

test("checks that passing non-empty whitespace string to isWhitespace(...) returns 'true'", () => {
  expect(VC.isWhitespace(" ")).toBe(true);
});

test("checks that passing empty string to isWhitespace(...) returns 'true'", () => {
  expect(VC.isWhitespace("")).toBe(true);
});

// TESTS for getBoolean(...)
test("checks that passing 'undefined' to getBoolean(...) returns 'undefined'", () => {
  expect(VC.getBoolean(undefined)).toBe(undefined);
});

test("checks that passing 'undefined' to getBoolean(...) with default to 'false' returns 'false'", () => {
  expect(VC.getBoolean(undefined, false)).toBe(false);
});

test("checks that passing 'undefined' to getBoolean(...) with default to 'true' returns 'true'", () => {
  expect(VC.getBoolean(undefined, true)).toBe(true);
});

test("checks that passing 'null' to getBoolean(...) returns 'null'", () => {
  expect(VC.getBoolean(null)).toBe(null);
});

test("checks that passing 'null' to getBoolean(...) with default to 'false' returns 'false'", () => {
  expect(VC.getBoolean(null, false)).toBe(false);
});

test("checks that passing 'null' to getBoolean(...) with default to 'true' returns 'true'", () => {
  expect(VC.getBoolean(null, true)).toBe(true);
});

test("checks that passing empty string to getBoolean(...) returns 'null'", () => {
  expect(VC.getBoolean("")).toBe(null);
});

test("checks that passing empty string to getBoolean(...) with default to 'false' returns 'false'", () => {
  expect(VC.getBoolean("", false)).toBe(false);
});

test("checks that passing empty string to getBoolean(...) with default to 'true' returns 'true'", () => {
  expect(VC.getBoolean("", true)).toBe(true);
});

test("checks that passing whitespace string to getBoolean(...) returns 'null'", () => {
  expect(VC.getBoolean(" ")).toBe(null);
});

test("checks that passing whitespace string to getBoolean(...) with default to 'false' returns 'false'", () => {
  expect(VC.getBoolean(" ", false)).toBe(false);
});

test("checks that passing whitespace string to getBoolean(...) with default to 'true' returns 'true'", () => {
  expect(VC.getBoolean(" ", true)).toBe(true);
});

test("checks that passing 'jUnKtExT234#2wr~' to getBoolean(...) returns 'null'", () => {
  expect(VC.getBoolean("jUnKtExT234#2wr~")).toBe(null);
});

test("checks that passing 'jUnKtExT234#2wr~' to getBoolean(...) with default to 'false' returns 'false'", () => {
  expect(VC.getBoolean("jUnKtExT234#2wr~", false)).toBe(false);
});

test("checks that passing 'jUnKtExT234#2wr~' to getBoolean(...) with default to 'true' returns 'true'", () => {
  expect(VC.getBoolean("jUnKtExT234#2wr~", true)).toBe(true);
});

test("checks that passing 'false' to getBoolean(...) returns 'false'", () => {
  expect(VC.getBoolean(false)).toBe(false);
});

test("checks that passing 'false' to getBoolean(...) with default to 'false' returns 'false'", () => {
  expect(VC.getBoolean(false, false)).toBe(false);
});

test("checks that passing 'false' to getBoolean(...) with default to 'true' returns 'false'", () => {
  expect(VC.getBoolean(false, true)).toBe(false);
});

test("checks that passing 'true' to getBoolean(...) returns 'true'", () => {
  expect(VC.getBoolean(true)).toBe(true);
});

test("checks that passing 'true' to getBoolean(...) with default to 'false' returns 'true'", () => {
  expect(VC.getBoolean(true, false)).toBe(true);
});

test("checks that passing 'true' to getBoolean(...) with default to 'true' returns 'true'", () => {
  expect(VC.getBoolean(true, true)).toBe(true);
});

test("checks that passing 'false' as text to getBoolean(...) returns 'false'", () => {
  expect(VC.getBoolean("false")).toBe(false);
});

test("checks that passing 'false' as text to getBoolean(...) with default to 'false' returns 'false'", () => {
  expect(VC.getBoolean("false", false)).toBe(false);
});

test("checks that passing 'false' as text to getBoolean(...) with default to 'true' returns 'false'", () => {
  expect(VC.getBoolean("false", true)).toBe(false);
});

test("checks that passing 'true' as text to getBoolean(...) returns 'true'", () => {
  expect(VC.getBoolean("true")).toBe(true);
});

test("checks that passing 'true' as text to getBoolean(...) with default to 'false' returns 'true'", () => {
  expect(VC.getBoolean("true", false)).toBe(true);
});

test("checks that passing 'true' as text to getBoolean(...) with default to 'true' returns 'true'", () => {
  expect(VC.getBoolean("true", true)).toBe(true);
});

test("checks that passing 'false' as capital text to getBoolean(...) returns 'false'", () => {
  expect(VC.getBoolean("FALSE")).toBe(false);
});

test("checks that passing 'false' as capital text to getBoolean(...) with default to 'false' returns 'false'", () => {
  expect(VC.getBoolean("FALSE", false)).toBe(false);
});

test("checks that passing 'false' as capital text to getBoolean(...) with default to 'true' returns 'false'", () => {
  expect(VC.getBoolean("FALSE", true)).toBe(false);
});

test("checks that passing 'true' as capital text to getBoolean(...) returns 'true'", () => {
  expect(VC.getBoolean("TRUE")).toBe(true);
});

test("checks that passing 'true' as capital text to getBoolean(...) with default to 'false' returns 'true'", () => {
  expect(VC.getBoolean("TRUE", false)).toBe(true);
});

test("checks that passing 'true' as capital text to getBoolean(...) with default to 'true' returns 'true'", () => {
  expect(VC.getBoolean("TRUE", true)).toBe(true);
});

test("checks that passing '0' to getBoolean(...) returns 'false'", () => {
  expect(VC.getBoolean(0)).toBe(false);
});

test("checks that passing '0' to getBoolean(...) with default to 'false' returns 'false'", () => {
  expect(VC.getBoolean(0, false)).toBe(false);
});

test("checks that passing '0' to getBoolean(...) with default to 'true' returns 'false'", () => {
  expect(VC.getBoolean(0, true)).toBe(false);
});

test("checks that passing '-1' to getBoolean(...) returns 'true'", () => {
  expect(VC.getBoolean(-1)).toBe(true);
});

test("checks that passing '-1' to getBoolean(...) with default to 'false' returns 'true'", () => {
  expect(VC.getBoolean(-1, false)).toBe(true);
});

test("checks that passing '-1' to getBoolean(...) with default to 'true' returns 'true'", () => {
  expect(VC.getBoolean(-1, true)).toBe(true);
});

test("checks that passing '1' to getBoolean(...) returns 'true'", () => {
  expect(VC.getBoolean(1)).toBe(true);
});

test("checks that passing '1' to getBoolean(...) with default to 'false' returns 'true'", () => {
  expect(VC.getBoolean(1, false)).toBe(true);
});

test("checks that passing '1' to getBoolean(...) with default to 'true' returns 'true'", () => {
  expect(VC.getBoolean(1, true)).toBe(true);
});

test("checks that passing '0' as text to getBoolean(...) returns 'false'", () => {
  expect(VC.getBoolean("0")).toBe(false);
});

test("checks that passing '0' as text to getBoolean(...) with default to 'false' returns 'false'", () => {
  expect(VC.getBoolean("0", false)).toBe(false);
});

test("checks that passing '0' as text to getBoolean(...) with default to 'true' returns 'false'", () => {
  expect(VC.getBoolean("0", true)).toBe(false);
});

test("checks that passing '-1' as text to getBoolean(...) returns 'true'", () => {
  expect(VC.getBoolean("-1")).toBe(true);
});

test("checks that passing '-1' as text to getBoolean(...) with default to 'false' returns 'true'", () => {
  expect(VC.getBoolean("-1", false)).toBe(true);
});

test("checks that passing '-1' as text to getBoolean(...) with default to 'true' returns 'true'", () => {
  expect(VC.getBoolean("-1", true)).toBe(true);
});

test("checks that passing '1' as text to getBoolean(...) returns 'true'", () => {
  expect(VC.getBoolean("1")).toBe(true);
});

test("checks that passing '1' as text to getBoolean(...) with default to 'false' returns 'true'", () => {
  expect(VC.getBoolean("1", false)).toBe(true);
});

test("checks that passing '1' as text to getBoolean(...) with default to 'true' returns 'true'", () => {
  expect(VC.getBoolean("1", true)).toBe(true);
});

// TESTS for areDatesEqual(...)
test("checks that passing both nullish to areDatesEqual(...) returns 'true'", () => {
  expect(VC.areDatesEqual(undefined, undefined)).toBe(true);
  expect(VC.areDatesEqual(undefined, null)).toBe(true);
  expect(VC.areDatesEqual(null, undefined)).toBe(true);
  expect(VC.areDatesEqual(null, null)).toBe(true);
});

test("checks that passing one nullish to isOfValue(...) returns 'false'", () => {
  const timestamp = firestore.Timestamp.now();
  const date = timestamp.toDate();

  expect(VC.areDatesEqual(date, undefined)).toBe(false);
  expect(VC.areDatesEqual(date, null)).toBe(false);
  expect(VC.areDatesEqual(timestamp, undefined)).toBe(false);
  expect(VC.areDatesEqual(timestamp, null)).toBe(false);
  expect(VC.areDatesEqual(undefined, date)).toBe(false);
  expect(VC.areDatesEqual(null, date)).toBe(false);
  expect(VC.areDatesEqual(undefined, timestamp)).toBe(false);
  expect(VC.areDatesEqual(null, timestamp)).toBe(false);
});

test("checks that passing different values to isOfValue(...) returns 'false'", () => {
  const timestamp1 = firestore.Timestamp.now();
  const date1 = timestamp1.toDate();
  const timestamp2 = new firestore.Timestamp(timestamp1.seconds + 1, timestamp1.nanoseconds);
  const date2 = timestamp2.toDate();

  expect(VC.areDatesEqual(timestamp1, timestamp2)).toBe(false);
  expect(VC.areDatesEqual(timestamp1, date2)).toBe(false);
  expect(VC.areDatesEqual(date1, timestamp2)).toBe(false);
  expect(VC.areDatesEqual(date1, date2)).toBe(false);
});

test("checks that passing same values to isOfValue(...) returns 'true'", () => {
  const timestamp1 = firestore.Timestamp.now();
  const date1 = timestamp1.toDate();
  const timestamp2 = new firestore.Timestamp(timestamp1.seconds, timestamp1.nanoseconds);
  const date2 = timestamp2.toDate();

  expect(VC.areDatesEqual(timestamp1, timestamp2)).toBe(true);
  expect(VC.areDatesEqual(timestamp1, date2)).toBe(true);
  expect(VC.areDatesEqual(date1, timestamp2)).toBe(true);
  expect(VC.areDatesEqual(date1, date2)).toBe(true);
});

// TESTS for isOfValue(...)
test("checks that passing 'undefined' to isOfValue(...) returns 'false'", () => {
  expect(VC.isOfValue(undefined, -33)).toBe(false);
  expect(VC.isOfValue(undefined, -32)).toBe(false);
  expect(VC.isOfValue(undefined, -1)).toBe(false);
  expect(VC.isOfValue(undefined, 0)).toBe(false);
  expect(VC.isOfValue(undefined, 1)).toBe(false);
  expect(VC.isOfValue(undefined, 32)).toBe(false);
  expect(VC.isOfValue(undefined, 33)).toBe(false);
});

test("checks that passing 'null' to isOfValue(...) returns 'false'", () => {
  expect(VC.isOfValue(null, -33)).toBe(false);
  expect(VC.isOfValue(null, -32)).toBe(false);
  expect(VC.isOfValue(null, -1)).toBe(false);
  expect(VC.isOfValue(null, 0)).toBe(false);
  expect(VC.isOfValue(null, 1)).toBe(false);
  expect(VC.isOfValue(null, 32)).toBe(false);
  expect(VC.isOfValue(null, 33)).toBe(false);
});

test("checks that passing '1' bitwise to isOfValue(...) returns correct value", () => {
  expect(VC.isOfValue(1, -33)).toBe(true);
  expect(VC.isOfValue(1, -32)).toBe(false);
  expect(VC.isOfValue(1, -1)).toBe(true);
  expect(VC.isOfValue(1, 0)).toBe(false);
  expect(VC.isOfValue(1, 1)).toBe(true);
  expect(VC.isOfValue(1, 32)).toBe(false);
  expect(VC.isOfValue(1, 33)).toBe(true);
});

test("checks that passing '1' logically to isOfValue(...) returns correct value", () => {
  expect(VC.isOfValue(1, -33, false)).toBe(false);
  expect(VC.isOfValue(1, -32, false)).toBe(false);
  expect(VC.isOfValue(1, -1, false)).toBe(false);
  expect(VC.isOfValue(1, 0, false)).toBe(false);
  expect(VC.isOfValue(1, 1, false)).toBe(true);
  expect(VC.isOfValue(1, 32, false)).toBe(false);
  expect(VC.isOfValue(1, 33, false)).toBe(false);
});

// TESTS for getUnlessThrowError(...)
test("checks that passing basic values to getUnlessThrowError(...) with \"throwError = false\" returns that value", () => {
  expect(VC.getUnlessThrowError(undefined, false)).toBe(undefined);
  expect(VC.getUnlessThrowError(null, false)).toBe(null);
  expect(VC.getUnlessThrowError(false, false)).toBe(false);
  expect(VC.getUnlessThrowError(true, false)).toBe(true);
  expect(VC.getUnlessThrowError(-1, false)).toBe(-1);
  expect(VC.getUnlessThrowError(0, false)).toBe(0);
  expect(VC.getUnlessThrowError(1, false)).toBe(1);
  expect(VC.getUnlessThrowError("Hello", false)).toBe("Hello");
});

test("checks that passing getter values to getUnlessThrowError(...) with \"throwError = false\" returns the gotten value", () => {
  expect(VC.getUnlessThrowError(() => undefined, false)).toBe(undefined);
  expect(VC.getUnlessThrowError(() => null, false)).toBe(null);
  expect(VC.getUnlessThrowError(() => false, false)).toBe(false);
  expect(VC.getUnlessThrowError(() => true, false)).toBe(true);
  expect(VC.getUnlessThrowError(() => -1, false)).toBe(-1);
  expect(VC.getUnlessThrowError(() => 0, false)).toBe(0);
  expect(VC.getUnlessThrowError(() => 1, false)).toBe(1);
  expect(VC.getUnlessThrowError(() => "Hello", false)).toBe("Hello");
});

test("checks that passing basic values to getUnlessThrowError(...) with \"throwError = true\" throws error", () => {
  expect(() => VC.getUnlessThrowError(undefined, true)).toThrowError();
  expect(() => VC.getUnlessThrowError(null, true)).toThrowError();
  expect(() => VC.getUnlessThrowError(false, true)).toThrowError();
  expect(() => VC.getUnlessThrowError(true, true)).toThrowError();
  expect(() => VC.getUnlessThrowError(-1, true)).toThrowError();
  expect(() => VC.getUnlessThrowError(0, true)).toThrowError();
  expect(() => VC.getUnlessThrowError(1, true)).toThrowError();
  expect(() => VC.getUnlessThrowError("Hello", true)).toThrowError();
});

test("checks that passing getter values to getUnlessThrowError(...) with \"throwError = true\" throws error", () => {
  expect(() => VC.getUnlessThrowError(() => undefined, true)).toThrowError();
  expect(() => VC.getUnlessThrowError(() => null, true)).toThrowError();
  expect(() => VC.getUnlessThrowError(() => false, true)).toThrowError();
  expect(() => VC.getUnlessThrowError(() => true, true)).toThrowError();
  expect(() => VC.getUnlessThrowError(() => -1, true)).toThrowError();
  expect(() => VC.getUnlessThrowError(() => 0, true)).toThrowError();
  expect(() => VC.getUnlessThrowError(() => 1, true)).toThrowError();
  expect(() => VC.getUnlessThrowError(() => "Hello", true)).toThrowError();
});

// TESTS for isOfValue(...)
test("checks that passing basic values to parseJsonIfNeeded(...) returns that value", () => {
  const now = Date.now();
  expect(VC.parseJsonIfNeeded(undefined)).toBe(undefined);
  expect(VC.parseJsonIfNeeded(null)).toBe(null);
  expect(VC.parseJsonIfNeeded(false)).toBe(false);
  expect(VC.parseJsonIfNeeded(true)).toBe(true);
  expect(VC.parseJsonIfNeeded(0)).toBe(0);
  expect(VC.parseJsonIfNeeded(1)).toBe(1);
  expect(VC.parseJsonIfNeeded(now)).toBe(now);
  expect(VC.parseJsonIfNeeded(now.toString())).toBe(now.toString());
  expect(VC.parseJsonIfNeeded("Hello")).toBe("Hello");
  expect(VC.parseJsonIfNeeded("Hello World!")).toBe("Hello World!");
});

test("checks that passing complex objects to parseJsonIfNeeded(...) returns that value", () => {
  const now = Date.now();
  expect(VC.parseJsonIfNeeded({})).toEqual({});
  expect(VC.parseJsonIfNeeded({a: null})).toEqual({a: null});
  expect(VC.parseJsonIfNeeded({b: false})).toEqual({b: false});
  expect(VC.parseJsonIfNeeded({c: true})).toEqual({c: true});
  expect(VC.parseJsonIfNeeded({d: 0})).toEqual({d: 0});
  expect(VC.parseJsonIfNeeded({e: 1})).toEqual({e: 1});
  expect(VC.parseJsonIfNeeded({f: now})).toEqual({f: now});
  expect(VC.parseJsonIfNeeded({g: now.toString()})).toEqual({g: now.toString()});
  expect(VC.parseJsonIfNeeded({h: "Hello"})).toEqual({h: "Hello"});
  expect(VC.parseJsonIfNeeded({i: "Hello World!"})).toEqual({i: "Hello World!"});
  expect(VC.parseJsonIfNeeded({j: {k: "Hello", l: "Hello World!"}, m: now})).toEqual({j: {k: "Hello", l: "Hello World!"}, m: now});
  expect(VC.parseJsonIfNeeded([null, false, true, 0, 1])).toEqual([null, false, true, 0, 1]);
});

test("checks that passing JSON to parseJsonIfNeeded(...) returns object", () => {
  const now = Date.now();
  expect(VC.parseJsonIfNeeded("{}")).toEqual({});
  expect(VC.parseJsonIfNeeded("{\"a\": null}")).toEqual({a: null});
  expect(VC.parseJsonIfNeeded("{\"b\": false}")).toEqual({b: false});
  expect(VC.parseJsonIfNeeded("{\"c\": true}")).toEqual({c: true});
  expect(VC.parseJsonIfNeeded("{\"d\": 0}")).toEqual({d: 0});
  expect(VC.parseJsonIfNeeded("{\"e\": 1}")).toEqual({e: 1});
  expect(VC.parseJsonIfNeeded("{\"g\": \"" + now.toString() + "\"}")).toEqual({g: now.toString()});
  expect(VC.parseJsonIfNeeded("{\"h\": \"Hello\"}")).toEqual({h: "Hello"});
  expect(VC.parseJsonIfNeeded("{\"i\": \"Hello World!\"}")).toEqual({i: "Hello World!"});
  expect(VC.parseJsonIfNeeded("{\"j\": {\"k\": \"Hello\", \"l\": \"Hello World!\"}, \"m\": \"" + now.toString() + "\"}")).toEqual({j: {k: "Hello", l: "Hello World!"}, m: now.toString()});
  expect(VC.parseJsonIfNeeded("[null, false, true, 0, 1]")).toEqual([null, false, true, 0, 1]);
});

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

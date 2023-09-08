import * as AP from "./Application";

/* eslint-disable camelcase */
export const name = "ApplicationTests";
type EnumUnderscore = "a_b" | "b_c" | "c_d";
type EnumDash = "a-b" | "b-c" | "c-d";
const undefinedString = ((undefined as unknown) as string);
const nullString = ((null as unknown) as string);
const falseString = ((false as unknown) as string);
const trueString = ((true as unknown) as string);
const zeroString = ((0 as unknown) as string);
const oneString = ((1 as unknown) as string);


// TESTS for copyObject(...)
test("checks that passing 'undefined' returns 'undefined'", () => {
  expect(AP.copyObject(undefinedString)).toBe(undefinedString);
});

test("checks that passing 'null' returns 'null'", () => {
  expect(AP.copyObject(nullString)).toBe(nullString);
});

test("checks that passing 'falseString' returns 'falseString'", () => {
  expect(AP.copyObject(falseString)).toBe(falseString);
});

test("checks that passing 'falseString' returns 'falseString'", () => {
  expect(AP.copyObject(trueString)).toBe(trueString);
});

test("checks that passing 'falseString' returns 'falseString'", () => {
  expect(AP.copyObject(zeroString)).toBe(zeroString);
});

test("checks that passing 'falseString' returns 'falseString'", () => {
  expect(AP.copyObject(oneString)).toBe(oneString);
});

test("checks that passing 'falseString' returns 'falseString'", () => {
  const input = {a: 1, b: 2, c: true, d: "four"};
  expect(AP.copyObject(input)).toEqual(input);
});

test("checks that passing 'falseString' returns 'falseString'", () => {
  const input = {a: 1, b: 2, c: true, d: "four", e: [trueString, falseString], f: {x: "x", y: 2, z: "aaaaaaaa"}};
  expect(AP.copyObject(input)).toEqual(input);
});


// TESTS for convertStringToEnumValue(...)
test("checks that passing 'undefined' returns 'null'", () => {
  expect(AP.convertStringToEnumValue<EnumUnderscore>(undefinedString, "b_c")).toBe("b_c");
});

test("checks that passing 'undefined' returns 'null'", () => {
  expect(AP.convertStringToEnumValue<EnumDash>(undefinedString, "b-c")).toBe("b-c");
});

test("checks that passing 'null' returns 'null'", () => {
  expect(AP.convertStringToEnumValue<EnumUnderscore>(nullString, "b_c")).toBe("b_c");
});

test("checks that passing 'null' returns 'null'", () => {
  expect(AP.convertStringToEnumValue<EnumDash>(nullString, "b-c")).toBe("b-c");
});

test("checks that passing 'a_b' returns 'a_b'", () => {
  expect(AP.convertStringToEnumValue<EnumUnderscore>("a_b", "b_c")).toBe("a_b");
});

test("checks that passing 'a-b' returns 'a-b'", () => {
  expect(AP.convertStringToEnumValue<EnumDash>("a-b", "b-c")).toBe("a-b");
});

test("checks that passing 'b_c' returns 'b_c'", () => {
  expect(AP.convertStringToEnumValue<EnumUnderscore>("b_c", "c_d")).toBe("b_c");
});

test("checks that passing 'b-c' returns 'b-c'", () => {
  expect(AP.convertStringToEnumValue<EnumDash>("b-c", "c-d")).toBe("b-c");
});

test("checks that passing 'c_d' returns 'c_d'", () => {
  expect(AP.convertStringToEnumValue<EnumUnderscore>("c_d", "a_b")).toBe("c_d");
});

test("checks that passing 'c-d' returns 'c-d'", () => {
  expect(AP.convertStringToEnumValue<EnumDash>("c-d", "a-b")).toBe("c-d");
});


// TESTS for convertVersionNumberStringToNumberParts(...)
test("checks that passing 'undefined' throws error", () => {
  expect(() => AP.convertVersionNumberStringToNumberParts(undefinedString)).toThrow();
});

test("checks that passing 'null' throws error", () => {
  expect(() => AP.convertVersionNumberStringToNumberParts(nullString)).toThrow();
});

test("checks that passing 'false' throws error", () => {
  expect(() => AP.convertVersionNumberStringToNumberParts(falseString)).toThrow();
});

test("checks that passing 'true' throws error", () => {
  expect(() => AP.convertVersionNumberStringToNumberParts(trueString)).toThrow();
});

test("checks that passing '0' throws error", () => {
  expect(() => AP.convertVersionNumberStringToNumberParts(zeroString)).toThrow();
});

test("checks that passing '1' throws error", () => {
  expect(() => AP.convertVersionNumberStringToNumberParts(oneString)).toThrow();
});

test("checks that passing '\"0\"' returns '[0]'", () => {
  expect(AP.convertVersionNumberStringToNumberParts("0")).toEqual([0]);
});

test("checks that passing '\"1\"' returns '[1]'", () => {
  expect(AP.convertVersionNumberStringToNumberParts("1")).toEqual([1]);
});

test("checks that passing '\"0.0\"' returns '[0, 0]'", () => {
  expect(AP.convertVersionNumberStringToNumberParts("0.0")).toEqual([0, 0]);
});

test("checks that passing '\"0.1\"' returns '[0, 1]'", () => {
  expect(AP.convertVersionNumberStringToNumberParts("0.1")).toEqual([0, 1]);
});

test("checks that passing '\"1.0\"' returns '[1, 0]'", () => {
  expect(AP.convertVersionNumberStringToNumberParts("1.0")).toEqual([1, 0]);
});

test("checks that passing '\"1.1\"' returns '[1, 1]'", () => {
  expect(AP.convertVersionNumberStringToNumberParts("1.1")).toEqual([1, 1]);
});

test("checks that passing '\"0.0.0\"' returns '[0, 0, 0]'", () => {
  expect(AP.convertVersionNumberStringToNumberParts("0.0.0")).toEqual([0, 0, 0]);
});

test("checks that passing '\"0.0.1\"' returns '[0, 0, 1]'", () => {
  expect(AP.convertVersionNumberStringToNumberParts("0.0.1")).toEqual([0, 0, 1]);
});

test("checks that passing '\"0.1.0\"' returns '[0, 1, 0]'", () => {
  expect(AP.convertVersionNumberStringToNumberParts("0.1.0")).toEqual([0, 1, 0]);
});

test("checks that passing '\"0.1.1\"' returns '[0, 1, 1]'", () => {
  expect(AP.convertVersionNumberStringToNumberParts("0.1.1")).toEqual([0, 1, 1]);
});

test("checks that passing '\"1.0.0\"' returns '[1, 0, 0]'", () => {
  expect(AP.convertVersionNumberStringToNumberParts("1.0.0")).toEqual([1, 0, 0]);
});

test("checks that passing '\"0.0.1\"' returns '[1, 0, 1]'", () => {
  expect(AP.convertVersionNumberStringToNumberParts("1.0.1")).toEqual([1, 0, 1]);
});

test("checks that passing '\"0.0.0\"' returns '[1, 1, 0]'", () => {
  expect(AP.convertVersionNumberStringToNumberParts("1.1.0")).toEqual([1, 1, 0]);
});

test("checks that passing '\"0.0.1\"' returns '[1, 1, 1]'", () => {
  expect(AP.convertVersionNumberStringToNumberParts("1.1.1")).toEqual([1, 1, 1]);
});


// TESTS for compareVersionNumberStrings(...)
test("checks that passing 'undefined' and 'undefined' throws error", () => {
  expect(() => AP.compareVersionNumberStrings(undefinedString, undefinedString)).toThrow();
});

test("checks that passing 'null' and 'null' throws error", () => {
  expect(() => AP.compareVersionNumberStrings(nullString, nullString)).toThrow();
});

test("checks that passing '\"0\"' and '\"0\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("0", "0")).toBe(0);
});

test("checks that passing '\"0\"' and '\"1\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("0", "1")).toBe(1);
});

test("checks that passing '\"1\"' and '\"0\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("1", "0")).toBe(-1);
});

test("checks that passing '\"1\"' and '\"1\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("1", "1")).toBe(0);
});

test("checks that passing '\"0.0\"' and '\"0.0\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("0.0", "0.0")).toBe(0);
});

test("checks that passing '\"0.0\"' and '\"0.1\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("0.0", "0.1")).toBe(1);
});

test("checks that passing '\"0.1\"' and '\"0.0\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("0.1", "0.0")).toBe(-1);
});

test("checks that passing '\"0.1\"' and '\"0.1\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("0.1", "0.1")).toBe(0);
});

test("checks that passing '\"0.0\"' and '\"1.0\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("0.0", "1.0")).toBe(1);
});

test("checks that passing '\"0.0\"' and '\"1.1\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("0.0", "1.1")).toBe(1);
});

test("checks that passing '\"0.1\"' and '\"1.0\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("0.1", "1.0")).toBe(1);
});

test("checks that passing '\"0.1\"' and '\"1.1\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("0.1", "1.1")).toBe(1);
});

test("checks that passing '\"1.0\"' and '\"0.0\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("1.0", "0.0")).toBe(-1);
});

test("checks that passing '\"1.0\"' and '\"0.1\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("1.0", "0.1")).toBe(-1);
});

test("checks that passing '\"1.1\"' and '\"0.0\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("1.1", "0.0")).toBe(-1);
});

test("checks that passing '\"1.1\"' and '\"0.1\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("1.1", "0.1")).toBe(-1);
});

test("checks that passing '\"1.0\"' and '\"1.0\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("1.0", "1.0")).toBe(0);
});

test("checks that passing '\"1.0\"' and '\"1.1\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("1.0", "1.1")).toBe(1);
});

test("checks that passing '\"1.1\"' and '\"1.0\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("1.1", "1.0")).toBe(-1);
});

test("checks that passing '\"1.1\"' and '\"1.1\"' returns '0'", () => {
  expect(AP.compareVersionNumberStrings("1.1", "1.1")).toBe(0);
});

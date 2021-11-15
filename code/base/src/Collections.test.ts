import * as CL from "./Collections";

/* eslint-disable camelcase, max-len*/
export const name = "CollectionsTests";

// TESTS for isValidLocalizable(...)
test("checks that creating a Map from an Array works properly", () => {
  let arrayOfNumbers = [2, 5, 3, 1, 4];
  let duplicateCount = 0; // no duplicates included
  let mapOfNumbers = CL.createMapFromArray(arrayOfNumbers, (num: number) => num);
  expect(mapOfNumbers.size).toBe(arrayOfNumbers.length - duplicateCount);

  arrayOfNumbers = [2, 5, 3, 1, 2, 4];
  duplicateCount = 1; // "2" is included twice
  mapOfNumbers = CL.createMapFromArray(arrayOfNumbers, (num: number) => num);
  expect(mapOfNumbers.size).toBe(arrayOfNumbers.length - duplicateCount);

  arrayOfNumbers = [6, 5, 3, 1, 2, 4];
  duplicateCount = 0; // no duplicates included
  mapOfNumbers = CL.createMapFromArray(arrayOfNumbers, (num: number) => num);
  expect(mapOfNumbers.size).toBe(arrayOfNumbers.length - duplicateCount);

  let arrayOfStrings = ["abc", "xyz", "mno", "def", "pqr"];
  duplicateCount = 0; // no duplicates included
  let mapOfStrings = CL.createMapFromArray(arrayOfStrings, (str: string) => str[0]);
  expect(mapOfStrings.size).toBe(arrayOfStrings.length - duplicateCount);

  arrayOfStrings = ["abc", "xyz", "mno", "def", "pqr", "abc"];
  duplicateCount = 1; // "abc" is included twice
  mapOfStrings = CL.createMapFromArray(arrayOfStrings, (str: string) => str[0]);
  expect(mapOfStrings.size).toBe(arrayOfStrings.length - duplicateCount);

  arrayOfStrings = ["abc", "xyz", "mno", "def", "pqr", "stu"];
  duplicateCount = 0; // no duplicates included
  mapOfStrings = CL.createMapFromArray(arrayOfStrings, (str: string) => str[0]);
  expect(mapOfStrings.size).toBe(arrayOfStrings.length - duplicateCount);
});

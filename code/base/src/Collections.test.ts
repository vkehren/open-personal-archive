import * as CL from "./Collections";

/* eslint-disable camelcase, max-len*/
export const name = "CollectionsTests";

// TESTS for createMapFromArray(...)
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

// TESTS for getCollectionFromObject(...)
test("checks that creating a Array of typed elements from a container object works properly", () => {
  const container = {myNum1: 1, myNum3: 3, myStr2: "2", myNum2: 2, myStr1: "1"};
  const arrayOfNumbers: Array<number> = [1, 3, 2];
  const arrayOfStrings: Array<string> = ["2", "1"];

  const collectionOfNumbers = CL.getCollectionFromObject<number>(container, (num) => (num.toExponential !== undefined));
  expect(collectionOfNumbers.length).toBe(arrayOfNumbers.length);
  expect(collectionOfNumbers[0]).toBe(arrayOfNumbers[0]);
  expect(collectionOfNumbers[1]).toBe(arrayOfNumbers[1]);
  expect(collectionOfNumbers[2]).toBe(arrayOfNumbers[2]);

  const collectionOfStrings = CL.getCollectionFromObject<string>(container, (str) => (str.charCodeAt !== undefined));
  expect(collectionOfStrings.length).toBe(arrayOfStrings.length);
  expect(collectionOfStrings[0]).toBe(arrayOfStrings[0]);
  expect(collectionOfStrings[1]).toBe(arrayOfStrings[1]);
});

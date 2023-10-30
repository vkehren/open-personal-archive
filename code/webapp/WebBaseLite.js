const NAME = "open-personal-archive-web-base-lite";
const VERSION = "2.4.4";
const AUTHOR = "Ryan Stephen Ehrenreich";
const COPYRIGHT = "Copyright © 2021 Open Personal Archive™";

function isUndefined(value) {
  return ((typeof value) === "undefined");
}

function assertIsUndefined(value, failureMessage = "The value is not \"undefined\".") {
  if (!isUndefined(value)) {
    throw new Error(failureMessage);
  }
}

function assertNotUndefined(value, failureMessage = "The value is \"undefined\".") {
  if (isUndefined(value)) {
    throw new Error(failureMessage);
  }
}

function isNull(value) {
  return (isNullish(value) && !isUndefined(value));
}

function assertIsNull(value, failureMessage = "The value is not \"null\".") {
  if (!isNull(value)) {
    throw new Error(failureMessage);
  }
}

function assertNotNull(value, failureMessage = "The value is \"null\".") {
  if (isNull(value)) {
    throw new Error(failureMessage);
  }
}

function isNullish(value) {
  return (value == undefined);
}

function assertIsNullish(value, failureMessage = "The value is not \"undefined\" and not \"null\".") {
  if (!isNullish(value)) {
    throw new Error(failureMessage);
  }
}

function assertNotNullish(value, failureMessage = "The value is \"undefined\" or \"null\".") {
  if (isNullish(value)) {
    throw new Error(failureMessage);
  }
}

function isEmptyString(value) {
  if (isNullish(value)) {
    return false;
  }
  const valueAsString = ("" + value);
  return (valueAsString.length <= 0);
}

function assertIsEmptyString(value, failureMessage = "The value is not \"\".") {
  if (!isEmptyString(value)) {
    throw new Error(failureMessage);
  }
}

function assertNotEmptyString(value, failureMessage = "The value is \"\".") {
  if (isEmptyString(value)) {
    throw new Error(failureMessage);
  }
}

function isWhitespace(value) {
  if (isNullish(value)) {
    return false;
  }
  const valueAsTrimmedString = ("" + value).trim();
  return (valueAsTrimmedString.length <= 0);
}

function assertIsWhitespace(value, failureMessage = "The value is not trimmable to \"\".") {
  if (!isWhitespace(value)) {
    throw new Error(failureMessage);
  }
}

function assertNotWhitespace(value, failureMessage = "The value is trimmable to \"\".") {
  if (isWhitespace(value)) {
    throw new Error(failureMessage);
  }
}

function isNullishOrWhitespace(value) {
  if (isNullish(value)) {
    return true;
  }
  return isWhitespace(value);
}

function assertIsNullishOrWhitespace(value, failureMessage = "The value is not \"undefined\" and not \"null\" and not trimmable to \"\".") {
  if (!isNullishOrWhitespace(value)) {
    throw new Error(failureMessage);
  }
}

function assertNotNullishOrWhitespace(value, failureMessage = "The value is \"undefined\" or \"null\" or trimmable to \"\".") {
  if (isNullishOrWhitespace(value)) {
    throw new Error(failureMessage);
  }
}

function isBoolean(value) {
  return ((typeof value) === "boolean");
}

function assertIsBoolean(value, failureMessage = "The value is not a boolean.") {
  if (!isBoolean(value)) {
    throw new Error(failureMessage);
  }
}

function assertNotBoolean(value, failureMessage = "The value is a boolean.") {
  if (isBoolean(value)) {
    throw new Error(failureMessage);
  }
}

function isNumber(value) {
  return ((typeof value) === "number");
}

function assertIsNumber(value, failureMessage = "The value is not a number.") {
  if (!isNumber(value)) {
    throw new Error(failureMessage);
  }
}

function assertNotNumber(value, failureMessage = "The value is a number.") {
  if (isNumber(value)) {
    throw new Error(failureMessage);
  }
}

function isBigInt(value) {
  return ((typeof value) === "bigint");
}

function assertIsBigInt(value, failureMessage = "The value is not a bigint.") {
  if (!isBigInt(value)) {
    throw new Error(failureMessage);
  }
}

function assertNotBigInt(value, failureMessage = "The value is a bigint.") {
  if (isBigInt(value)) {
    throw new Error(failureMessage);
  }
}

function isString(value) {
  return ((typeof value) === "string");
}

function assertIsString(value, failureMessage = "The value is not a string.") {
  if (!isString(value)) {
    throw new Error(failureMessage);
  }
}

function assertNotString(value, failureMessage = "The value is a string.") {
  if (isString(value)) {
    throw new Error(failureMessage);
  }
}

function isSymbol(value) {
  return ((typeof value) === "symbol");
}

function assertIsSymbol(value, failureMessage = "The value is not a symbol.") {
  if (!isSymbol(value)) {
    throw new Error(failureMessage);
  }
}

function assertNotSymbol(value, failureMessage = "The value is a symbol.") {
  if (isSymbol(value)) {
    throw new Error(failureMessage);
  }
}

function isFunctionOrClass(value) {
  return ((typeof value) === "function");
}

function assertIsFunctionOrClass(value, failureMessage = "The value is not a function (or class).") {
  if (!isFunctionOrClass(value)) {
    throw new Error(failureMessage);
  }
}

function assertNotFunctionOrClass(value, failureMessage = "The value is a function (or class).") {
  if (isFunctionOrClass(value)) {
    throw new Error(failureMessage);
  }
}

function isObjectOrNull(value) {
  return ((typeof value) === "object");
}

function assertIsObjectOrNull(value, failureMessage = "The value is not an object (or null).") {
  if (!isObjectOrNull(value)) {
    throw new Error(failureMessage);
  }
}

function assertNotObjectOrNull(value, failureMessage = "The value is an object (or null).") {
  if (isObjectOrNull(value)) {
    throw new Error(failureMessage);
  }
}

function isObject(value) {
  if (isNull(value)) {
    return false;
  }
  return (isObject(value));
}

function assertIsObject(value, failureMessage = "The value is not an object.") {
  if (!isObject(value)) {
    throw new Error(failureMessage);
  }
}

function assertNotObject(value, failureMessage = "The value is an object.") {
  if (isObject(value)) {
    throw new Error(failureMessage);
  }
}

function isDate(value) {
  return (value instanceof Date);
}

function assertIsDate(value, failureMessage = "The value is not an date.") {
  if (!isDate(value)) {
    throw new Error(failureMessage);
  }
}

function assertNotDate(value, failureMessage = "The value is an date.") {
  if (isDate(value)) {
    throw new Error(failureMessage);
  }
}

function isOfGuardedType(value, typeGuardFunc) {
  return typeGuardFunc(value);
}

function assertIsOfGuardedType(value, typeGuardFunc, failureMessage = "The value is not of the guarded type.") {
  if (!isOfGuardedType(value, typeGuardFunc)) {
    throw new Error(failureMessage);
  }
}

function assertNotOfGuardedType(value, typeGuardFunc, failureMessage = "The value is of the guarded type.") {
  if (isOfGuardedType(value, typeGuardFunc)) {
    throw new Error(failureMessage);
  }
}

function parseJsonIfNeeded(input) {
  if (isNullishOrWhitespace(input)) {
    return input;
  }
  if (!isString(input)) {
    return input;
  }

  const inputAsString = ("" + input);
  if (input != inputAsString) {
    return input;
  }

  const lastIndex = (inputAsString.length - 1);
  if (!((inputAsString[0] == "{") || (inputAsString[0] == "["))) {
    return input;
  }
  if (!((inputAsString[lastIndex] == "}") || (inputAsString[lastIndex] == "]"))) {
    return input;
  }

  const inputAsJson = JSON.parse(inputAsString);
  return inputAsJson;
}

export {isUndefined, assertIsUndefined, assertNotUndefined, isNull, assertIsNull, assertNotNull, isNullish, assertIsNullish, assertNotNullish, isEmptyString, assertIsEmptyString, assertNotEmptyString, isWhitespace, assertIsWhitespace, assertNotWhitespace, isNullishOrWhitespace, assertIsNullishOrWhitespace, assertNotNullishOrWhitespace, isBoolean, assertIsBoolean, assertNotBoolean, isNumber, assertIsNumber, assertNotNumber, isBigInt, assertIsBigInt, assertNotBigInt, isString, assertIsString, assertNotString, isSymbol, assertIsSymbol, assertNotSymbol, isFunctionOrClass, assertIsFunctionOrClass, assertNotFunctionOrClass, isObjectOrNull, assertIsObjectOrNull, assertNotObjectOrNull, isObject, assertIsObject, assertNotObject, isDate, assertIsDate, assertNotDate, isOfGuardedType, assertIsOfGuardedType, assertNotOfGuardedType, parseJsonIfNeeded};

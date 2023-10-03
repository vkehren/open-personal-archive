const NAME = "open-personal-archive-web-base-lite";
const VERSION = "2.3.3";
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

export {isUndefined, assertIsUndefined, assertNotUndefined, isNull, assertIsNull, assertNotNull, isNullish, assertIsNullish, assertNotNullish, isEmptyString, assertIsEmptyString, assertNotEmptyString, isWhitespace, assertIsWhitespace, assertNotWhitespace, isNullishOrWhitespace, assertIsNullishOrWhitespace, assertNotNullishOrWhitespace, isString, assertIsString, assertNotString, parseJsonIfNeeded};

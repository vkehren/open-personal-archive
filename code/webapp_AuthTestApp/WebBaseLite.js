const NAME = "open-personal-archive-web-base-lite";
const VERSION = "2.3.2";
const AUTHOR = "Ryan Stephen Ehrenreich";
const COPYRIGHT = "Copyright © 2021 Open Personal Archive™";
const BUILD_DATE = "2023-10-02T09:40:21.822Z";

function isUndefined(value) {
  return ((typeof value) === "undefined");
}

function isNull(value) {
  return (isNullish(value) && !isUndefined(value));
}

function isNullish(value) {
  return (value == undefined);
}

function isEmptyString(value) {
  if (isNullish(value)) {
    return false;
  }
  const valueAsString = ("" + value);
  return (valueAsString.length <= 0);
}

function isWhitespace(value) {
  if (isNullish(value)) {
    return false;
  }
  const valueAsTrimmedString = ("" + value).trim();
  return (valueAsTrimmedString.length <= 0);
}

function isNullishOrWhitespace(value) {
  if (isNullish(value)) {
    return true;
  }
  return isWhitespace(value);
}

function isString(value) {
  return ((typeof value) === "string");
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

export {isUndefined, isNull, isNullish, isEmptyString, isWhitespace, isNullishOrWhitespace, isString, parseJsonIfNeeded};

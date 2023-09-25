import * as MSG from "./Messaging";

/* eslint-disable camelcase, @typescript-eslint/no-explicit-any */
export const name = "MessagingTests";

type ResultState = "good" | "bad";
const ResultStates = {good: ("good" as ResultState), bad: ("bad" as ResultState)};
const Object_Prefix = "RESULT:";
const Error_Prefix = "ERROR:";
const Success_String = "The call was a success!";
const Success_Object = {name: (Object_Prefix + Success_String), wasSuccessful: true, state: ("good" as ResultState)};
const Failure_String = "The call was a failure!";
const Failure_Error = new Error(Error_Prefix + Failure_String);
const Failure_Object = {name: (Object_Prefix + Failure_String), wasSuccessful: false, state: ("bad" as ResultState)};


// TESTS for getSuccessResult<T>(...)
test("checks that passing string to getSuccessResult<T>(...) works", () => {
  const resultForMsg = MSG.getSuccessResultForMessage(Success_String);
  expect(resultForMsg.success).toBe(true);
  expect(resultForMsg.message).toBe(Success_String);
  expect(resultForMsg.data).toBe(undefined);

  const resultNoObj = MSG.getSuccessResult<unknown>(undefined, Success_String);
  expect(resultNoObj.success).toBe(true);
  expect(resultNoObj.message).toBe(Success_String);
  expect(resultNoObj.data).toBe(undefined);

  const resultWithObj = MSG.getSuccessResult<string>(Success_String, Success_String);
  expect(resultWithObj.success).toBe(true);
  expect(resultWithObj.message).toBe(Success_String);
  expect(resultWithObj.data).toBe(Success_String);
});

test("checks that passing object to getSuccessResult<T>(...) works", () => {
  const resultForMsg = MSG.getSuccessResultForMessage(Success_Object.name);
  expect(resultForMsg.success).toBe(true);
  expect(resultForMsg.message).toBe(Object_Prefix + Success_String);
  expect(resultForMsg.data).toBe(undefined);

  const resultNoObj = MSG.getSuccessResult<unknown>(undefined, Success_Object.name);
  expect(resultNoObj.success).toBe(true);
  expect(resultNoObj.message).toBe(Object_Prefix + Success_String);
  expect(resultNoObj.data).toBe(undefined);

  const resultWithObj = MSG.getSuccessResult<typeof Success_Object>(Success_Object, Success_Object.name,);
  expect(resultWithObj.success).toBe(true);
  expect(resultWithObj.message).toBe(Object_Prefix + Success_String);
  expect(resultWithObj.data).toBe(Success_Object);
  expect(resultWithObj.data?.name).toBe(Object_Prefix + Success_String);
  expect(resultWithObj.data?.wasSuccessful).toBe(true);
  expect(resultWithObj.data?.state).toBe(ResultStates.good);
});


// TESTS for getFailureResult<T>(...)
test("checks that passing 'undefined' to getFailureResult<T>(...) works", () => {
  const resultNoObj = MSG.getFailureResult(undefined, false);
  expect(resultNoObj.success).toBe(false);
  expect(resultNoObj.message).toBe(MSG.UNRECOGNIZED_ERROR_MESSAGE);
  expect(resultNoObj.data).toBe(undefined);

  const resultWithObj = MSG.getFailureResult(undefined, true);
  expect(resultWithObj.success).toBe(false);
  expect(resultWithObj.message).toBe(MSG.UNRECOGNIZED_ERROR_MESSAGE);
  expect(resultWithObj.data).toBe(undefined);
});

test("checks that passing 'null' to getFailureResult<T>(...) works", () => {
  const resultNoObj = MSG.getFailureResult(null, false);
  expect(resultNoObj.success).toBe(false);
  expect(resultNoObj.message).toBe(MSG.UNRECOGNIZED_ERROR_MESSAGE);
  expect(resultNoObj.data).toBe(undefined);

  const resultWithObj = MSG.getFailureResult(null, true);
  expect(resultWithObj.success).toBe(false);
  expect(resultWithObj.message).toBe(MSG.UNRECOGNIZED_ERROR_MESSAGE);
  expect(resultWithObj.data).toBe(null);
});

test("checks that passing '' to getFailureResult<T>(...) works", () => {
  const resultNoObj = MSG.getFailureResult("", false);
  expect(resultNoObj.success).toBe(false);
  expect(resultNoObj.message).toBe(MSG.UNRECOGNIZED_ERROR_MESSAGE);
  expect(resultNoObj.data).toBe(undefined);

  const resultWithObj = MSG.getFailureResult("", true);
  expect(resultWithObj.success).toBe(false);
  expect(resultWithObj.message).toBe(MSG.UNRECOGNIZED_ERROR_MESSAGE);
  expect(resultWithObj.data).toBe("");
});

test("checks that passing string to getFailureResult<T>(...) works", () => {
  const resultNoObj = MSG.getFailureResult(Failure_String, false);
  expect(resultNoObj.success).toBe(false);
  expect(resultNoObj.message).toBe(Failure_String);
  expect(resultNoObj.data).toBe(undefined);

  const resultWithObj = MSG.getFailureResult(Failure_String, true);
  expect(resultWithObj.success).toBe(false);
  expect(resultWithObj.message).toBe(Failure_String);
  expect(resultWithObj.data).toBe(Failure_String);
});

test("checks that passing Error to getFailureResult<T>(...) works", () => {
  const resultNoObj = MSG.getFailureResult(Failure_Error, false);
  expect(resultNoObj.success).toBe(false);
  expect(resultNoObj.message).toBe(Error_Prefix + Failure_String);
  expect(resultNoObj.data).toBe(undefined);

  const resultWithObj = MSG.getFailureResult(Failure_Error, true);
  expect(resultWithObj.success).toBe(false);
  expect(resultWithObj.message).toBe(Error_Prefix + Failure_String);
  expect(resultWithObj.data).toBe(Failure_Error);
  expect((resultWithObj.data as Error).message).toBe(Error_Prefix + Failure_String);
  expect((resultWithObj.data as Error).stack).toContain(" at ");
});

test("checks that passing object to getFailureResult<T>(...) works", () => {
  const resultNoObj = MSG.getFailureResult(Failure_Object, false);
  expect(resultNoObj.success).toBe(false);
  expect(resultNoObj.message).toBe(MSG.UNRECOGNIZED_ERROR_MESSAGE);
  expect(resultNoObj.data).toBe(undefined);

  const resultWithObj = MSG.getFailureResult(Failure_Object, true);
  expect(resultWithObj.success).toBe(false);
  expect(resultWithObj.message).toBe(MSG.UNRECOGNIZED_ERROR_MESSAGE);
  expect(resultWithObj.data).toBe(Failure_Object);
  expect((resultWithObj.data as typeof Failure_Object).name).toBe(Object_Prefix + Failure_String);
  expect((resultWithObj.data as typeof Failure_Object).wasSuccessful).toBe(false);
  expect((resultWithObj.data as typeof Failure_Object).state).toBe(ResultStates.bad);
});

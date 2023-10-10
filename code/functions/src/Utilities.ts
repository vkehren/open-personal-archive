import * as firestore from "@google-cloud/firestore";
import * as functions from "firebase-functions";
import {CallableRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import * as CSU from "../../domainlogic/src/CallStateUtilities";
import * as ActivityLog from "../../domainlogic/src/system/ActivityLog";

/**
 * Gets the Call State for the Firebase context and app.
 * @param {functions.https.CallableContext} context The Firebase Callable Function context.
 * @param {admin.app.App} app The Firebase app to use.
 * @param {OPA.DefaultFunc<string>} moduleNameGetter Gets the module name.
 * @param {OPA.DefaultFunc<string>} functionNameGetter Gets the function name.
 * @return {Promise<OpaDm.ICallState>}
 */
export async function getCallStateForFirebaseContextAndApp(context: functions.https.CallableContext, app: admin.app.App, moduleNameGetter: OPA.DefaultFunc<string>, functionNameGetter: OPA.DefaultFunc<string>): Promise<OpaDm.ICallState> { // eslint-disable-line max-len
  OPA.assertNonNullish(context, "The Firebase Callable Context must not be null.");
  OPA.assertNonNullish(app, "The Firebase Admin App provided must be non-null.");

  const dataStorageState = await getDataStorageStateForFirebaseApp(app, moduleNameGetter, functionNameGetter);
  const authenticationState = await getAuthenticationStateForContextAndApp(context, app);

  OPA.assertNonNullish(dataStorageState, "The data storage state could not be configured.");
  OPA.assertNonNullish(authenticationState, "The authentication state could not be determined for the current user.");

  const authenticationStateNonNull = OPA.convertNonNullish(authenticationState);
  const callState = CSU.getCallStateForCurrentUser(dataStorageState, authenticationStateNonNull);

  return callState;
}

/**
 * Gets the Data Storage State for the Firebase app.
 * @param {admin.app.App} app The Firebase app to use.
 * @param {OPA.DefaultFunc<string>} moduleNameGetter Gets the module name.
 * @param {OPA.DefaultFunc<string>} functionNameGetter Gets the function name.
 * @return {Promise<OpaDm.IDataStorageState>}
 */
export async function getDataStorageStateForFirebaseApp(app: admin.app.App, moduleNameGetter: OPA.DefaultFunc<string>, functionNameGetter: OPA.DefaultFunc<string>): Promise<OpaDm.IDataStorageState> {
  OPA.assertNonNullish(app, "The Firebase Admin App provided must be non-null.");

  const appName = app.name;
  const projectId = getFirebaseProjectId(app);
  const usesAdminAccess = true; // NOTE: Because we are explicitly passing an Admin App, this should be true
  const usesEmulators = getFirebaseProjectUsesEmulators();
  const db = admin.firestore(app);

  const dataStorageState: OpaDm.IDataStorageState = {
    appName: appName,
    projectId: projectId,
    usesAdminAccess: usesAdminAccess,
    usesEmulators: usesEmulators,
    db: db,
    constructorProvider: {
      timestampNow: firestore.Timestamp.now,
      timestampFromDate: firestore.Timestamp.fromDate,
      timestampFromTimestamp: (timestamp: firestore.Timestamp) => (new firestore.Timestamp(timestamp.seconds, timestamp.nanoseconds)),
      arrayRemove: firestore.FieldValue.arrayRemove,
      arrayUnion: firestore.FieldValue.arrayUnion,
      delete: firestore.FieldValue.delete,
      increment: firestore.FieldValue.increment,
      serverTimestamp: firestore.FieldValue.serverTimestamp,
      bulkWriter: () => {
        const writer = dataStorageState.db.bulkWriter();
        writer.onWriteError((error: firestore.BulkWriterError) => {
          return OPA.bulkWriterErrorHandler(dataStorageState, error);
        });
        return writer;
      },
      writeBatch: () => (dataStorageState.db.batch()),
    },
    logWriteState: {
      entryModuleName: moduleNameGetter(),
      entryFunctionName: functionNameGetter(),
      rootLogItemId: (null as string | null),
      externalLogItemId: (null as string | null),
    },
    currentBulkWriter: (null as firestore.BulkWriter | null),
    currentWriteBatch: (null as firestore.WriteBatch | null),
  };
  OPA.nowProvider.nowForTimestamp = dataStorageState.constructorProvider.timestampNow;
  return dataStorageState;
}

/**
 * Gets the Authentication State for the Firebase context.
 * @param {functions.https.CallableContext} context The Firebase Callable Function context.
 * @param {admin.app.App} app The Firebase app to use.
 * @return {Promise<OpaDm.IAuthenticationState | null>}
 */
export async function getAuthenticationStateForContextAndApp(context: functions.https.CallableContext, app: admin.app.App): Promise<OpaDm.IAuthenticationState | null> {
  OPA.assertNonNullish(app, "The Firebase App provided must be non-null.");

  if (OPA.isNullish(context)) {
    return null;
  }
  if (OPA.isNullish(context.auth)) {
    return null;
  }

  const authContextNonNull = OPA.convertNonNullish(context.auth);
  const authToken = authContextNonNull.token;

  if (OPA.isNullishOrWhitespace(authToken.email)) {
    return null;
  }

  const firebaseAuthUserId = authContextNonNull.uid;
  const userRecord = await app.auth().getUser(firebaseAuthUserId);

  OPA.assertNonNullish(userRecord, "The current User has not been authenticated.");
  OPA.assertNonNullish(userRecord.providerData, "The current User does not have a authentication provider.");
  OPA.assertIsTrue((userRecord.providerData.length > 0), "The current User does not have a authentication provider.");
  OPA.assertNonNullishOrWhitespace(userRecord.email, "The current User must have a valid email address.");
  OPA.assertIsTrue(userRecord.emailVerified, "The current User must have already verified their email address.");

  // LATER: Consider building a utility function to extract providerId more flexibly
  const providerId = userRecord.providerData[0].providerId;
  const email = OPA.convertNonNullish(authToken.email);
  const emailIsVerified = userRecord.emailVerified;
  const fullName = (!OPA.isNullishOrWhitespace(authToken.name)) ? authToken.name : userRecord.displayName;
  let firstName: string | undefined = undefined;
  let lastName: string | undefined = undefined;

  if (!OPA.isNullish(fullName)) {
    const nameNonNull = OPA.convertNonNullish(fullName as string);
    const nameParts = nameNonNull.split(" ");
    firstName = (nameParts.length > 0) ? nameParts[0] : firstName;
    lastName = (nameParts.length > 1) ? nameNonNull.replace((firstName + " "), "") : lastName;
  }

  const authenticationState: OpaDm.IAuthenticationState = {
    firebaseAuthUserId: firebaseAuthUserId,
    providerId: providerId,
    email: email,
    emailIsVerified: emailIsVerified,
    firstName: firstName,
    lastName: lastName,
  };
  return authenticationState;
}

/**
 * Gets the Firebase Project Id for the Firebase app.
 * @param {admin.app.App | null | undefined} app The Firebase app to use.
 * @return {string}
 */
export function getFirebaseProjectId(app: admin.app.App | null | undefined): string {
  if (!OPA.isNullishOrWhitespace(process.env.GCP_PROJECT)) {
    return OPA.convertNonNullish(process.env.GCP_PROJECT);
  } else if (!OPA.isNullishOrWhitespace(process.env.GCLOUD_PROJECT)) {
    return OPA.convertNonNullish(process.env.GCLOUD_PROJECT);
  } else if (!OPA.isNullish(app) && !OPA.isNullishOrWhitespace(app?.options.projectId)) {
    return OPA.convertNonNullish(app?.options.projectId);
  } else {
    return "[unknown]";
  }
}

/**
 * Gets whether the Firebase Project uses emulators.
 * @return {boolean}
 */
export function getFirebaseProjectUsesEmulators(): boolean {
  if (!OPA.isNullishOrWhitespace(process.env.FIREBASE_AUTH_EMULATOR_HOST)) {
    return true;
  } else if (!OPA.isNullishOrWhitespace(process.env.FIRESTORE_EMULATOR_HOST)) {
    return true;
  } else if (!OPA.isNullishOrWhitespace(process.env.STORAGE_EMULATOR_HOST)) {
    return true;
  } else {
    return false;
  }
}

/**
 * Gets the log message for the function call in the Open Personal Archive™ (OPA) system.
 * @param {string} moduleName The module name.
 * @param {string} functionName The function name.
 * @param {ExecutionState} executionState The execution state.
 * @return {Promise<OpaDm.void>}
 */
export function getFunctionCallLogMessage(moduleName: string, functionName: string, executionState: OPA.ExecutionState): string { // eslint-disable-line max-len
  const message = (moduleName + "/" + functionName + " : " + executionState.toUpperCase());
  return message;
}

/**
 * Extracts an ICallRequest from a Firebase CallableRequest.
 * @param {CallableRequest} request The Firebase request object.
 * @return {Promise<OPA.ICallRequest>}
 */
export function getShimmedRequestObject(request: CallableRequest): OPA.ICallRequest {
  const shimmedRequest: OPA.ICallRequest = {
    clientIpAddress: request.rawRequest.ip,
    url: request.rawRequest.originalUrl,
    data: request.data,
    headers: {},
  };
  if (!OPA.isNullish(request.rawRequest.headers)) {
    if (!OPA.isNullish(request.rawRequest.headers["client-ip"])) {
      shimmedRequest.headers.clientIp = request.rawRequest.headers["client-ip"];
    }
    if (!OPA.isNullish(request.rawRequest.headers["content-language"])) {
      shimmedRequest.headers.contentLanguage = request.rawRequest.headers["content-language"];
    }
    if (!OPA.isNullish(request.rawRequest.headers["content-location"])) {
      shimmedRequest.headers.contentLocation = request.rawRequest.headers["content-location"];
    }
    if (!OPA.isNullish(request.rawRequest.headers["content-type"])) {
      shimmedRequest.headers.contentType = request.rawRequest.headers["content-type"];
    }
    if (!OPA.isNullish(request.rawRequest.headers["date"])) {
      shimmedRequest.headers.date = request.rawRequest.headers["date"];
    }
    if (!OPA.isNullish(request.rawRequest.headers["host"])) {
      shimmedRequest.headers.host = request.rawRequest.headers["host"];
    }
    if (!OPA.isNullish(request.rawRequest.headers["latency"])) {
      shimmedRequest.headers.latency = request.rawRequest.headers["latency"];
    }
    if (!OPA.isNullish(request.rawRequest.headers["location"])) {
      shimmedRequest.headers.location = request.rawRequest.headers["location"];
    }
    if (!OPA.isNullish(request.rawRequest.headers["origin"])) {
      shimmedRequest.headers.origin = request.rawRequest.headers["origin"];
    }
    if (!OPA.isNullish(request.rawRequest.headers["referer"])) {
      shimmedRequest.headers.referer = request.rawRequest.headers["referer"];
    }
    if (!OPA.isNullish(request.rawRequest.headers["server-ip"])) {
      shimmedRequest.headers.serverIp = request.rawRequest.headers["server-ip"];
    }
    if (!OPA.isNullish(request.rawRequest.headers["user-agent"])) {
      shimmedRequest.headers.userAgent = request.rawRequest.headers["user-agent"];
    }
  }
  return shimmedRequest;
}

/**
 * Sets the external log state for the call in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {CallableRequest} request The Firebase request object.
 * @return {Promise<OpaDm.void>}
 */
export async function setExternalLogState(dataStorageState: OpaDm.IDataStorageState, request: CallableRequest): Promise<void> { // eslint-disable-line max-len
  let externalLogItemId = (request.data[OPA.getTypedPropertyKeyAsText<OPA.ILogWriteState>("externalLogItemId")] as string | null);
  externalLogItemId = (!OPA.isNullishOrWhitespace(externalLogItemId)) ? externalLogItemId : null;
  dataStorageState.logWriteState.externalLogItemId = externalLogItemId;
}

/**
 * Logs a server function call in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {OpaDm.IAuthenticationState | null} authenticationState The Firebase Authentication state for the User.
 * @param {OPA.ICallRequest} request The shimmed request object.
 * @param {OPA.ExecutionState} executionState The execution state for the function.
 * @return {Promise<OpaDm.void>}
 */
export async function logFunctionCall(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState | null, request: OPA.ICallRequest, executionState: OPA.ExecutionState): Promise<void> { // eslint-disable-line max-len
  try {
    const logState = dataStorageState.logWriteState;
    const message = getFunctionCallLogMessage(logState.entryModuleName, logState.entryFunctionName, executionState);
    const activityType = OpaDm.ActivityTypes.server_function_call;
    const requestor = request.clientIpAddress;
    const resource = request.url;
    const action = (logState.entryModuleName + "/" + logState.entryFunctionName);
    const errorState = {hasError: false};
    const otherState = {message: message, logWriteState: dataStorageState.logWriteState, errorState: errorState, headers: request.headers};

    logger.info(message, {structuredData: true, activityType, requestor, resource, action, otherState});
    const logItem = await ActivityLog.recordLogItem(dataStorageState, authenticationState, activityType, requestor, resource, action, request.data, otherState);

    if (OPA.isNullishOrWhitespace(dataStorageState.logWriteState.rootLogItemId)) {
      dataStorageState.logWriteState.rootLogItemId = logItem.id;
    }
  } catch (error) {
    await logFunctionError(dataStorageState, authenticationState, request, error);
  }
}

/**
 * Logs an error that occurred during a server function call in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {OpaDm.IAuthenticationState | null} authenticationState The Firebase Authentication state for the User.
 * @param {OPA.ICallRequest} request The shimmed request object.
 * @param {unknown} caught The caught object encountered.
 * @return {Promise<OpaDm.void>}
 */
export async function logFunctionError(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState | null, request: OPA.ICallRequest, caught: unknown): Promise<void> { // eslint-disable-line max-len
  try {
    const logState = dataStorageState.logWriteState;
    const activityType = OpaDm.ActivityTypes.server_function_error;
    const requestor = request.clientIpAddress;
    const resource = request.url;
    const action = (logState.entryModuleName + "/" + logState.entryFunctionName);
    const otherState = {message: OPA.UNRECOGNIZED_ERROR_MESSAGE, logWriteState: dataStorageState.logWriteState, errorState: caught, headers: request.headers};

    if (OPA.isOf<Error>(caught, (value) => (!OPA.isNullishOrWhitespace(value.message)))) {
      const error = (caught as Error);
      otherState.message = error.message;
      otherState.errorState = {hasError: true, name: error.name, message: error.message, stack: error.stack};
    }

    logger.error(otherState.message, {structuredData: true, activityType, requestor, resource, action, otherState});
    await ActivityLog.recordLogItem(dataStorageState, authenticationState, activityType, requestor, resource, action, request.data, otherState);
  } catch {
    // NOTE: Do nothing, as we are here because an error has already pccurred
  }
}

/**
 * Cleans up resources upon completion of a server function call in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {OpaDm.IAuthenticationState | null} authenticationState The Firebase Authentication state for the User.
 * @param {admin.app.App} adminApp The Firebase admin app used in the call.
 * @param {OPA.ICallRequest} request The shimmed request object.
 * @return {Promise<OpaDm.void>}
 */
export async function cleanUpStateAfterCall(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState | null, adminApp: admin.app.App, request: OPA.ICallRequest): Promise<void> { // eslint-disable-line max-len
  try {
    if (!OPA.isNullish(dataStorageState.currentBulkWriter)) {
      const currentBulkWriterNonNull = OPA.convertNonNullish(dataStorageState.currentBulkWriter);
      await currentBulkWriterNonNull.close();
      dataStorageState.currentBulkWriter = null;
    }
    if (!OPA.isNullish(dataStorageState.currentWriteBatch)) {
      const currentWriteBatchNonNull = OPA.convertNonNullish(dataStorageState.currentWriteBatch);
      await currentWriteBatchNonNull.commit();
      dataStorageState.currentWriteBatch = null;
    }

    if (!OPA.isNullish(dataStorageState.logWriteState.rootLogItemId)) {
      dataStorageState.logWriteState.rootLogItemId = null;
    }
    if (!OPA.isNullish(dataStorageState.logWriteState.externalLogItemId)) {
      dataStorageState.logWriteState.externalLogItemId = null;
    }

    // NOTE: Do NOT do the following, as they will cause all future calls to fail
    // await adminApp.delete();
    // await dataStorageState.db.terminate();
  } catch (error) {
    logFunctionError(dataStorageState, authenticationState, request, error);
  }
}

export type ActionFunc<T> = (request: CallableRequest, callState: OpaDm.ICallState) => Promise<T>;
export type ActionResult<T> = OPA.ICallResult<T | Error | string | unknown>;
/**
 * Cleans up resources upon completion of a server function call in the Open Personal Archive™ (OPA) system.
 * @param {CallableRequest} request The Firebase request object.
 * @param {OPA.DefaultFunc<string>} moduleNameGetter Gets the module name.
 * @param {OPA.DefaultFunc<string>} functionNameGetter Gets the function name.
 * @param {ActionFunc<T>} doAction The function that performs the action.
 * @return {Promise<ActionResult<T>>}
 */
export async function performAuthenticatedActionWithResult<T>(request: CallableRequest, moduleNameGetter: OPA.DefaultFunc<string>, functionNameGetter: OPA.DefaultFunc<string>, doAction: ActionFunc<T>): Promise<ActionResult<T>> { // eslint-disable-line max-len
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const shimmedRequest = getShimmedRequestObject(request);

  try {
    // LATER: Consider replacing the call to logger.info(...) below with a call to logFunctionCall(...)
    const message = getFunctionCallLogMessage(moduleNameGetter(), functionNameGetter(), OPA.ExecutionStates.entry);
    logger.info(message, {structuredData: true});

    adminApp = admin.app();
    callState = await getCallStateForFirebaseContextAndApp(request, adminApp, moduleNameGetter, functionNameGetter);

    await setExternalLogState(callState.dataStorageState, request);
    await logFunctionCall(callState.dataStorageState, callState.authenticationState, shimmedRequest, OPA.ExecutionStates.ready);

    const result = await doAction(request, callState);
    return OPA.getSuccessResult(result);
  } catch (error) {
    await logFunctionError(callState.dataStorageState, callState.authenticationState, shimmedRequest, error);
    return OPA.getFailureResult(error);
  } finally {
    await cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, shimmedRequest);
  }
}

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import * as CSU from "../../domainlogic/src/CallStateUtilities";

/**
 * Gets the Call State for the Firebase context and app.
 * @param {functions.https.CallableContext} context The Firebase Callable Function context.
 * @param {admin.app.App | undefined} [app=undefined] The Firebase app to use.
 * @return {Promise<OpaDm.ICallState>}
 */
export async function getCallStateForFirebaseContextAndApp(context: functions.https.CallableContext, app: admin.app.App | undefined = undefined): Promise<OpaDm.ICallState> {
  app = (!OPA.isNullish(app)) ? OPA.convertNonNullish(app) : admin.app();

  const dataStorageState = await getDataStorageStateForFirebaseApp(app);
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
 * @return {Promise<OpaDm.IDataStorageState>}
 */
export async function getDataStorageStateForFirebaseApp(app: admin.app.App): Promise<OpaDm.IDataStorageState> {
  OPA.assertNonNullish(app, "The Firebase App provided must be non-null.");

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
  };
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

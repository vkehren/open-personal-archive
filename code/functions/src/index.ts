import express from "express";
import cors from "cors";
// import {getAuth, sendEmailVerification} from "firebase/auth"; // LATER: Figure-out if it is possible to get the current User and send the verifiation email in the beforeUserSignedIn(...) handler
import {AuthBlockingEvent, beforeUserSignedIn, HttpsError} from "firebase-functions/v2/identity"; // NOTE: Also has "beforeUserCreated"
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {Application, authenticationEventHandlerForFirebaseAuth} from "../../domainlogic/src";
import * as adminCredentialFile from "../open-personal-archive-firebase-adminsdk-credential.json";
import * as UTL from "./Utilities";

const useAdminCredentialFile = true;
const useJsonParser = true;
const useUrlEncodingParser = true;
const useCorsHandler = true;
const useCorsProductionSettings = false;

// CONFIGURE ADMIN APP
let adminAppOptions = (undefined as admin.AppOptions | undefined);
if (useAdminCredentialFile) {
  const adminCredential = OPA.convertFirebaseKeyToCredential(adminCredentialFile);
  adminAppOptions = {credential: admin.credential.cert(adminCredential)};
}
admin.initializeApp(adminAppOptions);

// CONFIGURE EXPRESS APP
const expressApp = express();
if (useJsonParser) {
  const jsonParser = express.json();
  expressApp.use(jsonParser);
}
if (useUrlEncodingParser) {
  const urlEncodingOptions = {extended: true}; // NOTE: Allows for encoding arrays and objects
  const urlEncodingParser = express.urlencoded(urlEncodingOptions);
  expressApp.use(urlEncodingParser);
}
if (useCorsHandler) {
  // NOTE: "origin" value of "true" means reflect origin of sender, so even calls from localhost or local file loaded in browser will work
  const corsOptionsForDevelopment = {origin: true};
  const corsOptionsForProduction = {origin: ["https://YOUR_DOMAIN_NAME_1", "https://YOUR_DOMAIN_NAME_2", "https://YOUR_DOMAIN_NAME_3"]};
  const corsOptions = (useCorsProductionSettings) ? corsOptionsForProduction : corsOptionsForDevelopment;
  const corsHandler = cors(corsOptions);
  expressApp.use(corsHandler);
}

const moduleName = OPA.getModuleNameFromSrc(module.filename);

export const firebaseAuthSignInHandler = beforeUserSignedIn(OPA.FIREBASE_DEFAULT_OPTIONS, async (event: AuthBlockingEvent): Promise<void> => {
  const functionName = OPA.getTypedPropertyKeyAsText("firebaseAuthSignInHandler", {firebaseAuthSignInHandler});
  let adminApp = ((null as unknown) as admin.app.App);
  let dataStorageState = ((null as unknown) as OpaDm.IDataStorageState);
  let isInstalled = false;
  const shimmedRequest: OPA.ICallRequest = {
    clientIpAddress: event.ipAddress,
    url: event.eventType,
    data: {eventType: event.eventType, eventId: event.eventId, firebaseUserId: event.data.uid, eventData: JSON.stringify(event.data)},
    headers: {}, // NOTE: Since "event" is not an HTTP Request, it will not provide headers
  };

  try {
    const logMessage = UTL.getFunctionCallLogMessage(moduleName, (functionName + " : Authentication Trigger to initialize User " + event.data.uid), OPA.ExecutionStates.entry);
    logger.info(logMessage, {structuredData: true});

    adminApp = admin.app();
    dataStorageState = await UTL.getDataStorageStateForFirebaseApp(adminApp, moduleName, functionName);
    isInstalled = await Application.isSystemInstalled(dataStorageState);

    if (OPA.isNullishOrWhitespace(event.data.email)) {
      throw new Error("Currently, the OPA system requires a valid email address for each User.");
    }

    // LATER: Consider adding: event.eventId, event.eventType, and event.resource
    const userData: OPA.IFirebaseAuthUserData = {
      authType: OPA.convertNonNullish<OPA.FirebaseAuthType>(event.authType, OPA.FirebaseAuthTypes.user),
      uid: event.data.uid,
      providerId: (event.data.providerData[0].providerId as OPA.FirebaseProviderType),
      email: OPA.convertNonNullish(event.data.email),
      emailVerified: event.data.emailVerified,
      isAnonymous: false,
      disabled: event.data.disabled,
      ipAddress: event.ipAddress,
      timestamp: event.timestamp,
    };
    if (!OPA.isNullishOrWhitespace(event.data.displayName)) {
      userData.displayName = OPA.convertNonNullish(event.data.displayName);
    }
    if (!OPA.isNullishOrWhitespace(event.data.phoneNumber)) {
      userData.phoneNumber = OPA.convertNonNullish(event.data.phoneNumber);
    }
    if (!OPA.isNullishOrWhitespace(event.locale)) {
      userData.locale = OPA.convertNonNullish(event.locale);
    }
    if (!OPA.isNullish(event.additionalUserInfo)) {
      const info = OPA.convertNonNullish(event.additionalUserInfo);
      userData.isNewUser = info.isNewUser;
      if (!OPA.isNullishOrWhitespace(info.username)) {
        userData.username = OPA.convertNonNullish(info.username);
      }
    }

    const authState = OPA.getAuthenticationStateFromUserData(userData);
    await UTL.logFunctionCall(dataStorageState, authState, shimmedRequest, OPA.ExecutionStates.ready);

    const opaUser = await authenticationEventHandlerForFirebaseAuth(dataStorageState, userData);
    if (OPA.isNull(opaUser)) {
      throw new Error("A corrsponding User could not be found.");
    }

    const opaUserNonNull = OPA.convertNonNullish(opaUser);
    if (opaUserNonNull.approvalState != OPA.ApprovalStates.approved) {
      throw new Error("The corrsponding User account has not yet been approved.");
    }
    if (opaUserNonNull.isSuspended) {
      throw new Error("The corrsponding User account has been suspended.");
    }

    await UTL.logFunctionCall(dataStorageState, authState, shimmedRequest, OPA.ExecutionStates.complete);
  } catch (error) {
    await UTL.logFunctionError(dataStorageState, null, shimmedRequest, error as Error);

    if (isInstalled) {
      // NOTE: If the OPA System has already been installed, we want to block any Auth User who generates an error,
      //       but if the OPA System has not been installed, we expect the error, so we must allow the Owner to install the system.
      const errorRecord = (error as Record<string, unknown>);
      const message = (!OPA.isNullish(errorRecord) && !OPA.isNullishOrWhitespace(errorRecord.message)) ? errorRecord.message : "Unauthorized account.";
      throw new HttpsError("invalid-argument", message as string);
    }
  } finally {
    await UTL.cleanUpStateAfterCall(dataStorageState, null, adminApp, shimmedRequest);
  }
});

// NOTE: Export API functions
export * from "./system/ActivityLog";
export * from "./system/Application";
export * from "./authorization/Users";
export * from "./authorization/AccessRequests";
export * from "./authorization/Contacts";
export * as PackageInfo from "./PackageInfo";

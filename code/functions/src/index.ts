import {AuthBlockingEvent, beforeUserSignedIn} from "firebase-functions/v2/identity"; // NOTE: Also has "beforeUserCreated"
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {authenticationEventHandlerForFirebaseAuth} from "../../domainlogic/src";
import * as adminCredentialFile from "../open-personal-archive-firebase-adminsdk-credential.json";
import * as UTL from "./Utilities";
import express = require("express");
import cors = require("cors");

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

const moduleName = module.filename.split(".")[0];

export const firebaseAuthSignInHandler = beforeUserSignedIn(OPA.FIREBASE_DEFAULT_OPTIONS, async (event: AuthBlockingEvent): Promise<void> => {
  let adminApp = ((null as unknown) as admin.app.App);
  let dataStorageState = ((null as unknown) as OpaDm.IDataStorageState);
  const firebaseAuthUserId = () => (event.data.uid);
  const getLogMessage = (state: OPA.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, "Authentication Trigger to initialize User " + firebaseAuthUserId(), state);
  const shimmedRequest: OPA.ICallRequest = {
    clientIpAddress: event.ipAddress,
    url: event.eventType,
    data: {eventType: event.eventType, eventId: event.eventId, eventData: event.data},
  };

  try {
    logger.info(getLogMessage(OPA.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    dataStorageState = await UTL.getDataStorageStateForFirebaseApp(adminApp);
    await UTL.logFunctionCall(dataStorageState, null, shimmedRequest, getLogMessage(OPA.ExecutionStates.ready));

    const userData: OPA.IFirebaseAuthUserData = {
      authType: (event.authType as OPA.FirebaseAuthType),
      uid: event.data.uid,
      providerId: (event.data.providerData[0].providerId as OPA.FirebaseProviderType),
      email: OPA.convertNonNullish(event.data.email),
      emailVerified: event.data.emailVerified,
      isAnonymous: false,
      displayName: event.data.displayName,
      username: (!OPA.isNullish(event.additionalUserInfo)) ? event.additionalUserInfo?.username : undefined,
      phoneNumber: event.data.phoneNumber,
      disabled: event.data.disabled,
      isNewUser: (!OPA.isNullish(event.additionalUserInfo)) ? event.additionalUserInfo?.isNewUser : undefined,
      locale: event.locale,
      ipAddress: event.ipAddress,
      timestamp: event.timestamp,
    };
    const opaUser = await authenticationEventHandlerForFirebaseAuth(dataStorageState, userData);

    const messageSuffix = (!OPA.isNullish(opaUser)) ? (" for " + OPA.convertNonNullish(opaUser).authAccountName) : " without User";
    logger.info(getLogMessage(OPA.ExecutionStates.complete) + messageSuffix, {structuredData: true});
  } catch (error) {
    await UTL.logFunctionError(dataStorageState, null, shimmedRequest, error as Error);
  } finally {
    await UTL.cleanUpStateAfterCall(dataStorageState, null, adminApp, shimmedRequest);
  }
});

// NOTE: Export API functions
export * from "./system/Application";
export * from "./authorization/AccessRequests";
export * as PackageInfo from "./PackageInfo";

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {Application} from "../../domainlogic/src";

export const isInstalled = functions.https.onCall(async (data, context) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  try {
    const db = admin.firestore();

    const authenticationContext = (context) ? context.auth : null;
    const firebaseAuthUserId = (authenticationContext) ? authenticationContext.uid : null;
    const isUserAuthenticated = (!OPA.isNullishOrWhitespace(firebaseAuthUserId));
    const user = await OpaDm.getUserByFirebaseAuthUserId(db, firebaseAuthUserId);

    const isInstalled = await Application.isInstalled(db);
    const message = (isInstalled) ? "The OPA system is installed." : "The OPA system is NOT currently installed.";
    let data: unknown = {isInstalled};

    if (isUserAuthenticated && ((user?.assignedRoleId == OpaDm.Role_OwnerId) || (user?.assignedRoleId == OpaDm.Role_AdministratorId))) {
      const usesFunctionsEmulator = (OPA.getBoolean(process.env.FUNCTIONS_EMULATOR) == true);
      const usesAuthenticationEmulator = (!OPA.isNullishOrWhitespace(process.env.FIREBASE_AUTH_EMULATOR_HOST));
      const usesFirestoreEmulator = (!OPA.isNullishOrWhitespace(process.env.FIRESTORE_EMULATOR_HOST));
      const usesStorageEmulator = (!OPA.isNullishOrWhitespace(process.env.STORAGE_EMULATOR_HOST));
      data = {isInstalled, usesFunctionsEmulator, usesAuthenticationEmulator, usesFirestoreEmulator, usesStorageEmulator};
    }

    return OPA.getSuccessResult(message, data);
  } catch (error) {
    return OPA.getFailureResult(error as Error);
  }
});


// export async function getInstallationScreenDisplayModel(): Promise<IInstallationScreenDisplayModel> {

export const getInstallationScreenDisplayModel = functions.https.onCall(async (data, context) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  try {
    const db = admin.firestore();

    const authenticationContext = (context) ? context.auth : null;
    const firebaseAuthUserId = (authenticationContext) ? authenticationContext.uid : null;

    const displayModel = await Application.getInstallationScreenDisplayModel(db, firebaseAuthUserId);

    return OPA.getSuccessResult("", displayModel);
  } catch (error) {
    return OPA.getFailureResult(error as Error);
  }
});

export const performInstall = functions.https.onCall(async (data, context) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  try {
    throw new Error("NOT IMPLEMENTED!");
  } catch (error) {
    return OPA.getFailureResult(error as Error);
  }
});

export const performUninstall = functions.https.onCall(async (data, context) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  try {
    throw new Error("NOT IMPLEMENTED!");
  } catch (error) {
    return OPA.getFailureResult(error as Error);
  }
});

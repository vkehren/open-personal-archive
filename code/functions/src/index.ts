import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as OPA from "../../base/src";
import * as adminCredentialFile from "../open-personal-archive-firebase-adminsdk-credential.json";

// NOTE: Initialize Admin App
export const useDefaultAdminCredential = false;
if (useDefaultAdminCredential) {
  admin.initializeApp();
} else {
  const adminCredential = OPA.convertFirebaseKeyToCredential(adminCredentialFile);
  admin.initializeApp({
    credential: admin.credential.cert(adminCredential),
  });
}

// NOTE: Export API functions
export * from "./Application";

export const helloWorld = functions.https.onCall(async (data, context) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  try {
    const localizableHelloValues = {"en": "Hello!", "es": "¡Hola!"};
    const locale = (Math.random() >= .5) ? "en" : "es";
    const helloText = OPA.getLocalizedText(localizableHelloValues, locale);

    return OPA.getSuccessResult(helloText, data);
  } catch (error) {
    return OPA.getFailureResult(error as Error);
  }
});

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
export * from "./AccessRequests";

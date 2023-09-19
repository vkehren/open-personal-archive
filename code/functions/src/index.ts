import * as admin from "firebase-admin";
import * as OPA from "../../base/src";
import * as adminCredentialFile from "../open-personal-archive-firebase-adminsdk-credential.json";
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

// NOTE: Export API functions
export * from "./system/Application";
export * from "./authorization/AccessRequests";
export * as PackageInfo from "./PackageInfo";

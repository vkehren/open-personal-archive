import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
import {Application} from "../../../domainlogic/src";
import * as UTL from "../Utilities";

export const isInstalled = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  try {
    logger.info("isInstalled()", {structuredData: true});
    const firebaseAdminApp = admin.app();
    const dataStorageState = await UTL.getDataStorageStateForFirebaseApp(firebaseAdminApp);
    const authenticationState = await UTL.getAuthenticationStateForContextAndApp(request, firebaseAdminApp);

    const firebaseAuthUserId = (!OPA.isNullish(authenticationState)) ? OPA.convertNonNullish(authenticationState).firebaseAuthUserId : null;
    const isUserAuthenticated = (!OPA.isNullishOrWhitespace(firebaseAuthUserId));

    const isInstalled = await Application.isSystemInstalled(dataStorageState);
    const message = (isInstalled) ? "The OPA system is installed." : "The OPA system is NOT currently installed.";

    let archive: OpaDm.IArchive | null = null;
    let locale: OpaDm.ILocale | null = null;
    let data: any = {isInstalled, isAuthenticated: false, isAuthorized: false};

    if (isInstalled) {
      archive = await OpaDb.Archive.queries.getById(dataStorageState, OpaDm.ArchiveId);
      OPA.assertNonNullish(archive, "The Archive of the installation must not be null.");
      const archiveNonNull = OPA.convertNonNullish(archive);

      locale = await OpaDb.Locales.queries.getById(dataStorageState, archiveNonNull.defaultLocaleId);
      OPA.assertNonNullish(locale, "The default Locale for the Archive must not be null.");
      const localeNonNull = OPA.convertNonNullish(locale);

      const archiveName = OPA.getLocalizedText(archiveNonNull.name, localeNonNull.optionName);
      data = Object.assign(data, {archiveName: archiveName});
    }

    if (isUserAuthenticated) {
      const firebaseAuthUserIdNonNull = OPA.convertNonNullish(firebaseAuthUserId);
      const user = await OpaDb.Users.queries.getByFirebaseAuthUserId(dataStorageState, firebaseAuthUserIdNonNull);

      if (OPA.isNullish(user)) {
        // NOTE: This error case must not be fatal here, but should be handled elsewhere
        data = Object.assign(data, {isAuthenticated: true, firebaseAuthUserId: firebaseAuthUserIdNonNull, isAuthorized: false});
      } else {
        const userNonNull = OPA.convertNonNullish(user);

        if (!OPA.isNullish(archive)) {
          locale = await OpaDb.Locales.queries.getById(dataStorageState, userNonNull.localeId);
          OPA.assertNonNullish(locale, "The Locale for the User must not be null.");
          const localeNonNull = OPA.convertNonNullish(locale);

          const archiveNonNull = OPA.convertNonNullish(archive);
          const archiveName = OPA.getLocalizedText(archiveNonNull.name, localeNonNull.optionName);
          data = Object.assign(data, {archiveName: archiveName});
        }

        const userIsAuthorized = (userNonNull.approvalState == OpaDm.ApprovalStates.approved);
        const userId = userNonNull.id;
        const displayName = (userNonNull.preferredName) ? userNonNull.preferredName : userNonNull.firstName;
        const accessRequests = await OpaDb.AccessRequests.queries.getAllForUserId(dataStorageState, userId);
        const numberOfAccessRequests = accessRequests.length;

        data = Object.assign(data, {isAuthenticated: true, firebaseAuthUserId: firebaseAuthUserIdNonNull, isAuthorized: userIsAuthorized, userId: userNonNull.id, displayName: displayName, numberOfAccessRequests: numberOfAccessRequests}); // eslint-disable-line max-len

        if ((userNonNull.assignedRoleId == OpaDm.Role_OwnerId) || (userNonNull.assignedRoleId == OpaDm.Role_AdministratorId)) {
          const usesFunctionsEmulator = (OPA.getBoolean(process.env.FUNCTIONS_EMULATOR) == true);
          const usesAuthenticationEmulator = (!OPA.isNullishOrWhitespace(process.env.FIREBASE_AUTH_EMULATOR_HOST));
          const usesFirestoreEmulator = (!OPA.isNullishOrWhitespace(process.env.FIRESTORE_EMULATOR_HOST));
          const usesStorageEmulator = (!OPA.isNullishOrWhitespace(process.env.STORAGE_EMULATOR_HOST));
          data = Object.assign(data, {usesFunctionsEmulator, usesAuthenticationEmulator, usesFirestoreEmulator, usesStorageEmulator});
        }
      }
    }

    return OPA.getSuccessResult(message, data);
  } catch (error) {
    return OPA.getFailureResult(error as Error);
  }
});

export const getInstallationScreenDisplayModel = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  try {
    logger.info("getInstallationScreenDisplayModel()", {structuredData: true});
    const firebaseAdminApp = admin.app();
    const callState = await UTL.getCallStateForFirebaseContextAndApp(request, firebaseAdminApp);

    const displayModel = await Application.getInstallationScreenDisplayModel(callState);

    return OPA.getSuccessResult("", displayModel);
  } catch (error) {
    return OPA.getFailureResult(error as Error);
  }
});

export const performInstall = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  try {
    logger.info("performInstall()", {structuredData: true});
    const firebaseAdminApp = admin.app();
    const data = request.data;
    const callState = await UTL.getCallStateForFirebaseContextAndApp(request, firebaseAdminApp);

    const archiveName = (data.query.archiveName) ? data.query.archiveName : undefined;
    OPA.assertNonNullishOrWhitespace(archiveName, "The Archive name must not be blank.");
    const archiveDescription = (data.query.archiveDescription) ? data.query.archiveDescription : undefined;
    OPA.assertNonNullishOrWhitespace(archiveDescription, "The Archive description must not be blank.");
    const pathToStorageFolder = (data.query.pathToStorageFolder) ? data.query.pathToStorageFolder : undefined;
    OPA.assertNonNullishOrWhitespace(pathToStorageFolder, "The Archive storage path must not be blank.");
    const defaultLocaleId = (data.query.defaultLocaleId) ? data.query.defaultLocaleId : undefined;
    OPA.assertNonNullishOrWhitespace(defaultLocaleId, "The Archive default locale must not be blank.");
    const defaultTimeZoneGroupId = (data.query.defaultTimeZoneGroupId) ? data.query.defaultTimeZoneGroupId : undefined;
    OPA.assertNonNullishOrWhitespace(defaultTimeZoneGroupId, "The Archive default time zone group must not be blank.");
    // const defaultTimeZoneId = (data.query.defaultTimeZoneId) ? data.query.defaultTimeZoneId : undefined;
    // OPA.assertNonNullishOrWhitespace(defaultTimeZoneId, "The Archive default time zone must not be blank.");
    const ownerFirstName = (data.query.ownerFirstName) ? data.query.ownerFirstName : "";
    const ownerLastName = (data.query.ownerLastName) ? data.query.ownerLastName : "";
    const installResult = await Application.performInstall(callState.dataStorageState, callState.authenticationState, archiveName, archiveDescription, pathToStorageFolder, defaultLocaleId, defaultTimeZoneGroupId, ownerFirstName, ownerLastName); // eslint-disable-line max-len

    return OPA.getSuccessResult("", installResult);
  } catch (error) {
    return OPA.getFailureResult(error as Error);
  }
});

export const updateInstallationSettings = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  try {
    logger.info("updateInstallationSettings()", {structuredData: true});
    const firebaseAdminApp = admin.app();
    const data = request.data;
    const callState = await UTL.getCallStateForFirebaseContextAndApp(request, firebaseAdminApp);

    const archiveName = (data.query.archiveName) ? data.query.archiveName : undefined;
    const archiveDescription = (data.query.archiveDescription) ? data.query.archiveDescription : undefined;
    const defaultLocaleId = (data.query.defaultLocaleId) ? data.query.defaultLocaleId : undefined;
    const defaultTimeZoneGroupId = (data.query.defaultTimeZoneGroupId) ? data.query.defaultTimeZoneGroupId : undefined;
    const defaultTimeZoneId = (data.query.defaultTimeZoneId) ? data.query.defaultTimeZoneId : undefined;
    await Application.updateInstallationSettings(callState, archiveName, archiveDescription, defaultLocaleId, defaultTimeZoneGroupId, defaultTimeZoneId);

    const displayModel = await Application.getInstallationScreenDisplayModel(callState);

    return OPA.getSuccessResult("", displayModel);
  } catch (error) {
    return OPA.getFailureResult(error as Error);
  }
});

export const performUpgrade = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  try {
    logger.info("performUpgrade()", {structuredData: true});
    const firebaseAdminApp = admin.app();
    const data = request.data;
    const callState = await UTL.getCallStateForFirebaseContextAndApp(request, firebaseAdminApp);

    const doBackupFirst = OPA.convertNonNullish(OPA.getBoolean(data.query.doBackupFirst, true));
    const upgradeResult = await Application.performUpgrade(callState, doBackupFirst);

    return OPA.getSuccessResult("", upgradeResult);
  } catch (error) {
    return OPA.getFailureResult(error as Error);
  }
});

export const performUninstall = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  try {
    logger.info("performUninstall()", {structuredData: true});
    const firebaseAdminApp = admin.app();
    const data = request.data;
    const callState = await UTL.getCallStateForFirebaseContextAndApp(request, firebaseAdminApp);

    const doBackupFirst = OPA.convertNonNullish(OPA.getBoolean(data.query.doBackupFirst, true));
    const uninstallResult = await Application.performUninstall(callState.dataStorageState, callState.authenticationState, callState.authorizationState, doBackupFirst);

    return OPA.getSuccessResult("", uninstallResult);
  } catch (error) {
    return OPA.getFailureResult(error as Error);
  }
});

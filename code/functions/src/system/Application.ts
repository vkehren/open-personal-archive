import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
import {Application} from "../../../domainlogic/src";
import * as UTL from "../Utilities";

const moduleName = OPA.getModuleNameFromSrc(module.filename);
const moduleNameGetter = () => moduleName;

const isInstalled_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("isInstalled", {isInstalled})); // eslint-disable-line camelcase
export const isInstalled = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let dataStorageState = ((null as unknown) as OpaDm.IDataStorageState);
  let authenticationState = ((null as unknown) as OpaDm.IAuthenticationState | null);
  const getLogMessage = (state: OPA.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, isInstalled_FunctionNameGetter(), state);
  const shimmedRequest = UTL.getShimmedRequestObject(request);

  try {
    logger.info(getLogMessage(OPA.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    dataStorageState = await UTL.getDataStorageStateForFirebaseApp(adminApp, moduleNameGetter, isInstalled_FunctionNameGetter);
    authenticationState = await UTL.getAuthenticationStateForContextAndApp(request, adminApp);

    await UTL.setExternalLogState(dataStorageState, request);
    await UTL.logFunctionCall(dataStorageState, authenticationState, shimmedRequest, moduleNameGetter, isInstalled_FunctionNameGetter, OPA.ExecutionStates.ready);

    const firebaseAuthUserId = (!OPA.isNullish(authenticationState)) ? OPA.convertNonNullish(authenticationState).firebaseAuthUserId : null;
    const isUserAuthenticated = (!OPA.isNullishOrWhitespace(firebaseAuthUserId));

    const isInstalled = await Application.isSystemInstalled(dataStorageState);
    const message = (isInstalled) ? "The OPA system is installed." : "The OPA system is NOT currently installed.";

    let configuration: OpaDm.IConfiguration | null = null;
    let locale: OpaDm.ILocale | null = null;
    let data = {isInstalled, isAuthenticated: false, isAuthorized: false};

    if (isInstalled) {
      configuration = await OpaDb.Configuration.queries.getById(dataStorageState, OpaDm.ConfigurationId);
      OPA.assertNonNullish(configuration, "The Configuration of the Archive must not be null.");
      const configurationNonNull = OPA.convertNonNullish(configuration);

      locale = await OpaDb.Locales.queries.getById(dataStorageState, configurationNonNull.defaultLocaleId);
      OPA.assertNonNullish(locale, "The default Locale for the Archive must not be null.");
      const localeNonNull = OPA.convertNonNullish(locale);

      const archiveName = OPA.getLocalizedText(configurationNonNull.name, localeNonNull.optionName);
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

        if (!OPA.isNullish(configuration)) {
          locale = await OpaDb.Locales.queries.getById(dataStorageState, userNonNull.localeId);
          OPA.assertNonNullish(locale, "The Locale for the User must not be null.");
          const localeNonNull = OPA.convertNonNullish(locale);

          const configurationNonNull = OPA.convertNonNullish(configuration);
          const archiveName = OPA.getLocalizedText(configurationNonNull.name, localeNonNull.optionName);
          data = Object.assign(data, {archiveName: archiveName});
        }

        const userIsAuthorized = (userNonNull.approvalState == OPA.ApprovalStates.approved);
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

    return OPA.getSuccessResult(data, message);
  } catch (error) {
    await UTL.logFunctionError(dataStorageState, authenticationState, shimmedRequest, moduleNameGetter, isInstalled_FunctionNameGetter, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(dataStorageState, authenticationState, adminApp, shimmedRequest, moduleNameGetter, isInstalled_FunctionNameGetter);
  }
});

const getInstallationScreenDisplayModel_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("getInstallationScreenDisplayModel", {getInstallationScreenDisplayModel})); // eslint-disable-line camelcase
export const getInstallationScreenDisplayModel = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: OPA.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, getInstallationScreenDisplayModel_FunctionNameGetter(), state);
  const shimmedRequest = UTL.getShimmedRequestObject(request);

  try {
    logger.info(getLogMessage(OPA.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp, moduleNameGetter, getInstallationScreenDisplayModel_FunctionNameGetter);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, shimmedRequest, moduleNameGetter, getInstallationScreenDisplayModel_FunctionNameGetter, OPA.ExecutionStates.ready);

    const displayModel = await Application.getInstallationScreenDisplayModel(callState);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, shimmedRequest, moduleNameGetter, getInstallationScreenDisplayModel_FunctionNameGetter, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, shimmedRequest, moduleNameGetter, getInstallationScreenDisplayModel_FunctionNameGetter);
  }
});

const performInstall_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("performInstall", {performInstall})); // eslint-disable-line camelcase
export const performInstall = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: OPA.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, performInstall_FunctionNameGetter(), state);
  const shimmedRequest = UTL.getShimmedRequestObject(request);

  try {
    logger.info(getLogMessage(OPA.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp, moduleNameGetter, performInstall_FunctionNameGetter);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, shimmedRequest, moduleNameGetter, performInstall_FunctionNameGetter, OPA.ExecutionStates.ready);

    const data = request.data;
    const archiveName = (data.archiveName) ? data.archiveName : undefined;
    OPA.assertNonNullishOrWhitespace(archiveName, "The Archive name must not be blank.");
    const archiveDescription = (data.archiveDescription) ? data.archiveDescription : undefined;
    OPA.assertNonNullishOrWhitespace(archiveDescription, "The Archive description must not be blank.");
    const pathToRootStorageFolder = (data.pathToRootStorageFolder) ? data.pathToRootStorageFolder : undefined;
    OPA.assertNonNullishOrWhitespace(pathToRootStorageFolder, "The Archive root storage path must not be blank.");
    const defaultLocaleId = (data.defaultLocaleId) ? data.defaultLocaleId : undefined;
    OPA.assertNonNullishOrWhitespace(defaultLocaleId, "The Archive default locale must not be blank.");
    const defaultTimeZoneGroupId = (data.defaultTimeZoneGroupId) ? data.defaultTimeZoneGroupId : undefined;
    OPA.assertNonNullishOrWhitespace(defaultTimeZoneGroupId, "The Archive default time zone group must not be blank.");
    const installationNotes = OPA.convertNonNullish(data.installationNotes, "");
    const installResult = await Application.performInstall(callState.dataStorageState, callState.authenticationState, archiveName, archiveDescription, pathToRootStorageFolder, defaultLocaleId, defaultTimeZoneGroupId, installationNotes); // eslint-disable-line max-len

    return OPA.getSuccessResult(installResult);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, shimmedRequest, moduleNameGetter, performInstall_FunctionNameGetter, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, shimmedRequest, moduleNameGetter, performInstall_FunctionNameGetter);
  }
});

const updateInstallationSettings_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("updateInstallationSettings", {updateInstallationSettings})); // eslint-disable-line camelcase
export const updateInstallationSettings = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: OPA.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, updateInstallationSettings_FunctionNameGetter(), state);
  const shimmedRequest = UTL.getShimmedRequestObject(request);

  try {
    logger.info(getLogMessage(OPA.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp, moduleNameGetter, updateInstallationSettings_FunctionNameGetter);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, shimmedRequest, moduleNameGetter, updateInstallationSettings_FunctionNameGetter, OPA.ExecutionStates.ready);

    const data = request.data;
    const archiveName = (data.archiveName) ? data.archiveName : undefined;
    const archiveDescription = (data.archiveDescription) ? data.archiveDescription : undefined;
    const defaultLocaleId = (data.defaultLocaleId) ? data.defaultLocaleId : undefined;
    const defaultTimeZoneGroupId = (data.defaultTimeZoneGroupId) ? data.defaultTimeZoneGroupId : undefined;
    const defaultTimeZoneId = (data.defaultTimeZoneId) ? data.defaultTimeZoneId : undefined;
    await Application.updateInstallationSettings(callState, archiveName, archiveDescription, defaultLocaleId, defaultTimeZoneGroupId, defaultTimeZoneId);

    const displayModel = await Application.getInstallationScreenDisplayModel(callState);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, shimmedRequest, moduleNameGetter, updateInstallationSettings_FunctionNameGetter, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, shimmedRequest, moduleNameGetter, updateInstallationSettings_FunctionNameGetter);
  }
});

const performUpgrade_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("performUpgrade", {performUpgrade})); // eslint-disable-line camelcase
export const performUpgrade = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: OPA.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, performUpgrade_FunctionNameGetter(), state);
  const shimmedRequest = UTL.getShimmedRequestObject(request);

  try {
    logger.info(getLogMessage(OPA.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp, moduleNameGetter, performUpgrade_FunctionNameGetter);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, shimmedRequest, moduleNameGetter, performUpgrade_FunctionNameGetter, OPA.ExecutionStates.ready);

    const data = request.data;
    const upgradeNotes = OPA.convertNonNullish(data.upgradeNotes, "");
    const doBackupFirst = OPA.convertNonNullish(OPA.getBoolean(data.doBackupFirst, true));
    const upgradeResult = await Application.performUpgrade(callState, upgradeNotes, doBackupFirst);
    return OPA.getSuccessResult(upgradeResult);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, shimmedRequest, moduleNameGetter, performUpgrade_FunctionNameGetter, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, shimmedRequest, moduleNameGetter, performUpgrade_FunctionNameGetter);
  }
});

const performUninstall_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("performUninstall", {performUninstall})); // eslint-disable-line camelcase
export const performUninstall = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: OPA.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, performUninstall_FunctionNameGetter(), state);
  const shimmedRequest = UTL.getShimmedRequestObject(request);

  try {
    logger.info(getLogMessage(OPA.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp, moduleNameGetter, performUninstall_FunctionNameGetter);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, shimmedRequest, moduleNameGetter, performUninstall_FunctionNameGetter, OPA.ExecutionStates.ready);

    const data = request.data;
    const doBackupFirst = OPA.convertNonNullish(OPA.getBoolean(data.doBackupFirst, true));
    const uninstallResult = await Application.performUninstall(callState.dataStorageState, callState.authenticationState, callState.authorizationState, doBackupFirst);
    return OPA.getSuccessResult(uninstallResult);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, shimmedRequest, moduleNameGetter, performUninstall_FunctionNameGetter, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, shimmedRequest, moduleNameGetter, performUninstall_FunctionNameGetter);
  }
});

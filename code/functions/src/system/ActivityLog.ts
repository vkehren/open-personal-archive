import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {ActivityLog} from "../../../domainlogic/src";
import * as UTL from "../Utilities";

const moduleName = OPA.getModuleNameFromSrc(module.filename);
const logCallsToLog = true;

export const recordLogItem = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("recordLogItem", {recordLogItem});
  let adminApp = ((null as unknown) as admin.app.App);
  let dataStorageState = ((null as unknown) as OpaDm.IDataStorageState);
  let authenticationState = ((null as unknown) as OpaDm.IAuthenticationState | null);
  const shimmedRequest = UTL.getShimmedRequestObject(request);

  try {
    if (logCallsToLog) {
      const logMessage = UTL.getFunctionCallLogMessage(moduleName, functionName, OPA.ExecutionStates.entry);
      logger.info(logMessage, {structuredData: true});
    }

    adminApp = admin.app();
    dataStorageState = await UTL.getDataStorageStateForFirebaseApp(adminApp, moduleName, functionName);
    authenticationState = await UTL.getAuthenticationStateForContextAndApp(request, adminApp);

    await UTL.setExternalLogState(dataStorageState, request);
    if (logCallsToLog) {
      await UTL.logFunctionCall(dataStorageState, authenticationState, shimmedRequest, OPA.ExecutionStates.ready);
    }

    const activityType = (request.data.activityType) ? request.data.activityType : undefined;
    const executionState = OPA.ExecutionStates.remote;
    const requestor = shimmedRequest.clientIpAddress;
    const resource = (request.data.resource) ? request.data.resource : undefined;
    const action = (request.data.action) ? request.data.action : undefined;
    const data = (request.data.data) ? OPA.parseJsonIfNeeded(request.data.data) : {};
    const otherState = (request.data.otherState) ? OPA.parseJsonIfNeeded(request.data.otherState) : {};
    otherState.headers = shimmedRequest.headers;

    await ActivityLog.recordLogItem(dataStorageState, authenticationState, activityType, executionState, requestor, resource, action, data, otherState);

    if (logCallsToLog) {
      await UTL.logFunctionCall(dataStorageState, authenticationState, shimmedRequest, OPA.ExecutionStates.complete);
    }
    return OPA.getSuccessResultForMessage("The request was logged successfully.");
  } catch (error) {
    await UTL.logFunctionError(dataStorageState, authenticationState, shimmedRequest, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(dataStorageState, authenticationState, adminApp, shimmedRequest);
  }
});

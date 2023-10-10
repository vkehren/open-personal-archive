import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {ActivityLog} from "../../../domainlogic/src";
import * as UTL from "../Utilities";

const moduleName = OPA.getModuleNameFromSrc(module.filename);
const getModuleName = () => moduleName;

const recordLogItem_FunctionName = () => (OPA.getTypedPropertyKeyAsText("recordLogItem", {recordLogItem})); // eslint-disable-line camelcase
export const recordLogItem = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let dataStorageState = ((null as unknown) as OpaDm.IDataStorageState);
  let authenticationState = ((null as unknown) as OpaDm.IAuthenticationState | null);
  const getLogMessage = (state: OPA.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, recordLogItem_FunctionName(), state);
  const shimmedRequest = UTL.getShimmedRequestObject(request);

  try {
    logger.info(getLogMessage(OPA.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    dataStorageState = await UTL.getDataStorageStateForFirebaseApp(adminApp);
    authenticationState = await UTL.getAuthenticationStateForContextAndApp(request, adminApp);

    await UTL.setExternalLogState(dataStorageState, request);
    // LATER: Consider not logging that is the System is ready to record the log item, as it seems redundant with the actual log item
    await UTL.logFunctionCall(dataStorageState, authenticationState, shimmedRequest, getModuleName, recordLogItem_FunctionName, OPA.ExecutionStates.ready);

    const activityType = (request.data.activityType) ? request.data.activityType : undefined;
    const requestor = shimmedRequest.clientIpAddress;
    const resource = (request.data.resource) ? request.data.resource : undefined;
    const action = (request.data.action) ? request.data.action : undefined;
    const data = (request.data.data) ? OPA.parseJsonIfNeeded(request.data.data) : {};
    const otherState = (request.data.otherState) ? OPA.parseJsonIfNeeded(request.data.otherState) : {};
    otherState.headers = shimmedRequest.headers;

    await ActivityLog.recordLogItem(dataStorageState, authenticationState, activityType, requestor, resource, action, data, otherState);
    return OPA.getSuccessResultForMessage("The request was logged successfully.");
  } catch (error) {
    await UTL.logFunctionError(dataStorageState, authenticationState, shimmedRequest, getModuleName, recordLogItem_FunctionName, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(dataStorageState, authenticationState, adminApp, shimmedRequest, getModuleName, recordLogItem_FunctionName);
  }
});

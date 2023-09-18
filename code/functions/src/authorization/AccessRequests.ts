import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {AccessRequests} from "../../../domainlogic/src";
import * as UTL from "../Utilities";

const moduleName = module.filename.split(".")[0];

const requestUserAccess_FunctionName = () => (OPA.getTypedPropertyKeyAsText("requestUserAccess", {requestUserAccess})); // eslint-disable-line camelcase
export const requestUserAccess = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, requestUserAccess_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const message = (data.query.message) ? data.query.message : undefined;
    OPA.assertNonNullishOrWhitespace(message, "The Access Request message must not be blank.");
    const citationId = (data.query.citationId) ? data.query.citationId : null;

    const displayModel = await AccessRequests.requestUserAccess(callState, message, citationId);
    // LATER: Return an actual display model
    return OPA.getSuccessResult("", displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error as Error);
    return OPA.getFailureResult(error as Error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

// LATER: export const updateUserSettings = ...

// LATER: export const updateUserApprovalState = ...

// LATER: export const assignUserToRole = ...

// LATER: export const disableUser = ...

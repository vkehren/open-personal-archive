import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {AccessRequests} from "../../../domainlogic/src";
import * as UTL from "../Utilities";

const moduleName = module.filename.split(".")[0];

const getListOfAccessRequests_FunctionName = () => (OPA.getTypedPropertyKeyAsText("getListOfAccessRequests", {getListOfAccessRequests})); // eslint-disable-line camelcase
export const getListOfAccessRequests = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, getListOfAccessRequests_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const approvalState = (data.query.approvalState) ? data.query.approvalState : null;

    const documents = await AccessRequests.getListOfAccessRequests(callState, approvalState);
    const displayModels = await AccessRequests.convertAccessRequestsToDisplayModels(callState, documents);
    return OPA.getSuccessResult(displayModels);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

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
    const citationId = (data.query.citationId) ? data.query.citationId : null;

    OPA.assertNonNullishOrWhitespace(message, "The Access Request message must not be blank.");

    const document = await AccessRequests.requestUserAccess(callState, message, citationId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

const updateMessageForAccessRequest_FunctionName = () => (OPA.getTypedPropertyKeyAsText("updateMessageForAccessRequest", {updateMessageForAccessRequest})); // eslint-disable-line camelcase
export const updateMessageForAccessRequest = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, updateMessageForAccessRequest_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const accessRequestId = (data.query.accessRequestId) ? data.query.accessRequestId : undefined;
    const message = (data.query.message) ? data.query.message : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(message, "The Access Request message must not be blank.");

    const document = await AccessRequests.updateMessageForAccessRequest(callState, accessRequestId, message);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

const updateResponseToAccessRequest_FunctionName = () => (OPA.getTypedPropertyKeyAsText("updateResponseToAccessRequest", {updateResponseToAccessRequest})); // eslint-disable-line camelcase
export const updateResponseToAccessRequest = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, updateResponseToAccessRequest_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const accessRequestId = (data.query.accessRequestId) ? data.query.accessRequestId : undefined;
    const response = (data.query.response) ? data.query.response : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(response, "The Access Request response must not be blank.");

    const document = await AccessRequests.updateResponseToAccessRequest(callState, accessRequestId, response);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

const setAccessRequestTags_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestTags", {setAccessRequestTags})); // eslint-disable-line camelcase
export const setAccessRequestTags = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, setAccessRequestTags_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const accessRequestId = (data.query.accessRequestId) ? data.query.accessRequestId : undefined;
    const tags = (data.query.tags) ? JSON.parse(data.query.tags) : undefined;
    const contentType = (data.query.contentType) ? data.query.contentType : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(tags, "The Access Request tags must not be blank.");
    // LATER: Check that passing "contentType" of "undefined" yields the default value of "exact" below

    const document = await AccessRequests.setAccessRequestTags(callState, accessRequestId, tags, contentType);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

const addAccessRequestTags_FunctionName = () => (OPA.getTypedPropertyKeyAsText("addAccessRequestTags", {addAccessRequestTags})); // eslint-disable-line camelcase
export const addAccessRequestTags = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, addAccessRequestTags_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const accessRequestId = (data.query.accessRequestId) ? data.query.accessRequestId : undefined;
    const tags = (data.query.tags) ? JSON.parse(data.query.tags) : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(tags, "The Access Request tags must not be blank.");

    const document = await AccessRequests.addAccessRequestTags(callState, accessRequestId, tags);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

const removeAccessRequestTags_FunctionName = () => (OPA.getTypedPropertyKeyAsText("removeAccessRequestTags", {removeAccessRequestTags})); // eslint-disable-line camelcase
export const removeAccessRequestTags = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, removeAccessRequestTags_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const accessRequestId = (data.query.accessRequestId) ? data.query.accessRequestId : undefined;
    const tags = (data.query.tags) ? JSON.parse(data.query.tags) : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(tags, "The Access Request tags must not be blank.");

    const document = await AccessRequests.removeAccessRequestTags(callState, accessRequestId, tags);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

const setAccessRequestToArchivalState_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestToArchivalState", {setAccessRequestToArchivalState})); // eslint-disable-line camelcase
export const setAccessRequestToArchivalState = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, setAccessRequestToArchivalState_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const accessRequestId = (data.query.accessRequestId) ? data.query.accessRequestId : undefined;
    const archivalState = (data.query.archivalState) ? data.query.archivalState : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(archivalState, "The Access Request archival state must not be blank.");

    const document = await AccessRequests.setAccessRequestToArchivalState(callState, accessRequestId, archivalState);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

const setAccessRequestToArchived_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestToArchived", {setAccessRequestToArchived})); // eslint-disable-line camelcase
export const setAccessRequestToArchived = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, setAccessRequestToArchived_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const accessRequestId = (data.query.accessRequestId) ? data.query.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.setAccessRequestToArchived(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

const setAccessRequestToNotArchived_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestToNotArchived", {setAccessRequestToNotArchived})); // eslint-disable-line camelcase
export const setAccessRequestToNotArchived = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, setAccessRequestToNotArchived_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const accessRequestId = (data.query.accessRequestId) ? data.query.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.setAccessRequestToNotArchived(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

const setAccessRequestToViewed_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestToViewed", {setAccessRequestToViewed})); // eslint-disable-line camelcase
export const setAccessRequestToViewed = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, setAccessRequestToViewed_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const accessRequestId = (data.query.accessRequestId) ? data.query.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.setAccessRequestToViewed(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

const setAccessRequestToApprovalState_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestToApprovalState", {setAccessRequestToApprovalState})); // eslint-disable-line camelcase
export const setAccessRequestToApprovalState = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, setAccessRequestToApprovalState_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const accessRequestId = (data.query.accessRequestId) ? data.query.accessRequestId : undefined;
    const approvalState = (data.query.approvalState) ? data.query.approvalState : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(approvalState, "The Access Request approval state must not be blank.");

    const document = await AccessRequests.setAccessRequestToApprovalState(callState, accessRequestId, approvalState);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

const setAccessRequestToApproved_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestToApproved", {setAccessRequestToApproved})); // eslint-disable-line camelcase
export const setAccessRequestToApproved = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, setAccessRequestToApproved_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const accessRequestId = (data.query.accessRequestId) ? data.query.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.setAccessRequestToApproved(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

const setAccessRequestToDenied_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestToDenied", {setAccessRequestToDenied})); // eslint-disable-line camelcase
export const setAccessRequestToDenied = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, setAccessRequestToDenied_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const accessRequestId = (data.query.accessRequestId) ? data.query.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.setAccessRequestToDenied(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

const markAccessRequestWithDeletionState_FunctionName = () => (OPA.getTypedPropertyKeyAsText("markAccessRequestWithDeletionState", {markAccessRequestWithDeletionState})); // eslint-disable-line camelcase
export const markAccessRequestWithDeletionState = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, markAccessRequestWithDeletionState_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const accessRequestId = (data.query.accessRequestId) ? data.query.accessRequestId : undefined;
    const deletionState = (data.query.deletionState) ? data.query.deletionState : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(deletionState, "The Access Request deletion state must not be blank.");

    const document = await AccessRequests.markAccessRequestWithDeletionState(callState, accessRequestId, deletionState);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

const markAccessRequestAsDeleted_FunctionName = () => (OPA.getTypedPropertyKeyAsText("markAccessRequestAsDeleted", {markAccessRequestAsDeleted})); // eslint-disable-line camelcase
export const markAccessRequestAsDeleted = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, markAccessRequestAsDeleted_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const accessRequestId = (data.query.accessRequestId) ? data.query.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.markAccessRequestAsDeleted(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

const markAccessRequestAsUnDeleted_FunctionName = () => (OPA.getTypedPropertyKeyAsText("markAccessRequestAsUnDeleted", {markAccessRequestAsUnDeleted})); // eslint-disable-line camelcase
export const markAccessRequestAsUnDeleted = onCall({region: OPA.FIREBASE_DEFAULT_REGION}, async (request) => {
  let adminApp = ((null as unknown) as admin.app.App);
  let callState = ((null as unknown) as OpaDm.ICallState);
  const getLogMessage = (state: UTL.ExecutionState) => UTL.getFunctionCallLogMessage(moduleName, markAccessRequestAsUnDeleted_FunctionName(), state);

  try {
    logger.info(getLogMessage(UTL.ExecutionStates.entry), {structuredData: true});
    adminApp = admin.app();
    callState = await UTL.getCallStateForFirebaseContextAndApp(request, adminApp);

    await UTL.setExternalLogState(callState.dataStorageState, request);
    await UTL.logFunctionCall(callState.dataStorageState, callState.authenticationState, request, getLogMessage(UTL.ExecutionStates.ready));

    const data = request.data;
    const accessRequestId = (data.query.accessRequestId) ? data.query.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.markAccessRequestAsUnDeleted(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return OPA.getSuccessResult(displayModel);
  } catch (error) {
    await UTL.logFunctionError(callState.dataStorageState, callState.authenticationState, request, error);
    return OPA.getFailureResult(error);
  } finally {
    await UTL.cleanUpStateAfterCall(callState.dataStorageState, callState.authenticationState, adminApp, request);
  }
});

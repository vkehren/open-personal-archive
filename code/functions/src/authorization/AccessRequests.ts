import {onCall} from "firebase-functions/v2/https";
import * as OPA from "../../../base/src";
import {AccessRequests} from "../../../domainlogic/src";
import * as UTL from "../Utilities";

const moduleName = OPA.getModuleNameFromSrc(module.filename);
const getModuleName = () => moduleName;
type IAccessRequestDisplayModel = AccessRequests.IAccessRequestDisplayModel;

const getListOfAccessRequests_FunctionName = () => (OPA.getTypedPropertyKeyAsText("getListOfAccessRequests", {getListOfAccessRequests})); // eslint-disable-line camelcase
export const getListOfAccessRequests = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<Array<IAccessRequestDisplayModel>>(request, getModuleName, getListOfAccessRequests_FunctionName, async (request, callState) => {
    const data = request.data;
    const approvalState = (data.approvalState) ? data.approvalState : null;

    const documents = await AccessRequests.getListOfAccessRequests(callState, approvalState);
    const displayModels = await AccessRequests.convertAccessRequestsToDisplayModels(callState, documents);
    return displayModels;
  }) as UTL.ActionResult<Array<IAccessRequestDisplayModel>>);
  return result;
});

const requestUserAccess_FunctionName = () => (OPA.getTypedPropertyKeyAsText("requestUserAccess", {requestUserAccess})); // eslint-disable-line camelcase
export const requestUserAccess = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, requestUserAccess_FunctionName, async (request, callState) => {
    const data = request.data;
    const message = (data.message) ? data.message : undefined;
    const citationId = (data.citationId) ? data.citationId : null;

    OPA.assertNonNullishOrWhitespace(message, "The Access Request message must not be blank.");

    const document = await AccessRequests.requestUserAccess(callState, message, citationId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

const updateMessageForAccessRequest_FunctionName = () => (OPA.getTypedPropertyKeyAsText("updateMessageForAccessRequest", {updateMessageForAccessRequest})); // eslint-disable-line camelcase
export const updateMessageForAccessRequest = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, updateMessageForAccessRequest_FunctionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;
    const message = (data.message) ? data.message : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(message, "The Access Request message must not be blank.");

    const document = await AccessRequests.updateMessageForAccessRequest(callState, accessRequestId, message);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

const updateResponseToAccessRequest_FunctionName = () => (OPA.getTypedPropertyKeyAsText("updateResponseToAccessRequest", {updateResponseToAccessRequest})); // eslint-disable-line camelcase
export const updateResponseToAccessRequest = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, updateResponseToAccessRequest_FunctionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;
    const response = (data.response) ? data.response : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(response, "The Access Request response must not be blank.");

    const document = await AccessRequests.updateResponseToAccessRequest(callState, accessRequestId, response);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

const setAccessRequestTags_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestTags", {setAccessRequestTags})); // eslint-disable-line camelcase
export const setAccessRequestTags = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, setAccessRequestTags_FunctionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;
    const tags = (data.tags) ? OPA.parseJsonIfNeeded(data.tags) : undefined;
    const contentType = (data.contentType) ? data.contentType : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(tags, "The Access Request tags must not be blank.");
    // LATER: Check that passing "contentType" of "undefined" yields the default value of "exact" below

    const document = await AccessRequests.setAccessRequestTags(callState, accessRequestId, tags, contentType);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

const addAccessRequestTags_FunctionName = () => (OPA.getTypedPropertyKeyAsText("addAccessRequestTags", {addAccessRequestTags})); // eslint-disable-line camelcase
export const addAccessRequestTags = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, addAccessRequestTags_FunctionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;
    const tags = (data.tags) ? OPA.parseJsonIfNeeded(data.tags) : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(tags, "The Access Request tags must not be blank.");

    const document = await AccessRequests.addAccessRequestTags(callState, accessRequestId, tags);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

const removeAccessRequestTags_FunctionName = () => (OPA.getTypedPropertyKeyAsText("removeAccessRequestTags", {removeAccessRequestTags})); // eslint-disable-line camelcase
export const removeAccessRequestTags = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, removeAccessRequestTags_FunctionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;
    const tags = (data.tags) ? OPA.parseJsonIfNeeded(data.tags) : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(tags, "The Access Request tags must not be blank.");

    const document = await AccessRequests.removeAccessRequestTags(callState, accessRequestId, tags);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

const setAccessRequestToArchivalState_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestToArchivalState", {setAccessRequestToArchivalState})); // eslint-disable-line camelcase
export const setAccessRequestToArchivalState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, setAccessRequestToArchivalState_FunctionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;
    const archivalState = (data.archivalState) ? data.archivalState : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(archivalState, "The Access Request archival state must not be blank.");

    const document = await AccessRequests.setAccessRequestToArchivalState(callState, accessRequestId, archivalState);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

const setAccessRequestToArchived_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestToArchived", {setAccessRequestToArchived})); // eslint-disable-line camelcase
export const setAccessRequestToArchived = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, setAccessRequestToArchived_FunctionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.setAccessRequestToArchived(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

const setAccessRequestToNotArchived_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestToNotArchived", {setAccessRequestToNotArchived})); // eslint-disable-line camelcase
export const setAccessRequestToNotArchived = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, setAccessRequestToNotArchived_FunctionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.setAccessRequestToNotArchived(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

const setAccessRequestToViewed_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestToViewed", {setAccessRequestToViewed})); // eslint-disable-line camelcase
export const setAccessRequestToViewed = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, setAccessRequestToViewed_FunctionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.setAccessRequestToViewed(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

const setAccessRequestToApprovalState_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestToApprovalState", {setAccessRequestToApprovalState})); // eslint-disable-line camelcase
export const setAccessRequestToApprovalState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, setAccessRequestToApprovalState_FunctionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;
    const approvalState = (data.approvalState) ? data.approvalState : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(approvalState, "The Access Request approval state must not be blank.");

    const document = await AccessRequests.setAccessRequestToApprovalState(callState, accessRequestId, approvalState);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

const setAccessRequestToApproved_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestToApproved", {setAccessRequestToApproved})); // eslint-disable-line camelcase
export const setAccessRequestToApproved = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, setAccessRequestToApproved_FunctionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.setAccessRequestToApproved(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

const setAccessRequestToDenied_FunctionName = () => (OPA.getTypedPropertyKeyAsText("setAccessRequestToDenied", {setAccessRequestToDenied})); // eslint-disable-line camelcase
export const setAccessRequestToDenied = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, setAccessRequestToDenied_FunctionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.setAccessRequestToDenied(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

const markAccessRequestWithDeletionState_FunctionName = () => (OPA.getTypedPropertyKeyAsText("markAccessRequestWithDeletionState", {markAccessRequestWithDeletionState})); // eslint-disable-line camelcase, max-len
export const markAccessRequestWithDeletionState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, markAccessRequestWithDeletionState_FunctionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;
    const deletionState = (data.deletionState) ? data.deletionState : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(deletionState, "The Access Request deletion state must not be blank.");

    const document = await AccessRequests.markAccessRequestWithDeletionState(callState, accessRequestId, deletionState);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

const markAccessRequestAsDeleted_FunctionName = () => (OPA.getTypedPropertyKeyAsText("markAccessRequestAsDeleted", {markAccessRequestAsDeleted})); // eslint-disable-line camelcase
export const markAccessRequestAsDeleted = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, markAccessRequestAsDeleted_FunctionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.markAccessRequestAsDeleted(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

const markAccessRequestAsUnDeleted_FunctionName = () => (OPA.getTypedPropertyKeyAsText("markAccessRequestAsUnDeleted", {markAccessRequestAsUnDeleted})); // eslint-disable-line camelcase
export const markAccessRequestAsUnDeleted = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, getModuleName, markAccessRequestAsUnDeleted_FunctionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.markAccessRequestAsUnDeleted(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

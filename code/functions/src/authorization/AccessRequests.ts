import {onCall} from "firebase-functions/v2/https";
import * as OPA from "../../../base/src";
import {AccessRequests} from "../../../domainlogic/src";
import * as UTL from "../Utilities";

const moduleName = OPA.getModuleNameFromSrc(module.filename);
type IAccessRequestDisplayModel = AccessRequests.IAccessRequestDisplayModel;

export const getListOfAccessRequests = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("getListOfAccessRequests", {getListOfAccessRequests});
  const result = (await UTL.performAuthenticatedActionWithResult<Array<IAccessRequestDisplayModel>>(request, moduleName, functionName, async (request, callState) => { // eslint-disable-line max-len
    const data = request.data;
    const approvalState = (data.approvalState) ? data.approvalState : null;

    const documents = await AccessRequests.getListOfAccessRequests(callState, approvalState);
    const displayModels = await AccessRequests.convertAccessRequestsToDisplayModels(callState, documents);
    return displayModels;
  }) as UTL.ActionResult<Array<IAccessRequestDisplayModel>>);
  return result;
});

export const requestUserAccess = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("requestUserAccess", {requestUserAccess});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => {
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

export const updateMessageForAccessRequest = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("updateMessageForAccessRequest", {updateMessageForAccessRequest});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => { // eslint-disable-line max-len
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

export const updateResponseToAccessRequest = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("updateResponseToAccessRequest", {updateResponseToAccessRequest});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => { // eslint-disable-line max-len
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

export const setAccessRequestTags = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setAccessRequestTags", {setAccessRequestTags});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => {
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

export const addAccessRequestTags = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("addAccessRequestTags", {addAccessRequestTags});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => {
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

export const removeAccessRequestTags = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("removeAccessRequestTags", {removeAccessRequestTags});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => {
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

export const setAccessRequestToArchivalState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setAccessRequestToArchivalState", {setAccessRequestToArchivalState});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => { // eslint-disable-line max-len
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

export const setAccessRequestToArchived = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setAccessRequestToArchived", {setAccessRequestToArchived});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.setAccessRequestToArchived(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

export const setAccessRequestToNotArchived = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setAccessRequestToNotArchived", {setAccessRequestToNotArchived});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => { // eslint-disable-line max-len
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.setAccessRequestToNotArchived(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

export const setAccessRequestToViewed = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setAccessRequestToViewed", {setAccessRequestToViewed});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.setAccessRequestToViewed(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

export const setAccessRequestToApprovalState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setAccessRequestToApprovalState", {setAccessRequestToApprovalState});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => { // eslint-disable-line max-len
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

export const setAccessRequestToApproved = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setAccessRequestToApproved", {setAccessRequestToApproved});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.setAccessRequestToApproved(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

export const setAccessRequestToDenied = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setAccessRequestToDenied", {setAccessRequestToDenied});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.setAccessRequestToDenied(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

export const markAccessRequestWithDeletionState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("markAccessRequestWithDeletionState", {markAccessRequestWithDeletionState});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => { // eslint-disable-line max-len
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

export const markAccessRequestAsDeleted = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("markAccessRequestAsDeleted", {markAccessRequestAsDeleted});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.markAccessRequestAsDeleted(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

export const markAccessRequestAsUnDeleted = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("markAccessRequestAsUnDeleted", {markAccessRequestAsUnDeleted});
  const result = (await UTL.performAuthenticatedActionWithResult<IAccessRequestDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const accessRequestId = (data.accessRequestId) ? data.accessRequestId : undefined;

    OPA.assertIdentifierIsValid(accessRequestId, "The Access Request ID must not be blank.");

    const document = await AccessRequests.markAccessRequestAsUnDeleted(callState, accessRequestId);
    const displayModel = await AccessRequests.convertAccessRequestToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IAccessRequestDisplayModel>);
  return result;
});

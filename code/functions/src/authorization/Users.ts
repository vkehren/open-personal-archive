import {onCall} from "firebase-functions/v2/https";
import * as OPA from "../../../base/src";
import {Users} from "../../../domainlogic/src";
import * as UTL from "../Utilities";

const moduleName = OPA.getModuleNameFromSrc(module.filename);
type IUserDisplayModel = Users.IUserDisplayModel;
type IUserAccountDisplayModel = Users.IUserAccountDisplayModel;

export const getListOfUsers = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("getListOfUsers", {getListOfUsers});
  const result = (await UTL.performAuthenticatedActionWithResult<Array<IUserDisplayModel>>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const approvalState = (data.approvalState) ? data.approvalState : null;

    const documents = await Users.getListOfUsers(callState, approvalState);
    const displayModels = await Users.convertUsersToDisplayModels(callState, documents);
    return displayModels;
  }) as UTL.ActionResult<Array<IUserDisplayModel>>);
  return result;
});

export const getUserAccountDisplayModel = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("getUserAccountDisplayModel", {getUserAccountDisplayModel});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserAccountDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const displayModel = await Users.getUserAccountDisplayModel(callState);
    return displayModel;
  }) as UTL.ActionResult<IUserAccountDisplayModel>);
  return result;
});

export const initializeUserAccount = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("initializeUserAccount", {initializeUserAccount});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const authProviderId = callState.authenticationState.providerId;
    const authAccountName = callState.authenticationState.email;

    const document = await Users.initializeUserAccount(callState, authProviderId, authAccountName);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

export const updateUserProfile = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("updateUserProfile", {updateUserProfile});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const updateObject = (data.updateObject) ? OPA.parseJsonIfNeeded(data.updateObject) : undefined;

    OPA.assertNonNullish(updateObject, "The User profile data must not be blank.");

    const document = await Users.updateUserProfile(callState, updateObject);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

export const assignUserToRole = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("assignUserToRole", {assignUserToRole});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;
    const roleId = (data.roleId) ? data.roleId : undefined;

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");
    OPA.assertIdentifierIsValid(roleId, "The Role ID must not be blank.");

    const document = await Users.assignUserToRole(callState, userId, roleId);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

export const addRequestedCitationToUser = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("addRequestedCitationToUser", {addRequestedCitationToUser});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;
    const citationId = (data.citationId) ? data.citationId : undefined;

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");
    OPA.assertIdentifierIsValid(citationId, "The Citation ID must not be blank.");

    const document = await Users.addRequestedCitationToUser(callState, userId, citationId);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

export const addViewableCitationToUser = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("addViewableCitationToUser", {addViewableCitationToUser});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;
    const citationId = (data.citationId) ? data.citationId : undefined;

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");
    OPA.assertIdentifierIsValid(citationId, "The Citation ID must not be blank.");

    const document = await Users.addViewableCitationToUser(callState, userId, citationId);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

export const setUserToViewed = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setUserToViewed", {setUserToViewed});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");

    const document = await Users.setUserToViewed(callState, userId);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

export const setUserToApprovalState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setUserToApprovalState", {setUserToApprovalState});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;
    const approvalState = (data.approvalState) ? data.approvalState : undefined;

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(approvalState, "The User approval state must not be blank.");

    const document = await Users.setUserToApprovalState(callState, userId, approvalState);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

export const setUserToApproved = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setUserToApproved", {setUserToApproved});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");

    const document = await Users.setUserToApproved(callState, userId);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

export const setUserToDenied = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setUserToDenied", {setUserToDenied});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");

    const document = await Users.setUserToDenied(callState, userId);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

export const setUserToSuspensionState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setUserToSuspensionState", {setUserToSuspensionState});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;
    const suspensionState = (data.suspensionState) ? data.suspensionState : undefined;
    const reason = (data.reason) ? data.reason : "";

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(suspensionState, "The User suspension state must not be blank.");

    const document = await Users.setUserToSuspensionState(callState, userId, suspensionState, reason);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

export const setUserToSuspended = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setUserToSuspended", {setUserToSuspended});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;
    const reason = (data.reason) ? data.reason : "";

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");

    const document = await Users.setUserToSuspended(callState, userId, reason);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

export const setUserToUnSuspended = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("setUserToUnSuspended", {setUserToUnSuspended});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;
    const reason = (data.reason) ? data.reason : "";

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");

    const document = await Users.setUserToUnSuspended(callState, userId, reason);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

export const markUserWithDeletionState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("markUserWithDeletionState", {markUserWithDeletionState});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;
    const deletionState = (data.deletionState) ? data.deletionState : undefined;

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");
    OPA.assertNonNullishOrWhitespace(deletionState, "The User deletion state must not be blank.");

    const document = await Users.markUserWithDeletionState(callState, userId, deletionState);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

export const markUserAsDeleted = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("markUserAsDeleted", {markUserAsDeleted});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");

    const document = await Users.markUserAsDeleted(callState, userId);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

export const markUserAsUnDeleted = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const functionName = OPA.getTypedPropertyKeyAsText("markUserAsUnDeleted", {markUserAsUnDeleted});
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleName, functionName, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");

    const document = await Users.markUserAsUnDeleted(callState, userId);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

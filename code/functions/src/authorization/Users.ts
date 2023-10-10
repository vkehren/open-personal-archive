import {onCall} from "firebase-functions/v2/https";
import * as OPA from "../../../base/src";
import {Users} from "../../../domainlogic/src";
import * as UTL from "../Utilities";

const moduleName = OPA.getModuleNameFromSrc(module.filename);
const moduleNameGetter = () => moduleName;
type IUserDisplayModel = Users.IUserDisplayModel;
type IUserAccountDisplayModel = Users.IUserAccountDisplayModel;

const getListOfUsers_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("getListOfUsers", {getListOfUsers})); // eslint-disable-line camelcase
export const getListOfUsers = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<Array<IUserDisplayModel>>(request, moduleNameGetter, getListOfUsers_FunctionNameGetter, async (request, callState) => {
    const data = request.data;
    const approvalState = (data.approvalState) ? data.approvalState : null;

    const documents = await Users.getListOfUsers(callState, approvalState);
    const displayModels = await Users.convertUsersToDisplayModels(callState, documents);
    return displayModels;
  }) as UTL.ActionResult<Array<IUserDisplayModel>>);
  return result;
});

const getUserAccountDisplayModel_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("getUserAccountDisplayModel", {getUserAccountDisplayModel})); // eslint-disable-line camelcase
export const getUserAccountDisplayModel = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserAccountDisplayModel>(request, moduleNameGetter, getUserAccountDisplayModel_FunctionNameGetter, async (request, callState) => {
    const displayModel = await Users.getUserAccountDisplayModel(callState);
    return displayModel;
  }) as UTL.ActionResult<IUserAccountDisplayModel>);
  return result;
});

const initializeUserAccount_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("initializeUserAccount", {initializeUserAccount})); // eslint-disable-line camelcase
export const initializeUserAccount = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleNameGetter, initializeUserAccount_FunctionNameGetter, async (request, callState) => {
    const authProviderId = callState.authenticationState.providerId;
    const authAccountName = callState.authenticationState.email;

    const document = await Users.initializeUserAccount(callState, authProviderId, authAccountName);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

const updateUserProfile_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("updateUserProfile", {updateUserProfile})); // eslint-disable-line camelcase
export const updateUserProfile = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleNameGetter, updateUserProfile_FunctionNameGetter, async (request, callState) => {
    const data = request.data;
    const updateObject = (data.updateObject) ? OPA.parseJsonIfNeeded(data.updateObject) : undefined;

    OPA.assertNonNullish(updateObject, "The User profile data must not be blank.");

    const document = await Users.updateUserProfile(callState, updateObject);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

const assignUserToRole_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("assignUserToRole", {assignUserToRole})); // eslint-disable-line camelcase
export const assignUserToRole = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleNameGetter, assignUserToRole_FunctionNameGetter, async (request, callState) => {
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

const addRequestedCitationToUser_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("addRequestedCitationToUser", {addRequestedCitationToUser})); // eslint-disable-line camelcase
export const addRequestedCitationToUser = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleNameGetter, addRequestedCitationToUser_FunctionNameGetter, async (request, callState) => {
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

const addViewableCitationToUser_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("addViewableCitationToUser", {addViewableCitationToUser})); // eslint-disable-line camelcase
export const addViewableCitationToUser = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleNameGetter, addViewableCitationToUser_FunctionNameGetter, async (request, callState) => {
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

const setUserToViewed_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("setUserToViewed", {setUserToViewed})); // eslint-disable-line camelcase
export const setUserToViewed = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleNameGetter, setUserToViewed_FunctionNameGetter, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");

    const document = await Users.setUserToViewed(callState, userId);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

const setUserToApprovalState_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("setUserToApprovalState", {setUserToApprovalState})); // eslint-disable-line camelcase
export const setUserToApprovalState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleNameGetter, setUserToApprovalState_FunctionNameGetter, async (request, callState) => {
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

const setUserToApproved_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("setUserToApproved", {setUserToApproved})); // eslint-disable-line camelcase
export const setUserToApproved = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleNameGetter, setUserToApproved_FunctionNameGetter, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");

    const document = await Users.setUserToApproved(callState, userId);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

const setUserToDenied_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("setUserToDenied", {setUserToDenied})); // eslint-disable-line camelcase
export const setUserToDenied = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleNameGetter, setUserToDenied_FunctionNameGetter, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");

    const document = await Users.setUserToDenied(callState, userId);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

const setUserToSuspensionState_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("setUserToSuspensionState", {setUserToSuspensionState})); // eslint-disable-line camelcase
export const setUserToSuspensionState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleNameGetter, setUserToSuspensionState_FunctionNameGetter, async (request, callState) => {
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

const setUserToSuspended_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("setUserToSuspended", {setUserToSuspended})); // eslint-disable-line camelcase
export const setUserToSuspended = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleNameGetter, setUserToSuspended_FunctionNameGetter, async (request, callState) => {
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

const setUserToUnSuspended_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("setUserToUnSuspended", {setUserToUnSuspended})); // eslint-disable-line camelcase
export const setUserToUnSuspended = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleNameGetter, setUserToUnSuspended_FunctionNameGetter, async (request, callState) => {
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

const markUserWithDeletionState_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("markUserWithDeletionState", {markUserWithDeletionState})); // eslint-disable-line camelcase, max-len
export const markUserWithDeletionState = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleNameGetter, markUserWithDeletionState_FunctionNameGetter, async (request, callState) => {
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

const markUserAsDeleted_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("markUserAsDeleted", {markUserAsDeleted})); // eslint-disable-line camelcase
export const markUserAsDeleted = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleNameGetter, markUserAsDeleted_FunctionNameGetter, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");

    const document = await Users.markUserAsDeleted(callState, userId);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

const markUserAsUnDeleted_FunctionNameGetter = () => (OPA.getTypedPropertyKeyAsText("markUserAsUnDeleted", {markUserAsUnDeleted})); // eslint-disable-line camelcase
export const markUserAsUnDeleted = onCall(OPA.FIREBASE_DEFAULT_OPTIONS, async (request) => {
  const result = (await UTL.performAuthenticatedActionWithResult<IUserDisplayModel>(request, moduleNameGetter, markUserAsUnDeleted_FunctionNameGetter, async (request, callState) => {
    const data = request.data;
    const userId = (data.userId) ? data.userId : undefined;

    OPA.assertIdentifierIsValid(userId, "The User ID must not be blank.");

    const document = await Users.markUserAsUnDeleted(callState, userId);
    const displayModel = await Users.convertUserToDisplayModel(callState, document);
    return displayModel;
  }) as UTL.ActionResult<IUserDisplayModel>);
  return result;
});

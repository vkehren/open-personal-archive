import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
import * as Application from "../system/Application";

export interface IAccessRequestDisplayModel {
  readonly id: string;
  readonly message: string;
  readonly response: string;
  // LATER: Add other properties
}

/**
 * Converts an array of IAccessRequests to an array of IAccessRequestDisplayModels.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {Array<OpaDm.IAccessRequest>} accessRequests The array of IAccessRequests.
 * @return {Promise<Array<IAccessRequestDisplayModel>>}
 */
export async function convertAccessRequestsToDisplayModels(callState: OpaDm.ICallState, accessRequests: Array<OpaDm.IAccessRequest>): Promise<Array<IAccessRequestDisplayModel>> {
  OPA.assertCallStateIsNotNullish(callState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);
  OPA.assertNonNullish(accessRequests);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const locale = authorizationState.locale.optionName;

  const accessRequestDisplayModels = accessRequests.map((accessRequest) => ({
    id: accessRequest.id,
    message: OPA.getLocalizedText(accessRequest.message, locale),
    response: OPA.getLocalizedText(accessRequest.response, locale),
  } as IAccessRequestDisplayModel));
  return accessRequestDisplayModels;
}

/**
 * Converts an IAccessRequest to an IAccessRequestDisplayModel.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {OpaDm.IAccessRequest} accessRequest The IAccessRequest.
 * @return {Promise<IAccessRequestDisplayModel>}
 */
export async function convertAccessRequestToDisplayModel(callState: OpaDm.ICallState, accessRequest: OpaDm.IAccessRequest): Promise<IAccessRequestDisplayModel> {
  const accessRequestDisplayModels = await convertAccessRequestsToDisplayModels(callState, [accessRequest]);

  OPA.assertNonNullish(accessRequestDisplayModels);
  OPA.assertIsTrue(accessRequestDisplayModels.length == 1);

  const accessRequestDisplayModel = accessRequestDisplayModels[0];
  return accessRequestDisplayModel;
}

/**
 * Gets the list of AccessRequests for the current User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {OPA.ApprovalState | null} [approvalState=null] The ApprovalState desired for retrieval.
 * @return {Promise<Array<OpaDm.IAccessRequest>>}
 */
export async function getListOfAccessRequests(callState: OpaDm.ICallState, approvalState: OPA.ApprovalState | null = null): Promise<Array<OpaDm.IAccessRequest>> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();

  if (!authorizationState.isRoleAllowed(authorizerIds)) {
    const accessRequests = await OpaDb.AccessRequests.queries.getAllForUserId(callState.dataStorageState, authorizationState.user.id, approvalState);
    return accessRequests;
  } else {
    const accessRequests = await OpaDb.AccessRequests.queries.getAllForApprovalState(callState.dataStorageState, approvalState);
    return accessRequests;
  }
}

/**
 * Request access to the current installation of the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} message A message containing information about the Access Request.
 * @param {string | null} [citationId=null] The ID of the Citation that the Access Request pertains to, if one exists.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function requestUserAccess(callState: OpaDm.ICallState, message: string, citationId: string | null = null): Promise<OpaDm.IAccessRequest> { // eslint-disable-line max-len
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const viewersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.viewers);
  const viewerIds = [...viewersById.keys()];
  const user = authorizationState.user;
  const locale = authorizationState.locale;

  // NOTE: Do NOT assert "authorizationState.assertUserApproved();" to create AccessRequest
  OPA.assertIsFalse((user.id == OpaDm.User_OwnerId), "The Owner cannot request access as the Owner already has access to the entire Archive.");
  OPA.assertIsFalse(viewerIds.includes(user.assignedRoleId), "Users with normal access to the Archive cannot request access to specific items.");

  const accessRequestId = await OpaDb.AccessRequests.queries.create(callState.dataStorageState, user, locale, message, citationId);
  if (!OPA.isNullish(citationId)) {
    await OpaDb.Users.queries.addRequestedCitation(callState.dataStorageState, user.id, OPA.convertNonNullish(citationId), user.id);
  }

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const accessRequestReRead = await OpaDb.AccessRequests.queries.getByIdWithAssert(callState.dataStorageState, accessRequestId, "The requested AccessRequest does not exist.");
  return accessRequestReRead;
}

/**
 * Updates the Message for the specified AccessRequest in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} accessRequestIdToUpdate The AccessRequest to update.
 * @param {string} message The message provided.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function updateMessageForAccessRequest(callState: OpaDm.ICallState, accessRequestIdToUpdate: string, message: string): Promise<OpaDm.IAccessRequest> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const accessRequestPreRead = await OpaDb.AccessRequests.queries.getByIdWithAssert(callState.dataStorageState, accessRequestIdToUpdate, "The requested AccessRequest does not exist.");

  // NOTE: Do NOT assert "authorizationState.assertUserApproved();" to update "message" of AccessRequest
  authorizationState.assertUserSameAs(accessRequestPreRead.userIdOfCreator);

  const localizableMessage = {...(accessRequestPreRead.message)};
  const locale = authorizationState.locale.optionName;
  localizableMessage[locale] = message;
  await OpaDb.AccessRequests.queries.update(callState.dataStorageState, accessRequestIdToUpdate, {message: localizableMessage}, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const accessRequestReRead = await OpaDb.AccessRequests.queries.getByIdWithAssert(callState.dataStorageState, accessRequestIdToUpdate, "The requested AccessRequest does not exist.");
  return accessRequestReRead;
}

/**
 * Updates the Response for the specified AccessRequest in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} accessRequestIdToUpdate The AccessRequest to update.
 * @param {string} response The response provided.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function updateResponseToAccessRequest(callState: OpaDm.ICallState, accessRequestIdToUpdate: string, response: string): Promise<OpaDm.IAccessRequest> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  const accessRequestPreRead = await OpaDb.AccessRequests.queries.getByIdWithAssert(callState.dataStorageState, accessRequestIdToUpdate, "The requested AccessRequest does not exist.");
  const localizableResponse = {...(accessRequestPreRead.response)};
  const locale = authorizationState.locale.optionName;
  localizableResponse[locale] = response;
  await OpaDb.AccessRequests.queries.update(callState.dataStorageState, accessRequestIdToUpdate, {response: localizableResponse}, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const accessRequestReRead = await OpaDb.AccessRequests.queries.getByIdWithAssert(callState.dataStorageState, accessRequestIdToUpdate, "The requested AccessRequest does not exist.");
  return accessRequestReRead;
}

/**
 * Set the Tags of the specified AccessRequest in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} accessRequestIdToSet The AccessRequest to set.
 * @param {Array<string>} tags The tags that apply to the AccessRequest.
 * @param {OPA.ArrayContentType} [contentType="exact"] The content type of the array.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function setAccessRequestTags(callState: OpaDm.ICallState, accessRequestIdToSet: string, tags: Array<string>, contentType = OPA.ArrayContentTypes.exact): Promise<OpaDm.IAccessRequest> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  await OpaDb.AccessRequests.queries.setTags(callState.dataStorageState, accessRequestIdToSet, tags, contentType, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const accessRequestReRead = await OpaDb.AccessRequests.queries.getByIdWithAssert(callState.dataStorageState, accessRequestIdToSet, "The requested AccessRequest does not exist.");
  return accessRequestReRead;
}

/**
 * Adds the Tags to the specified AccessRequest in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} accessRequestIdToAddTo The AccessRequest to which to add Tags.
 * @param {Array<string>} tagsToAdd The tags to add to the AccessRequest.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function addAccessRequestTags(callState: OpaDm.ICallState, accessRequestIdToAddTo: string, tagsToAdd: Array<string>): Promise<OpaDm.IAccessRequest> {
  return await setAccessRequestTags(callState, accessRequestIdToAddTo, tagsToAdd, OPA.ArrayContentTypes.only_added);
}

/**
 * Removes the Tags from the specified AccessRequest in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} accessRequestIdToRemoveFrom The AccessRequest from which to remove Tags.
 * @param {Array<string>} tagsToRemove The tags to remove from the AccessRequest.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function removeAccessRequestTags(callState: OpaDm.ICallState, accessRequestIdToRemoveFrom: string, tagsToRemove: Array<string>): Promise<OpaDm.IAccessRequest> {
  return await setAccessRequestTags(callState, accessRequestIdToRemoveFrom, tagsToRemove, OPA.ArrayContentTypes.only_removed);
}

/**
 * Set the ArchivalState of the specified AccessRequest in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} accessRequestIdToSet The AccessRequest to set the ArchivalState of.
 * @param {OpaDm.ArchivalState} archivalState The ArchivalState to set to.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function setAccessRequestToArchivalState(callState: OpaDm.ICallState, accessRequestIdToSet: string, archivalState: OPA.ArchivalState): Promise<OpaDm.IAccessRequest> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  const isArchived = (archivalState == OPA.ArchivalStates.archived);
  await OpaDb.AccessRequests.queries.setToArchivalOption(callState.dataStorageState, accessRequestIdToSet, isArchived, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const accessRequestReRead = await OpaDb.AccessRequests.queries.getByIdWithAssert(callState.dataStorageState, accessRequestIdToSet, "The requested AccessRequest does not exist.");
  return accessRequestReRead;
}

/**
 * Set the ArchivalState to Archived for the specified AccessRequest in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} accessRequestIdToSet The AccessRequest to set the ArchivalState of.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function setAccessRequestToArchived(callState: OpaDm.ICallState, accessRequestIdToSet: string): Promise<OpaDm.IAccessRequest> {
  return await setAccessRequestToArchivalState(callState, accessRequestIdToSet, OPA.ArchivalStates.archived);
}

/**
 * Set the ArchivalState to NotArchived for the specified AccessRequest in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} accessRequestIdToSet The AccessRequest to set the ArchivalState of.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function setAccessRequestToNotArchived(callState: OpaDm.ICallState, accessRequestIdToSet: string): Promise<OpaDm.IAccessRequest> {
  return await setAccessRequestToArchivalState(callState, accessRequestIdToSet, OPA.ArchivalStates.not_archived);
}

/**
 * Updates the Viewed status of the specified AccessRequest in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} accessRequestIdToSet The AccessRequest to set the status of.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function setAccessRequestToViewed(callState: OpaDm.ICallState, accessRequestIdToSet: string): Promise<OpaDm.IAccessRequest> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  await OpaDb.AccessRequests.queries.setToViewed(callState.dataStorageState, accessRequestIdToSet, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const accessRequestReRead = await OpaDb.AccessRequests.queries.getByIdWithAssert(callState.dataStorageState, accessRequestIdToSet, "The requested AccessRequest does not exist.");
  return accessRequestReRead;
}

/**
 * Updates the Decided ApprovalState of the specified AccessRequest in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} accessRequestIdToSet The AccessRequest to set the ApprovalState of.
 * @param {OpaDm.ApprovalState} approvalState The ApprovalState to set to.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function setAccessRequestToApprovalState(callState: OpaDm.ICallState, accessRequestIdToSet: string, approvalState: OPA.ApprovalState): Promise<OpaDm.IAccessRequest> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizersById = await OpaDb.Roles.queries.getForRoleTypes(callState.dataStorageState, OpaDm.RoleTypes.authorizers);
  const authorizerIds = [...authorizersById.keys()];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizerIds);

  // LATER: Decide whether "approved" should be rescindable, and if so, upon "denied", remove the Viewable Citation from the User
  if (approvalState == OPA.ApprovalStates.approved) {
    const accessRequestPreRead = await OpaDb.AccessRequests.queries.getByIdWithAssert(callState.dataStorageState, accessRequestIdToSet, "The requested AccessRequest does not exist.");
    if (!OPA.isNullish(accessRequestPreRead.citationId)) {
      const userId = accessRequestPreRead.userIdOfCreator;
      const citationId = OPA.convertNonNullish(accessRequestPreRead.citationId);
      await OpaDb.Users.queries.addViewableCitation(callState.dataStorageState, userId, citationId, authorizationState.user.id);
    }
  }

  await OpaDb.AccessRequests.queries.setToDecidedOption(callState.dataStorageState, accessRequestIdToSet, approvalState, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const accessRequestReRead = await OpaDb.AccessRequests.queries.getByIdWithAssert(callState.dataStorageState, accessRequestIdToSet, "The requested AccessRequest does not exist.");
  return accessRequestReRead;
}

/**
 * Set the ApprovalState to Approved for the specified AccessRequest in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} accessRequestIdToSet The AccessRequest to set the ApprovalState of.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function setAccessRequestToApproved(callState: OpaDm.ICallState, accessRequestIdToSet: string): Promise<OpaDm.IAccessRequest> {
  return await setAccessRequestToApprovalState(callState, accessRequestIdToSet, OPA.ApprovalStates.approved);
}

/**
 * Set the ApprovalState to Denied for the specified AccessRequest in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} accessRequestIdToSet The AccessRequest to set the ApprovalState of.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function setAccessRequestToDenied(callState: OpaDm.ICallState, accessRequestIdToSet: string): Promise<OpaDm.IAccessRequest> {
  return await setAccessRequestToApprovalState(callState, accessRequestIdToSet, OPA.ApprovalStates.denied);
}

/**
 * Updates the deletion status of the specified AccessRequest in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} accessRequestIdToMark The AccessRequest to mark the status of.
 * @param {OPA.DeletionState} deletionState The DeletionState to set to.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function markAccessRequestWithDeletionState(callState: OpaDm.ICallState, accessRequestIdToMark: string, deletionState: OPA.DeletionState): Promise<OpaDm.IAccessRequest> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const accessRequestPreRead = await OpaDb.AccessRequests.queries.getByIdWithAssert(callState.dataStorageState, accessRequestIdToMark, "The requested AccessRequest does not exist.");
  authorizationState.assertUserApproved();
  authorizationState.assertUserSameAs(accessRequestPreRead.userIdOfCreator);

  await OpaDb.AccessRequests.queries.markWithDeletionState(callState.dataStorageState, accessRequestIdToMark, deletionState, authorizationState.user.id);

  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;

  const accessRequestReRead = await OpaDb.AccessRequests.queries.getByIdWithAssert(callState.dataStorageState, accessRequestIdToMark, "The requested AccessRequest does not exist.");
  return accessRequestReRead;
}

/**
 * Sets the Deletion status to "true" for the specified AccessRequest in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} accessRequestIdToMark The AccessRequest to mark the status of.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function markAccessRequestAsDeleted(callState: OpaDm.ICallState, accessRequestIdToMark: string): Promise<OpaDm.IAccessRequest> {
  return await markAccessRequestWithDeletionState(callState, accessRequestIdToMark, OPA.DeletionStates.deleted);
}

/**
 * Sets the Deletion status to "false" for the specified AccessRequest in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} accessRequestIdToMark The AccessRequest to mark the status of.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function markAccessRequestAsUnDeleted(callState: OpaDm.ICallState, accessRequestIdToMark: string): Promise<OpaDm.IAccessRequest> {
  return await markAccessRequestWithDeletionState(callState, accessRequestIdToMark, OPA.DeletionStates.undeleted);
}

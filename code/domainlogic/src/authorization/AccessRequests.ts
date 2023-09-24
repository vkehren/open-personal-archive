import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
import * as Application from "../system/Application";
import * as Users from "./Users";

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
  const user = authorizationState.user;
  const locale = authorizationState.locale;

  OPA.assertIsFalse((user.id == OpaDm.User_OwnerId), "The Owner cannot request access as the Owner already has access to the entire Archive.");
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
  OPA.assertIsTrue(callState.hasAuthorizationState, "The User account has not yet been initialized.");

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
  OPA.assertIsTrue(callState.hasAuthorizationState, "The User account has not yet been initialized.");

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
      await Users.addViewableCitationToUser(callState, userId, OPA.convertNonNullish(accessRequestPreRead.citationId));
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
  OPA.assertIsTrue(callState.hasAuthorizationState, "The User account has not yet been initialized.");

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

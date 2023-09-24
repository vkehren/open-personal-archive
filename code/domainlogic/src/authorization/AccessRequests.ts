import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
import * as Application from "../system/Application";

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

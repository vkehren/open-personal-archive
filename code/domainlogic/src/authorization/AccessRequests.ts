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
  OpaDm.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  const isSystemInstalled = await Application.isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);
  OpaDm.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const db = callState.dataStorageState.db;
  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const user = authorizationState.user;
  const locale = authorizationState.locale;

  OPA.assertIsFalse((user.id == OpaDm.User_OwnerId), "The Owner cannot request access as the Owner already has access to the entire Archive.");
  const accessRequestId = await OpaDb.AccessRequests.queries.create(db, user, locale, message, citationId);
  if (!OPA.isNullish(citationId)) {
    await OpaDb.Users.queries.addRequestedCitation(db, user.id, OPA.convertNonNullish(citationId), user.id, callState.dataStorageState.constructorProvider);
  }

  const accessRequestReRead = await OpaDb.AccessRequests.queries.getById(db, accessRequestId);
  OPA.assertDocumentIsValid(accessRequestReRead, "The requested AccessRequest does not exist.");
  const accessRequestReReadNonNull = OPA.convertNonNullish(accessRequestReRead);

  return accessRequestReReadNonNull;
}

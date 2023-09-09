import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../../datamodel/src";

/**
 * Request access to the current installation of the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} message A message containing information about the Access Request.
 * @param {string | null} [citationId=null] The ID of the Citation that the Access Request pertains to, if one exists.
 * @return {Promise<void>}
 */
export async function requestUserAccess(callState: OpaDm.ICallState, message: string, citationId: string | null = null): Promise<void> { // eslint-disable-line max-len
  OPA.assertNonNullish(callState, "The Call State must not be null.");
  OPA.assertNonNullish(callState.dataStorageState, "The Data Storage State must not be null.");
  OPA.assertNonNullish(callState.authorizationState, "The Authorization State must not be null.");
  OPA.assertNonNullish(callState.systemState, "The System State must not be null.");

  const db = callState.dataStorageState.db;
  const authorizationStateNonNull = OPA.convertNonNullish(callState.authorizationState);
  const systemStateNonNull = OPA.convertNonNullish(callState.systemState);
  const currentUser = authorizationStateNonNull.user;
  const currentLocale = authorizationStateNonNull.locale;
  const archive = systemStateNonNull.archive;

  const newAccessRequestRef = OpaDb.AccessRequests.getTypedCollection(db).doc();
  const newAccessRequest = OpaDb.AccessRequests.createInstance(currentUser, currentLocale, newAccessRequestRef.id, archive.id, currentUser.id, message, citationId);
  await newAccessRequestRef.set(newAccessRequest, {merge: true});
}

import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../datamodel/src";

/**
 * Reads the Authorization State for the specified User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {string} firebaseAuthUserId The Firebase UUID for the User.
 * @return {Promise<OpaDm.IAuthorizationState>}
 */
export async function readAuthorizationState(dataStorageState: OpaDm.IDataStorageState, firebaseAuthUserId: string): Promise<OpaDm.IAuthorizationState> {
  OPA.assertNonNullish(dataStorageState, "The Data Storage State must not be null.");
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);
  OPA.assertIdentifierIsValid(firebaseAuthUserId);

  const user = await OpaDb.Users.queries.getByFirebaseAuthUserId(dataStorageState.db, firebaseAuthUserId);
  OPA.assertDocumentIsValid(user, "The current User must be properly authenticated.");
  const userNonNull = OPA.convertNonNullish(user);

  const role = await OpaDb.Roles.queries.getById(dataStorageState.db, userNonNull.assignedRoleId);
  OPA.assertDocumentIsValid(role, "The current User's Role must be properly assigned.");
  const roleNonNull = OPA.convertNonNullish(role);

  const locale = await OpaDb.Locales.queries.getById(dataStorageState.db, userNonNull.localeId);
  OPA.assertDocumentIsValid(locale, "The current User must have a valid Locale.");
  const localeNonNull = OPA.convertNonNullish(locale);

  const timeZoneGroup = await OpaDb.TimeZoneGroups.queries.getById(dataStorageState.db, userNonNull.timeZoneGroupId);
  OPA.assertDocumentIsValid(timeZoneGroup, "The current User must have a valid Time Zone Group.");
  const timeZoneGroupNonNull = OPA.convertNonNullish(timeZoneGroup);

  const timeZone = await OpaDb.TimeZones.queries.getById(dataStorageState.db, userNonNull.timeZoneId);
  OPA.assertDocumentIsValid(timeZone, "The current User must have a valid Time Zone.");
  const timeZoneNonNull = OPA.convertNonNullish(timeZone);

  const result = new OpaDm.AuthorizationState(userNonNull, roleNonNull, localeNonNull, timeZoneGroupNonNull, timeZoneNonNull);
  return result;
}

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
  OPA.assertNonNullish(callState.archiveState, "The Archive State must not be null.");

  const db = callState.dataStorageState.db;
  const authorizationStateNonNull = OPA.convertNonNullish(callState.authorizationState);
  const archiveStateNonNull = OPA.convertNonNullish(callState.archiveState);
  const currentUser = authorizationStateNonNull.user;
  const currentLocale = authorizationStateNonNull.locale;
  const archive = archiveStateNonNull.archive;

  const newAccessRequestRef = OpaDb.AccessRequests.getTypedCollection(db).doc();
  const newAccessRequest = OpaDb.AccessRequests.createInstance(currentUser, currentLocale, newAccessRequestRef.id, archive.id, currentUser.id, message, citationId);
  await newAccessRequestRef.set(newAccessRequest, {merge: true});
}

// LATER: export async function updateUserSettings(...)

// LATER: export async function updateUserApprovalState(...)

// LATER: export async function assignUserToRole(...)

// LATER: export async function disableUser(...)

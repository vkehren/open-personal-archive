import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../datamodel/src";
import * as Application from "./system/Application";

/**
 * Gets the Call State for the current User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {OpaDm.IAuthenticationState} authenticationState The Firebase Authentication state for the User.
 * @return {Promise<OpaDm.ICallState>}
 */
export async function getCallStateForCurrentUser(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState): Promise<OpaDm.ICallState> {
  OPA.assertDataStorageStateIsNotNullish(dataStorageState);
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);
  OpaDm.assertAuthenticationStateIsNotNullish(authenticationState);
  OPA.assertIdentifierIsValid(authenticationState.firebaseAuthUserId);

  const isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);

  // LATER: Consider checking if AuthenticationState is Anonymous and returning ICallState with NULL AuthorizationState

  let hasSystemState = false;
  let systemState: OpaDm.ISystemState | undefined = undefined;

  // NOTE: Create System State
  const application = await OpaDb.Application.queries.getById(dataStorageState.db, OpaDm.ApplicationId);
  const archive = await OpaDb.Archive.queries.getById(dataStorageState.db, OpaDm.ArchiveId);
  let applicationNonNull = ((null as unknown) as OpaDm.IApplication);
  let archiveNonNull = ((null as unknown) as OpaDm.IArchive);

  if (!OPA.isNullish(application)) {
    OPA.assertDocumentIsValid(archive, "The Archive object must exist when the Application object exists.");

    applicationNonNull = OPA.convertNonNullish(application);
    archiveNonNull = OPA.convertNonNullish(archive);

    systemState = {application: applicationNonNull, archive: archiveNonNull};
    hasSystemState = true;
  }

  if (!hasSystemState) {
    const callState: OpaDm.ICallState = {
      dataStorageState: dataStorageState,
      authenticationState: authenticationState,
      hasSystemState: false,
      systemState: undefined,
      hasAuthorizationState: false,
      authorizationState: undefined,
    };
    return callState;
  }

  const systemStateNonNull = OPA.convertNonNullish(systemState);
  const user = await OpaDb.Users.queries.getByFirebaseAuthUserId(dataStorageState.db, authenticationState.firebaseAuthUserId);
  const hasUser = (!OPA.isNullish(user));

  if (!hasUser) {
    const callState: OpaDm.ICallState = {
      dataStorageState: dataStorageState,
      authenticationState: authenticationState,
      hasSystemState: true,
      systemState: systemStateNonNull,
      hasAuthorizationState: false,
      authorizationState: undefined,
    };
    return callState;
  }

  const authorizationState = await readAuthorizationStateForFirebaseAuthUser(dataStorageState, authenticationState.firebaseAuthUserId);

  const callState: OpaDm.ICallState = {
    dataStorageState: dataStorageState,
    authenticationState: authenticationState,
    hasSystemState: true,
    systemState: systemStateNonNull,
    hasAuthorizationState: true,
    authorizationState: authorizationState,
  };
  return callState;
}

/**
 * Reads the Authorization State for the specified Firebase Auth User in the Open Personal Archive™ (OPA) system..
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {string} firebaseAuthUserId The Firebase Auth UUID for the User.
 * @return {Promise<OpaDm.IAuthorizationState>}
 */
export async function readAuthorizationStateForFirebaseAuthUser(dataStorageState: OpaDm.IDataStorageState, firebaseAuthUserId: string): Promise<OpaDm.IAuthorizationState> {
  OPA.assertDataStorageStateIsNotNullish(dataStorageState);
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);
  OPA.assertIdentifierIsValid(firebaseAuthUserId);

  const isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
  OPA.assertSystemIsInstalled(isSystemInstalled);

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

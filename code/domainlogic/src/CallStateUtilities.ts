import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../datamodel/src";

/**
 * Gets the Call State for the current User in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {OpaDm.IAuthenticationState} authenticationState The Firebase Authentication state for the User.
 * @return {Promise<OpaDm.ICallState>}
 */
export async function getCallStateForCurrentUser(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState): Promise<OpaDm.ICallState> {
  OPA.assertNonNullish(dataStorageState, "The Data Storage State must not be null.");
  OPA.assertNonNullish(authenticationState, "The Authentication State must not be null.");
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);
  OPA.assertNonNullishOrWhitespace(authenticationState.providerId, "The Authentication Provider ID for the User's account must not be null.");
  OPA.assertNonNullishOrWhitespace(authenticationState.email, "The email account of the User must not be null.");
  OPA.assertIdentifierIsValid(authenticationState.firebaseAuthUserId);

  // LATER: Consider checking if AuthenticationState is Anonymous and returning ICallState with NULL AuthorizationState

  const db = dataStorageState.db;
  const firebaseAuthUserId = authenticationState.firebaseAuthUserId;

  let hasSystemState = false;
  let systemState: OpaDm.ISystemState | undefined = undefined;

  // NOTE: Create System State
  const application = await OpaDb.Application.queries.getById(db, OpaDm.ApplicationId);
  const archive = await OpaDb.Archive.queries.getById(db, OpaDm.ArchiveId);
  let applicationNonNull = ((null as unknown) as OpaDm.IApplication);
  let archiveNonNull = ((null as unknown) as OpaDm.IArchive);

  if (!OPA.isNullish(application)) {
    OPA.assertDocumentIsValid(archive, "The Archive object must exist.");

    applicationNonNull = OPA.convertNonNullish(application);
    archiveNonNull = OPA.convertNonNullish(archive);

    systemState = {application: applicationNonNull, archive: archiveNonNull};
    hasSystemState = true;
  }

  if (!hasSystemState) {
    const callState: OpaDm.ICallState = {
      dataStorageState: dataStorageState,
      authenticationState: authenticationState,
      hasAuthorizationState: false,
      authorizationState: undefined,
      hasSystemState: false,
      systemState: undefined,
    };
    return callState;
  }

  let user = await OpaDb.Users.queries.getByFirebaseAuthUserId(db, firebaseAuthUserId);

  if (OPA.isNullish(user)) {
    const externalAuthProviderId = authenticationState.providerId;
    const accountName = authenticationState.email;
    const firstName = authenticationState.firstName ?? "";
    const lastName = authenticationState.lastName ?? "";
    const preferredName = authenticationState.displayName;

    OPA.assertNonNullishOrWhitespace(externalAuthProviderId, "The Authentication Provider ID for the User's account must not be null.");
    OPA.assertNonNullishOrWhitespace(accountName, "The email account of the User must not be null.");

    const authProvider = await OpaDb.AuthProviders.queries.getByExternalAuthProviderId(db, externalAuthProviderId);
    OPA.assertDocumentIsValid(authProvider, "The Authentication Provider used by the current User is not recognized by the OPA system.");
    const authProviderNonNull = OPA.convertNonNullish(authProvider);

    const defaultRole = await OpaDb.Roles.queries.getById(db, OpaDm.Role_GuestId);
    OPA.assertDocumentIsValid(defaultRole, "The default Role of Guest must exist.");
    const defaultRoleNonNull = OPA.convertNonNullish(defaultRole);

    const defaultLocale = await OpaDb.Locales.queries.getById(db, archiveNonNull.defaultLocaleId);
    OPA.assertDocumentIsValid(defaultLocale, "The default Locale must exist.");
    const defaultLocaleNonNull = OPA.convertNonNullish(defaultLocale);

    const defaultTimeZoneGroup = await OpaDb.TimeZoneGroups.queries.getById(db, archiveNonNull.defaultTimeZoneGroupId);
    OPA.assertDocumentIsValid(defaultTimeZoneGroup, "The default Time Zone Group must exist.");
    const defaultTimeZoneGroupNonNull = OPA.convertNonNullish(defaultTimeZoneGroup);

    const newUserRef = OpaDb.Users.getTypedCollection(db).doc();
    const newUser = OpaDb.Users.createInstance(newUserRef.id, firebaseAuthUserId, authProviderNonNull, accountName, defaultRoleNonNull, defaultLocaleNonNull, defaultTimeZoneGroupNonNull, firstName, lastName, preferredName); // eslint-disable-line max-len
    await newUserRef.set(newUser, {merge: true});
  }

  const authorizationState = await readAuthorizationStateForFirebaseAuthUser(dataStorageState, firebaseAuthUserId);

  const callState: OpaDm.ICallState = {
    dataStorageState: dataStorageState,
    authenticationState: authenticationState,
    hasAuthorizationState: true,
    authorizationState: authorizationState,
    hasSystemState: hasSystemState,
    systemState: systemState,
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
  OPA.assertNonNullish(dataStorageState, "The Data Storage State must not be null.");
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);
  OPA.assertIdentifierIsValid(firebaseAuthUserId);

  const db = dataStorageState.db;

  const user = await OpaDb.Users.queries.getByFirebaseAuthUserId(db, firebaseAuthUserId);
  OPA.assertDocumentIsValid(user, "The current User must be properly authenticated.");
  const userNonNull = OPA.convertNonNullish(user);

  const role = await OpaDb.Roles.queries.getById(db, userNonNull.assignedRoleId);
  OPA.assertDocumentIsValid(role, "The current User's Role must be properly assigned.");
  const roleNonNull = OPA.convertNonNullish(role);

  const locale = await OpaDb.Locales.queries.getById(db, userNonNull.localeId);
  OPA.assertDocumentIsValid(locale, "The current User must have a valid Locale.");
  const localeNonNull = OPA.convertNonNullish(locale);

  const timeZoneGroup = await OpaDb.TimeZoneGroups.queries.getById(db, userNonNull.timeZoneGroupId);
  OPA.assertDocumentIsValid(timeZoneGroup, "The current User must have a valid Time Zone Group.");
  const timeZoneGroupNonNull = OPA.convertNonNullish(timeZoneGroup);

  const timeZone = await OpaDb.TimeZones.queries.getById(db, userNonNull.timeZoneId);
  OPA.assertDocumentIsValid(timeZone, "The current User must have a valid Time Zone.");
  const timeZoneNonNull = OPA.convertNonNullish(timeZone);

  const result = new OpaDm.AuthorizationState(userNonNull, roleNonNull, localeNonNull, timeZoneGroupNonNull, timeZoneNonNull);
  return result;
}

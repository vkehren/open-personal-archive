import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../datamodel/src";
import * as Application from "./system/Application";
import {TestAuthData} from "./TestData.test";

export type TestFunctionType = "query" | "logic";

/**
 * Uses the test AuthenticationStates and the defaults of the system to install the Open Personal Archive™ (OPA) system and create a User for each Role.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {OpaDm.IAuthenticationState} authenticationState The Firebase Authentication state for the User.
 * @return {Promise<void>}
 */
export async function performInstallForTest(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState): Promise<void> { // eslint-disable-line max-len
  OPA.assertDataStorageStateIsNotNullish(dataStorageState);
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);

  // NOTE: Install the Application completely before performing any more writes
  await Application.performInstall(dataStorageState, authenticationState, "Test Archive", "Archive for Mocha + Chai unit tests.", "./Test_Archive/files", OpaDm.DefaultLocaleId, OpaDm.DefaultTimeZoneGroupId, OPA.convertNonNullish(TestAuthData.owner.firstName), OPA.convertNonNullish(TestAuthData.owner.lastName)); // eslint-disable-line max-len

  // NOTE: Create the writeBatch AFTER installation is complete bc data from installation is necessary for later queries in this function
  dataStorageState.currentWriteBatch = dataStorageState.constructorProvider.writeBatch();

  const authProvider = OPA.convertNonNullish(await OpaDb.AuthProviders.queries.getByExternalAuthProviderId(dataStorageState, authenticationState.providerId));
  // const role_Owner = OPA.convertNonNullish(await OpaDb.Roles.queries.getById(dataStorageState.db, OpaDm.Role_OwnerId)); // eslint-disable-line camelcase
  const role_Admin = OPA.convertNonNullish(await OpaDb.Roles.queries.getById(dataStorageState, OpaDm.Role_AdministratorId)); // eslint-disable-line camelcase
  const role_Editor = OPA.convertNonNullish(await OpaDb.Roles.queries.getById(dataStorageState, OpaDm.Role_EditorId)); // eslint-disable-line camelcase
  const role_Viewer = OPA.convertNonNullish(await OpaDb.Roles.queries.getById(dataStorageState, OpaDm.Role_ViewerId)); // eslint-disable-line camelcase
  const role_Guest = OPA.convertNonNullish(await OpaDb.Roles.queries.getById(dataStorageState, OpaDm.Role_GuestId)); // eslint-disable-line camelcase

  const archive = OPA.convertNonNullish(await OpaDb.Archive.queries.getById(dataStorageState, OpaDm.ArchiveId));
  const locale = OPA.convertNonNullish(await OpaDb.Locales.queries.getById(dataStorageState, archive.defaultLocaleId));
  const timeZoneGroup = OPA.convertNonNullish(await OpaDb.TimeZoneGroups.queries.getById(dataStorageState, archive.defaultTimeZoneGroupId));

  let authState = TestAuthData.admin;
  authState.opaUserId = await OpaDb.Users.queries.createWithRole(dataStorageState, authState.firebaseAuthUserId, authProvider, authState.email, role_Admin, locale, timeZoneGroup, authState.firstName ?? "", authState.lastName ?? "", authState.displayName); // eslint-disable-line max-len

  authState = TestAuthData.editor;
  authState.opaUserId = await OpaDb.Users.queries.createWithRole(dataStorageState, authState.firebaseAuthUserId, authProvider, authState.email, role_Editor, locale, timeZoneGroup, authState.firstName ?? "", authState.lastName ?? "", authState.displayName); // eslint-disable-line max-len

  authState = TestAuthData.viewer;
  authState.opaUserId = await OpaDb.Users.queries.createWithRole(dataStorageState, authState.firebaseAuthUserId, authProvider, authState.email, role_Viewer, locale, timeZoneGroup, authState.firstName ?? "", authState.lastName ?? "", authState.displayName); // eslint-disable-line max-len

  authState = TestAuthData.guest;
  authState.opaUserId = await OpaDb.Users.queries.createWithRole(dataStorageState, authState.firebaseAuthUserId, authProvider, authState.email, role_Guest, locale, timeZoneGroup, authState.firstName ?? "", authState.lastName ?? "", authState.displayName); // eslint-disable-line max-len

  await dataStorageState.currentWriteBatch.commit();
  dataStorageState.currentWriteBatch = null;
}

/**
 * Asserts that a User corresponding to the specified AuthenticationState does not exist in the Open Personal Archive™ (OPA) system.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {OpaDm.IAuthenticationState} authenticationState The Firebase Authentication state for the User.
 * @return {Promise<void>}
 */
export async function assertUserDoesNotExist(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState): Promise<void> {
  const firebaseAuthUserId = authenticationState.firebaseAuthUserId;
  const user = await OpaDb.Users.queries.getByFirebaseAuthUserId(dataStorageState, firebaseAuthUserId);
  OPA.assertIsNullish(user, "The User was expected to NOT exist.");
}

/**
 * Asserts that a User corresponding to the specified AuthenticationState does exist in the Open Personal Archive™ (OPA) system and returns that User.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {OpaDm.IAuthenticationState} authenticationState The Firebase Authentication state for the User.
 * @return {Promise<OpaDm.IUser>}
 */
export async function assertUserDoesExist(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState): Promise<OpaDm.IUser> {
  const firebaseAuthUserId = authenticationState.firebaseAuthUserId;
  const user = await OpaDb.Users.queries.getByFirebaseAuthUserId(dataStorageState, firebaseAuthUserId);
  OPA.assertNonNullish(user, "The User was expected to exist.");
  return OPA.convertNonNullish(user);
}

/**
 * Asserts that an AccessRequest corresponding to the specified ID does exist in the Open Personal Archive™ (OPA) system and returns that AccessRequest.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {string} accessRequestId The ID for the AccessRequest.
 * @return {Promise<OpaDm.IAccessRequest>}
 */
export async function assertAccessRequestDoesExist(dataStorageState: OpaDm.IDataStorageState, accessRequestId: string): Promise<OpaDm.IAccessRequest> {
  const accessRequest = await OpaDb.AccessRequests.queries.getById(dataStorageState, accessRequestId);
  OPA.assertNonNullish(accessRequest, "The AccessRequest was expected to exist.");
  return OPA.convertNonNullish(accessRequest);
}

import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../datamodel/src";
import * as Application from "./system/Application";
import {TestAuthData} from "./TestData.test";

export const InstallName = "Test Archive";
export const InstallDescription = "Archive for Mocha + Chai unit tests.";
export const InstallPath = "./Test_Archive/files";
export const InstallLocaleId = OpaDm.DefaultLocaleId;
export const InstallTimeZoneGroupId = OpaDm.DefaultTimeZoneGroupId;
export const InstallNotes = "Install performed by Mocha test.";

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
  await Application.performInstall(dataStorageState, authenticationState, InstallName, InstallDescription, InstallPath, InstallLocaleId, InstallTimeZoneGroupId, InstallNotes); // eslint-disable-line max-len

  // NOTE: Create the writeBatch AFTER installation is complete bc data from installation is necessary for later queries in this function
  dataStorageState.currentWriteBatch = dataStorageState.constructorProvider.writeBatch();

  const authProvider = await OpaDb.AuthProviders.queries.getByExternalAuthProviderIdWithAssert(dataStorageState, authenticationState.providerId);
  // const role_Owner = await OpaDb.Roles.queries.getByIdWithAssert(dataStorageState.db, OpaDm.Role_OwnerId); // eslint-disable-line camelcase
  const role_Admin = await OpaDb.Roles.queries.getByIdWithAssert(dataStorageState, OpaDm.Role_AdministratorId); // eslint-disable-line camelcase
  const role_Editor = await OpaDb.Roles.queries.getByIdWithAssert(dataStorageState, OpaDm.Role_EditorId); // eslint-disable-line camelcase
  const role_Viewer = await OpaDb.Roles.queries.getByIdWithAssert(dataStorageState, OpaDm.Role_ViewerId); // eslint-disable-line camelcase
  const role_Guest = await OpaDb.Roles.queries.getByIdWithAssert(dataStorageState, OpaDm.Role_GuestId); // eslint-disable-line camelcase

  const configuration = await OpaDb.Configuration.queries.getByIdWithAssert(dataStorageState, OpaDm.ConfigurationId);
  const locale = await OpaDb.Locales.queries.getByIdWithAssert(dataStorageState, configuration.defaultLocaleId);
  const timeZoneGroup = await OpaDb.TimeZoneGroups.queries.getByIdWithAssert(dataStorageState, configuration.defaultTimeZoneGroupId);

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

  // NOTE: Create the writeBatch AFTER Users have been created bc the Users must exist before they are approved
  dataStorageState.currentWriteBatch = dataStorageState.constructorProvider.writeBatch();

  await OpaDb.Users.queries.setToDecidedOption(dataStorageState, TestAuthData.admin.opaUserId, OPA.ApprovalStates.approved, OpaDm.User_OwnerId);
  await OpaDb.Users.queries.setToDecidedOption(dataStorageState, TestAuthData.editor.opaUserId, OPA.ApprovalStates.approved, OpaDm.User_OwnerId);
  await OpaDb.Users.queries.setToDecidedOption(dataStorageState, TestAuthData.viewer.opaUserId, OPA.ApprovalStates.approved, OpaDm.User_OwnerId);
  await OpaDb.Users.queries.setToDecidedOption(dataStorageState, TestAuthData.guest.opaUserId, OPA.ApprovalStates.approved, OpaDm.User_OwnerId);

  await dataStorageState.currentWriteBatch.commit();
  dataStorageState.currentWriteBatch = null;

  const userIdsToAssert = [TestAuthData.owner.opaUserId, TestAuthData.admin.opaUserId, TestAuthData.editor.opaUserId, TestAuthData.viewer.opaUserId, TestAuthData.guest.opaUserId];
  const usersReadForIds = await OpaDb.Users.queries.getForIdsWithAssert(dataStorageState, userIdsToAssert);
  const usersReadAll = await OpaDb.Users.queries.getAll(dataStorageState);
  OPA.assertIsTrue((userIdsToAssert.length == usersReadForIds.length) && (userIdsToAssert.length == usersReadAll.length));
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
  const accessRequest = await OpaDb.AccessRequests.queries.getByIdWithAssert(dataStorageState, accessRequestId, "The AccessRequest was expected to exist.");
  return accessRequest;
}

/**
 * Asserts that an Contact corresponding to the specified ID does exist in the Open Personal Archive™ (OPA) system and returns that Contact.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {string} contactId The ID for the Contact.
 * @return {Promise<OpaDm.IContact>}
 */
export async function assertContactDoesExist(dataStorageState: OpaDm.IDataStorageState, contactId: string): Promise<OpaDm.IContact> {
  const contact = await OpaDb.Contacts.queries.getByIdWithAssert(dataStorageState, contactId, "The Contact was expected to exist.");
  return contact;
}

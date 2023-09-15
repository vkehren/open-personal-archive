import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../datamodel/src";
import * as Application from "./system/Application";
import {TestAuthData} from "./TestData.test";

export type TestFunctionType = "query" | "logic";

export async function performInstallForTest(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState): Promise<void> { // eslint-disable-line max-len
  OPA.assertDataStorageStateIsNotNullish(dataStorageState);
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);

  // NOTE: Install the Application completely before performing any more writes
  await Application.performInstall(dataStorageState, authenticationState,
    "Test Archive", "Archive for Mocha + Chai unit tests.", "./Test_Archive/files", OpaDm.DefaultLocaleId, OpaDm.DefaultTimeZoneGroupId,
    OPA.convertNonNullish(TestAuthData.owner.firstName), OPA.convertNonNullish(TestAuthData.owner.lastName));

  // NOTE: Create the writeBatch AFTER installation is complete bc data from installation is necessary for later queries in this function
  dataStorageState.currentWriteBatch = dataStorageState.constructorProvider.writeBatch();

  const authProvider = OPA.convertNonNullish(await OpaDb.AuthProviders.queries.getByExternalAuthProviderId(dataStorageState, authenticationState.providerId));
  // const role_Owner = OPA.convertNonNullish(await OpaDb.Roles.queries.getById(dataStorageState.db, OpaDm.Role_OwnerId));
  const role_Admin = OPA.convertNonNullish(await OpaDb.Roles.queries.getById(dataStorageState, OpaDm.Role_AdministratorId));
  const role_Editor = OPA.convertNonNullish(await OpaDb.Roles.queries.getById(dataStorageState, OpaDm.Role_EditorId));
  const role_Viewer = OPA.convertNonNullish(await OpaDb.Roles.queries.getById(dataStorageState, OpaDm.Role_ViewerId));
  const role_Guest = OPA.convertNonNullish(await OpaDb.Roles.queries.getById(dataStorageState, OpaDm.Role_GuestId));

  const archive = OPA.convertNonNullish(await OpaDb.Archive.queries.getById(dataStorageState, OpaDm.ArchiveId));
  const locale = OPA.convertNonNullish(await OpaDb.Locales.queries.getById(dataStorageState, archive.defaultLocaleId));
  const timeZoneGroup = OPA.convertNonNullish(await OpaDb.TimeZoneGroups.queries.getById(dataStorageState, archive.defaultTimeZoneGroupId));

  let authState = TestAuthData.admin;
  authState.opaUserId = await OpaDb.Users.queries.createWithRole(dataStorageState, authState.firebaseAuthUserId, authProvider, authState.email, role_Admin, locale, timeZoneGroup, authState.firstName ?? "", authState.lastName ?? "", authState.displayName);

  authState = TestAuthData.editor;
  authState.opaUserId = await OpaDb.Users.queries.createWithRole(dataStorageState, authState.firebaseAuthUserId, authProvider, authState.email, role_Editor, locale, timeZoneGroup, authState.firstName ?? "", authState.lastName ?? "", authState.displayName);

  authState = TestAuthData.viewer;
  authState.opaUserId = await OpaDb.Users.queries.createWithRole(dataStorageState, authState.firebaseAuthUserId, authProvider, authState.email, role_Viewer, locale, timeZoneGroup, authState.firstName ?? "", authState.lastName ?? "", authState.displayName);

  authState = TestAuthData.guest;
  authState.opaUserId = await OpaDb.Users.queries.createWithRole(dataStorageState, authState.firebaseAuthUserId, authProvider, authState.email, role_Guest, locale, timeZoneGroup, authState.firstName ?? "", authState.lastName ?? "", authState.displayName);

  await dataStorageState.currentWriteBatch.commit();
  dataStorageState.currentWriteBatch = null;
}

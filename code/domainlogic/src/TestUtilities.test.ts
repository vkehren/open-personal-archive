import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../datamodel/src";
import * as Application from "./system/Application";
import * as TestData from "./TestData.test";
import * as TestConfig from "./TestConfiguration.test";

const config = TestConfig.getTestConfiguration();

export async function performInstallForTest(dataStorageState: OpaDm.IDataStorageState = config.dataStorageState, authenticationState: OpaDm.IAuthenticationState = config.authenticationState, constructorProvider: OPA.IFirebaseConstructorProvider = config.firebaseConstructorProvider): Promise<void> { // eslint-disable-line max-len
  await Application.performInstall(dataStorageState, authenticationState,
    "Test Archive", "Archive for Mocha + Chai unit tests.", "./Test_Archive/files",
    "OPA_Locale_en_US", "OPA_TimeZoneGroup_PST_-08:00", "Owner", "de Archive");

  const db = dataStorageState.db;
  // const owner = OPA.convertNonNullish(await OpaDb.Users.queries.getById(db, OpaDm.User_OwnerId));

  const authProvider = OPA.convertNonNullish(await OpaDb.AuthProviders.queries.getByExternalAuthProviderId(dataStorageState.db, authenticationState.providerId));
  // const role_Owner = OPA.convertNonNullish(await OpaDb.Roles.queries.getById(db, OpaDm.Role_OwnerId));
  const role_Admin = OPA.convertNonNullish(await OpaDb.Roles.queries.getById(db, OpaDm.Role_AdministratorId));
  const role_Editor = OPA.convertNonNullish(await OpaDb.Roles.queries.getById(db, OpaDm.Role_EditorId));
  const role_Viewer = OPA.convertNonNullish(await OpaDb.Roles.queries.getById(db, OpaDm.Role_ViewerId));
  const role_Guest = OPA.convertNonNullish(await OpaDb.Roles.queries.getById(db, OpaDm.Role_GuestId));

  const archive = OPA.convertNonNullish(await OpaDb.Archive.queries.getById(db, OpaDm.ArchiveId));
  const locale = OPA.convertNonNullish(await OpaDb.Locales.queries.getById(db, archive.defaultLocaleId));
  const timeZoneGroup = OPA.convertNonNullish(await OpaDb.TimeZoneGroups.queries.getById(db, archive.defaultTimeZoneGroupId));

  let authState = TestData.authenticationState_Admin;
  await OpaDb.Users.queries.createWithRole(db, authState.firebaseAuthUserId, authProvider, authState.email, role_Admin, locale, timeZoneGroup, authState.firstName ?? "", authState.lastName ?? "", authState.displayName);

  authState = TestData.authenticationState_Editor;
  await OpaDb.Users.queries.createWithRole(db, authState.firebaseAuthUserId, authProvider, authState.email, role_Editor, locale, timeZoneGroup, authState.firstName ?? "", authState.lastName ?? "", authState.displayName);

  authState = TestData.authenticationState_Viewer;
  await OpaDb.Users.queries.createWithRole(db, authState.firebaseAuthUserId, authProvider, authState.email, role_Viewer, locale, timeZoneGroup, authState.firstName ?? "", authState.lastName ?? "", authState.displayName);

  authState = TestData.authenticationState_Guest;
  await OpaDb.Users.queries.createWithRole(db, authState.firebaseAuthUserId, authProvider, authState.email, role_Guest, locale, timeZoneGroup, authState.firstName ?? "", authState.lastName ?? "", authState.displayName);
}

import * as admin from "firebase-admin";
import {afterEach, beforeEach, describe, test} from "mocha";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {createApplication, OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
import * as CSU from "../CallStateUtilities";
import * as Application from "./Application";
import * as SchemaInfo from "../../../datamodel/src/PackageInfo";
import * as ApplicationInfo from "../PackageInfo";
import * as TestConfig from "../../test-config.json";

const useEmulators = TestConfig.use_emulators;
const useEmulatorsText = (useEmulators ? "Emulators" : "Cloud");
let timeout: number | null | undefined = TestConfig.timeout;
let initializeArgs = {projectId: ""};

if (useEmulators) {
  const emulatorsConfig = TestConfig.test_emulators;
  timeout = emulatorsConfig.timeout ?? timeout;
  OPA.setFirebaseToUseEmulators(emulatorsConfig.project_id, emulatorsConfig.emulator_authentication_host, emulatorsConfig.emulator_firestore_host, emulatorsConfig.emulator_storage_host);
  initializeArgs = {projectId: emulatorsConfig.project_id_for_admin};
} else {
  const cloudConfig = TestConfig.test_cloud;
  timeout = cloudConfig.timeout ?? timeout;
  OPA.setFirebaseToUseCloud(cloudConfig.path_to_credential);
  initializeArgs = {projectId: cloudConfig.project_id_for_admin};
}

const nullDb = ((null as unknown) as admin.firestore.Firestore);
const ownerFirebaseAuthUserId = "FB_" + OpaDm.User_OwnerId;
let isFirstTest = true;

const dataStorageState: OpaDm.IDataStorageState = {
  appName: "[DEFAULT]", // NOTE: This is the default name Firebase uses for unnamed apps
  projectId: initializeArgs.projectId,
  usesAdminAccess: true,
  usesEmulators: useEmulators,
  db: nullDb,
};
const authenticationState: OpaDm.IAuthenticationState = {
  firebaseAuthUserId: ownerFirebaseAuthUserId,
  providerId: "google.com",
  email: (ownerFirebaseAuthUserId + "@gmail.com"),
  emailIsVerified: true,
};

describe("Tests using Firebase " + useEmulatorsText, function () {
  if (!OPA.isNullish(timeout)) {
    this.timeout(OPA.convertNonNullish(timeout)); // eslint-disable-line no-invalid-this
  }

  beforeEach(async () => {
    const doBackup = false && (isFirstTest && !useEmulators); // LATER: Once backup is implemented, delete "false && "
    isFirstTest = false;

    admin.initializeApp(initializeArgs);
    dataStorageState.db = admin.firestore();

    const isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    if (isSystemInstalled) {
      const owner = await OpaDb.Users.queries.getById(dataStorageState.db, OpaDm.User_OwnerId);

      if (OPA.isNullish(owner)) {
        // NOTE: Passing a valid value for "authorizationState" only matters if the Archive Owner actually exists
        await Application.performUninstall(dataStorageState, authenticationState, null, doBackup);
      } else {
        const authorizationState = await CSU.readAuthorizationStateForFirebaseAuthUser(dataStorageState, OPA.convertNonNullish(owner).firebaseAuthUserId);
        await Application.performUninstall(dataStorageState, authenticationState, authorizationState, doBackup);
      }
    }

    // LATER: Consider terminating DB, deleting App, and re-creating App
  });

  test("checks that isSystemInstalled(...) works properly", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    expect(isSystemInstalled).equals(false);

    const application = createApplication(ApplicationInfo.VERSION, SchemaInfo.VERSION);
    const applicationCollectionRef = OpaDb.Application.getTypedCollection(dataStorageState.db);
    const applicationDocumentRef = applicationCollectionRef.doc(application.id);
    await applicationDocumentRef.set(application, {merge: true});

    isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    expect(isSystemInstalled).equals(true);
  });

  test("checks that performUninstall(...) works properly", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    expect(isSystemInstalled).equals(false);

    let application = createApplication(ApplicationInfo.VERSION, SchemaInfo.VERSION);
    let applicationCollectionRef = OpaDb.Application.getTypedCollection(dataStorageState.db);
    let applicationDocumentRef = applicationCollectionRef.doc(application.id);
    await applicationDocumentRef.set(application, {merge: true});

    isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    expect(isSystemInstalled).equals(true);

    // NOTE: Since no Archive Owner exists in the current data, the following call should complete successfully
    await Application.performUninstall(dataStorageState, authenticationState, null, false);

    isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    expect(isSystemInstalled).equals(false);

    const applications = await OpaDb.Application.queries.getAll(dataStorageState.db);
    expect(applications.length).equals(0);
    const authProviders = await OpaDb.AuthProviders.queries.getAll(dataStorageState.db);
    expect(authProviders.length).equals(0);
    const roles = await OpaDb.Roles.queries.getAll(dataStorageState.db);
    expect(roles.length).equals(0);
    const locales = await OpaDb.Locales.queries.getAll(dataStorageState.db);
    expect(locales.length).equals(0);
    const timeZoneGroups = await OpaDb.TimeZoneGroups.queries.getAll(dataStorageState.db);
    expect(timeZoneGroups.length).equals(0);
    const timeZones = await OpaDb.TimeZones.queries.getAll(dataStorageState.db);
    expect(timeZones.length).equals(0);
    const users = await OpaDb.Users.queries.getAll(dataStorageState.db);
    expect(users.length).equals(0);
    const archives = await OpaDb.Archive.queries.getAll(dataStorageState.db);
    expect(archives.length).equals(0);

    application = createApplication(ApplicationInfo.VERSION, SchemaInfo.VERSION);
    applicationCollectionRef = OpaDb.Application.getTypedCollection(dataStorageState.db);
    applicationDocumentRef = applicationCollectionRef.doc(application.id);
    await applicationDocumentRef.set(application, {merge: true});

    const authProvider = OpaDb.AuthProviders.requiredDocuments[0];
    const authProviderCollectionRef = OpaDb.AuthProviders.getTypedCollection(dataStorageState.db);
    const authProviderDocumentRef = authProviderCollectionRef.doc(authProvider.id);
    await authProviderDocumentRef.set(application, {merge: true});

    const role = OpaDb.Roles.requiredDocuments.filter((value) => (value.type == OpaDm.RoleTypes.owner))[0];
    const roleCollectionRef = OpaDb.Roles.getTypedCollection(dataStorageState.db);
    const roleDocumentRef = roleCollectionRef.doc(role.id);
    await roleDocumentRef.set(role, {merge: true});

    const locale = OpaDb.Locales.requiredDocuments[0];
    const localeCollectionRef = OpaDb.Locales.getTypedCollection(dataStorageState.db);
    const localeDocumentRef = localeCollectionRef.doc(locale.id);
    await localeDocumentRef.set(locale, {merge: true});

    const timeZoneGroup = OpaDb.TimeZoneGroups.requiredDocuments[0];
    const timeZoneGroupCollectionRef = OpaDb.TimeZoneGroups.getTypedCollection(dataStorageState.db);
    const timeZoneGroupDocumentRef = timeZoneGroupCollectionRef.doc(timeZoneGroup.id);
    await timeZoneGroupDocumentRef.set(timeZoneGroup, {merge: true});

    const timeZone = OpaDb.TimeZones.requiredDocuments[0];
    const timeZoneCollectionRef = OpaDb.TimeZones.getTypedCollection(dataStorageState.db);
    const timeZoneDocumentRef = timeZoneCollectionRef.doc(timeZone.id);
    await timeZoneDocumentRef.set(timeZone, {merge: true});

    const now = OPA.nowToUse();
    const owner: OpaDm.IUser = {
      id: OpaDm.User_OwnerId,
      firebaseAuthUserId: ownerFirebaseAuthUserId,
      authProviderId: authProvider.id,
      authAccountName: "",
      authAccountNameLowered: "",
      assignedRoleId: role.id,
      localeId: locale.id,
      timeZoneGroupId: timeZoneGroup.id,
      timeZoneId: timeZone.id,
      firstName: "",
      lastName: "",
      preferredName: "",
      requestedCitationIds: ([] as Array<string>),
      viewableCitationIds: ([] as Array<string>),
      recentQueries: ([] as Array<string>),
      dateOfCreation: now,
      hasBeenUpdated: false,
      dateOfLatestUpdate: null,
      hasBeenViewed: false,
      dateOfLatestViewing: null,
      userIdOfLatestViewer: null,
      approvalState: OpaDm.ApprovalStates.approved,
      hasBeenDecided: true,
      dateOfDecision: now,
      userIdOfDecider: OpaDm.User_OwnerId,
    };
    const userCollectionRef = OpaDb.Users.getTypedCollection(dataStorageState.db);
    const userDocumentRef = userCollectionRef.doc(owner.id);
    await userDocumentRef.set(owner, {merge: true});

    isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    expect(isSystemInstalled).equals(true);

    const authorizationState = await CSU.readAuthorizationStateForFirebaseAuthUser(dataStorageState, ownerFirebaseAuthUserId);
    // NOTE: Since an Archive Owner exists in the current data, the following call should throw an Error
    expect(Application.performUninstall(dataStorageState, authenticationState, null, false)).to.be.rejectedWith(Error);
    // NOTE: Since we pass the Archive Owner's Authorization State, the following call should complete successfully
    await Application.performUninstall(dataStorageState, authenticationState, authorizationState, false);

    isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    expect(isSystemInstalled).equals(false);

    // NOTE: Since the System is no longer installed, this call should succeed
    await Application.performUninstall(dataStorageState, authenticationState, null, false);

    isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    expect(isSystemInstalled).equals(false);

    // NOTE: Since the System is no longer installed, this call should also succeed
    await Application.performUninstall(dataStorageState, authenticationState, authorizationState, false);

    isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    expect(isSystemInstalled).equals(false);
  });

  test("checks that performInstall(...) works properly", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    expect(isSystemInstalled).equals(false);

    await Application.performInstall(dataStorageState, authenticationState, "Test Archive", "Archive for Mocha + Chai unit tests.", "./Test_Archive/files",
      "OPA_Locale_bn_IN", "OPA_TimeZoneGroup_IST_+05:30", "Fake", "Account");

    isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    expect(isSystemInstalled).equals(true);

    // LATER: Extract these checks into a isCorrupted(...) function that checks install data is valid or not
    const applications = await OpaDb.Application.queries.getAll(dataStorageState.db);
    expect(applications.length).equals(1);
    const authProviders = await OpaDb.AuthProviders.queries.getAll(dataStorageState.db);
    expect(authProviders.length).equals(OpaDb.AuthProviders.requiredDocuments.length).equals(1);
    const roles = await OpaDb.Roles.queries.getAll(dataStorageState.db);
    expect(roles.length).equals(OpaDb.Roles.requiredDocuments.length).equals(5);
    const locales = await OpaDb.Locales.queries.getAll(dataStorageState.db);
    expect(locales.length).equals(OpaDb.Locales.requiredDocuments.length).equals(53);
    const timeZoneGroups = await OpaDb.TimeZoneGroups.queries.getAll(dataStorageState.db);
    expect(timeZoneGroups.length).equals(OpaDb.TimeZoneGroups.requiredDocuments.length).equals(41);
    const timeZones = await OpaDb.TimeZones.queries.getAll(dataStorageState.db);
    expect(timeZones.length).equals(OpaDb.TimeZones.requiredDocuments.length).equals(41);
    const users = await OpaDb.Users.queries.getAll(dataStorageState.db);
    expect(users.length).equals(1);
    const archives = await OpaDb.Archive.queries.getAll(dataStorageState.db);
    expect(archives.length).equals(1);

    // NOTE: Since the System is already installed, this call should fail
    expect(Application.performInstall(dataStorageState, authenticationState, "Test Archive", "Archive for Mocha + Chai unit tests.", "./Test_Archive/files",
      "OPA_Locale_bn_IN", "OPA_TimeZoneGroup_IST_+05:30", "Fake", "Account")).to.be.rejectedWith(Error);
  });

  test("checks that updateInstallationSettings(...) works properly", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    expect(isSystemInstalled).equals(false);

    await Application.performInstall(dataStorageState, authenticationState, "Test Archive", "Archive for Mocha + Chai unit tests.", "./Test_Archive/files",
      "OPA_Locale_bn_IN", "OPA_TimeZoneGroup_IST_+05:30", "Fake", "Account");

    isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    expect(isSystemInstalled).equals(true);

    let callState = await CSU.getCallStateForCurrentUser(dataStorageState, authenticationState);
    OPA.assertNonNullish(callState.authorizationState, "Authorization State should not be null.");
    const currentUser = OPA.convertNonNullish(callState.authorizationState).user;
    const currentLocale = OPA.convertNonNullish(callState.authorizationState).locale;
    OPA.assertNonNullish(callState.systemState, "System State should not be null.");
    let archiveOriginal = OPA.convertNonNullish(callState.systemState).archive;
    expect(Application.updateInstallationSettings(callState, undefined, undefined, undefined, undefined, undefined)).to.be.rejectedWith(Error);

    let archive = await OpaDb.Archive.queries.getById(dataStorageState.db, OpaDm.ArchiveId);
    OPA.assertDocumentIsValid(archive, "The Archive does not exist.");
    let archiveNonNull = OPA.convertNonNullish(archive);

    expect(archiveNonNull.name[currentLocale.optionName]).equals(archiveOriginal.name[currentLocale.optionName]);
    expect(archiveNonNull.description[currentLocale.optionName]).equals(archiveOriginal.description[currentLocale.optionName]);
    expect(archiveNonNull.defaultLocaleId).equals(archiveOriginal.defaultLocaleId);
    expect(archiveNonNull.defaultTimeZoneGroupId).equals(archiveOriginal.defaultTimeZoneGroupId);
    expect(archiveNonNull.defaultTimeZoneId).equals(archiveOriginal.defaultTimeZoneId);
    expect(archiveNonNull.hasBeenUpdated).equals(false);
    expect(archiveNonNull.dateOfLatestUpdate).equals(null);
    expect(archiveNonNull.userIdOfLatestUpdater).equals(null);

    callState = await CSU.getCallStateForCurrentUser(dataStorageState, authenticationState);
    const nameUpdated = archiveOriginal.name[currentLocale.optionName] + " UPDATED";
    await Application.updateInstallationSettings(callState, nameUpdated, undefined, undefined, undefined, undefined);

    archive = await OpaDb.Archive.queries.getById(dataStorageState.db, OpaDm.ArchiveId);
    OPA.assertDocumentIsValid(archive, "The Archive does not exist.");
    archiveNonNull = OPA.convertNonNullish(archive);

    expect(archiveNonNull.name[currentLocale.optionName]).equals(nameUpdated);
    expect(archiveNonNull.description[currentLocale.optionName]).equals(archiveOriginal.description[currentLocale.optionName]);
    expect(archiveNonNull.defaultLocaleId).equals(archiveOriginal.defaultLocaleId);
    expect(archiveNonNull.defaultTimeZoneGroupId).equals(archiveOriginal.defaultTimeZoneGroupId);
    expect(archiveNonNull.defaultTimeZoneId).equals(archiveOriginal.defaultTimeZoneId);
    expect(archiveNonNull.hasBeenUpdated).equals(true);
    expect(archiveNonNull.dateOfLatestUpdate).not.equals(null);
    expect(archiveNonNull.userIdOfLatestUpdater).equals(currentUser.id);

    callState = await CSU.getCallStateForCurrentUser(dataStorageState, authenticationState);
    const descriptionUpdated = archiveOriginal.description[currentLocale.optionName] + " UPDATED";
    const defaultLocaleIdUpdated = (OpaDb.Locales.requiredDocuments.find((v) => !v.isDefault) as OpaDm.ILocale).id;
    await Application.updateInstallationSettings(callState, undefined, descriptionUpdated, defaultLocaleIdUpdated, undefined, undefined);

    archive = await OpaDb.Archive.queries.getById(dataStorageState.db, OpaDm.ArchiveId);
    OPA.assertDocumentIsValid(archive, "The Archive does not exist.");
    archiveNonNull = OPA.convertNonNullish(archive);

    expect(archiveNonNull.name[currentLocale.optionName]).equals(nameUpdated);
    expect(archiveNonNull.description[currentLocale.optionName]).equals(descriptionUpdated);
    expect(archiveNonNull.defaultLocaleId).equals(defaultLocaleIdUpdated);
    expect(archiveNonNull.defaultTimeZoneGroupId).equals(archiveOriginal.defaultTimeZoneGroupId);
    expect(archiveNonNull.defaultTimeZoneId).equals(archiveOriginal.defaultTimeZoneId);
    expect(archiveNonNull.hasBeenUpdated).equals(true);
    expect(archiveNonNull.dateOfLatestUpdate).not.equals(null);
    expect(archiveNonNull.userIdOfLatestUpdater).equals(currentUser.id);

    callState = await CSU.getCallStateForCurrentUser(dataStorageState, authenticationState);
    const defaultTimeZoneGroupUpdated = (OpaDb.TimeZoneGroups.requiredDocuments.find((v) => !v.isDefault) as OpaDm.ITimeZoneGroup);
    const defaultTimeZoneGroupIdUpdated = defaultTimeZoneGroupUpdated.id;
    const defaultTimeZoneIdUpdated = defaultTimeZoneGroupUpdated.primaryTimeZoneId;
    await Application.updateInstallationSettings(callState, undefined, undefined, undefined, defaultTimeZoneGroupIdUpdated, defaultTimeZoneIdUpdated);

    archive = await OpaDb.Archive.queries.getById(dataStorageState.db, OpaDm.ArchiveId);
    OPA.assertDocumentIsValid(archive, "The Archive does not exist.");
    archiveNonNull = OPA.convertNonNullish(archive);

    expect(archiveNonNull.name[currentLocale.optionName]).equals(nameUpdated);
    expect(archiveNonNull.description[currentLocale.optionName]).equals(descriptionUpdated);
    expect(archiveNonNull.defaultLocaleId).equals(defaultLocaleIdUpdated);
    expect(archiveNonNull.defaultTimeZoneGroupId).equals(defaultTimeZoneGroupIdUpdated);
    expect(archiveNonNull.defaultTimeZoneId).equals(defaultTimeZoneIdUpdated);
    expect(archiveNonNull.hasBeenUpdated).equals(true);
    expect(archiveNonNull.dateOfLatestUpdate).not.equals(null);
    expect(archiveNonNull.userIdOfLatestUpdater).equals(currentUser.id);
  });

  // IMPORTANT: You must build the domainlogic package before running this test so that the PackageInfo.ts files contain the correct VERSION values
  test("checks that performUpgrade(...) works properly", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    expect(isSystemInstalled).equals(false);

    await Application.performInstall(dataStorageState, authenticationState, "Test Archive", "Archive for Mocha + Chai unit tests.", "./Test_Archive/files",
      "OPA_Locale_bn_IN", "OPA_TimeZoneGroup_IST_+05:30", "Fake", "Account");

    isSystemInstalled = await Application.isSystemInstalled(dataStorageState);
    expect(isSystemInstalled).equals(true);

    // NOTE: Since the System version has not changed, this call should fail
    let callState = await CSU.getCallStateForCurrentUser(dataStorageState, authenticationState);
    expect(Application.performUpgrade(callState)).to.be.rejectedWith(Error);

    let application = await OpaDb.Application.queries.getById(dataStorageState.db, OpaDm.ApplicationId);
    OPA.assertDocumentIsValid(application, "The Application does not exist.");
    let applicationNonNull = OPA.convertNonNullish(application);

    const oldVersion = "0.0.0.1";
    const oldDateOfInstallation = applicationNonNull.dateOfInstallation;
    const newApplicationVersion = applicationNonNull.applicationVersion;
    const newSchemaVersion = applicationNonNull.schemaVersion;

    let applicationPartial: OpaDm.IApplicationPartial = {
      applicationVersion: oldVersion,
      schemaVersion: oldVersion,
      upgradeHistory: applicationNonNull.upgradeHistory,
      // NOTE: Do NOT update IUpgradeable_ByUser interface fields, as we are simulating an old installation
      hasBeenUpgraded: applicationNonNull.hasBeenUpgraded,
      dateOfLatestUpgrade: applicationNonNull.dateOfLatestUpgrade,
      userIdOfLatestUpgrader: applicationNonNull.userIdOfLatestUpgrader,
    };
    const applicationRef = OpaDb.Application.getTypedCollection(dataStorageState.db).doc(applicationNonNull.id);
    await applicationRef.set(applicationPartial, {merge: true});

    application = await OpaDb.Application.queries.getById(dataStorageState.db, OpaDm.ApplicationId);
    OPA.assertDocumentIsValid(application, "The Application does not exist.");
    applicationNonNull = OPA.convertNonNullish(application);

    expect(applicationNonNull.applicationVersion).equals(oldVersion);
    expect(applicationNonNull.schemaVersion).equals(oldVersion);
    expect(applicationNonNull.upgradeHistory.length).equals(0);
    expect(applicationNonNull.dateOfInstallation.valueOf()).equals(oldDateOfInstallation.valueOf());
    expect(applicationNonNull.hasBeenUpgraded).equals(false);
    expect(applicationNonNull.dateOfLatestUpgrade).equals(null);
    expect(applicationNonNull.userIdOfLatestUpgrader).equals(null);

    callState = await CSU.getCallStateForCurrentUser(dataStorageState, authenticationState);
    await Application.performUpgrade(callState);

    application = await OpaDb.Application.queries.getById(dataStorageState.db, OpaDm.ApplicationId);
    OPA.assertDocumentIsValid(application, "The Application does not exist.");
    applicationNonNull = OPA.convertNonNullish(application);

    const authorizationState = OPA.convertNonNullish(callState.authorizationState);
    expect(applicationNonNull.applicationVersion).equals(newApplicationVersion);
    expect(applicationNonNull.schemaVersion).equals(newSchemaVersion);
    expect(applicationNonNull.upgradeHistory.length).equals(1);
    expect(applicationNonNull.dateOfInstallation.valueOf()).equals(oldDateOfInstallation.valueOf());
    expect(applicationNonNull.hasBeenUpgraded).equals(true);
    expect(applicationNonNull.dateOfLatestUpgrade).not.equals(null);
    expect(applicationNonNull.userIdOfLatestUpgrader).equals(authorizationState.user.id);

    const applicationUpgradeData = applicationNonNull.upgradeHistory[0];
    expect(applicationUpgradeData.applicationVersionAfterUpgrade).equals(newApplicationVersion);
    expect(applicationUpgradeData.schemaVersionAfterUpgrade).equals(newSchemaVersion);
    expect(applicationUpgradeData.applicationVersionBeforeUpgrade).equals(oldVersion);
    expect(applicationUpgradeData.schemaVersionBeforeUpgrade).equals(oldVersion);
    expect(applicationUpgradeData.hasBeenUpgraded).equals(true);
    expect(applicationUpgradeData.dateOfLatestUpgrade?.valueOf()).equals(applicationNonNull.dateOfLatestUpgrade?.valueOf());
    expect(applicationUpgradeData.userIdOfLatestUpgrader).equals(authorizationState.user.id);
  });

  afterEach(async () => {
    await dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

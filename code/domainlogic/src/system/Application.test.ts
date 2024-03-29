import * as admin from "firebase-admin";
import {afterEach, beforeEach, describe, test} from "mocha";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
import * as CSU from "../CallStateUtilities";
import * as Application from "./Application";
import * as SchemaInfo from "../../../datamodel/src/PackageInfo";
import * as ApplicationInfo from "../PackageInfo";
import {TestAuthData} from "../TestData.test";
import * as TestConfig from "../TestConfiguration.test";
import * as TestUtils from "../TestUtilities.test";

const config = TestConfig.getTestConfiguration();
const createNotes = "CREATE APPLICATION FOR TEST";
const reCreateNotes = "CREATE APPLICATION AGAIN FOR TEST";
const installNotes = "INSTALL FOR TEST";
const invalidReInstallNotes = "INVALID INSTALL AGAIN FOR TEST";
const upgradeNotes = "UPGRADE FOR TEST";
const samegradeNotes = "SAME VERSION FOR TEST";
const downgradeNotes = "DOWNGRADE FOR TEST";

describe("Application Tests using Firebase " + config.testEnvironment, function() {
  if (!OPA.isNullish(config.timeout)) {
    this.timeout(OPA.convertNonNullish(config.timeout)); // eslint-disable-line no-invalid-this
  }

  beforeEach(async () => {
    // NOTE: Make sure that each AuthenticationState object is reset to its original state
    TestAuthData.resetTestData();
    // NOTE Set the ambient AuthenticationState to Archive Owner so that beforeEach(...) succeeds
    config.authenticationState = TestAuthData.owner;

    const doBackup = false && (config.hasRunTests && (config.testEnvironment != "Emulators")); // LATER: Once backup is implemented, delete "false && "
    config.hasRunTests = false;

    admin.initializeApp(config.appInitializationArgs);
    config.dataStorageState.db = admin.firestore();
    config.dataStorageState.currentBulkWriter = null;
    config.dataStorageState.currentWriteBatch = null;

    const isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    if (isSystemInstalled) {
      // NOTE: The following line is necessary bc the System may have been installed in manner other than running tests
      const ownerForUninstall = await OpaDb.Users.queries.getById(config.dataStorageState, OpaDm.User_OwnerId);

      if (OPA.isNullish(ownerForUninstall)) {
        // NOTE: Passing a valid value for "authorizationState" only matters if the Archive Owner actually exists
        await Application.performUninstall(config.dataStorageState, config.authenticationState, null, doBackup);
      } else {
        const authorizationState = await CSU.readAuthorizationStateForFirebaseAuthUser(config.dataStorageState, OPA.convertNonNullish(ownerForUninstall).firebaseAuthUserId);
        await Application.performUninstall(config.dataStorageState, config.authenticationState, authorizationState, doBackup);
      }
    }

    // LATER: Consider terminating DB, deleting App, and re-creating App
  });

  test("checks that isSystemInstalled(...) works properly", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);

    await OpaDb.Application.queries.create(config.dataStorageState, ApplicationInfo.VERSION, SchemaInfo.VERSION, createNotes);
    const application = await OpaDb.Application.queries.getByIdWithAssert(config.dataStorageState, OpaDm.ApplicationId);
    expect(application.id).equals(OpaDm.ApplicationId);
    expect(application.applicationVersion).equals(ApplicationInfo.VERSION);
    expect(application.schemaVersion).equals(SchemaInfo.VERSION);
    expect(application.notes).equals(createNotes);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);
  });

  test("checks that performUninstall(...) works properly", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);

    await OpaDb.Application.queries.create(config.dataStorageState, ApplicationInfo.VERSION, SchemaInfo.VERSION, createNotes);
    let application = await OpaDb.Application.queries.getByIdWithAssert(config.dataStorageState, OpaDm.ApplicationId);
    expect(application.id).equals(OpaDm.ApplicationId);
    expect(application.applicationVersion).equals(ApplicationInfo.VERSION);
    expect(application.schemaVersion).equals(SchemaInfo.VERSION);
    expect(application.notes).equals(createNotes);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);

    // NOTE: Since no Archive Owner exists in the current data, the following call should complete successfully
    let wasSuccessful = await Application.performUninstall(config.dataStorageState, config.authenticationState, null, false);
    expect(wasSuccessful).equals(true);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);

    const applications = await OpaDb.Application.queries.getAll(config.dataStorageState);
    expect(applications.length).equals(0);
    const authProviders = await OpaDb.AuthProviders.queries.getAll(config.dataStorageState);
    expect(authProviders.length).equals(0);
    const roles = await OpaDb.Roles.queries.getAll(config.dataStorageState);
    expect(roles.length).equals(0);
    const locales = await OpaDb.Locales.queries.getAll(config.dataStorageState);
    expect(locales.length).equals(0);
    const timeZoneGroups = await OpaDb.TimeZoneGroups.queries.getAll(config.dataStorageState);
    expect(timeZoneGroups.length).equals(0);
    const timeZones = await OpaDb.TimeZones.queries.getAll(config.dataStorageState);
    expect(timeZones.length).equals(0);
    const users = await OpaDb.Users.queries.getAll(config.dataStorageState);
    expect(users.length).equals(0);
    const configurations = await OpaDb.Configuration.queries.getAll(config.dataStorageState);
    expect(configurations.length).equals(0);

    await OpaDb.Application.queries.create(config.dataStorageState, ApplicationInfo.VERSION, SchemaInfo.VERSION, reCreateNotes);
    application = await OpaDb.Application.queries.getByIdWithAssert(config.dataStorageState, OpaDm.ApplicationId);
    expect(application.id).equals(OpaDm.ApplicationId);
    expect(application.applicationVersion).equals(ApplicationInfo.VERSION);
    expect(application.schemaVersion).equals(SchemaInfo.VERSION);
    expect(application.notes).equals(reCreateNotes);

    const authProvider = OpaDb.AuthProviders.requiredDocuments.filter((value) => (value.isDefault))[0];
    const authProviderCollectionRef = OpaDb.AuthProviders.getTypedCollection(config.dataStorageState);
    const authProviderDocumentRef = authProviderCollectionRef.doc(authProvider.id);
    await authProviderDocumentRef.set(authProvider, {merge: true});

    const role = OpaDb.Roles.requiredDocuments.filter((value) => (value.type == OpaDm.RoleTypes.owner))[0];
    const roleCollectionRef = OpaDb.Roles.getTypedCollection(config.dataStorageState);
    const roleDocumentRef = roleCollectionRef.doc(role.id);
    await roleDocumentRef.set(role, {merge: true});

    const locale = OpaDb.Locales.requiredDocuments.filter((value) => (value.isDefault))[0];
    const localeCollectionRef = OpaDb.Locales.getTypedCollection(config.dataStorageState);
    const localeDocumentRef = localeCollectionRef.doc(locale.id);
    await localeDocumentRef.set(locale, {merge: true});

    const timeZoneGroup = OpaDb.TimeZoneGroups.requiredDocuments.filter((value) => (value.isDefault))[0];
    const timeZoneGroupCollectionRef = OpaDb.TimeZoneGroups.getTypedCollection(config.dataStorageState);
    const timeZoneGroupDocumentRef = timeZoneGroupCollectionRef.doc(timeZoneGroup.id);
    await timeZoneGroupDocumentRef.set(timeZoneGroup, {merge: true});

    const timeZone = OpaDb.TimeZones.requiredDocuments.filter((value) => (value.id == timeZoneGroup.primaryTimeZoneId))[0];
    const timeZoneCollectionRef = OpaDb.TimeZones.getTypedCollection(config.dataStorageState);
    const timeZoneDocumentRef = timeZoneCollectionRef.doc(timeZone.id);
    await timeZoneDocumentRef.set(timeZone, {merge: true});

    await OpaDb.Users.queries.createArchiveOwner(config.dataStorageState, config.authenticationState.firebaseAuthUserId, authProvider, config.authenticationState.firebaseAuthUserId + "@gmail.com", locale, timeZoneGroup, "Archive", "la Owner"); // eslint-disable-line max-len

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);

    const authorizationState = await CSU.readAuthorizationStateForFirebaseAuthUser(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    // NOTE: Since an Archive Owner exists in the current data, the following call should throw an Error
    expect(Application.performUninstall(config.dataStorageState, config.authenticationState, null, false)).to.be.rejectedWith(Error);
    // NOTE: Since we pass the Archive Owner's Authorization State, the following call should complete successfully
    wasSuccessful = await Application.performUninstall(config.dataStorageState, config.authenticationState, authorizationState, false);
    expect(wasSuccessful).equals(true);
    expect(await OpaDb.Application.queries.getById(config.dataStorageState, OpaDm.ApplicationId)).equals(null);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);

    // NOTE: Since the System is no longer installed, this call should succeed
    wasSuccessful = await Application.performUninstall(config.dataStorageState, config.authenticationState, null, false);
    expect(wasSuccessful).equals(true);
    expect(await OpaDb.Application.queries.getById(config.dataStorageState, OpaDm.ApplicationId)).equals(null);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);

    // NOTE: Since the System is no longer installed, this call should also succeed
    wasSuccessful = await Application.performUninstall(config.dataStorageState, config.authenticationState, authorizationState, false);
    expect(wasSuccessful).equals(true);
    expect(await OpaDb.Application.queries.getById(config.dataStorageState, OpaDm.ApplicationId)).equals(null);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);
  });

  test("checks that performInstall(...) works properly", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);

    await Application.performInstall(config.dataStorageState, config.authenticationState, TestUtils.InstallName, TestUtils.InstallDescription, TestUtils.InstallPath, TestUtils.InstallLocaleId, TestUtils.InstallTimeZoneGroupId, installNotes); // eslint-disable-line max-len
    let application = await OpaDb.Application.queries.getByIdWithAssert(config.dataStorageState, OpaDm.ApplicationId);
    expect(application.id).equals(OpaDm.ApplicationId);
    expect(application.applicationVersion).equals(ApplicationInfo.VERSION);
    expect(application.schemaVersion).equals(SchemaInfo.VERSION);
    expect(application.notes).equals(installNotes);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);

    // LATER: Extract these checks into a isCorrupted(...) function that checks install data is valid or not
    const applications = await OpaDb.Application.queries.getAll(config.dataStorageState);
    expect(applications.length).equals(1);
    const authProviders = await OpaDb.AuthProviders.queries.getAll(config.dataStorageState);
    expect(authProviders.length).equals(OpaDb.AuthProviders.requiredDocuments.length).equals(2);
    const roles = await OpaDb.Roles.queries.getAll(config.dataStorageState);
    expect(roles.length).equals(OpaDb.Roles.requiredDocuments.length).equals(5);
    const locales = await OpaDb.Locales.queries.getAll(config.dataStorageState);
    expect(locales.length).equals(OpaDb.Locales.requiredDocuments.length).equals(OpaDm.DataConfiguration.Locale_UseMin ? 3 : 53);
    const timeZoneGroups = await OpaDb.TimeZoneGroups.queries.getAll(config.dataStorageState);
    expect(timeZoneGroups.length).equals(OpaDb.TimeZoneGroups.requiredDocuments.length).equals(OpaDm.DataConfiguration.TimeZoneGroup_UseMin ? 3 : 41);
    const timeZones = await OpaDb.TimeZones.queries.getAll(config.dataStorageState);
    expect(timeZones.length).equals(OpaDb.TimeZones.requiredDocuments.length).equals(OpaDm.DataConfiguration.TimeZone_UseMin ? 3 : 41);
    const users = await OpaDb.Users.queries.getAll(config.dataStorageState);
    expect(users.length).equals(1);
    const configurations = await OpaDb.Configuration.queries.getAll(config.dataStorageState);
    expect(configurations.length).equals(1);

    // NOTE: Since the System is already installed, this call should fail
    expect(Application.performInstall(config.dataStorageState, config.authenticationState, TestUtils.InstallName, TestUtils.InstallDescription, TestUtils.InstallPath, TestUtils.InstallLocaleId, TestUtils.InstallTimeZoneGroupId, invalidReInstallNotes)).to.be.rejectedWith(Error); // eslint-disable-line max-len
    application = await OpaDb.Application.queries.getByIdWithAssert(config.dataStorageState, OpaDm.ApplicationId);
    expect(application.id).equals(OpaDm.ApplicationId);
    expect(application.applicationVersion).equals(ApplicationInfo.VERSION);
    expect(application.schemaVersion).equals(SchemaInfo.VERSION);
    expect(application.notes).equals(installNotes);
  });

  test("checks that updateInstallationSettings(...) works properly", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);

    await Application.performInstall(config.dataStorageState, config.authenticationState, TestUtils.InstallName, TestUtils.InstallDescription, TestUtils.InstallPath, TestUtils.InstallLocaleId, TestUtils.InstallTimeZoneGroupId, installNotes); // eslint-disable-line max-len
    const application = await OpaDb.Application.queries.getByIdWithAssert(config.dataStorageState, OpaDm.ApplicationId);
    expect(application.id).equals(OpaDm.ApplicationId);
    expect(application.applicationVersion).equals(ApplicationInfo.VERSION);
    expect(application.schemaVersion).equals(SchemaInfo.VERSION);
    expect(application.notes).equals(installNotes);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);

    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    OpaDm.assertSystemStateIsNotNullish(callState.systemState);
    const configurationOriginal = OPA.convertNonNullish(callState.systemState).configuration;
    OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);
    const currentUser = OPA.convertNonNullish(callState.authorizationState).user;
    const currentLocale = OPA.convertNonNullish(callState.authorizationState).locale;
    await expect(Application.updateInstallationSettings(callState, undefined, undefined, undefined, undefined, undefined)).to.be.rejectedWith(Error);

    let configuration = await OpaDb.Configuration.queries.getByIdWithAssert(config.dataStorageState, OpaDm.ConfigurationId, "The Configuration does not exist.");

    expect(configuration.name[currentLocale.optionName]).equals(configurationOriginal.name[currentLocale.optionName]);
    expect(configuration.description[currentLocale.optionName]).equals(configurationOriginal.description[currentLocale.optionName]);
    expect(configuration.defaultLocaleId).equals(configurationOriginal.defaultLocaleId);
    expect(configuration.defaultTimeZoneGroupId).equals(configurationOriginal.defaultTimeZoneGroupId);
    expect(configuration.defaultTimeZoneId).equals(configurationOriginal.defaultTimeZoneId);
    expect(configuration.updateHistory.length).equals(1);
    expect((configuration.updateHistory[0] as OpaDm.IConfiguration).updateHistory).equals(undefined);
    expect(configuration.hasBeenUpdated).equals(false);
    expect(configuration.dateOfLatestUpdate).equals(null);
    expect(configuration.userIdOfLatestUpdater).equals(null);

    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const nameUpdated = configurationOriginal.name[currentLocale.optionName] + " UPDATED";
    await Application.updateInstallationSettings(callState, nameUpdated, undefined, undefined, undefined, undefined);

    configuration = await OpaDb.Configuration.queries.getByIdWithAssert(config.dataStorageState, OpaDm.ConfigurationId, "The Configuration does not exist.");

    expect(configuration.name[currentLocale.optionName]).equals(nameUpdated);
    expect(configuration.description[currentLocale.optionName]).equals(configurationOriginal.description[currentLocale.optionName]);
    expect(configuration.defaultLocaleId).equals(configurationOriginal.defaultLocaleId);
    expect(configuration.defaultTimeZoneGroupId).equals(configurationOriginal.defaultTimeZoneGroupId);
    expect(configuration.defaultTimeZoneId).equals(configurationOriginal.defaultTimeZoneId);
    expect(configuration.updateHistory.length).equals(2);
    expect(configuration.hasBeenUpdated).equals(true);
    expect(configuration.dateOfLatestUpdate).not.equals(null);
    expect(configuration.userIdOfLatestUpdater).equals(currentUser.id);

    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const descriptionUpdated = configurationOriginal.description[currentLocale.optionName] + " UPDATED";
    const defaultLocaleIdUpdated = (OpaDb.Locales.requiredDocuments.find((v) => !v.isDefault) as OpaDm.ILocale).id;
    await Application.updateInstallationSettings(callState, undefined, descriptionUpdated, defaultLocaleIdUpdated, undefined, undefined);

    configuration = await OpaDb.Configuration.queries.getByIdWithAssert(config.dataStorageState, OpaDm.ConfigurationId, "The Configuration does not exist.");

    expect(configuration.name[currentLocale.optionName]).equals(nameUpdated);
    expect(configuration.description[currentLocale.optionName]).equals(descriptionUpdated);
    expect(configuration.defaultLocaleId).equals(defaultLocaleIdUpdated);
    expect(configuration.defaultTimeZoneGroupId).equals(configurationOriginal.defaultTimeZoneGroupId);
    expect(configuration.defaultTimeZoneId).equals(configurationOriginal.defaultTimeZoneId);
    expect(configuration.updateHistory.length).equals(3);
    expect(configuration.hasBeenUpdated).equals(true);
    expect(configuration.dateOfLatestUpdate).not.equals(null);
    expect(configuration.userIdOfLatestUpdater).equals(currentUser.id);

    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const defaultTimeZoneGroupUpdated = (OpaDb.TimeZoneGroups.requiredDocuments.find((v) => !v.isDefault) as OpaDm.ITimeZoneGroup);
    const defaultTimeZoneGroupIdUpdated = defaultTimeZoneGroupUpdated.id;
    const defaultTimeZoneIdUpdated = defaultTimeZoneGroupUpdated.primaryTimeZoneId;
    await Application.updateInstallationSettings(callState, undefined, undefined, undefined, defaultTimeZoneGroupIdUpdated, defaultTimeZoneIdUpdated);

    configuration = await OpaDb.Configuration.queries.getByIdWithAssert(config.dataStorageState, OpaDm.ConfigurationId, "The Configuration does not exist.");

    expect(configuration.name[currentLocale.optionName]).equals(nameUpdated);
    expect(configuration.description[currentLocale.optionName]).equals(descriptionUpdated);
    expect(configuration.defaultLocaleId).equals(defaultLocaleIdUpdated);
    expect(configuration.defaultTimeZoneGroupId).equals(defaultTimeZoneGroupIdUpdated);
    expect(configuration.defaultTimeZoneId).equals(defaultTimeZoneIdUpdated);
    expect(configuration.updateHistory.length).equals(4);
    expect(configuration.hasBeenUpdated).equals(true);
    expect(configuration.dateOfLatestUpdate).not.equals(null);
    expect(configuration.userIdOfLatestUpdater).equals(currentUser.id);
  });

  // IMPORTANT: You must build the domainlogic package before running this test so that the PackageInfo.ts files contain the correct VERSION values
  test("checks that performUpgrade(...) works properly", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);

    await Application.performInstall(config.dataStorageState, config.authenticationState, TestUtils.InstallName, TestUtils.InstallDescription, TestUtils.InstallPath, TestUtils.InstallLocaleId, TestUtils.InstallTimeZoneGroupId, installNotes); // eslint-disable-line max-len
    let application = await OpaDb.Application.queries.getByIdWithAssert(config.dataStorageState, OpaDm.ApplicationId);
    expect(application.id).equals(OpaDm.ApplicationId);
    expect(application.applicationVersion).equals(ApplicationInfo.VERSION);
    expect(application.schemaVersion).equals(SchemaInfo.VERSION);
    expect(application.notes).equals(installNotes);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);

    // NOTE: Since the System version has not changed, this call should fail
    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    expect(Application.performUpgrade(callState, samegradeNotes)).to.be.rejectedWith(Error);
    application = await OpaDb.Application.queries.getByIdWithAssert(config.dataStorageState, OpaDm.ApplicationId, "The Application does not exist.");
    expect(application.id).equals(OpaDm.ApplicationId);
    expect(application.applicationVersion).equals(ApplicationInfo.VERSION);
    expect(application.schemaVersion).equals(SchemaInfo.VERSION);
    expect(application.notes).equals(installNotes);

    const oldVersion = "0.0.0.1";
    const oldDateOfInstallation = application.dateOfInstallation;
    const newApplicationVersion = application.applicationVersion;
    const newSchemaVersion = application.schemaVersion;

    // NOTE: We must downgrade initial version numbers to test upgrade works properly, but we cannot use updateApplication(...) to do downgrade, so we must update the server fields directly
    await expect(OpaDb.Application.queries.upgrade(config.dataStorageState, {applicationVersion: oldVersion, schemaVersion: oldVersion, notes: downgradeNotes}, OpaDm.User_OwnerId)).to.eventually.be.rejectedWith(Error); // eslint-disable-line max-len
    const applicationRef = OpaDb.Application.getTypedCollection(config.dataStorageState).doc(application.id);
    await applicationRef.update({applicationVersion: oldVersion, schemaVersion: oldVersion});
    application = await OpaDb.Application.queries.getByIdWithAssert(config.dataStorageState, OpaDm.ApplicationId, "The Application does not exist.");

    expect(application.applicationVersion).equals(oldVersion);
    expect(application.schemaVersion).equals(oldVersion);
    expect(application.upgradeHistory.length).equals(1);
    expect((application.upgradeHistory[0] as OpaDm.IApplication).upgradeHistory).equals(undefined);
    expect(application.dateOfInstallation.valueOf()).equals(oldDateOfInstallation.valueOf());
    expect(application.hasBeenUpgraded).equals(false);
    expect(application.dateOfLatestUpgrade).equals(null);
    expect(application.userIdOfLatestUpgrader).equals(null);

    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await Application.performUpgrade(callState, upgradeNotes);
    application = await OpaDb.Application.queries.getByIdWithAssert(config.dataStorageState, OpaDm.ApplicationId, "The Application does not exist.");
    expect(application.id).equals(OpaDm.ApplicationId);
    expect(application.applicationVersion).equals(ApplicationInfo.VERSION);
    expect(application.schemaVersion).equals(SchemaInfo.VERSION);
    expect(application.notes).equals(upgradeNotes);

    const authorizationState = OPA.convertNonNullish(callState.authorizationState);
    expect(application.applicationVersion).equals(newApplicationVersion);
    expect(application.schemaVersion).equals(newSchemaVersion);
    expect(application.upgradeHistory.length).equals(2);
    expect(application.dateOfInstallation.valueOf()).equals(oldDateOfInstallation.valueOf());
    expect(application.hasBeenUpgraded).equals(true);
    expect(application.dateOfLatestUpgrade).not.equals(null);
    expect(application.userIdOfLatestUpgrader).equals(authorizationState.user.id);
  });

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

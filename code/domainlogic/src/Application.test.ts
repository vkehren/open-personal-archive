import * as admin from "firebase-admin";
import {afterEach, beforeEach, describe, test} from "mocha";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {createSystem, OpaDbDescriptor as OpaDb} from "../../datamodel/src";
import * as Application from "./Application";
import * as Authorization from "./Authorization";
import * as SchemaConfig from "../../datamodel/package.json";
import * as ApplicationConfig from "../package.json";
import * as TestConfig from "../test-config.json";

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

describe("Tests using Firebase " + useEmulatorsText, function() {
  if (!OPA.isNullish(timeout)) {
    this.timeout(OPA.convertNonNullish(timeout)); // eslint-disable-line no-invalid-this
  }

  beforeEach(async () => {
    const doBackup = false && (isFirstTest && !useEmulators); // LATER: Once backup is implemented, delete "false && "
    isFirstTest = false;

    admin.initializeApp(initializeArgs);
    dataStorageState.db = admin.firestore();

    const isInstalled = await Application.isInstalled(dataStorageState);
    if (isInstalled) {
      const owner = await OpaDb.Users.queries.getById(dataStorageState.db, OpaDm.User_OwnerId);

      if (OPA.isNullish(owner)) {
        // NOTE: Passing a valid value for "authorizationState" only matters if the Archive Owner actually exists
        await Application.performUninstall(dataStorageState, authenticationState, null, doBackup);
      } else {
        const authorizationState = await Authorization.readAuthorizationState(dataStorageState, OPA.convertNonNullish(owner).firebaseAuthUserId);
        await Application.performUninstall(dataStorageState, authenticationState, authorizationState, doBackup);
      }
    }

    // LATER: Consider terminating DB, deleting App, and re-creating App
  });

  test("checks that isInstalled(...) works properly", async () => {
    let isInstalled = await Application.isInstalled(dataStorageState);
    expect(isInstalled).equals(false);

    const system = createSystem(ApplicationConfig.version, SchemaConfig.version);
    const systemCollectionRef = OpaDb.OpaSystem.getTypedCollection(dataStorageState.db);
    const systemDocumentRef = systemCollectionRef.doc(system.id);
    await systemDocumentRef.set(system, {merge: true});

    isInstalled = await Application.isInstalled(dataStorageState);
    expect(isInstalled).equals(true);
  });

  test("checks that performUninstall(...) works properly", async () => {
    let isInstalled = await Application.isInstalled(dataStorageState);
    expect(isInstalled).equals(false);

    let system = createSystem(ApplicationConfig.version, SchemaConfig.version);
    let systemCollectionRef = OpaDb.OpaSystem.getTypedCollection(dataStorageState.db);
    let systemDocumentRef = systemCollectionRef.doc(system.id);
    await systemDocumentRef.set(system, {merge: true});

    isInstalled = await Application.isInstalled(dataStorageState);
    expect(isInstalled).equals(true);

    // NOTE: Since no Archive Owner exists in the current data, the following call should complete successfully
    await Application.performUninstall(dataStorageState, authenticationState, null, false);

    isInstalled = await Application.isInstalled(dataStorageState);
    expect(isInstalled).equals(false);

    const systems = await OpaDb.OpaSystem.queries.getAll(dataStorageState.db);
    expect(systems.length).equals(0);
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

    system = createSystem(ApplicationConfig.version, SchemaConfig.version);
    systemCollectionRef = OpaDb.OpaSystem.getTypedCollection(dataStorageState.db);
    systemDocumentRef = systemCollectionRef.doc(system.id);
    await systemDocumentRef.set(system, {merge: true});

    const authProvider = OpaDb.AuthProviders.requiredDocuments[0];
    const authProviderCollectionRef = OpaDb.AuthProviders.getTypedCollection(dataStorageState.db);
    const authProviderDocumentRef = authProviderCollectionRef.doc(authProvider.id);
    await authProviderDocumentRef.set(system, {merge: true});

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

    const owner: OpaDm.IUser = {
      id: OpaDm.User_OwnerId,
      firebaseAuthUserId: ownerFirebaseAuthUserId,
      authProviderId: authProvider.id,
      authAccountName: "",
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
      dateOfCreation: OpaDm.now(),
      dateOfLatestUpdate: OpaDm.now(),
      approvalState: OpaDm.ApprovalStates.approved,
      userIdOfApprover: OpaDm.User_OwnerId,
      dateOfApproval: OpaDm.now(),
    };
    const userCollectionRef = OpaDb.Users.getTypedCollection(dataStorageState.db);
    const userDocumentRef = userCollectionRef.doc(owner.id);
    await userDocumentRef.set(owner, {merge: true});

    isInstalled = await Application.isInstalled(dataStorageState);
    expect(isInstalled).equals(true);

    const authorizationState = await Authorization.readAuthorizationState(dataStorageState, ownerFirebaseAuthUserId);
    // NOTE: Since an Archive Owner exists in the current data, the following call should throw an Error
    expect(Application.performUninstall(dataStorageState, authenticationState, null, false)).to.be.rejectedWith(Error);
    // NOTE: Since we pass the Archive Owner's Authorization State, the following call should complete successfully
    await Application.performUninstall(dataStorageState, authenticationState, authorizationState, false);

    isInstalled = await Application.isInstalled(dataStorageState);
    expect(isInstalled).equals(false);

    // NOTE: Since the System is no longer installed, this call should succeed
    await Application.performUninstall(dataStorageState, authenticationState, null, false);

    isInstalled = await Application.isInstalled(dataStorageState);
    expect(isInstalled).equals(false);

    // NOTE: Since the System is no longer installed, this call should also succeed
    await Application.performUninstall(dataStorageState, authenticationState, authorizationState, false);

    isInstalled = await Application.isInstalled(dataStorageState);
    expect(isInstalled).equals(false);
  });

  test("checks that performInstall(...) works properly", async () => {
    let isInstalled = await Application.isInstalled(dataStorageState);
    expect(isInstalled).equals(false);

    await Application.performInstall(dataStorageState, authenticationState, "Test Archive", "Archive for Mocha + Chai unit tests.", "./Test_Archive/files",
        "OPA_Locale_bn_IN", "OPA_TimeZoneGroup_IST_+05:30", "Fake", "Account");

    isInstalled = await Application.isInstalled(dataStorageState);
    expect(isInstalled).equals(true);

    // LATER: Extract these checks into a isCorrupted(...) function that checks install data is valid or not
    const systems = await OpaDb.OpaSystem.queries.getAll(dataStorageState.db);
    expect(systems.length).equals(1);
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

  afterEach(async () => {
    await dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

import * as admin from "firebase-admin";
import {afterEach, beforeEach, describe, test} from "mocha";
import {expect} from "chai";
import * as OPA from "../../base/src";
import {createSystem, OpaDbDescriptor as OpaDb} from "../../datamodel/src";
import * as Application from "./Application";
import * as SchemaConfig from "../../datamodel/package.json";
import * as ApplicationConfig from "../package.json";
import * as TestConfig from "../test-config.json";

const useEmulators = TestConfig.use_emulators;
const useEmulatorsText = (useEmulators ? "Emulators" : "Cloud");
let initializeArgs = {};

if (useEmulators) {
  const emulatorsConfig = TestConfig.test_emulators;
  OPA.setFirebaseToUseEmulators(emulatorsConfig.project_id, emulatorsConfig.auth_emu_host, emulatorsConfig.firestore_emu_host);
  initializeArgs = {projectId: emulatorsConfig.project_id_for_admin};
} else {
  const cloudConfig = TestConfig.test_cloud;
  OPA.setFirebaseToUseCloud(cloudConfig.path_to_credential);
  initializeArgs = {projectId: cloudConfig.project_id_for_admin};
}

const nullDb = ((null as unknown) as admin.firestore.Firestore);
let db = nullDb;
let isFirstTest = true;

describe("Tests using Firebase " + useEmulatorsText, function() {
  this.timeout(TestConfig.timeout); // eslint-disable-line no-invalid-this

  beforeEach(async () => {
    const doBackup = false && (isFirstTest && !useEmulators); // LATER: Once backup is implemented, delete "false && "
    isFirstTest = false;

    admin.initializeApp(initializeArgs);
    db = admin.firestore();
    await Application.performUninstall(db, doBackup);
    // LATER: Terminate and re-create DB
  });

  test("checks that isInstalled(...) works properly", async () => {
    let isInstalled = await Application.isInstalled(db);
    expect(isInstalled).equals(false);

    const system = createSystem(ApplicationConfig.version, SchemaConfig.version);
    const systemCollectionRef = OpaDb.OpaSystem.getTypedCollection(db);
    const systemDocumentRef = systemCollectionRef.doc(system.id);
    await systemDocumentRef.set(system, {merge: true});

    isInstalled = await Application.isInstalled(db);
    expect(isInstalled).equals(true);
  });

  test("checks that performUninstall(...) works properly", async () => {
    let isInstalled = await Application.isInstalled(db);
    expect(isInstalled).equals(false);

    const system = createSystem(ApplicationConfig.version, SchemaConfig.version);
    const systemCollectionRef = OpaDb.OpaSystem.getTypedCollection(db);
    const systemDocumentRef = systemCollectionRef.doc(system.id);
    await systemDocumentRef.set(system, {merge: true});

    isInstalled = await Application.isInstalled(db);
    expect(isInstalled).equals(true);

    await Application.performUninstall(db, false);

    isInstalled = await Application.isInstalled(db);
    expect(isInstalled).equals(false);
  });

  test("checks that performInstall(...) works properly", async () => {
    let isInstalled = await Application.isInstalled(db);
    expect(isInstalled).equals(false);

    await Application.performInstall(db, "Test Archive", "Archive for Mocha + Chai unit tests.", "./Test_Archive/files",
        "OPA_Locale_bn_IN", "OPA_TimeZoneGroup_IST_+05:30", "FAKE_UUID", "fake.account@gmail.com", "Fake", "Account");

    isInstalled = await Application.isInstalled(db);
    expect(isInstalled).equals(true);

    // LATER: Extract these checks into a isCorrupted(...) function that checks install data is valid or not
    const systems = await OpaDb.OpaSystem.getTypedCollection(db).listDocuments();
    expect(systems.length).equals(1);
    const authProviders = await OpaDb.AuthProviders.getTypedCollection(db).listDocuments();
    expect(authProviders.length).equals(OpaDb.AuthProviders.requiredDocuments.length).equals(1);
    const roles = await OpaDb.Roles.getTypedCollection(db).listDocuments();
    expect(roles.length).equals(OpaDb.Roles.requiredDocuments.length).equals(5);
    const locales = await OpaDb.Locales.getTypedCollection(db).listDocuments();
    expect(locales.length).equals(OpaDb.Locales.requiredDocuments.length).equals(53);
    const timeZoneGroups = await OpaDb.TimeZoneGroups.getTypedCollection(db).listDocuments();
    expect(timeZoneGroups.length).equals(OpaDb.TimeZoneGroups.requiredDocuments.length).equals(41);
    const timeZones = await OpaDb.TimeZones.getTypedCollection(db).listDocuments();
    expect(timeZones.length).equals(OpaDb.TimeZones.requiredDocuments.length).equals(41);
    const users = await OpaDb.Users.getTypedCollection(db).listDocuments();
    expect(users.length).equals(1);
    const archives = await OpaDb.Archive.getTypedCollection(db).listDocuments();
    expect(archives.length).equals(1);
  });

  afterEach(async () => {
    await db.terminate();
    await admin.app().delete();
  });
});

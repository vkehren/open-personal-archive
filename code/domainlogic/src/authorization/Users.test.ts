import * as admin from "firebase-admin";
import {afterEach, beforeEach, describe, test} from "mocha";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
import * as CSU from "../CallStateUtilities";
import * as Application from "../system/Application";
import * as Users from "./Users";
import * as TestConfiguration from "../TestConfiguration.test";

const config = TestConfiguration.getTestConfiguration();

describe("Tests using Firebase " + config.testEnvironment, function () {
  if (!OPA.isNullish(config.timeout)) {
    this.timeout(OPA.convertNonNullish(config.timeout)); // eslint-disable-line no-invalid-this
  }

  beforeEach(async () => {
    const doBackup = false && (config.hasRunTests && (config.testEnvironment != "Emulators")); // LATER: Once backup is implemented, delete "false && "
    config.hasRunTests = false;

    admin.initializeApp(config.appInitializationArgs);
    config.dataStorageState.db = admin.firestore();

    const isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    if (isSystemInstalled) {
      const owner = await OpaDb.Users.queries.getById(config.dataStorageState.db, OpaDm.User_OwnerId);

      if (OPA.isNullish(owner)) {
        // NOTE: Passing a valid value for "authorizationState" only matters if the Archive Owner actually exists
        await Application.performUninstall(config.dataStorageState, config.authenticationState, null, doBackup);
      } else {
        const authorizationState = await CSU.readAuthorizationStateForFirebaseAuthUser(config.dataStorageState, OPA.convertNonNullish(owner).firebaseAuthUserId);
        await Application.performUninstall(config.dataStorageState, config.authenticationState, authorizationState, doBackup);
      }
    }

    // LATER: Consider terminating DB, deleting App, and re-creating App
  });

  test("checks that initializeUserAccount(...) fails when System is not installed", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);
    let user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    // NOTE: Construct the CallState directly because calling the utility function to do so will fail
    const callState: OpaDm.ICallState = {
      dataStorageState: config.dataStorageState,
      authenticationState: config.authenticationState,
      hasSystemState: false,
      hasAuthorizationState: false,
    };

    await expect(Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email)).to.eventually.be.rejectedWith(Error);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);
  });

  test("checks that initializeUserAccount(...) fails when System is installed and User is Archive Owner", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);
    let user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    await Application.performInstall(config.dataStorageState, config.authenticationState, "Test Archive", "Archive for Mocha + Chai unit tests.", "./Test_Archive/files",
      "OPA_Locale_bn_IN", "OPA_TimeZoneGroup_IST_+05:30", "Fake", "Account");

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);

    const authProvider = await OpaDb.AuthProviders.queries.getByExternalAuthProviderId(config.dataStorageState.db, config.authenticationState.providerId);
    expect(authProvider).not.equals(null);

    // NOTE: Do NOT set the test AuthenticationState to a User other than the Archive Owner

    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);

    await expect(Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email)).to.eventually.be.rejectedWith(Error);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);
  });

  test("checks that initializeUserAccount(...) succeeds when System is installed and User is not Archive Owner", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);
    let user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    await Application.performInstall(config.dataStorageState, config.authenticationState, "Test Archive", "Archive for Mocha + Chai unit tests.", "./Test_Archive/files",
      "OPA_Locale_bn_IN", "OPA_TimeZoneGroup_IST_+05:30", "Fake", "Account");

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);

    const authProvider = await OpaDb.AuthProviders.queries.getByExternalAuthProviderId(config.dataStorageState.db, config.authenticationState.providerId);
    expect(authProvider).not.equals(null);
    const authProviderNonNull = OPA.convertNonNullish(authProvider);

    // NOTE: Set the test AuthenticationState to a User other than the Archive Owner
    config.authenticationState = {
      firebaseAuthUserId: "OPA_Test_User",
      providerId: authProviderNonNull.externalId,
      email: "OPA_Test_User" + "@gmail.com",
      emailIsVerified: true,
      firstName: "Test",
      lastName: "User",
      displayName: "T.U.",
    };
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    await Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);

    const userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
  });

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

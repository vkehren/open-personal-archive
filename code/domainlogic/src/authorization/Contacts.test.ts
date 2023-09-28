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
import * as Contacts from "./Contacts";
import {TestAuthData} from "../TestData.test";
import * as TestConfig from "../TestConfiguration.test";
import * as TestUtils from "../TestUtilities.test";

/* eslint-disable brace-style, camelcase */

const config = TestConfig.getTestConfiguration();
const testOrgName = "Fake Organization";
const testFirstName = "Fake";
const testLastName = "Guy";

describe("Contact Tests using Firebase " + config.testEnvironment, function() {
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

  const testFunc1 = () => (async () => {
    const isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, TestAuthData.owner);

    // NOTE: Construct the CallState directly because calling the utility function to do so will fail
    const callState: OpaDm.ICallState = {
      dataStorageState: config.dataStorageState,
      authenticationState: config.authenticationState,
      hasSystemState: false,
      hasAuthorizationState: false,
    };

    await expect(Contacts.createContact(callState, testOrgName, testFirstName, testLastName, null, null, null, null)).to.eventually.be.rejectedWith(Error);
  });
  test("checks that createContact(...) fails when System is not installed", testFunc1());

  const testFunc2 = () => (async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, TestAuthData.owner);

    await TestUtils.performInstallForTest(config.dataStorageState, config.authenticationState);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);
    await TestUtils.assertUserDoesExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.owner);

    const authProvider = await OpaDb.AuthProviders.queries.getByExternalAuthProviderId(config.dataStorageState, config.authenticationState.providerId);
    expect(authProvider).not.equals(null);

    // NOTE: Do NOT set the test AuthenticationState to a User other than the Archive Owner
    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.owner);

    await expect(Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email)).to.eventually.be.rejectedWith(Error);
    callState.dataStorageState.currentWriteBatch = null; // NOTE: This should be done in the outer try-catch-finally of the calling Firebase function
    await TestUtils.assertUserDoesExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.owner);

    config.authenticationState = TestAuthData.viewer;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await expect(Contacts.createContact(callState, testOrgName, testFirstName, testLastName, null, null, null, null)).to.eventually.be.rejectedWith(Error);
  });
  test("checks that createContact(...) fails when System is installed and User is not Authorizer", testFunc2());

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

import * as admin from "firebase-admin";
import * as firebase from "firebase/app";
import {getAuth, signInWithEmailAndPassword} from "firebase/auth";
import {afterEach, beforeEach, describe, test} from "mocha";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../datamodel/src";
import * as CSU from "./CallStateUtilities";
import * as FBU from "./FirebaseUtilities";
import * as Application from "./system/Application";
import {TestAuthData} from "./TestData.test";
import * as TestConfig from "./TestConfiguration.test";
import * as TestUtils from "./TestUtilities.test";

/* eslint-disable brace-style, camelcase */

const config = TestConfig.getTestConfiguration();
const firebaseAppConfig = {
  apiKey: "[REPLACE WITH FIREBASE VALUE]",
  authDomain: "[REPLACE WITH FIREBASE VALUE]",
  projectId: "[REPLACE WITH FIREBASE VALUE]",
  storageBucket: "[REPLACE WITH FIREBASE VALUE]",
  messagingSenderId: "[REPLACE WITH FIREBASE VALUE]",
  appId: "[REPLACE WITH FIREBASE VALUE]",
};
const firebaseAuthUserEmail = "[REPLACE WITH FIREBASE AUTH USER EMAIL]";
const firebaseAuthUserPassword = "[REPLACE WITH FIREBASE AUTH USER PASSWORD]";

describe("Firebase Auth Handler Tests using Firebase " + config.testEnvironment, function() {
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
    config.dataStorageState.currentWriteBatch = null;
    config.dataStorageState.currentBulkWriter = null;

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

  const testFunc1 = (treatUserAsDisabled: boolean, treatEmailAsVerified: boolean) => (async () => {
    const app = firebase.initializeApp(firebaseAppConfig);
    const auth = getAuth(app);

    const fbAuthUserCredential = await signInWithEmailAndPassword(auth, firebaseAuthUserEmail, firebaseAuthUserPassword);
    const fbAuthUser = fbAuthUserCredential.user;
    const fbAuthProviderData = fbAuthUser.providerData[0];
    const userData: OPA.IFirebaseAuthUserData = {
      authType: OPA.FirebaseAuthTypes.user,
      uid: fbAuthUser.uid,
      providerId: (fbAuthProviderData.providerId as OPA.FirebaseProviderType),
      email: OPA.convertNonNullish(fbAuthUser.email),
      emailVerified: treatEmailAsVerified,
      isAnonymous: fbAuthUser.isAnonymous,
      displayName: (!OPA.isNullishOrWhitespace(fbAuthUser.displayName)) ? OPA.convertNonNullish(fbAuthUser.displayName) : undefined,
      username: undefined,
      phoneNumber: (!OPA.isNullishOrWhitespace(fbAuthUser.phoneNumber)) ? OPA.convertNonNullish(fbAuthUser.phoneNumber) : undefined,
      disabled: treatUserAsDisabled,
      isNewUser: undefined,
      locale: undefined,
      ipAddress: "[TEST]",
      timestamp: OPA.nowToUse().toString(),
    };

    const opaUser = await FBU.authenticationEventHandlerForFirebaseAuth(config.dataStorageState, userData);
    expect(OPA.isNullish(opaUser)).equals(true);
  });
  test("checks that authenticationEventHandlerForFirebaseAuth(...) fails when System is not installed ", testFunc1(false, false));
  test("checks that authenticationEventHandlerForFirebaseAuth(...) fails when System is not installed ", testFunc1(false, true));
  test("checks that authenticationEventHandlerForFirebaseAuth(...) fails when System is not installed ", testFunc1(true, false));
  test("checks that authenticationEventHandlerForFirebaseAuth(...) fails when System is not installed ", testFunc1(true, true));

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

    const app = firebase.initializeApp(firebaseAppConfig);
    const auth = getAuth(app);

    const fbAuthUserCredential = await signInWithEmailAndPassword(auth, firebaseAuthUserEmail, firebaseAuthUserPassword);
    const fbAuthUser = fbAuthUserCredential.user;
    const fbAuthProviderData = fbAuthUser.providerData[0];
    const userData: OPA.IFirebaseAuthUserData = {
      authType: OPA.FirebaseAuthTypes.user,
      uid: fbAuthUser.uid,
      providerId: (fbAuthProviderData.providerId as OPA.FirebaseProviderType),
      email: OPA.convertNonNullish(fbAuthUser.email),
      emailVerified: fbAuthUser.emailVerified,
      isAnonymous: fbAuthUser.isAnonymous,
      displayName: (!OPA.isNullishOrWhitespace(fbAuthUser.displayName)) ? OPA.convertNonNullish(fbAuthUser.displayName) : undefined,
      username: undefined,
      phoneNumber: (!OPA.isNullishOrWhitespace(fbAuthUser.phoneNumber)) ? OPA.convertNonNullish(fbAuthUser.phoneNumber) : undefined,
      disabled: true,
      isNewUser: undefined,
      locale: undefined,
      ipAddress: "[TEST]",
      timestamp: OPA.nowToUse().toString(),
    };

    // NOTE: Because authenticationEventHandlerForFirebaseAuth(...) may have already run for a "beforeUserSignedIn" listener in functions package, the User may have already been created
    const opaUser = await FBU.authenticationEventHandlerForFirebaseAuth(config.dataStorageState, userData);
    if (!OPA.isNullish(opaUser)) {
      const opaUserNonNull = OPA.convertNonNullish(opaUser);
      // NOTE: Either the User will not exist, or if it already exists, it will have been changed to suspended
      expect(opaUserNonNull.isSuspended).equals(true);
    }
  });
  test("checks that authenticationEventHandlerForFirebaseAuth(...) fails when System is installed and Auth User is disabled ", testFunc2());

  const testFunc3 = () => (async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, TestAuthData.owner);

    await TestUtils.performInstallForTest(config.dataStorageState, config.authenticationState);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);
    await TestUtils.assertUserDoesExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.owner);

    const app = firebase.initializeApp(firebaseAppConfig);
    const auth = getAuth(app);

    const fbAuthUserCredential = await signInWithEmailAndPassword(auth, firebaseAuthUserEmail, firebaseAuthUserPassword);
    const fbAuthUser = fbAuthUserCredential.user;
    const fbAuthProviderData = fbAuthUser.providerData[0];
    const userData: OPA.IFirebaseAuthUserData = {
      authType: OPA.FirebaseAuthTypes.user,
      uid: fbAuthUser.uid,
      providerId: (fbAuthProviderData.providerId as OPA.FirebaseProviderType),
      email: OPA.convertNonNullish(fbAuthUser.email),
      emailVerified: fbAuthUser.emailVerified,
      isAnonymous: fbAuthUser.isAnonymous,
      displayName: (!OPA.isNullishOrWhitespace(fbAuthUser.displayName)) ? OPA.convertNonNullish(fbAuthUser.displayName) : undefined,
      username: undefined,
      phoneNumber: (!OPA.isNullishOrWhitespace(fbAuthUser.phoneNumber)) ? OPA.convertNonNullish(fbAuthUser.phoneNumber) : undefined,
      disabled: false,
      isNewUser: undefined,
      locale: undefined,
      ipAddress: "[TEST]",
      timestamp: OPA.nowToUse().toString(),
    };

    const opaUser = await FBU.authenticationEventHandlerForFirebaseAuth(config.dataStorageState, userData);
    expect(OPA.isNullish(opaUser)).equals(false);

    const opaUserId = (OPA.convertNonNullish(opaUser)).id;
    const opaUserNonNull = await OpaDb.Users.queries.getByIdWithAssert(config.dataStorageState, opaUserId);
    expect(opaUserNonNull.isSuspended).equals(false);
  });
  test("checks that authenticationEventHandlerForFirebaseAuth(...) succeeds when System is installed and Auth User not disabled ", testFunc3());

  // LATER: Add another test for Google Auth if a workaround for Node not being a supported environment can be found
  //   const provider = new GoogleAuthProvider();
  //   const result = await signInWithPopup(auth, provider);
  //   const credential = GoogleAuthProvider.credentialFromResult(result);

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

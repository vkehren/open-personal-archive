import * as firestore from "@google-cloud/firestore";
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
import {TestAuthData} from "../TestData.test";
import * as TestConfig from "../TestConfiguration.test";
import * as TestUtils from "../TestUtilities.test";

/* eslint-disable brace-style, camelcase */

const config = TestConfig.getTestConfiguration();
const ambientAuth = (): TestConfig.IAuthenticationStateForTests => (config.authenticationState);
const ambientUserId = (): string => (ambientAuth().opaUserId);
const ownerId = (): string => (TestAuthData.owner.opaUserId);
const adminId = (): string => (TestAuthData.admin.opaUserId);
const editorId = (): string => (TestAuthData.editor.opaUserId);
const viewerId = (): string => (TestAuthData.viewer.opaUserId);
const guestId = (): string => (TestAuthData.guest.opaUserId);
const testUserId = (): string => (TestAuthData.testUser.opaUserId);
const testCitationId1 = "THIS_CITATION_DOES_NOT_ACTUALLY_EXIST_1";
const testCitationId2 = "THIS_CITATION_DOES_NOT_ACTUALLY_EXIST_2";
const testString_Hello = "Hello";
const testString_World = "World";
const testString_EXCLAIM = "!";
const testStartReason = "START reason";
const testEndReason = "END reason";

describe("Tests using Firebase " + config.testEnvironment, function() {
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

    await expect(Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email)).to.eventually.be.rejectedWith(Error);
    callState.dataStorageState.currentWriteBatch = null; // NOTE: This should be done in the outer try-catch-finally of the calling Firebase function
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, TestAuthData.owner);
  });
  test("checks that initializeUserAccount(...) fails when System is not installed", testFunc1());

  const testFunc2 = (functionType: TestConfig.TestFunctionType) => (async () => {
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
    const authProviderNonNull = OPA.convertNonNullish(authProvider);

    // NOTE: Do NOT set the test AuthenticationState to a User other than the Archive Owner
    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.owner);

    await expect(Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email)).to.eventually.be.rejectedWith(Error);
    callState.dataStorageState.currentWriteBatch = null; // NOTE: This should be done in the outer try-catch-finally of the calling Firebase function
    await TestUtils.assertUserDoesExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.owner);

    // NOTE: Since the Test User is also the Owner, record that fact
    TestAuthData.testUser = TestAuthData.owner;
    let user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(TestAuthData.owner.firstName);
    expect(user.lastName).equals(TestAuthData.owner.lastName);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(1);
    expect((user.updateHistory[0] as OpaDm.IUser).updateHistory).equals(undefined);
    expect(user.hasBeenUpdated).equals(false);
    expect(user.dateOfLatestUpdate).equals(null);
    expect(user.userIdOfLatestUpdater).equals(null);
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    const invalidUpdateObject = (({updateHistory: "BLANK"} as unknown) as OpaDm.IUserPartial);
    await expect(OpaDb.Users.queries.update(config.dataStorageState, testUserId(), invalidUpdateObject, ambientUserId())).to.eventually.be.rejectedWith(Error);
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(TestAuthData.owner.firstName);
    expect(user.lastName).equals(TestAuthData.owner.lastName);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(1);
    expect((user.updateHistory[0] as OpaDm.IUser).updateHistory).equals(undefined);
    expect(user.hasBeenUpdated).equals(false);
    expect(user.dateOfLatestUpdate).equals(null);
    expect(user.userIdOfLatestUpdater).equals(null);
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const firstName_Updated = (user.firstName + " UPDATED");
    let userUpdateObject = ({firstName: firstName_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(TestAuthData.owner.lastName);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(2);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const lastName_Updated = (user.lastName + " UPDATED");
    userUpdateObject = ({lastName: lastName_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(3);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let recentQueries_Updated = ([testString_Hello] as Array<string> | firestore.FieldValue);
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.recentQueries.length).equals(1);
    expect(user.updateHistory.length).equals(4);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    recentQueries_Updated = config.dataStorageState.constructorProvider.arrayUnion(testString_World, testString_EXCLAIM);
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.recentQueries.length).equals(3);
    expect(user.updateHistory.length).equals(5);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    recentQueries_Updated = config.dataStorageState.constructorProvider.arrayRemove(testString_Hello, testString_EXCLAIM);
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.recentQueries.length).equals(1);
    expect(user.updateHistory.length).equals(6);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    recentQueries_Updated = [];
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(7);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const roleToAssign = await OpaDb.Roles.queries.getByIdWithAssert(config.dataStorageState, OpaDm.Role_ViewerId);
    if (functionType == "logic") {await expect(Users.assignUserToRole(callState, testUserId(), roleToAssign.id)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.assignToRole(config.dataStorageState, testUserId(), roleToAssign, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(7);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToViewed(callState, testUserId())).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToViewed(config.dataStorageState, testUserId(), ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(7);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToDenied(callState, testUserId())).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToDecidedOption(config.dataStorageState, testUserId(), OPA.ApprovalStates.denied, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(7);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToApproved(callState, testUserId())).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToDecidedOption(config.dataStorageState, testUserId(), OPA.ApprovalStates.approved, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(7);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToSuspended(callState, testUserId(), testStartReason)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToSuspensionState(config.dataStorageState, testUserId(), OPA.SuspensionStates.suspended, testStartReason, ambientUserId())).to.eventually.be.rejectedWith(Error);} // eslint-disable-line max-len
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(7);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToUnSuspended(callState, testUserId(), testEndReason)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToSuspensionState(config.dataStorageState, testUserId(), OPA.SuspensionStates.unsuspended, testEndReason, ambientUserId())).to.eventually.be.rejectedWith(Error);} // eslint-disable-line max-len
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(7);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.markUserAsDeleted(callState, testUserId())).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.markWithDeletionState(config.dataStorageState, testUserId(), OPA.DeletionStates.deleted, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(7);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.markUserAsDeleted(callState, testUserId())).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.markWithDeletionState(config.dataStorageState, testUserId(), OPA.DeletionStates.deleted, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.owner.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.owner.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(7);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(testUserId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);
  });
  test("checks that initializeUserAccount(...) fails but some User updates succeed when System is installed and User is Archive Owner", testFunc2("query"));
  test("checks that initializeUserAccount(...) fails but some User updates succeed when System is installed and User is Archive Owner", testFunc2("logic"));

  const testFunc3 = (functionType: TestConfig.TestFunctionType) => (async () => {
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
    const authProviderNonNull = OPA.convertNonNullish(authProvider);

    // NOTE: Set the ambient AuthenticationState to a User other than the Archive Owner
    config.authenticationState = TestAuthData.testUser;
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, TestAuthData.testUser);

    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, TestAuthData.testUser);

    await Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email);
    await TestUtils.assertUserDoesExist(config.dataStorageState, config.authenticationState);
    let user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    // NOTE: Since the TestUser is newly created, record the userId
    TestAuthData.testUser.opaUserId = user.id;

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(user.firstName).equals(TestAuthData.testUser.firstName);
    expect(user.lastName).equals(TestAuthData.testUser.lastName);
    expect(user.requestedCitationIds.length).equals(0);
    expect(user.viewableCitationIds.length).equals(0);
    expect(user.dateOfLatestCitationChange).equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(null);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(1);
    expect((user.updateHistory[0] as OpaDm.IUser).updateHistory).equals(undefined);
    expect(user.hasBeenUpdated).equals(false);
    expect(user.dateOfLatestUpdate).equals(null);
    expect(user.userIdOfLatestUpdater).equals(null);
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(false);
    expect(user.dateOfLatestViewing).equals(null);
    expect(user.userIdOfLatestViewer).equals(null);
    expect(user.hasBeenDecided).equals(false);
    expect(user.approvalState).equals(OPA.ApprovalStates.pending);
    expect(user.dateOfDecision).equals(null);
    expect(user.userIdOfDecider).equals(null);
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    const invalidUpdateObject = (({updateHistory: "BLANK"} as unknown) as OpaDm.IUserPartial);
    await expect(OpaDb.Users.queries.update(config.dataStorageState, testUserId(), invalidUpdateObject, ambientUserId())).to.eventually.be.rejectedWith(Error);
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(user.firstName).equals(TestAuthData.testUser.firstName);
    expect(user.lastName).equals(TestAuthData.testUser.lastName);
    expect(user.requestedCitationIds.length).equals(0);
    expect(user.viewableCitationIds.length).equals(0);
    expect(user.dateOfLatestCitationChange).equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(null);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(1);
    expect((user.updateHistory[0] as OpaDm.IUser).updateHistory).equals(undefined);
    expect(user.hasBeenUpdated).equals(false);
    expect(user.dateOfLatestUpdate).equals(null);
    expect(user.userIdOfLatestUpdater).equals(null);
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(false);
    expect(user.dateOfLatestViewing).equals(null);
    expect(user.userIdOfLatestViewer).equals(null);
    expect(user.hasBeenDecided).equals(false);
    expect(user.approvalState).equals(OPA.ApprovalStates.pending);
    expect(user.dateOfDecision).equals(null);
    expect(user.userIdOfDecider).equals(null);
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.setUserToViewed(callState, testUserId());}
    else {await OpaDb.Users.queries.setToViewed(config.dataStorageState, testUserId(), ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(user.firstName).equals(TestAuthData.testUser.firstName);
    expect(user.lastName).equals(TestAuthData.testUser.lastName);
    expect(user.requestedCitationIds.length).equals(0);
    expect(user.viewableCitationIds.length).equals(0);
    expect(user.dateOfLatestCitationChange).equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(null);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(2);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(ownerId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(false);
    expect(user.approvalState).equals(OPA.ApprovalStates.pending);
    expect(user.dateOfDecision).equals(null);
    expect(user.userIdOfDecider).equals(null);
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.setUserToDenied(callState, testUserId());}
    else {await OpaDb.Users.queries.setToDecidedOption(config.dataStorageState, testUserId(), OPA.ApprovalStates.denied, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(user.firstName).equals(TestAuthData.testUser.firstName);
    expect(user.lastName).equals(TestAuthData.testUser.lastName);
    expect(user.requestedCitationIds.length).equals(0);
    expect(user.viewableCitationIds.length).equals(0);
    expect(user.dateOfLatestCitationChange).equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(null);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(3);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(ownerId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.denied);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.setUserToApprovalState(callState, testUserId(), OPA.ApprovalStates.approved);}
    else {await OpaDb.Users.queries.setToDecidedOption(config.dataStorageState, testUserId(), OPA.ApprovalStates.approved, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(user.firstName).equals(TestAuthData.testUser.firstName);
    expect(user.lastName).equals(TestAuthData.testUser.lastName);
    expect(user.requestedCitationIds.length).equals(0);
    expect(user.viewableCitationIds.length).equals(0);
    expect(user.dateOfLatestCitationChange).equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(null);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(4);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(ownerId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const firstName_Updated = (user.firstName + " UPDATED");
    let userUpdateObject = ({firstName: firstName_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(TestAuthData.testUser.lastName);
    expect(user.requestedCitationIds.length).equals(0);
    expect(user.viewableCitationIds.length).equals(0);
    expect(user.dateOfLatestCitationChange).equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(null);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(5);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const lastName_Updated = (user.lastName + " UPDATED");
    userUpdateObject = ({lastName: lastName_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(0);
    expect(user.viewableCitationIds.length).equals(0);
    expect(user.dateOfLatestCitationChange).equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(null);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(6);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let recentQueries_Updated = ([testString_Hello] as Array<string> | firestore.FieldValue);
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(0);
    expect(user.viewableCitationIds.length).equals(0);
    expect(user.dateOfLatestCitationChange).equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(null);
    expect(user.recentQueries.length).equals(1);
    expect(user.updateHistory.length).equals(7);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    recentQueries_Updated = config.dataStorageState.constructorProvider.arrayUnion(testString_World, testString_EXCLAIM);
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(0);
    expect(user.viewableCitationIds.length).equals(0);
    expect(user.dateOfLatestCitationChange).equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(null);
    expect(user.recentQueries.length).equals(3);
    expect(user.updateHistory.length).equals(8);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    recentQueries_Updated = config.dataStorageState.constructorProvider.arrayRemove(testString_Hello, testString_EXCLAIM);
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(0);
    expect(user.viewableCitationIds.length).equals(0);
    expect(user.dateOfLatestCitationChange).equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(null);
    expect(user.recentQueries.length).equals(1);
    expect(user.updateHistory.length).equals(9);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    recentQueries_Updated = [];
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(0);
    expect(user.viewableCitationIds.length).equals(0);
    expect(user.dateOfLatestCitationChange).equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(null);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(10);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const roleToAssign = await OpaDb.Roles.queries.getByIdWithAssert(config.dataStorageState, OpaDm.Role_ViewerId);
    OPA.assertIsFalse(OpaDm.DefaultRoleId == roleToAssign.id);
    if (functionType == "logic") {await expect(Users.assignUserToRole(callState, testUserId(), roleToAssign.id)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.assignToRole(config.dataStorageState, testUserId(), roleToAssign, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(0);
    expect(user.viewableCitationIds.length).equals(0);
    expect(user.dateOfLatestCitationChange).equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(null);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(10);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(null);
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.assignUserToRole(callState, testUserId(), roleToAssign.id);}
    else {await OpaDb.Users.queries.assignToRole(config.dataStorageState, testUserId(), roleToAssign, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(0);
    expect(user.viewableCitationIds.length).equals(0);
    expect(user.dateOfLatestCitationChange).equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(null);
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(11);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(ownerId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.addRequestedCitationToUser(callState, testUserId(), testCitationId1)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.addRequestedCitation(config.dataStorageState, testUserId(), testCitationId1, ambientUserId())).to.eventually.be.rejectedWith(Error);}

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.addRequestedCitationToUser(callState, testUserId(), testCitationId1);}
    else {await OpaDb.Users.queries.addRequestedCitation(config.dataStorageState, testUserId(), testCitationId1, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(1);
    expect(user.viewableCitationIds.length).equals(0);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(testUserId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(12);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.addRequestedCitationToUser(callState, testUserId(), testCitationId2)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.addRequestedCitation(config.dataStorageState, testUserId(), testCitationId2, ambientUserId())).to.eventually.be.rejectedWith(Error);}

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.addRequestedCitationToUser(callState, testUserId(), testCitationId2);}
    else {await OpaDb.Users.queries.addRequestedCitation(config.dataStorageState, testUserId(), testCitationId2, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(0);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(testUserId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(13);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.addViewableCitationToUser(callState, testUserId(), testCitationId1)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.addViewableCitation(config.dataStorageState, testUserId(), testCitationId1, ambientUserId())).to.eventually.be.rejectedWith(Error);}

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.addViewableCitationToUser(callState, testUserId(), testCitationId1);}
    else {await OpaDb.Users.queries.addViewableCitation(config.dataStorageState, testUserId(), testCitationId1, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(1);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(ownerId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(14);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(ownerId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.addViewableCitationToUser(callState, testUserId(), testCitationId2)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.addViewableCitation(config.dataStorageState, testUserId(), testCitationId2, ambientUserId())).to.eventually.be.rejectedWith(Error);}

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.addViewableCitationToUser(callState, testUserId(), testCitationId2);}
    else {await OpaDb.Users.queries.addViewableCitation(config.dataStorageState, testUserId(), testCitationId2, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(2);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(ownerId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(15);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(ownerId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToSuspended(callState, testUserId(), testStartReason)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToSuspensionState(config.dataStorageState, testUserId(), OPA.SuspensionStates.suspended, testStartReason, ambientUserId())).to.eventually.be.rejectedWith(Error);} // eslint-disable-line max-len
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(2);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(ownerId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(15);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(ownerId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(0);
    expect(user.hasSuspensionStarted).equals(false);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(null);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(null);
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.setUserToSuspended(callState, testUserId(), testStartReason);}
    else {await OpaDb.Users.queries.setToSuspensionState(config.dataStorageState, testUserId(), OPA.SuspensionStates.suspended, testStartReason, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(2);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(ownerId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(16);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(ownerId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(true);
    expect(user.isSuspended).equals(true);
    expect(user.numberOfTimesSuspended).equals(1);
    expect(user.hasSuspensionStarted).equals(true);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(testStartReason);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).not.equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(ownerId());
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToSuspended(callState, testUserId(), testStartReason)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToSuspensionState(config.dataStorageState, testUserId(), OPA.SuspensionStates.suspended, testStartReason, ambientUserId())).to.eventually.be.rejectedWith(Error);} // eslint-disable-line max-len
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(2);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(ownerId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(16);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(ownerId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(true);
    expect(user.isSuspended).equals(true);
    expect(user.numberOfTimesSuspended).equals(1);
    expect(user.hasSuspensionStarted).equals(true);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(testStartReason);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).not.equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(ownerId());
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToUnSuspended(callState, testUserId(), testEndReason)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToSuspensionState(config.dataStorageState, testUserId(), OPA.SuspensionStates.unsuspended, testEndReason, ambientUserId())).to.eventually.be.rejectedWith(Error);} // eslint-disable-line max-len
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(2);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(ownerId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(16);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(ownerId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(true);
    expect(user.isSuspended).equals(true);
    expect(user.numberOfTimesSuspended).equals(1);
    expect(user.hasSuspensionStarted).equals(true);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(testStartReason);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).not.equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(ownerId());
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.setUserToUnSuspended(callState, testUserId(), testEndReason);}
    else {await OpaDb.Users.queries.setToSuspensionState(config.dataStorageState, testUserId(), OPA.SuspensionStates.unsuspended, testEndReason, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(2);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(ownerId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(17);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(ownerId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(1);
    expect(user.hasSuspensionStarted).equals(true);
    expect(user.hasSuspensionEnded).equals(true);
    expect(user.reasonForSuspensionStart).equals(testStartReason);
    expect(user.reasonForSuspensionEnd).equals(testEndReason);
    expect(user.dateOfSuspensionStart).not.equals(null);
    expect(user.dateOfSuspensionEnd).not.equals(null);
    expect(user.userIdOfSuspensionStarter).equals(ownerId());
    expect(user.userIdOfSuspensionEnder).equals(ownerId());
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToUnSuspended(callState, testUserId(), testEndReason)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToSuspensionState(config.dataStorageState, testUserId(), OPA.SuspensionStates.unsuspended, testEndReason, ambientUserId())).to.eventually.be.rejectedWith(Error);} // eslint-disable-line max-len
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(2);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(ownerId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(17);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(ownerId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(1);
    expect(user.hasSuspensionStarted).equals(true);
    expect(user.hasSuspensionEnded).equals(true);
    expect(user.reasonForSuspensionStart).equals(testStartReason);
    expect(user.reasonForSuspensionEnd).equals(testEndReason);
    expect(user.dateOfSuspensionStart).not.equals(null);
    expect(user.dateOfSuspensionEnd).not.equals(null);
    expect(user.userIdOfSuspensionStarter).equals(ownerId());
    expect(user.userIdOfSuspensionEnder).equals(ownerId());
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.setUserToSuspended(callState, testUserId(), testStartReason);}
    else {await OpaDb.Users.queries.setToSuspensionState(config.dataStorageState, testUserId(), OPA.SuspensionStates.suspended, testStartReason, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(2);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(ownerId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(18);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(ownerId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(true);
    expect(user.isSuspended).equals(true);
    expect(user.numberOfTimesSuspended).equals(2);
    expect(user.hasSuspensionStarted).equals(true);
    expect(user.hasSuspensionEnded).equals(false);
    expect(user.reasonForSuspensionStart).equals(testStartReason);
    expect(user.reasonForSuspensionEnd).equals(null);
    expect(user.dateOfSuspensionStart).not.equals(null);
    expect(user.dateOfSuspensionEnd).equals(null);
    expect(user.userIdOfSuspensionStarter).equals(ownerId());
    expect(user.userIdOfSuspensionEnder).equals(null);
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.setUserToUnSuspended(callState, testUserId(), testEndReason);}
    else {await OpaDb.Users.queries.setToSuspensionState(config.dataStorageState, testUserId(), OPA.SuspensionStates.unsuspended, testEndReason, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(2);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(ownerId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(19);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(ownerId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(2);
    expect(user.hasSuspensionStarted).equals(true);
    expect(user.hasSuspensionEnded).equals(true);
    expect(user.reasonForSuspensionStart).equals(testStartReason);
    expect(user.reasonForSuspensionEnd).equals(testEndReason);
    expect(user.dateOfSuspensionStart).not.equals(null);
    expect(user.dateOfSuspensionEnd).not.equals(null);
    expect(user.userIdOfSuspensionStarter).equals(ownerId());
    expect(user.userIdOfSuspensionEnder).equals(ownerId());
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.markUserAsDeleted(callState, testUserId())).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.markWithDeletionState(config.dataStorageState, testUserId(), OPA.DeletionStates.deleted, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(2);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(ownerId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(19);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(ownerId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(2);
    expect(user.hasSuspensionStarted).equals(true);
    expect(user.hasSuspensionEnded).equals(true);
    expect(user.reasonForSuspensionStart).equals(testStartReason);
    expect(user.reasonForSuspensionEnd).equals(testEndReason);
    expect(user.dateOfSuspensionStart).not.equals(null);
    expect(user.dateOfSuspensionEnd).not.equals(null);
    expect(user.userIdOfSuspensionStarter).equals(ownerId());
    expect(user.userIdOfSuspensionEnder).equals(ownerId());
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).equals(null);
    expect(user.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.markUserAsDeleted(callState, testUserId());}
    else {await OpaDb.Users.queries.markWithDeletionState(config.dataStorageState, testUserId(), OPA.DeletionStates.deleted, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(2);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(ownerId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(20);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(2);
    expect(user.hasSuspensionStarted).equals(true);
    expect(user.hasSuspensionEnded).equals(true);
    expect(user.reasonForSuspensionStart).equals(testStartReason);
    expect(user.reasonForSuspensionEnd).equals(testEndReason);
    expect(user.dateOfSuspensionStart).not.equals(null);
    expect(user.dateOfSuspensionEnd).not.equals(null);
    expect(user.userIdOfSuspensionStarter).equals(ownerId());
    expect(user.userIdOfSuspensionEnder).equals(ownerId());
    expect(user.isMarkedAsDeleted).equals(true);
    expect(user.dateOfDeletionChange).not.equals(null);
    expect(user.userIdOfDeletionChanger).equals(testUserId());

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.markUserAsUnDeleted(callState, testUserId());}
    else {await OpaDb.Users.queries.markWithDeletionState(config.dataStorageState, testUserId(), OPA.DeletionStates.undeleted, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(2);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(ownerId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(21);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(2);
    expect(user.hasSuspensionStarted).equals(true);
    expect(user.hasSuspensionEnded).equals(true);
    expect(user.reasonForSuspensionStart).equals(testStartReason);
    expect(user.reasonForSuspensionEnd).equals(testEndReason);
    expect(user.dateOfSuspensionStart).not.equals(null);
    expect(user.dateOfSuspensionEnd).not.equals(null);
    expect(user.userIdOfSuspensionStarter).equals(ownerId());
    expect(user.userIdOfSuspensionEnder).equals(ownerId());
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).not.equals(null);
    expect(user.userIdOfDeletionChanger).equals(testUserId());

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.markUserAsDeleted(callState, testUserId());}
    else {await OpaDb.Users.queries.markWithDeletionState(config.dataStorageState, testUserId(), OPA.DeletionStates.deleted, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(2);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(ownerId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(22);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(2);
    expect(user.hasSuspensionStarted).equals(true);
    expect(user.hasSuspensionEnded).equals(true);
    expect(user.reasonForSuspensionStart).equals(testStartReason);
    expect(user.reasonForSuspensionEnd).equals(testEndReason);
    expect(user.dateOfSuspensionStart).not.equals(null);
    expect(user.dateOfSuspensionEnd).not.equals(null);
    expect(user.userIdOfSuspensionStarter).equals(ownerId());
    expect(user.userIdOfSuspensionEnder).equals(ownerId());
    expect(user.isMarkedAsDeleted).equals(true);
    expect(user.dateOfDeletionChange).not.equals(null);
    expect(user.userIdOfDeletionChanger).equals(testUserId());

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.markUserAsUnDeleted(callState, testUserId());}
    else {await OpaDb.Users.queries.markWithDeletionState(config.dataStorageState, testUserId(), OPA.DeletionStates.undeleted, ambientUserId());}
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    expect(user.id).equals(TestAuthData.testUser.opaUserId);
    expect(user.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(user.authProviderId).equals(authProviderNonNull.id);
    expect(user.authAccountName).equals(TestAuthData.testUser.email);
    expect(user.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(user.assignedRoleId).equals(roleToAssign.id);
    expect(user.firstName).equals(firstName_Updated);
    expect(user.lastName).equals(lastName_Updated);
    expect(user.requestedCitationIds.length).equals(2);
    expect(user.viewableCitationIds.length).equals(2);
    expect(user.dateOfLatestCitationChange).not.equals(null);
    expect(user.userIdOfLatestCitationChanger).equals(ownerId());
    expect(user.recentQueries.length).equals(0);
    expect(user.updateHistory.length).equals(23);
    expect(user.hasBeenUpdated).equals(true);
    expect(user.dateOfLatestUpdate).not.equals(null);
    expect(user.userIdOfLatestUpdater).equals(testUserId());
    expect(user.dateOfLatestRoleAssignment).not.equals(null);
    expect(user.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(user.hasBeenViewed).equals(true);
    expect(user.dateOfLatestViewing).not.equals(null);
    expect(user.userIdOfLatestViewer).equals(ownerId());
    expect(user.hasBeenDecided).equals(true);
    expect(user.approvalState).equals(OPA.ApprovalStates.approved);
    expect(user.dateOfDecision).not.equals(null);
    expect(user.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(user)).equals(false);
    expect(user.isSuspended).equals(false);
    expect(user.numberOfTimesSuspended).equals(2);
    expect(user.hasSuspensionStarted).equals(true);
    expect(user.hasSuspensionEnded).equals(true);
    expect(user.reasonForSuspensionStart).equals(testStartReason);
    expect(user.reasonForSuspensionEnd).equals(testEndReason);
    expect(user.dateOfSuspensionStart).not.equals(null);
    expect(user.dateOfSuspensionEnd).not.equals(null);
    expect(user.userIdOfSuspensionStarter).equals(ownerId());
    expect(user.userIdOfSuspensionEnder).equals(ownerId());
    expect(user.isMarkedAsDeleted).equals(false);
    expect(user.dateOfDeletionChange).not.equals(null);
    expect(user.userIdOfDeletionChanger).equals(testUserId());
  });
  test("checks that initializeUserAccount(...) succeeds and User updates succeed when System is installed and User is not Archive Owner", testFunc3("query"));
  test("checks that initializeUserAccount(...) succeeds and User updates succeed when System is installed and User is not Archive Owner", testFunc3("logic"));

  const testFunc4 = () => (async () => {
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

    // NOTE: Set the ambient AuthenticationState to a User other than the Archive Owner
    config.authenticationState = TestAuthData.testUser;
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, TestAuthData.testUser);

    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesNotExist(config.dataStorageState, TestAuthData.testUser);

    await Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email);
    await TestUtils.assertUserDoesExist(config.dataStorageState, config.authenticationState);
    const user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    // NOTE: Since the TestUser is newly created, record the userId
    TestAuthData.testUser.opaUserId = user.id;

    // NOTE: Do NOT approve TestUser yet, as we need a User whose ApprovalState we can set to "pending" or "denied"

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let usersOwnerAll = await Users.getListOfUsers(callState);
    let usersOwnerAllIds = usersOwnerAll.map((value) => (value.id));
    let usersOwnerPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    let usersOwnerPendingIds = usersOwnerPending.map((value) => (value.id));
    let usersOwnerDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    let usersOwnerDeniedIds = usersOwnerDenied.map((value) => (value.id));
    let usersOwnerApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    let usersOwnerApprovedIds = usersOwnerApproved.map((value) => (value.id));

    expect(usersOwnerAll.length).equals(6);
    expect(usersOwnerAllIds.includes(ownerId())).equals(true);
    expect(usersOwnerAllIds.includes(adminId())).equals(true);
    expect(usersOwnerAllIds.includes(editorId())).equals(true);
    expect(usersOwnerAllIds.includes(viewerId())).equals(true);
    expect(usersOwnerAllIds.includes(guestId())).equals(true);
    expect(usersOwnerAllIds.includes(testUserId())).equals(true);
    expect(usersOwnerPending.length).equals(1);
    expect(usersOwnerPendingIds.includes(ownerId())).equals(false);
    expect(usersOwnerPendingIds.includes(adminId())).equals(false);
    expect(usersOwnerPendingIds.includes(editorId())).equals(false);
    expect(usersOwnerPendingIds.includes(viewerId())).equals(false);
    expect(usersOwnerPendingIds.includes(guestId())).equals(false);
    expect(usersOwnerPendingIds.includes(testUserId())).equals(true);
    expect(usersOwnerDenied.length).equals(0);
    expect(usersOwnerDeniedIds.includes(ownerId())).equals(false);
    expect(usersOwnerDeniedIds.includes(adminId())).equals(false);
    expect(usersOwnerDeniedIds.includes(editorId())).equals(false);
    expect(usersOwnerDeniedIds.includes(viewerId())).equals(false);
    expect(usersOwnerDeniedIds.includes(guestId())).equals(false);
    expect(usersOwnerDeniedIds.includes(testUserId())).equals(false);
    expect(usersOwnerApproved.length).equals(5);
    expect(usersOwnerApprovedIds.includes(ownerId())).equals(true);
    expect(usersOwnerApprovedIds.includes(adminId())).equals(true);
    expect(usersOwnerApprovedIds.includes(editorId())).equals(true);
    expect(usersOwnerApprovedIds.includes(viewerId())).equals(true);
    expect(usersOwnerApprovedIds.includes(guestId())).equals(true);
    expect(usersOwnerApprovedIds.includes(testUserId())).equals(false);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let usersAdminAll = await Users.getListOfUsers(callState);
    let usersAdminAllIds = usersAdminAll.map((value) => (value.id));
    let usersAdminPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    let usersAdminPendingIds = usersAdminPending.map((value) => (value.id));
    let usersAdminDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    let usersAdminDeniedIds = usersAdminDenied.map((value) => (value.id));
    let usersAdminApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    let usersAdminApprovedIds = usersAdminApproved.map((value) => (value.id));

    expect(usersAdminAll.length).equals(6);
    expect(usersAdminAllIds.includes(ownerId())).equals(true);
    expect(usersAdminAllIds.includes(adminId())).equals(true);
    expect(usersAdminAllIds.includes(editorId())).equals(true);
    expect(usersAdminAllIds.includes(viewerId())).equals(true);
    expect(usersAdminAllIds.includes(guestId())).equals(true);
    expect(usersAdminAllIds.includes(testUserId())).equals(true);
    expect(usersAdminPending.length).equals(1);
    expect(usersAdminPendingIds.includes(ownerId())).equals(false);
    expect(usersAdminPendingIds.includes(adminId())).equals(false);
    expect(usersAdminPendingIds.includes(editorId())).equals(false);
    expect(usersAdminPendingIds.includes(viewerId())).equals(false);
    expect(usersAdminPendingIds.includes(guestId())).equals(false);
    expect(usersAdminPendingIds.includes(testUserId())).equals(true);
    expect(usersAdminDenied.length).equals(0);
    expect(usersAdminDeniedIds.includes(ownerId())).equals(false);
    expect(usersAdminDeniedIds.includes(adminId())).equals(false);
    expect(usersAdminDeniedIds.includes(editorId())).equals(false);
    expect(usersAdminDeniedIds.includes(viewerId())).equals(false);
    expect(usersAdminDeniedIds.includes(guestId())).equals(false);
    expect(usersAdminDeniedIds.includes(testUserId())).equals(false);
    expect(usersAdminApproved.length).equals(5);
    expect(usersAdminApprovedIds.includes(ownerId())).equals(true);
    expect(usersAdminApprovedIds.includes(adminId())).equals(true);
    expect(usersAdminApprovedIds.includes(editorId())).equals(true);
    expect(usersAdminApprovedIds.includes(viewerId())).equals(true);
    expect(usersAdminApprovedIds.includes(guestId())).equals(true);
    expect(usersAdminApprovedIds.includes(testUserId())).equals(false);

    config.authenticationState = TestAuthData.editor;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let usersEditorAll = await Users.getListOfUsers(callState);
    let usersEditorAllIds = usersEditorAll.map((value) => (value.id));
    let usersEditorPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    let usersEditorPendingIds = usersEditorPending.map((value) => (value.id));
    let usersEditorDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    let usersEditorDeniedIds = usersEditorDenied.map((value) => (value.id));
    let usersEditorApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    let usersEditorApprovedIds = usersEditorApproved.map((value) => (value.id));

    expect(usersEditorAll.length).equals(1);
    expect(usersEditorAllIds.includes(ownerId())).equals(false);
    expect(usersEditorAllIds.includes(adminId())).equals(false);
    expect(usersEditorAllIds.includes(editorId())).equals(true);
    expect(usersEditorAllIds.includes(viewerId())).equals(false);
    expect(usersEditorAllIds.includes(guestId())).equals(false);
    expect(usersEditorAllIds.includes(testUserId())).equals(false);
    expect(usersEditorPending.length).equals(0);
    expect(usersEditorPendingIds.includes(ownerId())).equals(false);
    expect(usersEditorPendingIds.includes(adminId())).equals(false);
    expect(usersEditorPendingIds.includes(editorId())).equals(false);
    expect(usersEditorPendingIds.includes(viewerId())).equals(false);
    expect(usersEditorPendingIds.includes(guestId())).equals(false);
    expect(usersEditorPendingIds.includes(testUserId())).equals(false);
    expect(usersEditorDenied.length).equals(0);
    expect(usersEditorDeniedIds.includes(ownerId())).equals(false);
    expect(usersEditorDeniedIds.includes(adminId())).equals(false);
    expect(usersEditorDeniedIds.includes(editorId())).equals(false);
    expect(usersEditorDeniedIds.includes(viewerId())).equals(false);
    expect(usersEditorDeniedIds.includes(guestId())).equals(false);
    expect(usersEditorDeniedIds.includes(testUserId())).equals(false);
    expect(usersEditorApproved.length).equals(1);
    expect(usersEditorApprovedIds.includes(ownerId())).equals(false);
    expect(usersEditorApprovedIds.includes(adminId())).equals(false);
    expect(usersEditorApprovedIds.includes(editorId())).equals(true);
    expect(usersEditorApprovedIds.includes(viewerId())).equals(false);
    expect(usersEditorApprovedIds.includes(guestId())).equals(false);
    expect(usersEditorApprovedIds.includes(testUserId())).equals(false);

    config.authenticationState = TestAuthData.viewer;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let usersViewerAll = await Users.getListOfUsers(callState);
    let usersViewerAllIds = usersViewerAll.map((value) => (value.id));
    let usersViewerPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    let usersViewerPendingIds = usersViewerPending.map((value) => (value.id));
    let usersViewerDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    let usersViewerDeniedIds = usersViewerDenied.map((value) => (value.id));
    let usersViewerApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    let usersViewerApprovedIds = usersViewerApproved.map((value) => (value.id));

    expect(usersViewerAll.length).equals(1);
    expect(usersViewerAllIds.includes(ownerId())).equals(false);
    expect(usersViewerAllIds.includes(adminId())).equals(false);
    expect(usersViewerAllIds.includes(editorId())).equals(false);
    expect(usersViewerAllIds.includes(viewerId())).equals(true);
    expect(usersViewerAllIds.includes(guestId())).equals(false);
    expect(usersViewerAllIds.includes(testUserId())).equals(false);
    expect(usersViewerPending.length).equals(0);
    expect(usersViewerPendingIds.includes(ownerId())).equals(false);
    expect(usersViewerPendingIds.includes(adminId())).equals(false);
    expect(usersViewerPendingIds.includes(editorId())).equals(false);
    expect(usersViewerPendingIds.includes(viewerId())).equals(false);
    expect(usersViewerPendingIds.includes(guestId())).equals(false);
    expect(usersViewerPendingIds.includes(testUserId())).equals(false);
    expect(usersViewerDenied.length).equals(0);
    expect(usersViewerDeniedIds.includes(ownerId())).equals(false);
    expect(usersViewerDeniedIds.includes(adminId())).equals(false);
    expect(usersViewerDeniedIds.includes(editorId())).equals(false);
    expect(usersViewerDeniedIds.includes(viewerId())).equals(false);
    expect(usersViewerDeniedIds.includes(guestId())).equals(false);
    expect(usersViewerDeniedIds.includes(testUserId())).equals(false);
    expect(usersViewerApproved.length).equals(1);
    expect(usersViewerApprovedIds.includes(ownerId())).equals(false);
    expect(usersViewerApprovedIds.includes(adminId())).equals(false);
    expect(usersViewerApprovedIds.includes(editorId())).equals(false);
    expect(usersViewerApprovedIds.includes(viewerId())).equals(true);
    expect(usersViewerApprovedIds.includes(guestId())).equals(false);
    expect(usersViewerApprovedIds.includes(testUserId())).equals(false);

    config.authenticationState = TestAuthData.guest;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let usersGuestAll = await Users.getListOfUsers(callState);
    let usersGuestAllIds = usersGuestAll.map((value) => (value.id));
    let usersGuestPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    let usersGuestPendingIds = usersGuestPending.map((value) => (value.id));
    let usersGuestDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    let usersGuestDeniedIds = usersGuestDenied.map((value) => (value.id));
    let usersGuestApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    let usersGuestApprovedIds = usersGuestApproved.map((value) => (value.id));

    expect(usersGuestAll.length).equals(1);
    expect(usersGuestAllIds.includes(ownerId())).equals(false);
    expect(usersGuestAllIds.includes(adminId())).equals(false);
    expect(usersGuestAllIds.includes(editorId())).equals(false);
    expect(usersGuestAllIds.includes(viewerId())).equals(false);
    expect(usersGuestAllIds.includes(guestId())).equals(true);
    expect(usersGuestAllIds.includes(testUserId())).equals(false);
    expect(usersGuestPending.length).equals(0);
    expect(usersGuestPendingIds.includes(ownerId())).equals(false);
    expect(usersGuestPendingIds.includes(adminId())).equals(false);
    expect(usersGuestPendingIds.includes(editorId())).equals(false);
    expect(usersGuestPendingIds.includes(viewerId())).equals(false);
    expect(usersGuestPendingIds.includes(guestId())).equals(false);
    expect(usersGuestPendingIds.includes(testUserId())).equals(false);
    expect(usersGuestDenied.length).equals(0);
    expect(usersGuestDeniedIds.includes(ownerId())).equals(false);
    expect(usersGuestDeniedIds.includes(adminId())).equals(false);
    expect(usersGuestDeniedIds.includes(editorId())).equals(false);
    expect(usersGuestDeniedIds.includes(viewerId())).equals(false);
    expect(usersGuestDeniedIds.includes(guestId())).equals(false);
    expect(usersGuestDeniedIds.includes(testUserId())).equals(false);
    expect(usersGuestApproved.length).equals(1);
    expect(usersGuestApprovedIds.includes(ownerId())).equals(false);
    expect(usersGuestApprovedIds.includes(adminId())).equals(false);
    expect(usersGuestApprovedIds.includes(editorId())).equals(false);
    expect(usersGuestApprovedIds.includes(viewerId())).equals(false);
    expect(usersGuestApprovedIds.includes(guestId())).equals(true);
    expect(usersGuestApprovedIds.includes(testUserId())).equals(false);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await expect(Users.getListOfUsers(callState)).to.eventually.be.rejectedWith(Error);
    await expect(Users.getListOfUsers(callState, OPA.ApprovalStates.pending)).to.eventually.be.rejectedWith(Error);
    await expect(Users.getListOfUsers(callState, OPA.ApprovalStates.denied)).to.eventually.be.rejectedWith(Error);
    await expect(Users.getListOfUsers(callState, OPA.ApprovalStates.approved)).to.eventually.be.rejectedWith(Error);

    // NOTE: Skip assertions for TestUser because queries failed because TestUser's ApprovalState is not "approved"

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await Users.setUserToDenied(callState, testUserId());

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    usersOwnerAll = await Users.getListOfUsers(callState);
    usersOwnerAllIds = usersOwnerAll.map((value) => (value.id));
    usersOwnerPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    usersOwnerPendingIds = usersOwnerPending.map((value) => (value.id));
    usersOwnerDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    usersOwnerDeniedIds = usersOwnerDenied.map((value) => (value.id));
    usersOwnerApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    usersOwnerApprovedIds = usersOwnerApproved.map((value) => (value.id));

    expect(usersOwnerAll.length).equals(6);
    expect(usersOwnerAllIds.includes(ownerId())).equals(true);
    expect(usersOwnerAllIds.includes(adminId())).equals(true);
    expect(usersOwnerAllIds.includes(editorId())).equals(true);
    expect(usersOwnerAllIds.includes(viewerId())).equals(true);
    expect(usersOwnerAllIds.includes(guestId())).equals(true);
    expect(usersOwnerAllIds.includes(testUserId())).equals(true);
    expect(usersOwnerPending.length).equals(0);
    expect(usersOwnerPendingIds.includes(ownerId())).equals(false);
    expect(usersOwnerPendingIds.includes(adminId())).equals(false);
    expect(usersOwnerPendingIds.includes(editorId())).equals(false);
    expect(usersOwnerPendingIds.includes(viewerId())).equals(false);
    expect(usersOwnerPendingIds.includes(guestId())).equals(false);
    expect(usersOwnerPendingIds.includes(testUserId())).equals(false);
    expect(usersOwnerDenied.length).equals(1);
    expect(usersOwnerDeniedIds.includes(ownerId())).equals(false);
    expect(usersOwnerDeniedIds.includes(adminId())).equals(false);
    expect(usersOwnerDeniedIds.includes(editorId())).equals(false);
    expect(usersOwnerDeniedIds.includes(viewerId())).equals(false);
    expect(usersOwnerDeniedIds.includes(guestId())).equals(false);
    expect(usersOwnerDeniedIds.includes(testUserId())).equals(true);
    expect(usersOwnerApproved.length).equals(5);
    expect(usersOwnerApprovedIds.includes(ownerId())).equals(true);
    expect(usersOwnerApprovedIds.includes(adminId())).equals(true);
    expect(usersOwnerApprovedIds.includes(editorId())).equals(true);
    expect(usersOwnerApprovedIds.includes(viewerId())).equals(true);
    expect(usersOwnerApprovedIds.includes(guestId())).equals(true);
    expect(usersOwnerApprovedIds.includes(testUserId())).equals(false);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    usersAdminAll = await Users.getListOfUsers(callState);
    usersAdminAllIds = usersAdminAll.map((value) => (value.id));
    usersAdminPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    usersAdminPendingIds = usersAdminPending.map((value) => (value.id));
    usersAdminDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    usersAdminDeniedIds = usersAdminDenied.map((value) => (value.id));
    usersAdminApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    usersAdminApprovedIds = usersAdminApproved.map((value) => (value.id));

    expect(usersAdminAll.length).equals(6);
    expect(usersAdminAllIds.includes(ownerId())).equals(true);
    expect(usersAdminAllIds.includes(adminId())).equals(true);
    expect(usersAdminAllIds.includes(editorId())).equals(true);
    expect(usersAdminAllIds.includes(viewerId())).equals(true);
    expect(usersAdminAllIds.includes(guestId())).equals(true);
    expect(usersAdminAllIds.includes(testUserId())).equals(true);
    expect(usersAdminPending.length).equals(0);
    expect(usersAdminPendingIds.includes(ownerId())).equals(false);
    expect(usersAdminPendingIds.includes(adminId())).equals(false);
    expect(usersAdminPendingIds.includes(editorId())).equals(false);
    expect(usersAdminPendingIds.includes(viewerId())).equals(false);
    expect(usersAdminPendingIds.includes(guestId())).equals(false);
    expect(usersAdminPendingIds.includes(testUserId())).equals(false);
    expect(usersAdminDenied.length).equals(1);
    expect(usersAdminDeniedIds.includes(ownerId())).equals(false);
    expect(usersAdminDeniedIds.includes(adminId())).equals(false);
    expect(usersAdminDeniedIds.includes(editorId())).equals(false);
    expect(usersAdminDeniedIds.includes(viewerId())).equals(false);
    expect(usersAdminDeniedIds.includes(guestId())).equals(false);
    expect(usersAdminDeniedIds.includes(testUserId())).equals(true);
    expect(usersAdminApproved.length).equals(5);
    expect(usersAdminApprovedIds.includes(ownerId())).equals(true);
    expect(usersAdminApprovedIds.includes(adminId())).equals(true);
    expect(usersAdminApprovedIds.includes(editorId())).equals(true);
    expect(usersAdminApprovedIds.includes(viewerId())).equals(true);
    expect(usersAdminApprovedIds.includes(guestId())).equals(true);
    expect(usersAdminApprovedIds.includes(testUserId())).equals(false);

    config.authenticationState = TestAuthData.editor;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    usersEditorAll = await Users.getListOfUsers(callState);
    usersEditorAllIds = usersEditorAll.map((value) => (value.id));
    usersEditorPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    usersEditorPendingIds = usersEditorPending.map((value) => (value.id));
    usersEditorDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    usersEditorDeniedIds = usersEditorDenied.map((value) => (value.id));
    usersEditorApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    usersEditorApprovedIds = usersEditorApproved.map((value) => (value.id));

    expect(usersEditorAll.length).equals(1);
    expect(usersEditorAllIds.includes(ownerId())).equals(false);
    expect(usersEditorAllIds.includes(adminId())).equals(false);
    expect(usersEditorAllIds.includes(editorId())).equals(true);
    expect(usersEditorAllIds.includes(viewerId())).equals(false);
    expect(usersEditorAllIds.includes(guestId())).equals(false);
    expect(usersEditorAllIds.includes(testUserId())).equals(false);
    expect(usersEditorPending.length).equals(0);
    expect(usersEditorPendingIds.includes(ownerId())).equals(false);
    expect(usersEditorPendingIds.includes(adminId())).equals(false);
    expect(usersEditorPendingIds.includes(editorId())).equals(false);
    expect(usersEditorPendingIds.includes(viewerId())).equals(false);
    expect(usersEditorPendingIds.includes(guestId())).equals(false);
    expect(usersEditorPendingIds.includes(testUserId())).equals(false);
    expect(usersEditorDenied.length).equals(0);
    expect(usersEditorDeniedIds.includes(ownerId())).equals(false);
    expect(usersEditorDeniedIds.includes(adminId())).equals(false);
    expect(usersEditorDeniedIds.includes(editorId())).equals(false);
    expect(usersEditorDeniedIds.includes(viewerId())).equals(false);
    expect(usersEditorDeniedIds.includes(guestId())).equals(false);
    expect(usersEditorDeniedIds.includes(testUserId())).equals(false);
    expect(usersEditorApproved.length).equals(1);
    expect(usersEditorApprovedIds.includes(ownerId())).equals(false);
    expect(usersEditorApprovedIds.includes(adminId())).equals(false);
    expect(usersEditorApprovedIds.includes(editorId())).equals(true);
    expect(usersEditorApprovedIds.includes(viewerId())).equals(false);
    expect(usersEditorApprovedIds.includes(guestId())).equals(false);
    expect(usersEditorApprovedIds.includes(testUserId())).equals(false);

    config.authenticationState = TestAuthData.viewer;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    usersViewerAll = await Users.getListOfUsers(callState);
    usersViewerAllIds = usersViewerAll.map((value) => (value.id));
    usersViewerPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    usersViewerPendingIds = usersViewerPending.map((value) => (value.id));
    usersViewerDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    usersViewerDeniedIds = usersViewerDenied.map((value) => (value.id));
    usersViewerApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    usersViewerApprovedIds = usersViewerApproved.map((value) => (value.id));

    expect(usersViewerAll.length).equals(1);
    expect(usersViewerAllIds.includes(ownerId())).equals(false);
    expect(usersViewerAllIds.includes(adminId())).equals(false);
    expect(usersViewerAllIds.includes(editorId())).equals(false);
    expect(usersViewerAllIds.includes(viewerId())).equals(true);
    expect(usersViewerAllIds.includes(guestId())).equals(false);
    expect(usersViewerAllIds.includes(testUserId())).equals(false);
    expect(usersViewerPending.length).equals(0);
    expect(usersViewerPendingIds.includes(ownerId())).equals(false);
    expect(usersViewerPendingIds.includes(adminId())).equals(false);
    expect(usersViewerPendingIds.includes(editorId())).equals(false);
    expect(usersViewerPendingIds.includes(viewerId())).equals(false);
    expect(usersViewerPendingIds.includes(guestId())).equals(false);
    expect(usersViewerPendingIds.includes(testUserId())).equals(false);
    expect(usersViewerDenied.length).equals(0);
    expect(usersViewerDeniedIds.includes(ownerId())).equals(false);
    expect(usersViewerDeniedIds.includes(adminId())).equals(false);
    expect(usersViewerDeniedIds.includes(editorId())).equals(false);
    expect(usersViewerDeniedIds.includes(viewerId())).equals(false);
    expect(usersViewerDeniedIds.includes(guestId())).equals(false);
    expect(usersViewerDeniedIds.includes(testUserId())).equals(false);
    expect(usersViewerApproved.length).equals(1);
    expect(usersViewerApprovedIds.includes(ownerId())).equals(false);
    expect(usersViewerApprovedIds.includes(adminId())).equals(false);
    expect(usersViewerApprovedIds.includes(editorId())).equals(false);
    expect(usersViewerApprovedIds.includes(viewerId())).equals(true);
    expect(usersViewerApprovedIds.includes(guestId())).equals(false);
    expect(usersViewerApprovedIds.includes(testUserId())).equals(false);

    config.authenticationState = TestAuthData.guest;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    usersGuestAll = await Users.getListOfUsers(callState);
    usersGuestAllIds = usersGuestAll.map((value) => (value.id));
    usersGuestPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    usersGuestPendingIds = usersGuestPending.map((value) => (value.id));
    usersGuestDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    usersGuestDeniedIds = usersGuestDenied.map((value) => (value.id));
    usersGuestApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    usersGuestApprovedIds = usersGuestApproved.map((value) => (value.id));

    expect(usersGuestAll.length).equals(1);
    expect(usersGuestAllIds.includes(ownerId())).equals(false);
    expect(usersGuestAllIds.includes(adminId())).equals(false);
    expect(usersGuestAllIds.includes(editorId())).equals(false);
    expect(usersGuestAllIds.includes(viewerId())).equals(false);
    expect(usersGuestAllIds.includes(guestId())).equals(true);
    expect(usersGuestAllIds.includes(testUserId())).equals(false);
    expect(usersGuestPending.length).equals(0);
    expect(usersGuestPendingIds.includes(ownerId())).equals(false);
    expect(usersGuestPendingIds.includes(adminId())).equals(false);
    expect(usersGuestPendingIds.includes(editorId())).equals(false);
    expect(usersGuestPendingIds.includes(viewerId())).equals(false);
    expect(usersGuestPendingIds.includes(guestId())).equals(false);
    expect(usersGuestPendingIds.includes(testUserId())).equals(false);
    expect(usersGuestDenied.length).equals(0);
    expect(usersGuestDeniedIds.includes(ownerId())).equals(false);
    expect(usersGuestDeniedIds.includes(adminId())).equals(false);
    expect(usersGuestDeniedIds.includes(editorId())).equals(false);
    expect(usersGuestDeniedIds.includes(viewerId())).equals(false);
    expect(usersGuestDeniedIds.includes(guestId())).equals(false);
    expect(usersGuestDeniedIds.includes(testUserId())).equals(false);
    expect(usersGuestApproved.length).equals(1);
    expect(usersGuestApprovedIds.includes(ownerId())).equals(false);
    expect(usersGuestApprovedIds.includes(adminId())).equals(false);
    expect(usersGuestApprovedIds.includes(editorId())).equals(false);
    expect(usersGuestApprovedIds.includes(viewerId())).equals(false);
    expect(usersGuestApprovedIds.includes(guestId())).equals(true);
    expect(usersGuestApprovedIds.includes(testUserId())).equals(false);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await expect(Users.getListOfUsers(callState)).to.eventually.be.rejectedWith(Error);
    await expect(Users.getListOfUsers(callState, OPA.ApprovalStates.pending)).to.eventually.be.rejectedWith(Error);
    await expect(Users.getListOfUsers(callState, OPA.ApprovalStates.denied)).to.eventually.be.rejectedWith(Error);
    await expect(Users.getListOfUsers(callState, OPA.ApprovalStates.approved)).to.eventually.be.rejectedWith(Error);

    // NOTE: Skip assertions for TestUser because queries failed because TestUser's ApprovalState is not "approved"

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await Users.setUserToApproved(callState, testUserId());

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    usersOwnerAll = await Users.getListOfUsers(callState);
    usersOwnerAllIds = usersOwnerAll.map((value) => (value.id));
    usersOwnerPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    usersOwnerPendingIds = usersOwnerPending.map((value) => (value.id));
    usersOwnerDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    usersOwnerDeniedIds = usersOwnerDenied.map((value) => (value.id));
    usersOwnerApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    usersOwnerApprovedIds = usersOwnerApproved.map((value) => (value.id));

    expect(usersOwnerAll.length).equals(6);
    expect(usersOwnerAllIds.includes(ownerId())).equals(true);
    expect(usersOwnerAllIds.includes(adminId())).equals(true);
    expect(usersOwnerAllIds.includes(editorId())).equals(true);
    expect(usersOwnerAllIds.includes(viewerId())).equals(true);
    expect(usersOwnerAllIds.includes(guestId())).equals(true);
    expect(usersOwnerAllIds.includes(testUserId())).equals(true);
    expect(usersOwnerPending.length).equals(0);
    expect(usersOwnerPendingIds.includes(ownerId())).equals(false);
    expect(usersOwnerPendingIds.includes(adminId())).equals(false);
    expect(usersOwnerPendingIds.includes(editorId())).equals(false);
    expect(usersOwnerPendingIds.includes(viewerId())).equals(false);
    expect(usersOwnerPendingIds.includes(guestId())).equals(false);
    expect(usersOwnerPendingIds.includes(testUserId())).equals(false);
    expect(usersOwnerDenied.length).equals(0);
    expect(usersOwnerDeniedIds.includes(ownerId())).equals(false);
    expect(usersOwnerDeniedIds.includes(adminId())).equals(false);
    expect(usersOwnerDeniedIds.includes(editorId())).equals(false);
    expect(usersOwnerDeniedIds.includes(viewerId())).equals(false);
    expect(usersOwnerDeniedIds.includes(guestId())).equals(false);
    expect(usersOwnerDeniedIds.includes(testUserId())).equals(false);
    expect(usersOwnerApproved.length).equals(6);
    expect(usersOwnerApprovedIds.includes(ownerId())).equals(true);
    expect(usersOwnerApprovedIds.includes(adminId())).equals(true);
    expect(usersOwnerApprovedIds.includes(editorId())).equals(true);
    expect(usersOwnerApprovedIds.includes(viewerId())).equals(true);
    expect(usersOwnerApprovedIds.includes(guestId())).equals(true);
    expect(usersOwnerApprovedIds.includes(testUserId())).equals(true);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    usersAdminAll = await Users.getListOfUsers(callState);
    usersAdminAllIds = usersAdminAll.map((value) => (value.id));
    usersAdminPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    usersAdminPendingIds = usersAdminPending.map((value) => (value.id));
    usersAdminDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    usersAdminDeniedIds = usersAdminDenied.map((value) => (value.id));
    usersAdminApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    usersAdminApprovedIds = usersAdminApproved.map((value) => (value.id));

    expect(usersAdminAll.length).equals(6);
    expect(usersAdminAllIds.includes(ownerId())).equals(true);
    expect(usersAdminAllIds.includes(adminId())).equals(true);
    expect(usersAdminAllIds.includes(editorId())).equals(true);
    expect(usersAdminAllIds.includes(viewerId())).equals(true);
    expect(usersAdminAllIds.includes(guestId())).equals(true);
    expect(usersAdminAllIds.includes(testUserId())).equals(true);
    expect(usersAdminPending.length).equals(0);
    expect(usersAdminPendingIds.includes(ownerId())).equals(false);
    expect(usersAdminPendingIds.includes(adminId())).equals(false);
    expect(usersAdminPendingIds.includes(editorId())).equals(false);
    expect(usersAdminPendingIds.includes(viewerId())).equals(false);
    expect(usersAdminPendingIds.includes(guestId())).equals(false);
    expect(usersAdminPendingIds.includes(testUserId())).equals(false);
    expect(usersAdminDenied.length).equals(0);
    expect(usersAdminDeniedIds.includes(ownerId())).equals(false);
    expect(usersAdminDeniedIds.includes(adminId())).equals(false);
    expect(usersAdminDeniedIds.includes(editorId())).equals(false);
    expect(usersAdminDeniedIds.includes(viewerId())).equals(false);
    expect(usersAdminDeniedIds.includes(guestId())).equals(false);
    expect(usersAdminDeniedIds.includes(testUserId())).equals(false);
    expect(usersAdminApproved.length).equals(6);
    expect(usersAdminApprovedIds.includes(ownerId())).equals(true);
    expect(usersAdminApprovedIds.includes(adminId())).equals(true);
    expect(usersAdminApprovedIds.includes(editorId())).equals(true);
    expect(usersAdminApprovedIds.includes(viewerId())).equals(true);
    expect(usersAdminApprovedIds.includes(guestId())).equals(true);
    expect(usersAdminApprovedIds.includes(testUserId())).equals(true);

    config.authenticationState = TestAuthData.editor;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    usersEditorAll = await Users.getListOfUsers(callState);
    usersEditorAllIds = usersEditorAll.map((value) => (value.id));
    usersEditorPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    usersEditorPendingIds = usersEditorPending.map((value) => (value.id));
    usersEditorDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    usersEditorDeniedIds = usersEditorDenied.map((value) => (value.id));
    usersEditorApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    usersEditorApprovedIds = usersEditorApproved.map((value) => (value.id));

    expect(usersEditorAll.length).equals(1);
    expect(usersEditorAllIds.includes(ownerId())).equals(false);
    expect(usersEditorAllIds.includes(adminId())).equals(false);
    expect(usersEditorAllIds.includes(editorId())).equals(true);
    expect(usersEditorAllIds.includes(viewerId())).equals(false);
    expect(usersEditorAllIds.includes(guestId())).equals(false);
    expect(usersEditorAllIds.includes(testUserId())).equals(false);
    expect(usersEditorPending.length).equals(0);
    expect(usersEditorPendingIds.includes(ownerId())).equals(false);
    expect(usersEditorPendingIds.includes(adminId())).equals(false);
    expect(usersEditorPendingIds.includes(editorId())).equals(false);
    expect(usersEditorPendingIds.includes(viewerId())).equals(false);
    expect(usersEditorPendingIds.includes(guestId())).equals(false);
    expect(usersEditorPendingIds.includes(testUserId())).equals(false);
    expect(usersEditorDenied.length).equals(0);
    expect(usersEditorDeniedIds.includes(ownerId())).equals(false);
    expect(usersEditorDeniedIds.includes(adminId())).equals(false);
    expect(usersEditorDeniedIds.includes(editorId())).equals(false);
    expect(usersEditorDeniedIds.includes(viewerId())).equals(false);
    expect(usersEditorDeniedIds.includes(guestId())).equals(false);
    expect(usersEditorDeniedIds.includes(testUserId())).equals(false);
    expect(usersEditorApproved.length).equals(1);
    expect(usersEditorApprovedIds.includes(ownerId())).equals(false);
    expect(usersEditorApprovedIds.includes(adminId())).equals(false);
    expect(usersEditorApprovedIds.includes(editorId())).equals(true);
    expect(usersEditorApprovedIds.includes(viewerId())).equals(false);
    expect(usersEditorApprovedIds.includes(guestId())).equals(false);
    expect(usersEditorApprovedIds.includes(testUserId())).equals(false);

    config.authenticationState = TestAuthData.viewer;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    usersViewerAll = await Users.getListOfUsers(callState);
    usersViewerAllIds = usersViewerAll.map((value) => (value.id));
    usersViewerPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    usersViewerPendingIds = usersViewerPending.map((value) => (value.id));
    usersViewerDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    usersViewerDeniedIds = usersViewerDenied.map((value) => (value.id));
    usersViewerApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    usersViewerApprovedIds = usersViewerApproved.map((value) => (value.id));

    expect(usersViewerAll.length).equals(1);
    expect(usersViewerAllIds.includes(ownerId())).equals(false);
    expect(usersViewerAllIds.includes(adminId())).equals(false);
    expect(usersViewerAllIds.includes(editorId())).equals(false);
    expect(usersViewerAllIds.includes(viewerId())).equals(true);
    expect(usersViewerAllIds.includes(guestId())).equals(false);
    expect(usersViewerAllIds.includes(testUserId())).equals(false);
    expect(usersViewerPending.length).equals(0);
    expect(usersViewerPendingIds.includes(ownerId())).equals(false);
    expect(usersViewerPendingIds.includes(adminId())).equals(false);
    expect(usersViewerPendingIds.includes(editorId())).equals(false);
    expect(usersViewerPendingIds.includes(viewerId())).equals(false);
    expect(usersViewerPendingIds.includes(guestId())).equals(false);
    expect(usersViewerPendingIds.includes(testUserId())).equals(false);
    expect(usersViewerDenied.length).equals(0);
    expect(usersViewerDeniedIds.includes(ownerId())).equals(false);
    expect(usersViewerDeniedIds.includes(adminId())).equals(false);
    expect(usersViewerDeniedIds.includes(editorId())).equals(false);
    expect(usersViewerDeniedIds.includes(viewerId())).equals(false);
    expect(usersViewerDeniedIds.includes(guestId())).equals(false);
    expect(usersViewerDeniedIds.includes(testUserId())).equals(false);
    expect(usersViewerApproved.length).equals(1);
    expect(usersViewerApprovedIds.includes(ownerId())).equals(false);
    expect(usersViewerApprovedIds.includes(adminId())).equals(false);
    expect(usersViewerApprovedIds.includes(editorId())).equals(false);
    expect(usersViewerApprovedIds.includes(viewerId())).equals(true);
    expect(usersViewerApprovedIds.includes(guestId())).equals(false);
    expect(usersViewerApprovedIds.includes(testUserId())).equals(false);

    config.authenticationState = TestAuthData.guest;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    usersGuestAll = await Users.getListOfUsers(callState);
    usersGuestAllIds = usersGuestAll.map((value) => (value.id));
    usersGuestPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    usersGuestPendingIds = usersGuestPending.map((value) => (value.id));
    usersGuestDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    usersGuestDeniedIds = usersGuestDenied.map((value) => (value.id));
    usersGuestApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    usersGuestApprovedIds = usersGuestApproved.map((value) => (value.id));

    expect(usersGuestAll.length).equals(1);
    expect(usersGuestAllIds.includes(ownerId())).equals(false);
    expect(usersGuestAllIds.includes(adminId())).equals(false);
    expect(usersGuestAllIds.includes(editorId())).equals(false);
    expect(usersGuestAllIds.includes(viewerId())).equals(false);
    expect(usersGuestAllIds.includes(guestId())).equals(true);
    expect(usersGuestAllIds.includes(testUserId())).equals(false);
    expect(usersGuestPending.length).equals(0);
    expect(usersGuestPendingIds.includes(ownerId())).equals(false);
    expect(usersGuestPendingIds.includes(adminId())).equals(false);
    expect(usersGuestPendingIds.includes(editorId())).equals(false);
    expect(usersGuestPendingIds.includes(viewerId())).equals(false);
    expect(usersGuestPendingIds.includes(guestId())).equals(false);
    expect(usersGuestPendingIds.includes(testUserId())).equals(false);
    expect(usersGuestDenied.length).equals(0);
    expect(usersGuestDeniedIds.includes(ownerId())).equals(false);
    expect(usersGuestDeniedIds.includes(adminId())).equals(false);
    expect(usersGuestDeniedIds.includes(editorId())).equals(false);
    expect(usersGuestDeniedIds.includes(viewerId())).equals(false);
    expect(usersGuestDeniedIds.includes(guestId())).equals(false);
    expect(usersGuestDeniedIds.includes(testUserId())).equals(false);
    expect(usersGuestApproved.length).equals(1);
    expect(usersGuestApprovedIds.includes(ownerId())).equals(false);
    expect(usersGuestApprovedIds.includes(adminId())).equals(false);
    expect(usersGuestApprovedIds.includes(editorId())).equals(false);
    expect(usersGuestApprovedIds.includes(viewerId())).equals(false);
    expect(usersGuestApprovedIds.includes(guestId())).equals(true);
    expect(usersGuestApprovedIds.includes(testUserId())).equals(false);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const usersTestUserAll = await Users.getListOfUsers(callState);
    const usersTestUserAllIds = usersTestUserAll.map((value) => (value.id));
    const usersTestUserPending = await Users.getListOfUsers(callState, OPA.ApprovalStates.pending);
    const usersTestUserPendingIds = usersTestUserPending.map((value) => (value.id));
    const usersTestUserDenied = await Users.getListOfUsers(callState, OPA.ApprovalStates.denied);
    const usersTestUserDeniedIds = usersTestUserDenied.map((value) => (value.id));
    const usersTestUserApproved = await Users.getListOfUsers(callState, OPA.ApprovalStates.approved);
    const usersTestUserApprovedIds = usersTestUserApproved.map((value) => (value.id));

    expect(usersTestUserAll.length).equals(1);
    expect(usersTestUserAllIds.includes(ownerId())).equals(false);
    expect(usersTestUserAllIds.includes(adminId())).equals(false);
    expect(usersTestUserAllIds.includes(editorId())).equals(false);
    expect(usersTestUserAllIds.includes(viewerId())).equals(false);
    expect(usersTestUserAllIds.includes(guestId())).equals(false);
    expect(usersTestUserAllIds.includes(testUserId())).equals(true);
    expect(usersTestUserPending.length).equals(0);
    expect(usersTestUserPendingIds.includes(ownerId())).equals(false);
    expect(usersTestUserPendingIds.includes(adminId())).equals(false);
    expect(usersTestUserPendingIds.includes(editorId())).equals(false);
    expect(usersTestUserPendingIds.includes(viewerId())).equals(false);
    expect(usersTestUserPendingIds.includes(guestId())).equals(false);
    expect(usersTestUserPendingIds.includes(testUserId())).equals(false);
    expect(usersTestUserDenied.length).equals(0);
    expect(usersTestUserDeniedIds.includes(ownerId())).equals(false);
    expect(usersTestUserDeniedIds.includes(adminId())).equals(false);
    expect(usersTestUserDeniedIds.includes(editorId())).equals(false);
    expect(usersTestUserDeniedIds.includes(viewerId())).equals(false);
    expect(usersTestUserDeniedIds.includes(guestId())).equals(false);
    expect(usersTestUserDeniedIds.includes(testUserId())).equals(false);
    expect(usersTestUserApproved.length).equals(1);
    expect(usersTestUserApprovedIds.includes(ownerId())).equals(false);
    expect(usersTestUserApprovedIds.includes(adminId())).equals(false);
    expect(usersTestUserApprovedIds.includes(editorId())).equals(false);
    expect(usersTestUserApprovedIds.includes(viewerId())).equals(false);
    expect(usersTestUserApprovedIds.includes(guestId())).equals(false);
    expect(usersTestUserApprovedIds.includes(testUserId())).equals(true);
  });
  test("checks that getListOfUsers(...) succeeds and filters properly when System is installed", testFunc4());

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

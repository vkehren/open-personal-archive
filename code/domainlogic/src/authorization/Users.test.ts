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

  const testFunc2 = (functionType: TestUtils.TestFunctionType) => (async () => {
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
    if (functionType == "logic") {await expect(Users.setUserToApprovalState(callState, testUserId(), OPA.ApprovalStates.denied)).to.eventually.be.rejectedWith(Error);}
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
    if (functionType == "logic") {await expect(Users.setUserToApprovalState(callState, testUserId(), OPA.ApprovalStates.approved)).to.eventually.be.rejectedWith(Error);}
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
    else {await expect(OpaDb.Users.queries.setToSuspended(config.dataStorageState, testUserId(), testStartReason, ambientUserId())).to.eventually.be.rejectedWith(Error);}
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
    else {await expect(OpaDb.Users.queries.setToUnSuspended(config.dataStorageState, testUserId(), testEndReason, ambientUserId())).to.eventually.be.rejectedWith(Error);}
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
    else {await expect(OpaDb.Users.queries.markAsDeleted(config.dataStorageState, testUserId(), ambientUserId())).to.eventually.be.rejectedWith(Error);}
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
    else {await expect(OpaDb.Users.queries.markAsDeleted(config.dataStorageState, testUserId(), ambientUserId())).to.eventually.be.rejectedWith(Error);}
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

  const testFunc3 = (functionType: TestUtils.TestFunctionType) => (async () => {
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
    if (functionType == "logic") {await Users.setUserToApprovalState(callState, testUserId(), OPA.ApprovalStates.denied);}
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
    const roleToAssign = await OpaDb.Roles.queries.getByIdWithAssert(config.dataStorageState, OpaDm.Role_AdministratorId);
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
    else {await expect(OpaDb.Users.queries.setToSuspended(config.dataStorageState, testUserId(), testStartReason, ambientUserId())).to.eventually.be.rejectedWith(Error);}
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
    else {await OpaDb.Users.queries.setToSuspended(config.dataStorageState, testUserId(), testStartReason, ambientUserId());}
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
    else {await expect(OpaDb.Users.queries.setToSuspended(config.dataStorageState, testUserId(), testStartReason, ambientUserId())).to.eventually.be.rejectedWith(Error);}
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
    else {await expect(OpaDb.Users.queries.setToUnSuspended(config.dataStorageState, testUserId(), testEndReason, ambientUserId())).to.eventually.be.rejectedWith(Error);}
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
    else {await OpaDb.Users.queries.setToUnSuspended(config.dataStorageState, testUserId(), testEndReason, ambientUserId());}
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
    else {await expect(OpaDb.Users.queries.setToUnSuspended(config.dataStorageState, testUserId(), testEndReason, ambientUserId())).to.eventually.be.rejectedWith(Error);}
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
    else {await expect(OpaDb.Users.queries.markAsDeleted(config.dataStorageState, testUserId(), ambientUserId())).to.eventually.be.rejectedWith(Error);}
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
    else {await OpaDb.Users.queries.markAsDeleted(config.dataStorageState, testUserId(), ambientUserId());}
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
    else {await OpaDb.Users.queries.markAsUnDeleted(config.dataStorageState, testUserId(), ambientUserId());}
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
    else {await OpaDb.Users.queries.markAsDeleted(config.dataStorageState, testUserId(), ambientUserId());}
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
    else {await OpaDb.Users.queries.markAsUnDeleted(config.dataStorageState, testUserId(), ambientUserId());}
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

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

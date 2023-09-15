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

describe("Tests using Firebase " + config.testEnvironment, function () {
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
      const owner = await OpaDb.Users.queries.getById(config.dataStorageState, OpaDm.User_OwnerId);

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

  const testFunc1 = () => (async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);
    let user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    // NOTE: Construct the CallState directly because calling the utility function to do so will fail
    const callState: OpaDm.ICallState = {
      dataStorageState: config.dataStorageState,
      authenticationState: config.authenticationState,
      hasSystemState: false,
      hasAuthorizationState: false,
    };

    await expect(Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email)).to.eventually.be.rejectedWith(Error);
    callState.dataStorageState.currentWriteBatch = null; // NOTE: This should be done in the outer try-catch-finally of the calling Firebase function
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);
  });
  test("checks that initializeUserAccount(...) fails when System is not installed", testFunc1());

  const testFunc2 = (functionType: TestUtils.TestFunctionType) => (async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);
    let user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    await TestUtils.performInstallForTest(config.dataStorageState, config.authenticationState);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);

    const authProvider = await OpaDb.AuthProviders.queries.getByExternalAuthProviderId(config.dataStorageState, config.authenticationState.providerId);
    expect(authProvider).not.equals(null);
    const authProviderNonNull = OPA.convertNonNullish(authProvider);

    // NOTE: Do NOT set the test AuthenticationState to a User other than the Archive Owner
    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);

    await expect(Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email)).to.eventually.be.rejectedWith(Error);
    callState.dataStorageState.currentWriteBatch = null; // NOTE: This should be done in the outer try-catch-finally of the calling Firebase function
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);

    // NOTE: Since the Test User is also the Owner, record that fact
    TestAuthData.testUser = TestAuthData.owner;

    let userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.owner.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(userNonNull.firstName).equals(TestAuthData.owner.firstName);
    expect(userNonNull.lastName).equals(TestAuthData.owner.lastName);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(1);
    expect((userNonNull.updateHistory[0] as any).updateHistory).equals(undefined);
    expect(userNonNull.hasBeenUpdated).equals(false);
    expect(userNonNull.dateOfLatestUpdate).equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(null);
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const firstName_Updated = (userNonNull.firstName + " UPDATED");
    let userUpdateObject = ({firstName: firstName_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.owner.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(TestAuthData.owner.lastName);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(2);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const lastName_Updated = (userNonNull.lastName + " UPDATED");
    userUpdateObject = ({lastName: lastName_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.owner.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(3);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let recentQueries_Updated = ([testString_Hello] as Array<string> | firestore.FieldValue);
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.owner.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(4);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    recentQueries_Updated = config.dataStorageState.constructorProvider.arrayUnion(testString_World, testString_EXCLAIM);
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.owner.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(3);
    expect(userNonNull.updateHistory.length).equals(5);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    recentQueries_Updated = config.dataStorageState.constructorProvider.arrayRemove(testString_Hello, testString_EXCLAIM);
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.owner.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(6);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    recentQueries_Updated = [];
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.owner.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(7);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const roleToAssign = await OpaDb.Roles.queries.getById(config.dataStorageState, OpaDm.Role_ViewerId);
    const roleToAssignNonNull = OPA.convertNonNullish(roleToAssign);
    if (functionType == "logic") {await expect(Users.assignUserToRole(callState, testUserId(), roleToAssignNonNull.id)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.assignToRole(config.dataStorageState, testUserId(), roleToAssignNonNull, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.owner.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(7);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToViewed(callState, testUserId())).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToViewed(config.dataStorageState, testUserId(), ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.owner.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(7);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToApprovalState(callState, testUserId(), OpaDm.ApprovalStates.denied)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToDecidedOption(config.dataStorageState, testUserId(), OpaDm.ApprovalStates.denied, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.owner.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(7);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToApprovalState(callState, testUserId(), OpaDm.ApprovalStates.approved)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToDecidedOption(config.dataStorageState, testUserId(), OpaDm.ApprovalStates.approved, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.owner.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(7);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToSuspended(callState, testUserId(), testStartReason)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToSuspended(config.dataStorageState, testUserId(), testStartReason, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.owner.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(7);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToUnSuspended(callState, testUserId(), testEndReason)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToUnSuspended(config.dataStorageState, testUserId(), testEndReason, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.owner.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(7);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.markUserAsDeleted(callState, testUserId())).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.markAsDeleted(config.dataStorageState, testUserId(), ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.owner.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(7);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.markUserAsDeleted(callState, testUserId())).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.markAsDeleted(config.dataStorageState, testUserId(), ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.owner.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.owner.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.Role_OwnerId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(7);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(testUserId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);
  });
  test("checks that initializeUserAccount(...) fails but some User updates succeed when System is installed and User is Archive Owner", testFunc2("query"));
  test("checks that initializeUserAccount(...) fails but some User updates succeed when System is installed and User is Archive Owner", testFunc2("logic"));

  const testFunc3 = (functionType: TestUtils.TestFunctionType) => (async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);
    let user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    await TestUtils.performInstallForTest(config.dataStorageState, config.authenticationState);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);

    const authProvider = await OpaDb.AuthProviders.queries.getByExternalAuthProviderId(config.dataStorageState, config.authenticationState.providerId);
    expect(authProvider).not.equals(null);
    const authProviderNonNull = OPA.convertNonNullish(authProvider);

    // NOTE: Set the ambient AuthenticationState to a User other than the Archive Owner
    config.authenticationState = TestAuthData.testUser;
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    user = await Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email);
    expect(user).not.equals(null);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);

    // NOTE: Since the TestUser is newly created, record the userId
    TestAuthData.testUser.opaUserId = OPA.convertNonNullish(user).id;

    let userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(userNonNull.firstName).equals(TestAuthData.testUser.firstName);
    expect(userNonNull.lastName).equals(TestAuthData.testUser.lastName);
    expect(userNonNull.requestedCitationIds.length).equals(0);
    expect(userNonNull.viewableCitationIds.length).equals(0);
    expect(userNonNull.dateOfLatestCitationChange).equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(null);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(1);
    expect((userNonNull.updateHistory[0] as any).updateHistory).equals(undefined);
    expect(userNonNull.hasBeenUpdated).equals(false);
    expect(userNonNull.dateOfLatestUpdate).equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(null);
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(false);
    expect(userNonNull.dateOfLatestViewing).equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(null);
    expect(userNonNull.hasBeenDecided).equals(false);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(userNonNull.dateOfDecision).equals(null);
    expect(userNonNull.userIdOfDecider).equals(null);
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.setUserToViewed(callState, testUserId());}
    else {await OpaDb.Users.queries.setToViewed(config.dataStorageState, testUserId(), ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(userNonNull.firstName).equals(TestAuthData.testUser.firstName);
    expect(userNonNull.lastName).equals(TestAuthData.testUser.lastName);
    expect(userNonNull.requestedCitationIds.length).equals(0);
    expect(userNonNull.viewableCitationIds.length).equals(0);
    expect(userNonNull.dateOfLatestCitationChange).equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(null);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(2);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(false);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(userNonNull.dateOfDecision).equals(null);
    expect(userNonNull.userIdOfDecider).equals(null);
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.setUserToApprovalState(callState, testUserId(), OpaDm.ApprovalStates.denied);}
    else {await OpaDb.Users.queries.setToDecidedOption(config.dataStorageState, testUserId(), OpaDm.ApprovalStates.denied, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(userNonNull.firstName).equals(TestAuthData.testUser.firstName);
    expect(userNonNull.lastName).equals(TestAuthData.testUser.lastName);
    expect(userNonNull.requestedCitationIds.length).equals(0);
    expect(userNonNull.viewableCitationIds.length).equals(0);
    expect(userNonNull.dateOfLatestCitationChange).equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(null);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(3);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.denied);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.setUserToApprovalState(callState, testUserId(), OpaDm.ApprovalStates.approved);}
    else {await OpaDb.Users.queries.setToDecidedOption(config.dataStorageState, testUserId(), OpaDm.ApprovalStates.approved, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(userNonNull.firstName).equals(TestAuthData.testUser.firstName);
    expect(userNonNull.lastName).equals(TestAuthData.testUser.lastName);
    expect(userNonNull.requestedCitationIds.length).equals(0);
    expect(userNonNull.viewableCitationIds.length).equals(0);
    expect(userNonNull.dateOfLatestCitationChange).equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(null);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(4);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const firstName_Updated = (userNonNull.firstName + " UPDATED");
    let userUpdateObject = ({firstName: firstName_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(TestAuthData.testUser.lastName);
    expect(userNonNull.requestedCitationIds.length).equals(0);
    expect(userNonNull.viewableCitationIds.length).equals(0);
    expect(userNonNull.dateOfLatestCitationChange).equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(null);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(5);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const lastName_Updated = (userNonNull.lastName + " UPDATED");
    userUpdateObject = ({lastName: lastName_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(0);
    expect(userNonNull.viewableCitationIds.length).equals(0);
    expect(userNonNull.dateOfLatestCitationChange).equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(null);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(6);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let recentQueries_Updated = ([testString_Hello] as Array<string> | firestore.FieldValue);
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(0);
    expect(userNonNull.viewableCitationIds.length).equals(0);
    expect(userNonNull.dateOfLatestCitationChange).equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(null);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(7);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    recentQueries_Updated = config.dataStorageState.constructorProvider.arrayUnion(testString_World, testString_EXCLAIM);
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(0);
    expect(userNonNull.viewableCitationIds.length).equals(0);
    expect(userNonNull.dateOfLatestCitationChange).equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(null);
    expect(userNonNull.recentQueries.length).equals(3);
    expect(userNonNull.updateHistory.length).equals(8);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    recentQueries_Updated = config.dataStorageState.constructorProvider.arrayRemove(testString_Hello, testString_EXCLAIM);
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(0);
    expect(userNonNull.viewableCitationIds.length).equals(0);
    expect(userNonNull.dateOfLatestCitationChange).equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(null);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(9);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    recentQueries_Updated = [];
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    if (functionType == "logic") {await Users.updateUserProfile(callState, userUpdateObject);}
    else {await OpaDb.Users.queries.update(config.dataStorageState, testUserId(), userUpdateObject, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(0);
    expect(userNonNull.viewableCitationIds.length).equals(0);
    expect(userNonNull.dateOfLatestCitationChange).equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(null);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(10);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const roleToAssign = await OpaDb.Roles.queries.getById(config.dataStorageState, OpaDm.Role_AdministratorId);
    const roleToAssignNonNull = OPA.convertNonNullish(roleToAssign);
    OPA.assertIsFalse(OpaDm.DefaultRoleId == roleToAssignNonNull.id);
    if (functionType == "logic") {await expect(Users.assignUserToRole(callState, testUserId(), roleToAssignNonNull.id)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.assignToRole(config.dataStorageState, testUserId(), roleToAssignNonNull, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(OpaDm.DefaultRoleId);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(0);
    expect(userNonNull.viewableCitationIds.length).equals(0);
    expect(userNonNull.dateOfLatestCitationChange).equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(null);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(10);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.assignUserToRole(callState, testUserId(), roleToAssignNonNull.id);}
    else {await OpaDb.Users.queries.assignToRole(config.dataStorageState, testUserId(), roleToAssignNonNull, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(roleToAssignNonNull.id);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(0);
    expect(userNonNull.viewableCitationIds.length).equals(0);
    expect(userNonNull.dateOfLatestCitationChange).equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(null);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(11);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.addRequestedCitationToUser(callState, testUserId(), testCitationId1)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.addRequestedCitation(config.dataStorageState, testUserId(), testCitationId1, ambientUserId())).to.eventually.be.rejectedWith(Error);}

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.addRequestedCitationToUser(callState, testUserId(), testCitationId1);}
    else {await OpaDb.Users.queries.addRequestedCitation(config.dataStorageState, testUserId(), testCitationId1, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(roleToAssignNonNull.id);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(1);
    expect(userNonNull.viewableCitationIds.length).equals(0);
    expect(userNonNull.dateOfLatestCitationChange).not.equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(testUserId());
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(12);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.addRequestedCitationToUser(callState, testUserId(), testCitationId2)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.addRequestedCitation(config.dataStorageState, testUserId(), testCitationId2, ambientUserId())).to.eventually.be.rejectedWith(Error);}

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.addRequestedCitationToUser(callState, testUserId(), testCitationId2);}
    else {await OpaDb.Users.queries.addRequestedCitation(config.dataStorageState, testUserId(), testCitationId2, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(roleToAssignNonNull.id);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(2);
    expect(userNonNull.viewableCitationIds.length).equals(0);
    expect(userNonNull.dateOfLatestCitationChange).not.equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(testUserId());
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(13);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.addViewableCitationToUser(callState, testUserId(), testCitationId1)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.addViewableCitation(config.dataStorageState, testUserId(), testCitationId1, ambientUserId())).to.eventually.be.rejectedWith(Error);}

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.addViewableCitationToUser(callState, testUserId(), testCitationId1);}
    else {await OpaDb.Users.queries.addViewableCitation(config.dataStorageState, testUserId(), testCitationId1, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(roleToAssignNonNull.id);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(2);
    expect(userNonNull.viewableCitationIds.length).equals(1);
    expect(userNonNull.dateOfLatestCitationChange).not.equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(ownerId());
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(14);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.addViewableCitationToUser(callState, testUserId(), testCitationId2)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.addViewableCitation(config.dataStorageState, testUserId(), testCitationId2, ambientUserId())).to.eventually.be.rejectedWith(Error);}

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.addViewableCitationToUser(callState, testUserId(), testCitationId2);}
    else {await OpaDb.Users.queries.addViewableCitation(config.dataStorageState, testUserId(), testCitationId2, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(roleToAssignNonNull.id);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(2);
    expect(userNonNull.viewableCitationIds.length).equals(2);
    expect(userNonNull.dateOfLatestCitationChange).not.equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(ownerId());
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(15);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToSuspended(callState, testUserId(), testStartReason)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToSuspended(config.dataStorageState, testUserId(), testStartReason, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(roleToAssignNonNull.id);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(2);
    expect(userNonNull.viewableCitationIds.length).equals(2);
    expect(userNonNull.dateOfLatestCitationChange).not.equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(ownerId());
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(15);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(false);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(null);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(null);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.setUserToSuspended(callState, testUserId(), testStartReason);}
    else {await OpaDb.Users.queries.setToSuspended(config.dataStorageState, testUserId(), testStartReason, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(roleToAssignNonNull.id);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(2);
    expect(userNonNull.viewableCitationIds.length).equals(2);
    expect(userNonNull.dateOfLatestCitationChange).not.equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(ownerId());
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(16);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(true);
    expect(userNonNull.isSuspended).equals(true);
    expect(userNonNull.hasSuspensionStarted).equals(true);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(testStartReason);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).not.equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(ownerId());
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToSuspended(callState, testUserId(), testStartReason)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToSuspended(config.dataStorageState, testUserId(), testStartReason, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(roleToAssignNonNull.id);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(2);
    expect(userNonNull.viewableCitationIds.length).equals(2);
    expect(userNonNull.dateOfLatestCitationChange).not.equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(ownerId());
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(16);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(true);
    expect(userNonNull.isSuspended).equals(true);
    expect(userNonNull.hasSuspensionStarted).equals(true);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(testStartReason);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).not.equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(ownerId());
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToUnSuspended(callState, testUserId(), testEndReason)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToUnSuspended(config.dataStorageState, testUserId(), testEndReason, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(roleToAssignNonNull.id);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(2);
    expect(userNonNull.viewableCitationIds.length).equals(2);
    expect(userNonNull.dateOfLatestCitationChange).not.equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(ownerId());
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(16);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(true);
    expect(userNonNull.isSuspended).equals(true);
    expect(userNonNull.hasSuspensionStarted).equals(true);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(testStartReason);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).not.equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(ownerId());
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.setUserToUnSuspended(callState, testUserId(), testEndReason);}
    else {await OpaDb.Users.queries.setToUnSuspended(config.dataStorageState, testUserId(), testEndReason, ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(roleToAssignNonNull.id);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(2);
    expect(userNonNull.viewableCitationIds.length).equals(2);
    expect(userNonNull.dateOfLatestCitationChange).not.equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(ownerId());
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(17);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(true);
    expect(userNonNull.hasSuspensionEnded).equals(true);
    expect(userNonNull.reasonForSuspensionStart).equals(testStartReason);
    expect(userNonNull.reasonForSuspensionEnd).equals(testEndReason);
    expect(userNonNull.dateOfSuspensionStart).not.equals(null);
    expect(userNonNull.dateOfSuspensionEnd).not.equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(ownerId());
    expect(userNonNull.userIdOfSuspensionEnder).equals(ownerId());
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.setUserToUnSuspended(callState, testUserId(), testEndReason)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.setToUnSuspended(config.dataStorageState, testUserId(), testEndReason, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(roleToAssignNonNull.id);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(2);
    expect(userNonNull.viewableCitationIds.length).equals(2);
    expect(userNonNull.dateOfLatestCitationChange).not.equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(ownerId());
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(17);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(true);
    expect(userNonNull.hasSuspensionEnded).equals(true);
    expect(userNonNull.reasonForSuspensionStart).equals(testStartReason);
    expect(userNonNull.reasonForSuspensionEnd).equals(testEndReason);
    expect(userNonNull.dateOfSuspensionStart).not.equals(null);
    expect(userNonNull.dateOfSuspensionEnd).not.equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(ownerId());
    expect(userNonNull.userIdOfSuspensionEnder).equals(ownerId());
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(Users.markUserAsDeleted(callState, testUserId())).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.Users.queries.markAsDeleted(config.dataStorageState, testUserId(), ambientUserId())).to.eventually.be.rejectedWith(Error);}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(roleToAssignNonNull.id);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(2);
    expect(userNonNull.viewableCitationIds.length).equals(2);
    expect(userNonNull.dateOfLatestCitationChange).not.equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(ownerId());
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(17);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(true);
    expect(userNonNull.hasSuspensionEnded).equals(true);
    expect(userNonNull.reasonForSuspensionStart).equals(testStartReason);
    expect(userNonNull.reasonForSuspensionEnd).equals(testEndReason);
    expect(userNonNull.dateOfSuspensionStart).not.equals(null);
    expect(userNonNull.dateOfSuspensionEnd).not.equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(ownerId());
    expect(userNonNull.userIdOfSuspensionEnder).equals(ownerId());
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Users.markUserAsDeleted(callState, testUserId());}
    else {await OpaDb.Users.queries.markAsDeleted(config.dataStorageState, testUserId(), ambientUserId());}
    user = await OpaDb.Users.queries.getById(config.dataStorageState, testUserId());
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(TestAuthData.testUser.email);
    expect(userNonNull.authAccountNameLowered).equals(TestAuthData.testUser.email.toLowerCase());
    expect(userNonNull.assignedRoleId).equals(roleToAssignNonNull.id);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.requestedCitationIds.length).equals(2);
    expect(userNonNull.viewableCitationIds.length).equals(2);
    expect(userNonNull.dateOfLatestCitationChange).not.equals(null);
    expect(userNonNull.userIdOfLatestCitationChanger).equals(ownerId());
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(18);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(userNonNull.dateOfLatestRoleAssignment).not.equals(null);
    expect(userNonNull.userIdOfLatestRoleAssigner).equals(ownerId());
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(ownerId());
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.isSuspended).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(true);
    expect(userNonNull.hasSuspensionEnded).equals(true);
    expect(userNonNull.reasonForSuspensionStart).equals(testStartReason);
    expect(userNonNull.reasonForSuspensionEnd).equals(testEndReason);
    expect(userNonNull.dateOfSuspensionStart).not.equals(null);
    expect(userNonNull.dateOfSuspensionEnd).not.equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(ownerId());
    expect(userNonNull.userIdOfSuspensionEnder).equals(ownerId());
    expect(userNonNull.isMarkedAsDeleted).equals(true);
    expect(userNonNull.dateOfDeletion).not.equals(null);
    expect(userNonNull.userIdOfDeleter).equals(testUserId());
  });
  test("checks that initializeUserAccount(...) succeeds and User updates succeed when System is installed and User is not Archive Owner", testFunc3("query"));
  test("checks that initializeUserAccount(...) succeeds and User updates succeed when System is installed and User is not Archive Owner", testFunc3("logic"));

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

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
import * as AccessRequests from "./AccessRequests";
import {TestAuthData} from "../TestData.test";
import * as TestConfig from "../TestConfiguration.test";
import * as TestUtils from "../TestUtilities.test";

const config = TestConfig.getTestConfiguration();
const ambientAuth = (): TestConfig.IAuthenticationStateForTests => (config.authenticationState);
const ambientUserId = (): string => (ambientAuth().opaUserId);
const ownerId = (): string => (TestAuthData.owner.opaUserId);
const testUserId = (): string => (TestAuthData.testUser.opaUserId);
const testMessage = "Please give me access to your archive.";
const testCitationId_Null: string | null = null;
const testCitationId_NonNull: string = "CITATION_1234";
const testResponse = "OK.";

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

  const testFunc1 = (testCitationId: string | null) => (async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
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

    await expect(AccessRequests.requestUserAccess(callState, testMessage, testCitationId)).to.eventually.be.rejectedWith(Error);
  });
  test("checks that requestUserAccess(...) fails when System is not installed", testFunc1(testCitationId_Null));
  test("checks that requestUserAccess(...) fails when System is not installed", testFunc1(testCitationId_NonNull));

  const testFunc2 = (testCitationId: string | null) => (async () => {
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

    // NOTE: Since the Test User is also the Owner, record that fact
    TestAuthData.testUser = TestAuthData.owner;
    await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    await expect(AccessRequests.requestUserAccess(callState, testMessage, testCitationId)).to.eventually.be.rejectedWith(Error);
  });
  test("checks that requestUserAccess(...) fails when System is installed and User is Archive Owner", testFunc2(testCitationId_Null));
  test("checks that requestUserAccess(...) fails when System is installed and User is Archive Owner", testFunc2(testCitationId_NonNull));

  const testFunc3 = (testCitationId: string | null) => (async () => {
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
    let user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    // NOTE: Since the TestUser is newly created, record the userId
    TestAuthData.testUser.opaUserId = OPA.convertNonNullish(user).id;

    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);

    const accessRequestNullable = await AccessRequests.requestUserAccess(callState, testMessage, testCitationId);
    expect(accessRequestNullable).not.equals(null);
    const accessRequestId = OPA.convertNonNullish(accessRequestNullable).id;
    let accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    await TestUtils.assertUserDoesExist(config.dataStorageState, config.authenticationState);
    user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    const hasCitationId = (!OPA.isNullish(testCitationId));
    if (!hasCitationId) {
      expect(user.requestedCitationIds.length).equals(0);
    } else {
      expect(user.requestedCitationIds.length).equals(1);
      expect(user.requestedCitationIds[0]).equals(testCitationId);
    }

    let accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals("");
    expect(accessRequestNonNull.updateHistory.length).equals(1);
    expect((accessRequestNonNull.updateHistory[0] as any).updateHistory).equals(undefined);
    expect(accessRequestNonNull.hasBeenUpdated).equals(false);
    expect(accessRequestNonNull.dateOfLatestUpdate).equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(null);
    expect(accessRequestNonNull.tags.length).equals(0);
    expect(accessRequestNonNull.dateOfLatestTagging).equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(null);
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(null);
    expect(accessRequestNonNull.hasBeenViewed).equals(false);
    expect(accessRequestNonNull.dateOfLatestViewing).equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(null);
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    await OpaDb.AccessRequests.queries.setTags(config.dataStorageState, accessRequestId, ["a", "b", "c"], ambientUserId());
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals("");
    expect(accessRequestNonNull.updateHistory.length).equals(2);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(null);
    expect(accessRequestNonNull.hasBeenViewed).equals(false);
    expect(accessRequestNonNull.dateOfLatestViewing).equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(null);
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    await OpaDb.AccessRequests.queries.setToViewed(config.dataStorageState, accessRequestId, ambientUserId());
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals("");
    expect(accessRequestNonNull.updateHistory.length).equals(3);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(null);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(ownerId());
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    // NOTE: Set to Viewed by User who created AccessRequest so that "userIdOfLatestViewer" changes to value other than "ownerId()" for next step
    await OpaDb.AccessRequests.queries.setToViewed(config.dataStorageState, accessRequestId, ambientUserId());
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals("");
    expect(accessRequestNonNull.updateHistory.length).equals(4);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(null);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    let accessRequestUpdateObject = ({response: OpaDm.localizableStringConstructor(OpaDm.DefaultLocale, testResponse)} as OpaDm.IAccessRequestPartial);
    await OpaDb.AccessRequests.queries.update(config.dataStorageState, accessRequestId, accessRequestUpdateObject, ambientUserId());
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse);
    expect(accessRequestNonNull.updateHistory.length).equals(5);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(null);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    const testResponse_Updated = (testResponse + " UPDATED");
    accessRequestUpdateObject = ({response: OpaDm.localizableStringConstructor(OpaDm.DefaultLocale, testResponse_Updated)} as OpaDm.IAccessRequestPartial);
    await OpaDb.AccessRequests.queries.update(config.dataStorageState, accessRequestId, accessRequestUpdateObject, ambientUserId());
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(6);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(null);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    const testMessage_Updated = (testMessage + " UPDATED");
    accessRequestUpdateObject = ({message: OpaDm.localizableStringConstructor(OpaDm.DefaultLocale, testMessage_Updated)} as OpaDm.IAccessRequestPartial);
    await OpaDb.AccessRequests.queries.update(config.dataStorageState, accessRequestId, accessRequestUpdateObject, ambientUserId());
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(7);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(null);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    await OpaDb.AccessRequests.queries.setToArchivalOption(config.dataStorageState, accessRequestId, true, ambientUserId());
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(8);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequestNonNull.isArchived).equals(true);
    expect(accessRequestNonNull.dateOfArchivalChange).not.equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(testUserId());
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    await OpaDb.AccessRequests.queries.setToArchivalOption(config.dataStorageState, accessRequestId, false, ambientUserId());
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(9);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).not.equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(ownerId());
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    await OpaDb.AccessRequests.queries.setToDecidedOption(config.dataStorageState, accessRequestId, OpaDm.ApprovalStates.denied, ambientUserId());
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(10);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).not.equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(ownerId());
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(accessRequestNonNull.hasBeenDecided).equals(true);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.denied);
    expect(accessRequestNonNull.dateOfDecision).not.equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(ownerId());
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    await OpaDb.AccessRequests.queries.setToDecidedOption(config.dataStorageState, accessRequestId, OpaDm.ApprovalStates.approved, ambientUserId());
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(11);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).not.equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(ownerId());
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(accessRequestNonNull.hasBeenDecided).equals(true);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(accessRequestNonNull.dateOfDecision).not.equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(ownerId());
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.owner;
    await expect(OpaDb.AccessRequests.queries.markAsDeleted(config.dataStorageState, accessRequestId, ambientUserId())).to.eventually.be.rejectedWith(Error);
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(11);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).not.equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(ownerId());
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(accessRequestNonNull.hasBeenDecided).equals(true);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(accessRequestNonNull.dateOfDecision).not.equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(ownerId());
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    config.authenticationState = TestAuthData.testUser;
    await OpaDb.AccessRequests.queries.markAsDeleted(config.dataStorageState, accessRequestId, ambientUserId());
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(12);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(testUserId());
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).not.equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(ownerId());
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(testUserId());
    expect(accessRequestNonNull.hasBeenDecided).equals(true);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(accessRequestNonNull.dateOfDecision).not.equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(ownerId());
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(true);
    expect(accessRequestNonNull.dateOfDeletion).not.equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(testUserId());
  });
  test("checks that requestUserAccess(...) succeeds and AccessRequest updates succeed when System is installed and User is not Archive Owner", testFunc3(testCitationId_Null));
  test("checks that requestUserAccess(...) succeeds and AccessRequest updates succeed when System is installed and User is not Archive Owner", testFunc3(testCitationId_NonNull));

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

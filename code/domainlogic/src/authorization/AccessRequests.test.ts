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

/* eslint-disable brace-style, camelcase */

const config = TestConfig.getTestConfiguration();
const ambientAuth = (): TestConfig.IAuthenticationStateForTests => (config.authenticationState);
const ambientUserId = (): string => (ambientAuth().opaUserId);
const ownerId = (): string => (TestAuthData.owner.opaUserId);
const adminId = (): string => (TestAuthData.admin.opaUserId);
const testUserId = (): string => (TestAuthData.testUser.opaUserId);
const testMessage = "Please give me access to your archive.";
const testCitationId_Null: string | null = null;
const testCitationId_NonNull = "CITATION_1234";
const testResponse = "OK.";

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
    const callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
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

  const testFunc3 = (testCitationId: string | null, functionType: TestConfig.TestFunctionType) => (async () => {
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
    TestAuthData.testUser.opaUserId = user.id;

    // LATER: Check that relevant AccessRequests functions fail prior to approving Test User
    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    user = await Users.setUserToApproved(callState, testUserId());

    config.authenticationState = TestAuthData.testUser;
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

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals("");
    expect(accessRequest.updateHistory.length).equals(1);
    expect((accessRequest.updateHistory[0] as OpaDm.IAccessRequest).updateHistory).equals(undefined);
    expect(accessRequest.hasBeenUpdated).equals(false);
    expect(accessRequest.dateOfLatestUpdate).equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(null);
    expect(accessRequest.tags.length).equals(0);
    expect(accessRequest.dateOfLatestTagging).equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(null);
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(null);
    expect(accessRequest.hasBeenViewed).equals(false);
    expect(accessRequest.dateOfLatestViewing).equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(null);
    expect(accessRequest.hasBeenDecided).equals(false);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.pending);
    expect(accessRequest.dateOfDecision).equals(null);
    expect(accessRequest.userIdOfDecider).equals(null);
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    const invalidUpdateObject = (({updateHistory: "BLANK"} as unknown) as OpaDm.IAccessRequestPartial);
    await expect(OpaDb.AccessRequests.queries.update(config.dataStorageState, accessRequestId, invalidUpdateObject, ambientUserId())).to.eventually.be.rejectedWith(Error);
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals("");
    expect(accessRequest.updateHistory.length).equals(1);
    expect((accessRequest.updateHistory[0] as OpaDm.IAccessRequest).updateHistory).equals(undefined);
    expect(accessRequest.hasBeenUpdated).equals(false);
    expect(accessRequest.dateOfLatestUpdate).equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(null);
    expect(accessRequest.tags.length).equals(0);
    expect(accessRequest.dateOfLatestTagging).equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(null);
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(null);
    expect(accessRequest.hasBeenViewed).equals(false);
    expect(accessRequest.dateOfLatestViewing).equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(null);
    expect(accessRequest.hasBeenDecided).equals(false);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.pending);
    expect(accessRequest.dateOfDecision).equals(null);
    expect(accessRequest.userIdOfDecider).equals(null);
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const tags = ["a", "b", "c"];
    if (functionType == "logic") {await AccessRequests.setAccessRequestTags(callState, accessRequestId, tags);}
    else {await OpaDb.AccessRequests.queries.setTags(config.dataStorageState, accessRequestId, tags, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals("");
    expect(accessRequest.updateHistory.length).equals(2);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(null);
    expect(accessRequest.hasBeenViewed).equals(false);
    expect(accessRequest.dateOfLatestViewing).equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(null);
    expect(accessRequest.hasBeenDecided).equals(false);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.pending);
    expect(accessRequest.dateOfDecision).equals(null);
    expect(accessRequest.userIdOfDecider).equals(null);
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await AccessRequests.setAccessRequestToViewed(callState, accessRequestId);}
    else {await OpaDb.AccessRequests.queries.setToViewed(config.dataStorageState, accessRequestId, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals("");
    expect(accessRequest.updateHistory.length).equals(3);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(null);
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(ownerId());
    expect(accessRequest.hasBeenDecided).equals(false);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.pending);
    expect(accessRequest.dateOfDecision).equals(null);
    expect(accessRequest.userIdOfDecider).equals(null);
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(AccessRequests.setAccessRequestToViewed(callState, accessRequestId)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.AccessRequests.queries.setToViewed(config.dataStorageState, accessRequestId, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    // NOTE: Set to Viewed by User who created AccessRequest so that "userIdOfLatestViewer" changes to value other than "ownerId()" for next step
    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await AccessRequests.setAccessRequestToViewed(callState, accessRequestId);}
    else {await OpaDb.AccessRequests.queries.setToViewed(config.dataStorageState, accessRequestId, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals("");
    expect(accessRequest.updateHistory.length).equals(4);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(adminId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(null);
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(adminId());
    expect(accessRequest.hasBeenDecided).equals(false);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.pending);
    expect(accessRequest.dateOfDecision).equals(null);
    expect(accessRequest.userIdOfDecider).equals(null);
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let accessRequestUpdateObject = ({response: OPA.localizableStringConstructor(OpaDm.DefaultLocale, testResponse)} as OpaDm.IAccessRequestPartial);
    if (functionType == "logic") {await AccessRequests.updateResponseToAccessRequest(callState, accessRequestId, testResponse);}
    else {await OpaDb.AccessRequests.queries.update(config.dataStorageState, accessRequestId, accessRequestUpdateObject, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals(testResponse);
    expect(accessRequest.updateHistory.length).equals(5);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(null);
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(adminId());
    expect(accessRequest.hasBeenDecided).equals(false);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.pending);
    expect(accessRequest.dateOfDecision).equals(null);
    expect(accessRequest.userIdOfDecider).equals(null);
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const testResponse_Updated = (testResponse + " UPDATED");
    accessRequestUpdateObject = ({response: OPA.localizableStringConstructor(OpaDm.DefaultLocale, testResponse_Updated)} as OpaDm.IAccessRequestPartial);
    if (functionType == "logic") {await AccessRequests.updateResponseToAccessRequest(callState, accessRequestId, testResponse_Updated);}
    else {await OpaDb.AccessRequests.queries.update(config.dataStorageState, accessRequestId, accessRequestUpdateObject, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequest.updateHistory.length).equals(6);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(null);
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(adminId());
    expect(accessRequest.hasBeenDecided).equals(false);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.pending);
    expect(accessRequest.dateOfDecision).equals(null);
    expect(accessRequest.userIdOfDecider).equals(null);
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const testMessage_Updated = (testMessage + " UPDATED");
    accessRequestUpdateObject = ({message: OPA.localizableStringConstructor(OpaDm.DefaultLocale, testMessage_Updated)} as OpaDm.IAccessRequestPartial);
    if (functionType == "logic") {await AccessRequests.updateMessageForAccessRequest(callState, accessRequestId, testMessage_Updated);}
    else {await OpaDb.AccessRequests.queries.update(config.dataStorageState, accessRequestId, accessRequestUpdateObject, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequest.updateHistory.length).equals(7);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(testUserId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(null);
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(adminId());
    expect(accessRequest.hasBeenDecided).equals(false);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.pending);
    expect(accessRequest.dateOfDecision).equals(null);
    expect(accessRequest.userIdOfDecider).equals(null);
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(AccessRequests.setAccessRequestToArchived(callState, accessRequestId)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.AccessRequests.queries.setToArchivalOption(config.dataStorageState, accessRequestId, true, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await AccessRequests.setAccessRequestToArchived(callState, accessRequestId);}
    else {await OpaDb.AccessRequests.queries.setToArchivalOption(config.dataStorageState, accessRequestId, true, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequest.updateHistory.length).equals(8);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(adminId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(true);
    expect(accessRequest.dateOfArchivalChange).not.equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(adminId());
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(adminId());
    expect(accessRequest.hasBeenDecided).equals(false);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.pending);
    expect(accessRequest.dateOfDecision).equals(null);
    expect(accessRequest.userIdOfDecider).equals(null);
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await AccessRequests.setAccessRequestToNotArchived(callState, accessRequestId);}
    else {await OpaDb.AccessRequests.queries.setToArchivalOption(config.dataStorageState, accessRequestId, false, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequest.updateHistory.length).equals(9);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).not.equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(ownerId());
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(adminId());
    expect(accessRequest.hasBeenDecided).equals(false);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.pending);
    expect(accessRequest.dateOfDecision).equals(null);
    expect(accessRequest.userIdOfDecider).equals(null);
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(null);

    // NOTE: Set-and-UnSet a second time to verify logic
    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await AccessRequests.setAccessRequestToArchived(callState, accessRequestId);}
    else {await OpaDb.AccessRequests.queries.setToArchivalOption(config.dataStorageState, accessRequestId, true, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequest.updateHistory.length).equals(10);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(true);
    expect(accessRequest.dateOfArchivalChange).not.equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(ownerId());
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(adminId());
    expect(accessRequest.hasBeenDecided).equals(false);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.pending);
    expect(accessRequest.dateOfDecision).equals(null);
    expect(accessRequest.userIdOfDecider).equals(null);
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await AccessRequests.setAccessRequestToNotArchived(callState, accessRequestId);}
    else {await OpaDb.AccessRequests.queries.setToArchivalOption(config.dataStorageState, accessRequestId, false, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequest.updateHistory.length).equals(11);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).not.equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(ownerId());
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(adminId());
    expect(accessRequest.hasBeenDecided).equals(false);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.pending);
    expect(accessRequest.dateOfDecision).equals(null);
    expect(accessRequest.userIdOfDecider).equals(null);
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await AccessRequests.setAccessRequestToDenied(callState, accessRequestId);}
    else {await OpaDb.AccessRequests.queries.setToDecidedOption(config.dataStorageState, accessRequestId, OPA.ApprovalStates.denied, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequest.updateHistory.length).equals(12);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).not.equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(ownerId());
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(adminId());
    expect(accessRequest.hasBeenDecided).equals(true);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.denied);
    expect(accessRequest.dateOfDecision).not.equals(null);
    expect(accessRequest.userIdOfDecider).equals(ownerId());
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await AccessRequests.setAccessRequestToApproved(callState, accessRequestId);}
    else {await OpaDb.AccessRequests.queries.setToDecidedOption(config.dataStorageState, accessRequestId, OPA.ApprovalStates.approved, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequest.updateHistory.length).equals(13);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).not.equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(ownerId());
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(adminId());
    expect(accessRequest.hasBeenDecided).equals(true);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.approved);
    expect(accessRequest.dateOfDecision).not.equals(null);
    expect(accessRequest.userIdOfDecider).equals(ownerId());
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await expect(AccessRequests.markAccessRequestAsDeleted(callState, accessRequestId)).to.eventually.be.rejectedWith(Error);}
    else {await expect(OpaDb.AccessRequests.queries.markWithDeletionState(config.dataStorageState, accessRequestId, OPA.DeletionStates.deleted, ambientUserId())).to.eventually.be.rejectedWith(Error);}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequest.updateHistory.length).equals(13);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).not.equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(ownerId());
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(adminId());
    expect(accessRequest.hasBeenDecided).equals(true);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.approved);
    expect(accessRequest.dateOfDecision).not.equals(null);
    expect(accessRequest.userIdOfDecider).equals(ownerId());
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await AccessRequests.markAccessRequestAsDeleted(callState, accessRequestId);}
    else {await OpaDb.AccessRequests.queries.markWithDeletionState(config.dataStorageState, accessRequestId, OPA.DeletionStates.deleted, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequest.updateHistory.length).equals(14);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(testUserId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).not.equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(ownerId());
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(adminId());
    expect(accessRequest.hasBeenDecided).equals(true);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.approved);
    expect(accessRequest.dateOfDecision).not.equals(null);
    expect(accessRequest.userIdOfDecider).equals(ownerId());
    expect(accessRequest.isMarkedAsDeleted).equals(true);
    expect(accessRequest.dateOfDeletionChange).not.equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(testUserId());

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await AccessRequests.markAccessRequestAsUnDeleted(callState, accessRequestId);}
    else {await OpaDb.AccessRequests.queries.markWithDeletionState(config.dataStorageState, accessRequestId, OPA.DeletionStates.undeleted, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequest.updateHistory.length).equals(15);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(testUserId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).not.equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(ownerId());
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(adminId());
    expect(accessRequest.hasBeenDecided).equals(true);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.approved);
    expect(accessRequest.dateOfDecision).not.equals(null);
    expect(accessRequest.userIdOfDecider).equals(ownerId());
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).not.equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(testUserId());

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await AccessRequests.markAccessRequestAsDeleted(callState, accessRequestId);}
    else {await OpaDb.AccessRequests.queries.markWithDeletionState(config.dataStorageState, accessRequestId, OPA.DeletionStates.deleted, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequest.updateHistory.length).equals(16);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(testUserId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).not.equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(ownerId());
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(adminId());
    expect(accessRequest.hasBeenDecided).equals(true);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.approved);
    expect(accessRequest.dateOfDecision).not.equals(null);
    expect(accessRequest.userIdOfDecider).equals(ownerId());
    expect(accessRequest.isMarkedAsDeleted).equals(true);
    expect(accessRequest.dateOfDeletionChange).not.equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(testUserId());

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await AccessRequests.markAccessRequestAsUnDeleted(callState, accessRequestId);}
    else {await OpaDb.AccessRequests.queries.markWithDeletionState(config.dataStorageState, accessRequestId, OPA.DeletionStates.undeleted, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequest.updateHistory.length).equals(17);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(testUserId());
    expect(accessRequest.tags.length).equals(3);
    expect(accessRequest.dateOfLatestTagging).not.equals(null);
    expect(accessRequest.userIdOfLatestTagger).equals(ownerId());
    expect(accessRequest.isArchived).equals(false);
    expect(accessRequest.dateOfArchivalChange).not.equals(null);
    expect(accessRequest.userIdOfArchivalChanger).equals(ownerId());
    expect(accessRequest.hasBeenViewed).equals(true);
    expect(accessRequest.dateOfLatestViewing).not.equals(null);
    expect(accessRequest.userIdOfLatestViewer).equals(adminId());
    expect(accessRequest.hasBeenDecided).equals(true);
    expect(accessRequest.approvalState).equals(OPA.ApprovalStates.approved);
    expect(accessRequest.dateOfDecision).not.equals(null);
    expect(accessRequest.userIdOfDecider).equals(ownerId());
    expect(accessRequest.isMarkedAsDeleted).equals(false);
    expect(accessRequest.dateOfDeletionChange).not.equals(null);
    expect(accessRequest.userIdOfDeletionChanger).equals(testUserId());
  });
  test("checks that requestUserAccess(...) succeeds and AccessRequest updates succeed when System is installed and User is not Archive Owner", testFunc3(testCitationId_Null, "query"));
  test("checks that requestUserAccess(...) succeeds and AccessRequest updates succeed when System is installed and User is not Archive Owner", testFunc3(testCitationId_Null, "logic"));
  test("checks that requestUserAccess(...) succeeds and AccessRequest updates succeed when System is installed and User is not Archive Owner", testFunc3(testCitationId_NonNull, "query"));
  test("checks that requestUserAccess(...) succeeds and AccessRequest updates succeed when System is installed and User is not Archive Owner", testFunc3(testCitationId_NonNull, "logic"));

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

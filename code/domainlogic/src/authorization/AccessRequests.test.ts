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
    else {await OpaDb.AccessRequests.queries.setTags(config.dataStorageState, accessRequestId, tags, OPA.ArrayContentTypes.exact, ambientUserId());}
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
    const tagsToAdd = ["d", "e", "f", "g"];
    if (functionType == "logic") {await AccessRequests.addAccessRequestTags(callState, accessRequestId, tagsToAdd);}
    else {await OpaDb.AccessRequests.queries.setTags(config.dataStorageState, accessRequestId, tagsToAdd, OPA.ArrayContentTypes.only_added, ambientUserId());}
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
    expect(accessRequest.tags.length).equals(7);
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
    const tagsToRemove = ["b", "d", "f"];
    if (functionType == "logic") {await AccessRequests.removeAccessRequestTags(callState, accessRequestId, tagsToRemove);}
    else {await OpaDb.AccessRequests.queries.setTags(config.dataStorageState, accessRequestId, tagsToRemove, OPA.ArrayContentTypes.only_removed, ambientUserId());}
    accessRequest = await TestUtils.assertAccessRequestDoesExist(config.dataStorageState, accessRequestId);

    expect(accessRequest.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequest.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequest.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequest.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequest.response[OpaDm.DefaultLocale]).equals("");
    expect(accessRequest.updateHistory.length).equals(4);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.updateHistory.length).equals(5);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.updateHistory.length).equals(6);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(adminId());
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.updateHistory.length).equals(7);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.updateHistory.length).equals(8);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.updateHistory.length).equals(9);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(testUserId());
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.updateHistory.length).equals(10);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(adminId());
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.updateHistory.length).equals(11);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.updateHistory.length).equals(12);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.updateHistory.length).equals(13);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.updateHistory.length).equals(14);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.updateHistory.length).equals(15);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.updateHistory.length).equals(15);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(ownerId());
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.updateHistory.length).equals(16);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(testUserId());
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.updateHistory.length).equals(18);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(testUserId());
    expect(accessRequest.tags.length).equals(4);
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
    expect(accessRequest.updateHistory.length).equals(19);
    expect(accessRequest.hasBeenUpdated).equals(true);
    expect(accessRequest.dateOfLatestUpdate).not.equals(null);
    expect(accessRequest.userIdOfLatestUpdater).equals(testUserId());
    expect(accessRequest.tags.length).equals(4);
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
    let user = await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.testUser);

    // NOTE: Since the TestUser is newly created, record the userId
    TestAuthData.testUser.opaUserId = user.id;

    // LATER: Check that relevant AccessRequests functions fail prior to approving Test User
    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    user = await Users.setUserToApproved(callState, testUserId());

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const accessRequestT1 = await AccessRequests.requestUserAccess(callState, testMessage + "T1");
    const accessRequestT2 = await AccessRequests.requestUserAccess(callState, testMessage + "T2");
    const accessRequestT3 = await AccessRequests.requestUserAccess(callState, testMessage + "T3");

    config.authenticationState = TestAuthData.guest;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const accessRequestG1 = await AccessRequests.requestUserAccess(callState, testMessage + "G1");
    const accessRequestG2 = await AccessRequests.requestUserAccess(callState, testMessage + "G2");
    const accessRequestG3 = await AccessRequests.requestUserAccess(callState, testMessage + "G3");

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const accessRequestT1DM = await AccessRequests.convertAccessRequestToDisplayModel(callState, accessRequestT1);
    expect(accessRequestT1DM.id).equals(accessRequestT1.id);
    const accessRequestT2DM = await AccessRequests.convertAccessRequestToDisplayModel(callState, accessRequestT2);
    expect(accessRequestT2DM.id).equals(accessRequestT2.id);
    const accessRequestT3DM = await AccessRequests.convertAccessRequestToDisplayModel(callState, accessRequestT3);
    expect(accessRequestT3DM.id).equals(accessRequestT3.id);
    const accessRequestG1DM = await AccessRequests.convertAccessRequestToDisplayModel(callState, accessRequestG1);
    expect(accessRequestG1DM.id).equals(accessRequestG1.id);
    const accessRequestG2DM = await AccessRequests.convertAccessRequestToDisplayModel(callState, accessRequestG2);
    expect(accessRequestG2DM.id).equals(accessRequestG2.id);
    const accessRequestG3DM = await AccessRequests.convertAccessRequestToDisplayModel(callState, accessRequestG3);
    expect(accessRequestG3DM.id).equals(accessRequestG3.id);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let accessRequestsOwnerAll = await AccessRequests.getListOfAccessRequests(callState);
    let accessRequestsOwnerAllIds = accessRequestsOwnerAll.map((value) => (value.id));
    let accessRequestsOwnerPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    let accessRequestsOwnerPendingIds = accessRequestsOwnerPending.map((value) => (value.id));
    let accessRequestsOwnerDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    let accessRequestsOwnerDeniedIds = accessRequestsOwnerDenied.map((value) => (value.id));
    let accessRequestsOwnerApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    let accessRequestsOwnerApprovedIds = accessRequestsOwnerApproved.map((value) => (value.id));

    expect(accessRequestsOwnerAll.length).equals(6);
    expect(accessRequestsOwnerAllIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsOwnerAllIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsOwnerAllIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsOwnerAllIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsOwnerAllIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsOwnerAllIds.includes(accessRequestG3.id)).equals(true);
    expect(accessRequestsOwnerPending.length).equals(6);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestG3.id)).equals(true);
    expect(accessRequestsOwnerDenied.length).equals(0);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsOwnerApproved.length).equals(0);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestG3.id)).equals(false);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let accessRequestsAdminAll = await AccessRequests.getListOfAccessRequests(callState);
    let accessRequestsAdminAllIds = accessRequestsAdminAll.map((value) => (value.id));
    let accessRequestsAdminPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    let accessRequestsAdminPendingIds = accessRequestsAdminPending.map((value) => (value.id));
    let accessRequestsAdminDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    let accessRequestsAdminDeniedIds = accessRequestsAdminDenied.map((value) => (value.id));
    let accessRequestsAdminApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    let accessRequestsAdminApprovedIds = accessRequestsAdminApproved.map((value) => (value.id));

    expect(accessRequestsAdminAll.length).equals(6);
    expect(accessRequestsAdminAllIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsAdminAllIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsAdminAllIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsAdminAllIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsAdminAllIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsAdminAllIds.includes(accessRequestG3.id)).equals(true);
    expect(accessRequestsAdminPending.length).equals(6);
    expect(accessRequestsAdminPendingIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsAdminPendingIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsAdminPendingIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsAdminPendingIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsAdminPendingIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsAdminPendingIds.includes(accessRequestG3.id)).equals(true);
    expect(accessRequestsAdminDenied.length).equals(0);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsAdminApproved.length).equals(0);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestG3.id)).equals(false);

    config.authenticationState = TestAuthData.editor;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let accessRequestsEditorAll = await AccessRequests.getListOfAccessRequests(callState);
    let accessRequestsEditorAllIds = accessRequestsEditorAll.map((value) => (value.id));
    let accessRequestsEditorPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    let accessRequestsEditorPendingIds = accessRequestsEditorPending.map((value) => (value.id));
    let accessRequestsEditorDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    let accessRequestsEditorDeniedIds = accessRequestsEditorDenied.map((value) => (value.id));
    let accessRequestsEditorApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    let accessRequestsEditorApprovedIds = accessRequestsEditorApproved.map((value) => (value.id));

    expect(accessRequestsEditorAll.length).equals(0);
    expect(accessRequestsEditorAllIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsEditorAllIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsEditorAllIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsEditorAllIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsEditorAllIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsEditorAllIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsEditorPending.length).equals(0);
    expect(accessRequestsEditorPendingIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsEditorPendingIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsEditorPendingIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsEditorPendingIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsEditorPendingIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsEditorPendingIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsEditorDenied.length).equals(0);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsEditorApproved.length).equals(0);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestG3.id)).equals(false);

    config.authenticationState = TestAuthData.viewer;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let accessRequestsViewerAll = await AccessRequests.getListOfAccessRequests(callState);
    let accessRequestsViewerAllIds = accessRequestsViewerAll.map((value) => (value.id));
    let accessRequestsViewerPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    let accessRequestsViewerPendingIds = accessRequestsViewerPending.map((value) => (value.id));
    let accessRequestsViewerDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    let accessRequestsViewerDeniedIds = accessRequestsViewerDenied.map((value) => (value.id));
    let accessRequestsViewerApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    let accessRequestsViewerApprovedIds = accessRequestsViewerApproved.map((value) => (value.id));

    expect(accessRequestsViewerAll.length).equals(0);
    expect(accessRequestsViewerAllIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsViewerAllIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsViewerAllIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsViewerAllIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsViewerAllIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsViewerAllIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsViewerPending.length).equals(0);
    expect(accessRequestsViewerPendingIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsViewerPendingIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsViewerPendingIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsViewerPendingIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsViewerPendingIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsViewerPendingIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsViewerDenied.length).equals(0);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsViewerApproved.length).equals(0);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestG3.id)).equals(false);

    config.authenticationState = TestAuthData.guest;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let accessRequestsGuestAll = await AccessRequests.getListOfAccessRequests(callState);
    let accessRequestsGuestAllIds = accessRequestsGuestAll.map((value) => (value.id));
    let accessRequestsGuestPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    let accessRequestsGuestPendingIds = accessRequestsGuestPending.map((value) => (value.id));
    let accessRequestsGuestDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    let accessRequestsGuestDeniedIds = accessRequestsGuestDenied.map((value) => (value.id));
    let accessRequestsGuestApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    let accessRequestsGuestApprovedIds = accessRequestsGuestApproved.map((value) => (value.id));

    expect(accessRequestsGuestAll.length).equals(3);
    expect(accessRequestsGuestAllIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsGuestAllIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsGuestAllIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsGuestAllIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsGuestAllIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsGuestAllIds.includes(accessRequestG3.id)).equals(true);
    expect(accessRequestsGuestPending.length).equals(3);
    expect(accessRequestsGuestPendingIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsGuestPendingIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsGuestPendingIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsGuestPendingIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsGuestPendingIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsGuestPendingIds.includes(accessRequestG3.id)).equals(true);
    expect(accessRequestsGuestDenied.length).equals(0);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsGuestApproved.length).equals(0);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestG3.id)).equals(false);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    let accessRequestsTestUserAll = await AccessRequests.getListOfAccessRequests(callState);
    let accessRequestsTestUserAllIds = accessRequestsTestUserAll.map((value) => (value.id));
    let accessRequestsTestUserPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    let accessRequestsTestUserPendingIds = accessRequestsTestUserPending.map((value) => (value.id));
    let accessRequestsTestUserDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    let accessRequestsTestUserDeniedIds = accessRequestsTestUserDenied.map((value) => (value.id));
    let accessRequestsTestUserApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    let accessRequestsTestUserApprovedIds = accessRequestsTestUserApproved.map((value) => (value.id));

    expect(accessRequestsTestUserAll.length).equals(3);
    expect(accessRequestsTestUserAllIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsTestUserAllIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsTestUserAllIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsTestUserAllIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsTestUserAllIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsTestUserAllIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsTestUserPending.length).equals(3);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsTestUserDenied.length).equals(0);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsTestUserApproved.length).equals(0);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestG3.id)).equals(false);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await AccessRequests.setAccessRequestToDenied(callState, accessRequestT2.id);
    await AccessRequests.setAccessRequestToDenied(callState, accessRequestG2.id);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    accessRequestsOwnerAll = await AccessRequests.getListOfAccessRequests(callState);
    accessRequestsOwnerAllIds = accessRequestsOwnerAll.map((value) => (value.id));
    accessRequestsOwnerPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    accessRequestsOwnerPendingIds = accessRequestsOwnerPending.map((value) => (value.id));
    accessRequestsOwnerDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    accessRequestsOwnerDeniedIds = accessRequestsOwnerDenied.map((value) => (value.id));
    accessRequestsOwnerApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    accessRequestsOwnerApprovedIds = accessRequestsOwnerApproved.map((value) => (value.id));

    expect(accessRequestsOwnerAll.length).equals(6);
    expect(accessRequestsOwnerAllIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsOwnerAllIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsOwnerAllIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsOwnerAllIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsOwnerAllIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsOwnerAllIds.includes(accessRequestG3.id)).equals(true);
    expect(accessRequestsOwnerPending.length).equals(4);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestG3.id)).equals(true);
    expect(accessRequestsOwnerDenied.length).equals(2);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsOwnerApproved.length).equals(0);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestG3.id)).equals(false);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    accessRequestsAdminAll = await AccessRequests.getListOfAccessRequests(callState);
    accessRequestsAdminAllIds = accessRequestsAdminAll.map((value) => (value.id));
    accessRequestsAdminPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    accessRequestsAdminPendingIds = accessRequestsAdminPending.map((value) => (value.id));
    accessRequestsAdminDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    accessRequestsAdminDeniedIds = accessRequestsAdminDenied.map((value) => (value.id));
    accessRequestsAdminApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    accessRequestsAdminApprovedIds = accessRequestsAdminApproved.map((value) => (value.id));

    expect(accessRequestsAdminAll.length).equals(6);
    expect(accessRequestsAdminAllIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsAdminAllIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsAdminAllIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsAdminAllIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsAdminAllIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsAdminAllIds.includes(accessRequestG3.id)).equals(true);
    expect(accessRequestsAdminPending.length).equals(4);
    expect(accessRequestsAdminPendingIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsAdminPendingIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsAdminPendingIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsAdminPendingIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsAdminPendingIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsAdminPendingIds.includes(accessRequestG3.id)).equals(true);
    expect(accessRequestsAdminDenied.length).equals(2);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsAdminApproved.length).equals(0);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestG3.id)).equals(false);

    config.authenticationState = TestAuthData.editor;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    accessRequestsEditorAll = await AccessRequests.getListOfAccessRequests(callState);
    accessRequestsEditorAllIds = accessRequestsEditorAll.map((value) => (value.id));
    accessRequestsEditorPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    accessRequestsEditorPendingIds = accessRequestsEditorPending.map((value) => (value.id));
    accessRequestsEditorDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    accessRequestsEditorDeniedIds = accessRequestsEditorDenied.map((value) => (value.id));
    accessRequestsEditorApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    accessRequestsEditorApprovedIds = accessRequestsEditorApproved.map((value) => (value.id));

    expect(accessRequestsEditorAll.length).equals(0);
    expect(accessRequestsEditorAllIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsEditorAllIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsEditorAllIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsEditorAllIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsEditorAllIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsEditorAllIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsEditorPending.length).equals(0);
    expect(accessRequestsEditorPendingIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsEditorPendingIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsEditorPendingIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsEditorPendingIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsEditorPendingIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsEditorPendingIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsEditorDenied.length).equals(0);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsEditorApproved.length).equals(0);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestG3.id)).equals(false);

    config.authenticationState = TestAuthData.viewer;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    accessRequestsViewerAll = await AccessRequests.getListOfAccessRequests(callState);
    accessRequestsViewerAllIds = accessRequestsViewerAll.map((value) => (value.id));
    accessRequestsViewerPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    accessRequestsViewerPendingIds = accessRequestsViewerPending.map((value) => (value.id));
    accessRequestsViewerDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    accessRequestsViewerDeniedIds = accessRequestsViewerDenied.map((value) => (value.id));
    accessRequestsViewerApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    accessRequestsViewerApprovedIds = accessRequestsViewerApproved.map((value) => (value.id));

    expect(accessRequestsViewerAll.length).equals(0);
    expect(accessRequestsViewerAllIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsViewerAllIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsViewerAllIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsViewerAllIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsViewerAllIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsViewerAllIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsViewerPending.length).equals(0);
    expect(accessRequestsViewerPendingIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsViewerPendingIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsViewerPendingIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsViewerPendingIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsViewerPendingIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsViewerPendingIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsViewerDenied.length).equals(0);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsViewerApproved.length).equals(0);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestG3.id)).equals(false);

    config.authenticationState = TestAuthData.guest;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    accessRequestsGuestAll = await AccessRequests.getListOfAccessRequests(callState);
    accessRequestsGuestAllIds = accessRequestsGuestAll.map((value) => (value.id));
    accessRequestsGuestPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    accessRequestsGuestPendingIds = accessRequestsGuestPending.map((value) => (value.id));
    accessRequestsGuestDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    accessRequestsGuestDeniedIds = accessRequestsGuestDenied.map((value) => (value.id));
    accessRequestsGuestApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    accessRequestsGuestApprovedIds = accessRequestsGuestApproved.map((value) => (value.id));

    expect(accessRequestsGuestAll.length).equals(3);
    expect(accessRequestsGuestAllIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsGuestAllIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsGuestAllIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsGuestAllIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsGuestAllIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsGuestAllIds.includes(accessRequestG3.id)).equals(true);
    expect(accessRequestsGuestPending.length).equals(2);
    expect(accessRequestsGuestPendingIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsGuestPendingIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsGuestPendingIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsGuestPendingIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsGuestPendingIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsGuestPendingIds.includes(accessRequestG3.id)).equals(true);
    expect(accessRequestsGuestDenied.length).equals(1);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsGuestApproved.length).equals(0);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestG3.id)).equals(false);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    accessRequestsTestUserAll = await AccessRequests.getListOfAccessRequests(callState);
    accessRequestsTestUserAllIds = accessRequestsTestUserAll.map((value) => (value.id));
    accessRequestsTestUserPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    accessRequestsTestUserPendingIds = accessRequestsTestUserPending.map((value) => (value.id));
    accessRequestsTestUserDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    accessRequestsTestUserDeniedIds = accessRequestsTestUserDenied.map((value) => (value.id));
    accessRequestsTestUserApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    accessRequestsTestUserApprovedIds = accessRequestsTestUserApproved.map((value) => (value.id));

    expect(accessRequestsTestUserAll.length).equals(3);
    expect(accessRequestsTestUserAllIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsTestUserAllIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsTestUserAllIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsTestUserAllIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsTestUserAllIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsTestUserAllIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsTestUserPending.length).equals(2);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsTestUserDenied.length).equals(1);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsTestUserApproved.length).equals(0);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestG3.id)).equals(false);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await AccessRequests.setAccessRequestToApproved(callState, accessRequestT3.id);
    await AccessRequests.setAccessRequestToApproved(callState, accessRequestG3.id);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    accessRequestsOwnerAll = await AccessRequests.getListOfAccessRequests(callState);
    accessRequestsOwnerAllIds = accessRequestsOwnerAll.map((value) => (value.id));
    accessRequestsOwnerPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    accessRequestsOwnerPendingIds = accessRequestsOwnerPending.map((value) => (value.id));
    accessRequestsOwnerDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    accessRequestsOwnerDeniedIds = accessRequestsOwnerDenied.map((value) => (value.id));
    accessRequestsOwnerApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    accessRequestsOwnerApprovedIds = accessRequestsOwnerApproved.map((value) => (value.id));

    expect(accessRequestsOwnerAll.length).equals(6);
    expect(accessRequestsOwnerAllIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsOwnerAllIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsOwnerAllIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsOwnerAllIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsOwnerAllIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsOwnerAllIds.includes(accessRequestG3.id)).equals(true);
    expect(accessRequestsOwnerPending.length).equals(2);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsOwnerPendingIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsOwnerDenied.length).equals(2);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsOwnerDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsOwnerApproved.length).equals(2);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsOwnerApprovedIds.includes(accessRequestG3.id)).equals(true);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    accessRequestsAdminAll = await AccessRequests.getListOfAccessRequests(callState);
    accessRequestsAdminAllIds = accessRequestsAdminAll.map((value) => (value.id));
    accessRequestsAdminPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    accessRequestsAdminPendingIds = accessRequestsAdminPending.map((value) => (value.id));
    accessRequestsAdminDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    accessRequestsAdminDeniedIds = accessRequestsAdminDenied.map((value) => (value.id));
    accessRequestsAdminApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    accessRequestsAdminApprovedIds = accessRequestsAdminApproved.map((value) => (value.id));

    expect(accessRequestsAdminAll.length).equals(6);
    expect(accessRequestsAdminAllIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsAdminAllIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsAdminAllIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsAdminAllIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsAdminAllIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsAdminAllIds.includes(accessRequestG3.id)).equals(true);
    expect(accessRequestsAdminPending.length).equals(2);
    expect(accessRequestsAdminPendingIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsAdminPendingIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsAdminPendingIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsAdminPendingIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsAdminPendingIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsAdminPendingIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsAdminDenied.length).equals(2);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsAdminDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsAdminApproved.length).equals(2);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsAdminApprovedIds.includes(accessRequestG3.id)).equals(true);

    config.authenticationState = TestAuthData.editor;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    accessRequestsEditorAll = await AccessRequests.getListOfAccessRequests(callState);
    accessRequestsEditorAllIds = accessRequestsEditorAll.map((value) => (value.id));
    accessRequestsEditorPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    accessRequestsEditorPendingIds = accessRequestsEditorPending.map((value) => (value.id));
    accessRequestsEditorDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    accessRequestsEditorDeniedIds = accessRequestsEditorDenied.map((value) => (value.id));
    accessRequestsEditorApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    accessRequestsEditorApprovedIds = accessRequestsEditorApproved.map((value) => (value.id));

    expect(accessRequestsEditorAll.length).equals(0);
    expect(accessRequestsEditorAllIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsEditorAllIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsEditorAllIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsEditorAllIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsEditorAllIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsEditorAllIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsEditorPending.length).equals(0);
    expect(accessRequestsEditorPendingIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsEditorPendingIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsEditorPendingIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsEditorPendingIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsEditorPendingIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsEditorPendingIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsEditorDenied.length).equals(0);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsEditorDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsEditorApproved.length).equals(0);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsEditorApprovedIds.includes(accessRequestG3.id)).equals(false);

    config.authenticationState = TestAuthData.viewer;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    accessRequestsViewerAll = await AccessRequests.getListOfAccessRequests(callState);
    accessRequestsViewerAllIds = accessRequestsViewerAll.map((value) => (value.id));
    accessRequestsViewerPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    accessRequestsViewerPendingIds = accessRequestsViewerPending.map((value) => (value.id));
    accessRequestsViewerDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    accessRequestsViewerDeniedIds = accessRequestsViewerDenied.map((value) => (value.id));
    accessRequestsViewerApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    accessRequestsViewerApprovedIds = accessRequestsViewerApproved.map((value) => (value.id));

    expect(accessRequestsViewerAll.length).equals(0);
    expect(accessRequestsViewerAllIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsViewerAllIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsViewerAllIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsViewerAllIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsViewerAllIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsViewerAllIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsViewerPending.length).equals(0);
    expect(accessRequestsViewerPendingIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsViewerPendingIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsViewerPendingIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsViewerPendingIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsViewerPendingIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsViewerPendingIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsViewerDenied.length).equals(0);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsViewerDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsViewerApproved.length).equals(0);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsViewerApprovedIds.includes(accessRequestG3.id)).equals(false);

    config.authenticationState = TestAuthData.guest;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    accessRequestsGuestAll = await AccessRequests.getListOfAccessRequests(callState);
    accessRequestsGuestAllIds = accessRequestsGuestAll.map((value) => (value.id));
    accessRequestsGuestPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    accessRequestsGuestPendingIds = accessRequestsGuestPending.map((value) => (value.id));
    accessRequestsGuestDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    accessRequestsGuestDeniedIds = accessRequestsGuestDenied.map((value) => (value.id));
    accessRequestsGuestApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    accessRequestsGuestApprovedIds = accessRequestsGuestApproved.map((value) => (value.id));

    expect(accessRequestsGuestAll.length).equals(3);
    expect(accessRequestsGuestAllIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsGuestAllIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsGuestAllIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsGuestAllIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsGuestAllIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsGuestAllIds.includes(accessRequestG3.id)).equals(true);
    expect(accessRequestsGuestPending.length).equals(1);
    expect(accessRequestsGuestPendingIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsGuestPendingIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsGuestPendingIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsGuestPendingIds.includes(accessRequestG1.id)).equals(true);
    expect(accessRequestsGuestPendingIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsGuestPendingIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsGuestDenied.length).equals(1);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestG2.id)).equals(true);
    expect(accessRequestsGuestDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsGuestApproved.length).equals(1);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsGuestApprovedIds.includes(accessRequestG3.id)).equals(true);

    config.authenticationState = TestAuthData.testUser;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    accessRequestsTestUserAll = await AccessRequests.getListOfAccessRequests(callState);
    accessRequestsTestUserAllIds = accessRequestsTestUserAll.map((value) => (value.id));
    accessRequestsTestUserPending = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.pending);
    accessRequestsTestUserPendingIds = accessRequestsTestUserPending.map((value) => (value.id));
    accessRequestsTestUserDenied = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.denied);
    accessRequestsTestUserDeniedIds = accessRequestsTestUserDenied.map((value) => (value.id));
    accessRequestsTestUserApproved = await AccessRequests.getListOfAccessRequests(callState, OPA.ApprovalStates.approved);
    accessRequestsTestUserApprovedIds = accessRequestsTestUserApproved.map((value) => (value.id));

    expect(accessRequestsTestUserAll.length).equals(3);
    expect(accessRequestsTestUserAllIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsTestUserAllIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsTestUserAllIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsTestUserAllIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsTestUserAllIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsTestUserAllIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsTestUserPending.length).equals(1);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestT1.id)).equals(true);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsTestUserPendingIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsTestUserDenied.length).equals(1);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestT2.id)).equals(true);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestT3.id)).equals(false);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsTestUserDeniedIds.includes(accessRequestG3.id)).equals(false);
    expect(accessRequestsTestUserApproved.length).equals(1);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestT1.id)).equals(false);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestT2.id)).equals(false);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestT3.id)).equals(true);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestG1.id)).equals(false);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestG2.id)).equals(false);
    expect(accessRequestsTestUserApprovedIds.includes(accessRequestG3.id)).equals(false);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const accessRequestDMsOwnerAll = await AccessRequests.convertAccessRequestsToDisplayModels(callState, accessRequestsOwnerAll);
    expect(accessRequestDMsOwnerAll.length).equals(accessRequestsOwnerAll.length);
    accessRequestDMsOwnerAll.forEach((value, index) => expect(value.id).equals(accessRequestsOwnerAll[index].id));
    const accessRequestDMsAdminAll = await AccessRequests.convertAccessRequestsToDisplayModels(callState, accessRequestsAdminAll);
    expect(accessRequestDMsAdminAll.length).equals(accessRequestsAdminAll.length);
    accessRequestDMsAdminAll.forEach((value, index) => expect(value.id).equals(accessRequestsAdminAll[index].id));
    const accessRequestDMsEditorAll = await AccessRequests.convertAccessRequestsToDisplayModels(callState, accessRequestsEditorAll);
    expect(accessRequestDMsEditorAll.length).equals(accessRequestsEditorAll.length);
    accessRequestDMsEditorAll.forEach((value, index) => expect(value.id).equals(accessRequestsEditorAll[index].id));
    const accessRequestDMsViewerAll = await AccessRequests.convertAccessRequestsToDisplayModels(callState, accessRequestsViewerAll);
    expect(accessRequestDMsViewerAll.length).equals(accessRequestsViewerAll.length);
    accessRequestDMsViewerAll.forEach((value, index) => expect(value.id).equals(accessRequestsViewerAll[index].id));
    const accessRequestDMsGuestAll = await AccessRequests.convertAccessRequestsToDisplayModels(callState, accessRequestsGuestAll);
    expect(accessRequestDMsGuestAll.length).equals(accessRequestsGuestAll.length);
    accessRequestDMsGuestAll.forEach((value, index) => expect(value.id).equals(accessRequestsGuestAll[index].id));
    const accessRequestDMsTestUserAll = await AccessRequests.convertAccessRequestsToDisplayModels(callState, accessRequestsTestUserAll);
    expect(accessRequestDMsTestUserAll.length).equals(accessRequestsTestUserAll.length);
    accessRequestDMsTestUserAll.forEach((value, index) => expect(value.id).equals(accessRequestsTestUserAll[index].id));
  });
  test("checks that getListOfAccessRequests(...) succeeds and filters properly when System is installed", testFunc4());

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

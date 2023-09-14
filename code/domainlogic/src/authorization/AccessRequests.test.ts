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
import * as TestData from "../TestData.test";
import * as TestConfig from "../TestConfiguration.test";
import * as TestUtils from "../TestUtilities.test";

const config = TestConfig.getTestConfiguration();
const testMessage = "Please give me access to your archive.";
const testCitationId_Null: string | null = null;
const testCitationId_NonNull: string = "CITATION_1234";
const testResponse = "OK.";

describe("Tests using Firebase " + config.testEnvironment, function () {
  if (!OPA.isNullish(config.timeout)) {
    this.timeout(OPA.convertNonNullish(config.timeout)); // eslint-disable-line no-invalid-this
  }

  beforeEach(async () => {
    config.authenticationState = TestData.authenticationState_Owner;
    const doBackup = false && (config.hasRunTests && (config.testEnvironment != "Emulators")); // LATER: Once backup is implemented, delete "false && "
    config.hasRunTests = false;

    admin.initializeApp(config.appInitializationArgs);
    config.dataStorageState.db = admin.firestore();
    config.dataStorageState.currentWriteBatch = null;

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

  const testFunc1 = (testCitationId: string | null) => (async () => {
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

    await expect(AccessRequests.requestUserAccess(callState, testMessage, testCitationId)).to.eventually.be.rejectedWith(Error);
  });
  test("checks that requestUserAccess(...) fails when System is not installed", testFunc1(testCitationId_Null));
  test("checks that requestUserAccess(...) fails when System is not installed", testFunc1(testCitationId_NonNull));

  const testFunc2 = (testCitationId: string | null) => (async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);
    let user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    await TestUtils.performInstallForTest(config.dataStorageState, config.authenticationState);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);
    // const owner = OPA.convertNonNullish(user);

    const authProvider = await OpaDb.AuthProviders.queries.getByExternalAuthProviderId(config.dataStorageState, config.authenticationState.providerId);
    expect(authProvider).not.equals(null);
    // const authProviderNonNull = OPA.convertNonNullish(authProvider);

    // NOTE: Do NOT set the test AuthenticationState to a User other than the Archive Owner

    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);

    await expect(Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email)).to.eventually.be.rejectedWith(Error);
    callState.dataStorageState.currentWriteBatch = null; // NOTE: This should be done in the outer try-catch-finally of the calling Firebase function
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);

    await expect(AccessRequests.requestUserAccess(callState, testMessage, testCitationId)).to.eventually.be.rejectedWith(Error);
  });
  test("checks that requestUserAccess(...) fails when System is installed and User is Archive Owner", testFunc2(testCitationId_Null));
  test("checks that requestUserAccess(...) fails when System is installed and User is Archive Owner", testFunc2(testCitationId_NonNull));

  const testFunc3 = (testCitationId: string | null) => (async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);
    let user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    await TestUtils.performInstallForTest(config.dataStorageState, config.authenticationState);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);
    const owner = OPA.convertNonNullish(user);

    const authProvider = await OpaDb.AuthProviders.queries.getByExternalAuthProviderId(config.dataStorageState, config.authenticationState.providerId);
    expect(authProvider).not.equals(null);
    // const authProviderNonNull = OPA.convertNonNullish(authProvider);

    // NOTE: Set the test AuthenticationState to a User other than the Archive Owner
    config.authenticationState = TestData.authenticationState_TestUser;
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    user = await Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email);
    expect(user).not.equals(null);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);

    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);

    let accessRequest: OpaDm.IAccessRequest | null = null;
    accessRequest = await AccessRequests.requestUserAccess(callState, testMessage, testCitationId);
    expect(accessRequest).not.equals(null);
    accessRequest = await OpaDb.AccessRequests.queries.getById(config.dataStorageState, accessRequest.id);
    expect(accessRequest).not.equals(null);

    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);

    const userNonNull = OPA.convertNonNullish(user);
    const userId = userNonNull.id;
    const hasCitationId = (!OPA.isNullish(testCitationId));
    if (!hasCitationId) {
      expect(userNonNull.requestedCitationIds.length).equals(0);
    } else {
      expect(userNonNull.requestedCitationIds.length).equals(1);
      expect(userNonNull.requestedCitationIds[0]).equals(testCitationId);
    }

    let accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    const accessRequestId = accessRequestNonNull.id;
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

    await OpaDb.AccessRequests.queries.setTags(config.dataStorageState, accessRequestId, ["a", "b", "c"], owner.id);
    accessRequest = await OpaDb.AccessRequests.queries.getById(config.dataStorageState, accessRequestId);
    expect(accessRequestNonNull).not.equals(null);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals("");
    expect(accessRequestNonNull.updateHistory.length).equals(2);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(owner.id);
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

    await OpaDb.AccessRequests.queries.setToViewed(config.dataStorageState, accessRequestId, owner.id);
    accessRequest = await OpaDb.AccessRequests.queries.getById(config.dataStorageState, accessRequestId);
    expect(accessRequestNonNull).not.equals(null);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals("");
    expect(accessRequestNonNull.updateHistory.length).equals(3);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(owner.id);
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(null);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(owner.id);
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    // NOTE: Set to Viewed by User who created AccessRequest so that "userIdOfLatestViewer" changes to value other than "owner.id" for next step
    await OpaDb.AccessRequests.queries.setToViewed(config.dataStorageState, accessRequestId, userId);
    accessRequest = await OpaDb.AccessRequests.queries.getById(config.dataStorageState, accessRequestId);
    expect(accessRequestNonNull).not.equals(null);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals("");
    expect(accessRequestNonNull.updateHistory.length).equals(4);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(userId);
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(owner.id);
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(null);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(userId);
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    let accessRequestUpdateObject = ({response: OpaDm.localizableStringConstructor(OpaDm.DefaultLocale, testResponse)} as OpaDm.IAccessRequestPartial);
    await OpaDb.AccessRequests.queries.update(config.dataStorageState, accessRequestId, accessRequestUpdateObject, owner.id);
    accessRequest = await OpaDb.AccessRequests.queries.getById(config.dataStorageState, accessRequestId);
    expect(accessRequestNonNull).not.equals(null);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse);
    expect(accessRequestNonNull.updateHistory.length).equals(5);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(owner.id);
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(null);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(userId);
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    const testResponse_Updated = (testResponse + " UPDATED");
    accessRequestUpdateObject = ({response: OpaDm.localizableStringConstructor(OpaDm.DefaultLocale, testResponse_Updated)} as OpaDm.IAccessRequestPartial);
    await OpaDb.AccessRequests.queries.update(config.dataStorageState, accessRequestId, accessRequestUpdateObject, owner.id);
    accessRequest = await OpaDb.AccessRequests.queries.getById(config.dataStorageState, accessRequestId);
    expect(accessRequestNonNull).not.equals(null);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(6);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(owner.id);
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(null);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(userId);
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    const testMessage_Updated = (testMessage + " UPDATED");
    accessRequestUpdateObject = ({message: OpaDm.localizableStringConstructor(OpaDm.DefaultLocale, testMessage_Updated)} as OpaDm.IAccessRequestPartial);
    await OpaDb.AccessRequests.queries.update(config.dataStorageState, accessRequestId, accessRequestUpdateObject, userId);
    accessRequest = await OpaDb.AccessRequests.queries.getById(config.dataStorageState, accessRequestId);
    expect(accessRequestNonNull).not.equals(null);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(7);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(userId);
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(owner.id);
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(null);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(userId);
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    await OpaDb.AccessRequests.queries.setToArchivalOption(config.dataStorageState, accessRequestId, true, userId);
    accessRequest = await OpaDb.AccessRequests.queries.getById(config.dataStorageState, accessRequestId);
    expect(accessRequestNonNull).not.equals(null);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(8);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(userId);
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(owner.id);
    expect(accessRequestNonNull.isArchived).equals(true);
    expect(accessRequestNonNull.dateOfArchivalChange).not.equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(userId);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(userId);
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    await OpaDb.AccessRequests.queries.setToArchivalOption(config.dataStorageState, accessRequestId, false, owner.id);
    accessRequest = await OpaDb.AccessRequests.queries.getById(config.dataStorageState, accessRequestId);
    expect(accessRequestNonNull).not.equals(null);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(9);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(owner.id);
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).not.equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(owner.id);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(userId);
    expect(accessRequestNonNull.hasBeenDecided).equals(false);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(accessRequestNonNull.dateOfDecision).equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(null);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    await OpaDb.AccessRequests.queries.setToDecidedOption(config.dataStorageState, accessRequestId, OpaDm.ApprovalStates.denied, owner.id);
    accessRequest = await OpaDb.AccessRequests.queries.getById(config.dataStorageState, accessRequestId);
    expect(accessRequest).not.equals(null);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(10);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(owner.id);
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).not.equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(owner.id);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(userId);
    expect(accessRequestNonNull.hasBeenDecided).equals(true);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.denied);
    expect(accessRequestNonNull.dateOfDecision).not.equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(owner.id);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    await OpaDb.AccessRequests.queries.setToDecidedOption(config.dataStorageState, accessRequestId, OpaDm.ApprovalStates.approved, owner.id);
    accessRequest = await OpaDb.AccessRequests.queries.getById(config.dataStorageState, accessRequestId);
    expect(accessRequest).not.equals(null);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(11);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(owner.id);
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).not.equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(owner.id);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(userId);
    expect(accessRequestNonNull.hasBeenDecided).equals(true);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(accessRequestNonNull.dateOfDecision).not.equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(owner.id);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    await expect(OpaDb.AccessRequests.queries.markAsDeleted(config.dataStorageState, accessRequestId, owner.id)).to.eventually.be.rejectedWith(Error);
    accessRequest = await OpaDb.AccessRequests.queries.getById(config.dataStorageState, accessRequestId);
    expect(accessRequest).not.equals(null);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(11);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(owner.id);
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).not.equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(owner.id);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(userId);
    expect(accessRequestNonNull.hasBeenDecided).equals(true);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(accessRequestNonNull.dateOfDecision).not.equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(owner.id);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(false);
    expect(accessRequestNonNull.dateOfDeletion).equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(null);

    await OpaDb.AccessRequests.queries.markAsDeleted(config.dataStorageState, accessRequestId, userId);
    accessRequest = await OpaDb.AccessRequests.queries.getById(config.dataStorageState, accessRequestId);
    expect(accessRequest).not.equals(null);

    accessRequestNonNull = OPA.convertNonNullish(accessRequest);
    expect(accessRequestNonNull.archiveId).equals(OpaDm.ArchiveId);
    expect(accessRequestNonNull.isSpecificToCitation).equals(hasCitationId);
    expect(accessRequestNonNull.citationId).equals(hasCitationId ? OPA.convertNonNullish(testCitationId) : null);
    expect(accessRequestNonNull.message[OpaDm.DefaultLocale]).equals(testMessage_Updated);
    expect(accessRequestNonNull.response[OpaDm.DefaultLocale]).equals(testResponse_Updated);
    expect(accessRequestNonNull.updateHistory.length).equals(12);
    expect(accessRequestNonNull.hasBeenUpdated).equals(true);
    expect(accessRequestNonNull.dateOfLatestUpdate).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestUpdater).equals(userId);
    expect(accessRequestNonNull.tags.length).equals(3);
    expect(accessRequestNonNull.dateOfLatestTagging).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestTagger).equals(owner.id);
    expect(accessRequestNonNull.isArchived).equals(false);
    expect(accessRequestNonNull.dateOfArchivalChange).not.equals(null);
    expect(accessRequestNonNull.userIdOfArchivalChanger).equals(owner.id);
    expect(accessRequestNonNull.hasBeenViewed).equals(true);
    expect(accessRequestNonNull.dateOfLatestViewing).not.equals(null);
    expect(accessRequestNonNull.userIdOfLatestViewer).equals(userId);
    expect(accessRequestNonNull.hasBeenDecided).equals(true);
    expect(accessRequestNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(accessRequestNonNull.dateOfDecision).not.equals(null);
    expect(accessRequestNonNull.userIdOfDecider).equals(owner.id);
    expect(accessRequestNonNull.isMarkedAsDeleted).equals(true);
    expect(accessRequestNonNull.dateOfDeletion).not.equals(null);
    expect(accessRequestNonNull.userIdOfDeleter).equals(userId);
  });
  test("checks that requestUserAccess(...) succeeds and AccessRequest updates succeed when System is installed and User is not Archive Owner", testFunc3(testCitationId_Null));
  test("checks that requestUserAccess(...) succeeds and AccessRequest updates succeed when System is installed and User is not Archive Owner", testFunc3(testCitationId_NonNull));

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

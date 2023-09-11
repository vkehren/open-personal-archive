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
const testOtherUserId = "THIS_USER_DOES_NOT_ACTUALLY_EXIST";
const testStartReason = "START reason";
const testEndReason = "END reason";

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

  test("checks that initializeUserAccount(...) fails but some User updates succeed when System is installed and User is Archive Owner", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);
    let user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    await Application.performInstall(config.dataStorageState, config.authenticationState, "Test Archive", "Archive for Mocha + Chai unit tests.", "./Test_Archive/files",
      "OPA_Locale_en_US", "OPA_TimeZoneGroup_PST_-08:00", "Owner", "de Archive");

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);
    const owner = OPA.convertNonNullish(user);

    const authProvider = await OpaDb.AuthProviders.queries.getByExternalAuthProviderId(config.dataStorageState.db, config.authenticationState.providerId);
    expect(authProvider).not.equals(null);
    // const authProviderNonNull = OPA.convertNonNullish(authProvider);

    // NOTE: Do NOT set the test AuthenticationState to a User other than the Archive Owner

    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);

    await expect(Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email)).to.eventually.be.rejectedWith(Error);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);

    let userNonNull = OPA.convertNonNullish(user);
    const userId = userNonNull.id;
    expect(userNonNull.firebaseAuthUserId).equals(owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(owner.authProviderId);
    expect(userNonNull.authAccountName).equals(owner.authAccountName);
    expect(userNonNull.authAccountNameLowered).equals(owner.authAccountNameLowered);
    expect(userNonNull.firstName).equals(owner.firstName);
    expect(userNonNull.lastName).equals(owner.lastName);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(1);
    expect((userNonNull.updateHistory[0] as any).updateHistory).equals(undefined);
    expect(userNonNull.hasBeenUpdated).equals(false);
    expect(userNonNull.dateOfLatestUpdate).equals(null);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(userId);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(userId);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    const firstName_Updated = (userNonNull.firstName + " UPDATED");
    let userUpdateObject = ({firstName: firstName_Updated} as OpaDm.IUserPartial);
    await OpaDb.Users.queries.update(config.dataStorageState.db, userId, userUpdateObject, userId, config.firebaseConstructorProvider);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(owner.authProviderId);
    expect(userNonNull.authAccountName).equals(owner.authAccountName);
    expect(userNonNull.authAccountNameLowered).equals(owner.authAccountNameLowered);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(owner.lastName);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(2);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(userId);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(userId);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(userId);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    const lastName_Updated = (userNonNull.lastName + " UPDATED");
    userUpdateObject = ({lastName: lastName_Updated} as OpaDm.IUserPartial);
    await OpaDb.Users.queries.update(config.dataStorageState.db, userId, userUpdateObject, userId, config.firebaseConstructorProvider);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(owner.authProviderId);
    expect(userNonNull.authAccountName).equals(owner.authAccountName);
    expect(userNonNull.authAccountNameLowered).equals(owner.authAccountNameLowered);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(3);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(userId);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(userId);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(userId);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    const recentQueries_Updated = ["what?"];
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    await OpaDb.Users.queries.update(config.dataStorageState.db, userId, userUpdateObject, userId, config.firebaseConstructorProvider);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(owner.authProviderId);
    expect(userNonNull.authAccountName).equals(owner.authAccountName);
    expect(userNonNull.authAccountNameLowered).equals(owner.authAccountNameLowered);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(4);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(userId);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(userId);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(userId);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    await expect(OpaDb.Users.queries.setToViewed(config.dataStorageState.db, userId, owner.id, config.firebaseConstructorProvider)).to.eventually.be.rejectedWith(Error);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(owner.authProviderId);
    expect(userNonNull.authAccountName).equals(owner.authAccountName);
    expect(userNonNull.authAccountNameLowered).equals(owner.authAccountNameLowered);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(4);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(userId);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(userId);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(userId);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    await expect(OpaDb.Users.queries.setToDecidedOption(config.dataStorageState.db, userId, OpaDm.ApprovalStates.denied, owner.id, config.firebaseConstructorProvider)).to.eventually.be.rejectedWith(Error);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(owner.authProviderId);
    expect(userNonNull.authAccountName).equals(owner.authAccountName);
    expect(userNonNull.authAccountNameLowered).equals(owner.authAccountNameLowered);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(4);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(userId);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(userId);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(userId);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    await expect(OpaDb.Users.queries.setToDecidedOption(config.dataStorageState.db, userId, OpaDm.ApprovalStates.approved, owner.id, config.firebaseConstructorProvider)).to.eventually.be.rejectedWith(Error);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(owner.authProviderId);
    expect(userNonNull.authAccountName).equals(owner.authAccountName);
    expect(userNonNull.authAccountNameLowered).equals(owner.authAccountNameLowered);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(4);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(userId);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(userId);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(userId);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    await expect(OpaDb.Users.queries.setToSuspended(config.dataStorageState.db, userId, testStartReason, testOtherUserId, config.firebaseConstructorProvider)).to.eventually.be.rejectedWith(Error);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(owner.authProviderId);
    expect(userNonNull.authAccountName).equals(owner.authAccountName);
    expect(userNonNull.authAccountNameLowered).equals(owner.authAccountNameLowered);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(4);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(userId);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(userId);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(userId);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    await expect(OpaDb.Users.queries.setToUnSuspended(config.dataStorageState.db, userId, testStartReason, testOtherUserId, config.firebaseConstructorProvider)).to.eventually.be.rejectedWith(Error);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(owner.authProviderId);
    expect(userNonNull.authAccountName).equals(owner.authAccountName);
    expect(userNonNull.authAccountNameLowered).equals(owner.authAccountNameLowered);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(4);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(userId);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(userId);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(userId);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    await expect(OpaDb.Users.queries.markAsDeleted(config.dataStorageState.db, userId, testOtherUserId, config.firebaseConstructorProvider)).to.eventually.be.rejectedWith(Error);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(owner.authProviderId);
    expect(userNonNull.authAccountName).equals(owner.authAccountName);
    expect(userNonNull.authAccountNameLowered).equals(owner.authAccountNameLowered);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(4);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(userId);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(userId);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(userId);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    await expect(OpaDb.Users.queries.markAsDeleted(config.dataStorageState.db, userId, userId, config.firebaseConstructorProvider)).to.eventually.be.rejectedWith(Error);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(owner.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(owner.authProviderId);
    expect(userNonNull.authAccountName).equals(owner.authAccountName);
    expect(userNonNull.authAccountNameLowered).equals(owner.authAccountNameLowered);
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(4);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(userId);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(userId);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(userId);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

  test("checks that initializeUserAccount(...) succeeds and User updates succeed when System is installed and User is not Archive Owner", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);
    let user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).equals(null);

    await Application.performInstall(config.dataStorageState, config.authenticationState, "Test Archive", "Archive for Mocha + Chai unit tests.", "./Test_Archive/files",
      "OPA_Locale_en_US", "OPA_TimeZoneGroup_PST_-08:00", "Owner", "de Archive");

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);
    const owner = OPA.convertNonNullish(user);

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

    user = await Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email);
    expect(user).not.equals(null);
    user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState.db, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);

    let userNonNull = OPA.convertNonNullish(user);
    const userId = userNonNull.id;
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
    expect(userNonNull.firstName).equals(config.authenticationState.firstName);
    expect(userNonNull.lastName).equals(config.authenticationState.lastName);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(1);
    expect((userNonNull.updateHistory[0] as any).updateHistory).equals(undefined);
    expect(userNonNull.hasBeenUpdated).equals(false);
    expect(userNonNull.dateOfLatestUpdate).equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(null);
    expect(userNonNull.hasBeenViewed).equals(false);
    expect(userNonNull.dateOfLatestViewing).equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(null);
    expect(userNonNull.hasBeenDecided).equals(false);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(userNonNull.dateOfDecision).equals(null);
    expect(userNonNull.userIdOfDecider).equals(null);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    const firstName_Updated = (userNonNull.firstName + " UPDATED");
    let userUpdateObject = ({firstName: firstName_Updated} as OpaDm.IUserPartial);
    await OpaDb.Users.queries.update(config.dataStorageState.db, userId, userUpdateObject, userId, config.firebaseConstructorProvider);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(config.authenticationState.lastName);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(2);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(userId);
    expect(userNonNull.hasBeenViewed).equals(false);
    expect(userNonNull.dateOfLatestViewing).equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(null);
    expect(userNonNull.hasBeenDecided).equals(false);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(userNonNull.dateOfDecision).equals(null);
    expect(userNonNull.userIdOfDecider).equals(null);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    const lastName_Updated = (userNonNull.lastName + " UPDATED");
    userUpdateObject = ({lastName: lastName_Updated} as OpaDm.IUserPartial);
    await OpaDb.Users.queries.update(config.dataStorageState.db, userId, userUpdateObject, userId, config.firebaseConstructorProvider);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(0);
    expect(userNonNull.updateHistory.length).equals(3);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(userId);
    expect(userNonNull.hasBeenViewed).equals(false);
    expect(userNonNull.dateOfLatestViewing).equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(null);
    expect(userNonNull.hasBeenDecided).equals(false);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(userNonNull.dateOfDecision).equals(null);
    expect(userNonNull.userIdOfDecider).equals(null);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    const recentQueries_Updated = ["what?"];
    userUpdateObject = ({recentQueries: recentQueries_Updated} as OpaDm.IUserPartial);
    await OpaDb.Users.queries.update(config.dataStorageState.db, userId, userUpdateObject, userId, config.firebaseConstructorProvider);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(4);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(userId);
    expect(userNonNull.hasBeenViewed).equals(false);
    expect(userNonNull.dateOfLatestViewing).equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(null);
    expect(userNonNull.hasBeenDecided).equals(false);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(userNonNull.dateOfDecision).equals(null);
    expect(userNonNull.userIdOfDecider).equals(null);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    await OpaDb.Users.queries.setToViewed(config.dataStorageState.db, userId, owner.id, config.firebaseConstructorProvider);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(5);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(owner.id);
    expect(userNonNull.hasBeenDecided).equals(false);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.pending);
    expect(userNonNull.dateOfDecision).equals(null);
    expect(userNonNull.userIdOfDecider).equals(null);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    await OpaDb.Users.queries.setToDecidedOption(config.dataStorageState.db, userId, OpaDm.ApprovalStates.denied, owner.id, config.firebaseConstructorProvider);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(6);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(owner.id);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.denied);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(owner.id);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    await OpaDb.Users.queries.setToDecidedOption(config.dataStorageState.db, userId, OpaDm.ApprovalStates.approved, owner.id, config.firebaseConstructorProvider);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(7);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(owner.id);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(owner.id);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    await expect(OpaDb.Users.queries.setToSuspended(config.dataStorageState.db, userId, testStartReason, userId, config.firebaseConstructorProvider)).to.eventually.be.rejectedWith(Error);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(7);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(owner.id);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(owner.id);
    expect(OPA.isSuspended(userNonNull)).equals(false);
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

    await OpaDb.Users.queries.setToSuspended(config.dataStorageState.db, userId, testStartReason, owner.id, config.firebaseConstructorProvider);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(8);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(owner.id);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(owner.id);
    expect(OPA.isSuspended(userNonNull)).equals(true);
    expect(userNonNull.hasSuspensionStarted).equals(true);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(testStartReason);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).not.equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(owner.id);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    await expect(OpaDb.Users.queries.setToSuspended(config.dataStorageState.db, userId, testStartReason, owner.id, config.firebaseConstructorProvider)).to.eventually.be.rejectedWith(Error);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(8);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(owner.id);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(owner.id);
    expect(OPA.isSuspended(userNonNull)).equals(true);
    expect(userNonNull.hasSuspensionStarted).equals(true);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(testStartReason);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).not.equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(owner.id);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    await expect(OpaDb.Users.queries.setToUnSuspended(config.dataStorageState.db, userId, testEndReason, userId, config.firebaseConstructorProvider)).to.eventually.be.rejectedWith(Error);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(8);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(owner.id);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(owner.id);
    expect(OPA.isSuspended(userNonNull)).equals(true);
    expect(userNonNull.hasSuspensionStarted).equals(true);
    expect(userNonNull.hasSuspensionEnded).equals(false);
    expect(userNonNull.reasonForSuspensionStart).equals(testStartReason);
    expect(userNonNull.reasonForSuspensionEnd).equals(null);
    expect(userNonNull.dateOfSuspensionStart).not.equals(null);
    expect(userNonNull.dateOfSuspensionEnd).equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(owner.id);
    expect(userNonNull.userIdOfSuspensionEnder).equals(null);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    await OpaDb.Users.queries.setToUnSuspended(config.dataStorageState.db, userId, testEndReason, owner.id, config.firebaseConstructorProvider);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(9);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(owner.id);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(owner.id);
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(true);
    expect(userNonNull.hasSuspensionEnded).equals(true);
    expect(userNonNull.reasonForSuspensionStart).equals(testStartReason);
    expect(userNonNull.reasonForSuspensionEnd).equals(testEndReason);
    expect(userNonNull.dateOfSuspensionStart).not.equals(null);
    expect(userNonNull.dateOfSuspensionEnd).not.equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(owner.id);
    expect(userNonNull.userIdOfSuspensionEnder).equals(owner.id);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    await expect(OpaDb.Users.queries.setToUnSuspended(config.dataStorageState.db, userId, testEndReason, owner.id, config.firebaseConstructorProvider)).to.eventually.be.rejectedWith(Error);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(9);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(owner.id);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(owner.id);
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(true);
    expect(userNonNull.hasSuspensionEnded).equals(true);
    expect(userNonNull.reasonForSuspensionStart).equals(testStartReason);
    expect(userNonNull.reasonForSuspensionEnd).equals(testEndReason);
    expect(userNonNull.dateOfSuspensionStart).not.equals(null);
    expect(userNonNull.dateOfSuspensionEnd).not.equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(owner.id);
    expect(userNonNull.userIdOfSuspensionEnder).equals(owner.id);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    await expect(OpaDb.Users.queries.markAsDeleted(config.dataStorageState.db, userId, owner.id, config.firebaseConstructorProvider)).to.eventually.be.rejectedWith(Error);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(9);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(owner.id);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(owner.id);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(owner.id);
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(true);
    expect(userNonNull.hasSuspensionEnded).equals(true);
    expect(userNonNull.reasonForSuspensionStart).equals(testStartReason);
    expect(userNonNull.reasonForSuspensionEnd).equals(testEndReason);
    expect(userNonNull.dateOfSuspensionStart).not.equals(null);
    expect(userNonNull.dateOfSuspensionEnd).not.equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(owner.id);
    expect(userNonNull.userIdOfSuspensionEnder).equals(owner.id);
    expect(userNonNull.isMarkedAsDeleted).equals(false);
    expect(userNonNull.dateOfDeletion).equals(null);
    expect(userNonNull.userIdOfDeleter).equals(null);

    await OpaDb.Users.queries.markAsDeleted(config.dataStorageState.db, userId, userId, config.firebaseConstructorProvider);
    user = await OpaDb.Users.queries.getById(config.dataStorageState.db, userId);
    expect(user).not.equals(null);

    userNonNull = OPA.convertNonNullish(user);
    expect(userNonNull.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(userNonNull.authProviderId).equals(authProviderNonNull.id);
    expect(userNonNull.authAccountName).equals(config.authenticationState.email);
    expect(userNonNull.authAccountNameLowered).equals(config.authenticationState.email.toLowerCase());
    expect(userNonNull.firstName).equals(firstName_Updated);
    expect(userNonNull.lastName).equals(lastName_Updated);
    expect(userNonNull.recentQueries.length).equals(1);
    expect(userNonNull.updateHistory.length).equals(10);
    expect(userNonNull.hasBeenUpdated).equals(true);
    expect(userNonNull.dateOfLatestUpdate).not.equals(null);
    expect(userNonNull.userIdOfLatestUpdater).equals(userId);
    expect(userNonNull.hasBeenViewed).equals(true);
    expect(userNonNull.dateOfLatestViewing).not.equals(null);
    expect(userNonNull.userIdOfLatestViewer).equals(owner.id);
    expect(userNonNull.hasBeenDecided).equals(true);
    expect(userNonNull.approvalState).equals(OpaDm.ApprovalStates.approved);
    expect(userNonNull.dateOfDecision).not.equals(null);
    expect(userNonNull.userIdOfDecider).equals(owner.id);
    expect(OPA.isSuspended(userNonNull)).equals(false);
    expect(userNonNull.hasSuspensionStarted).equals(true);
    expect(userNonNull.hasSuspensionEnded).equals(true);
    expect(userNonNull.reasonForSuspensionStart).equals(testStartReason);
    expect(userNonNull.reasonForSuspensionEnd).equals(testEndReason);
    expect(userNonNull.dateOfSuspensionStart).not.equals(null);
    expect(userNonNull.dateOfSuspensionEnd).not.equals(null);
    expect(userNonNull.userIdOfSuspensionStarter).equals(owner.id);
    expect(userNonNull.userIdOfSuspensionEnder).equals(owner.id);
    expect(userNonNull.isMarkedAsDeleted).equals(true);
    expect(userNonNull.dateOfDeletion).not.equals(null);
    expect(userNonNull.userIdOfDeleter).equals(userId);
  });

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

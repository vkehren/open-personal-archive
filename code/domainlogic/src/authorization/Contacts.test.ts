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
import * as Contacts from "./Contacts";
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

    await expect(Contacts.createContact(callState.dataStorageState, callState.authenticationState, testOrgName, testFirstName, testLastName, null, null, null, null)).to.eventually.be.rejectedWith(Error); // eslint-disable-line max-len
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

    config.authenticationState = TestAuthData.owner;
    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.owner);

    config.authenticationState = TestAuthData.viewer;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.viewer);

    await expect(Contacts.createContact(callState.dataStorageState, callState.authenticationState, testOrgName, testFirstName, testLastName, null, null, null, null)).to.eventually.be.rejectedWith(Error); // eslint-disable-line max-len
  });
  test("checks that createContact(...) fails when System is installed and User is not Authorizer", testFunc2());

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

    config.authenticationState = TestAuthData.owner;
    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.owner);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, config.authenticationState);
    await TestUtils.assertUserDoesExist(config.dataStorageState, TestAuthData.admin);

    let contact = await Contacts.createContact(callState.dataStorageState, callState.authenticationState, testOrgName, testFirstName, testLastName, null, null, null, null);
    const contactId = contact.id;
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(null);
    expect(contact.message).equals(null);
    expect(OPA.isEmpty(contact.otherInfo)).equals(true);
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(1);
    expect((contact.updateHistory[0] as OpaDm.IContact).updateHistory).equals(undefined);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(false);
    expect(contact.dateOfLatestUpdate).equals(null);
    expect(contact.userIdOfLatestUpdater).equals(null);
    expect(contact.tags.length).equals(0);
    expect(contact.dateOfLatestTagging).equals(null);
    expect(contact.userIdOfLatestTagger).equals(null);
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).equals(null);
    expect(contact.userIdOfArchivalChanger).equals(null);
    expect(contact.hasBeenViewed).equals(false);
    expect(contact.dateOfLatestViewing).equals(null);
    expect(contact.userIdOfLatestViewer).equals(null);
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.testUser;
    const invalidUpdateObject = (({updateHistory: "BLANK"} as unknown) as OpaDm.IContactPartial);
    await expect(OpaDb.Contacts.queries.update(config.dataStorageState, contactId, invalidUpdateObject, ambientUserId())).to.eventually.be.rejectedWith(Error);
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(null);
    expect(contact.message).equals(null);
    expect(OPA.isEmpty(contact.otherInfo)).equals(true);
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(1);
    expect((contact.updateHistory[0] as OpaDm.IContact).updateHistory).equals(undefined);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(false);
    expect(contact.dateOfLatestUpdate).equals(null);
    expect(contact.userIdOfLatestUpdater).equals(null);
    expect(contact.tags.length).equals(0);
    expect(contact.dateOfLatestTagging).equals(null);
    expect(contact.userIdOfLatestTagger).equals(null);
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).equals(null);
    expect(contact.userIdOfArchivalChanger).equals(null);
    expect(contact.hasBeenViewed).equals(false);
    expect(contact.dateOfLatestViewing).equals(null);
    expect(contact.userIdOfLatestViewer).equals(null);
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const tags = ["a", "b", "c"];
    if (functionType == "logic") {await Contacts.setContactTags(callState, contactId, tags);}
    else {await OpaDb.Contacts.queries.setTags(config.dataStorageState, contactId, tags, OPA.ArrayContentTypes.exact, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(null);
    expect(contact.message).equals(null);
    expect(OPA.isEmpty(contact.otherInfo)).equals(true);
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(2);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(ownerId());
    expect(contact.tags.length).equals(3);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).equals(null);
    expect(contact.userIdOfArchivalChanger).equals(null);
    expect(contact.hasBeenViewed).equals(false);
    expect(contact.dateOfLatestViewing).equals(null);
    expect(contact.userIdOfLatestViewer).equals(null);
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const tagsToAdd = ["d", "e", "f", "g"];
    if (functionType == "logic") {await Contacts.addContactTags(callState, contactId, tagsToAdd);}
    else {await OpaDb.Contacts.queries.setTags(config.dataStorageState, contactId, tagsToAdd, OPA.ArrayContentTypes.only_added, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(null);
    expect(contact.message).equals(null);
    expect(OPA.isEmpty(contact.otherInfo)).equals(true);
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(3);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(adminId());
    expect(contact.tags.length).equals(7);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(adminId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).equals(null);
    expect(contact.userIdOfArchivalChanger).equals(null);
    expect(contact.hasBeenViewed).equals(false);
    expect(contact.dateOfLatestViewing).equals(null);
    expect(contact.userIdOfLatestViewer).equals(null);
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const tagsToRemove = ["b", "d", "f"];
    if (functionType == "logic") {await Contacts.removeContactTags(callState, contactId, tagsToRemove);}
    else {await OpaDb.Contacts.queries.setTags(config.dataStorageState, contactId, tagsToRemove, OPA.ArrayContentTypes.only_removed, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(null);
    expect(contact.message).equals(null);
    expect(OPA.isEmpty(contact.otherInfo)).equals(true);
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(4);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(ownerId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).equals(null);
    expect(contact.userIdOfArchivalChanger).equals(null);
    expect(contact.hasBeenViewed).equals(false);
    expect(contact.dateOfLatestViewing).equals(null);
    expect(contact.userIdOfLatestViewer).equals(null);
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Contacts.setContactToViewed(callState, contactId);}
    else {await OpaDb.Contacts.queries.setToViewed(config.dataStorageState, contactId, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(null);
    expect(contact.message).equals(null);
    expect(OPA.isEmpty(contact.otherInfo)).equals(true);
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(5);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(ownerId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).equals(null);
    expect(contact.userIdOfArchivalChanger).equals(null);
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(ownerId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.editor;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await expect(Contacts.setContactToViewed(callState, contactId)).to.eventually.be.rejectedWith(Error);
    config.dataStorageState.currentWriteBatch = null; // NOTE: The "currentWriteBatch" must be set to null for test using "query" function type to write correctly in next step
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Contacts.setContactToViewed(callState, contactId);}
    else {await OpaDb.Contacts.queries.setToViewed(config.dataStorageState, contactId, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(null);
    expect(contact.message).equals(null);
    expect(OPA.isEmpty(contact.otherInfo)).equals(true);
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(6);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(adminId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).equals(null);
    expect(contact.userIdOfArchivalChanger).equals(null);
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const testOrgName_Updated = (testOrgName + " UPDATED");
    let contactUpdateObject = ({organizationName: testOrgName_Updated} as OpaDm.IContactPartial);
    if (functionType == "logic") {await Contacts.updateContact(callState, contactId, contactUpdateObject);}
    else {await OpaDb.Contacts.queries.update(config.dataStorageState, contactId, contactUpdateObject, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(null);
    expect(contact.message).equals(null);
    expect(OPA.isEmpty(contact.otherInfo)).equals(true);
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(7);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(ownerId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).equals(null);
    expect(contact.userIdOfArchivalChanger).equals(null);
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const testAddress = "1234 OneTwoThreeFour Way";
    contactUpdateObject = ({address: testAddress} as OpaDm.IContactPartial);
    if (functionType == "logic") {await Contacts.updateContact(callState, contactId, contactUpdateObject);}
    else {await OpaDb.Contacts.queries.update(config.dataStorageState, contactId, contactUpdateObject, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(testAddress);
    expect(contact.message).equals(null);
    expect(OPA.isEmpty(contact.otherInfo)).equals(true);
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(8);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(adminId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).equals(null);
    expect(contact.userIdOfArchivalChanger).equals(null);
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const testAddress_Updated = (testAddress + " UPDATED");
    contactUpdateObject = ({address: testAddress_Updated} as OpaDm.IContactPartial);
    if (functionType == "logic") {await Contacts.updateContact(callState, contactId, contactUpdateObject);}
    else {await OpaDb.Contacts.queries.update(config.dataStorageState, contactId, contactUpdateObject, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(testAddress_Updated);
    expect(contact.message).equals(null);
    expect(OPA.isEmpty(contact.otherInfo)).equals(true);
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(9);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(ownerId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).equals(null);
    expect(contact.userIdOfArchivalChanger).equals(null);
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const testOtherInfo = {info1: "TEST INFO 1", info2: "TEST INFO 2"};
    contactUpdateObject = ({otherInfo: (testOtherInfo as Record<string, unknown>)} as OpaDm.IContactPartial);
    if (functionType == "logic") {await Contacts.updateContact(callState, contactId, contactUpdateObject);}
    else {await OpaDb.Contacts.queries.update(config.dataStorageState, contactId, contactUpdateObject, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(testAddress_Updated);
    expect(contact.message).equals(null);
    expect(contact.otherInfo).not.equals(true);
    expect(contact.otherInfo.info1).equals(testOtherInfo.info1);
    expect(contact.otherInfo.info2).equals(testOtherInfo.info2);
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(10);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(adminId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).equals(null);
    expect(contact.userIdOfArchivalChanger).equals(null);
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const correspondingUserIds = [viewerId(), guestId()];
    const correspondingUsers = await OpaDb.Users.queries.getForIdsWithAssert(callState.dataStorageState, correspondingUserIds);
    if (functionType == "logic") {await Contacts.setCorrespondingUsersForContact(callState, contactId, correspondingUserIds);}
    else {await OpaDb.Contacts.queries.setCorrespondingUsers(config.dataStorageState, contactId, correspondingUsers, OPA.ArrayContentTypes.exact, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(testAddress_Updated);
    expect(contact.message).equals(null);
    expect(contact.otherInfo).not.equals(true);
    expect(contact.otherInfo.info1).equals(testOtherInfo.info1);
    expect(contact.otherInfo.info2).equals(testOtherInfo.info2);
    expect(contact.correspondingUserIds.length).equals(2);
    expect(contact.correspondingUserIds[0]).equals(viewerId());
    expect(contact.correspondingUserIds[1]).equals(guestId());
    expect(contact.dateOfLatestCorrespondingUsersChange).not.equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(adminId());
    expect(contact.updateHistory.length).equals(11);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(adminId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).equals(null);
    expect(contact.userIdOfArchivalChanger).equals(null);
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const correspondingUserIdsToAdd = [editorId()];
    const correspondingUsersToAdd = await OpaDb.Users.queries.getForIdsWithAssert(config.dataStorageState, correspondingUserIdsToAdd);
    if (functionType == "logic") {await Contacts.addCorrespondingUsersToContact(callState, contactId, correspondingUserIdsToAdd);}
    else {await OpaDb.Contacts.queries.setCorrespondingUsers(config.dataStorageState, contactId, correspondingUsersToAdd, OPA.ArrayContentTypes.only_added, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(testAddress_Updated);
    expect(contact.message).equals(null);
    expect(contact.otherInfo).not.equals(true);
    expect(contact.otherInfo.info1).equals(testOtherInfo.info1);
    expect(contact.otherInfo.info2).equals(testOtherInfo.info2);
    expect(contact.correspondingUserIds.length).equals(3);
    expect(contact.correspondingUserIds[0]).equals(viewerId());
    expect(contact.correspondingUserIds[1]).equals(guestId());
    expect(contact.correspondingUserIds[2]).equals(editorId());
    expect(contact.dateOfLatestCorrespondingUsersChange).not.equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(ownerId());
    expect(contact.updateHistory.length).equals(12);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(ownerId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).equals(null);
    expect(contact.userIdOfArchivalChanger).equals(null);
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const correspondingUserIdsToRemove = [guestId(), viewerId()];
    const correspondingUsersToRemove = await OpaDb.Users.queries.getForIdsWithAssert(config.dataStorageState, correspondingUserIdsToRemove);
    if (functionType == "logic") {await Contacts.removeCorrespondingUsersFromContact(callState, contactId, correspondingUserIdsToRemove);}
    else {await OpaDb.Contacts.queries.setCorrespondingUsers(config.dataStorageState, contactId, correspondingUsersToRemove, OPA.ArrayContentTypes.only_removed, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(testAddress_Updated);
    expect(contact.message).equals(null);
    expect(contact.otherInfo).not.equals(true);
    expect(contact.otherInfo.info1).equals(testOtherInfo.info1);
    expect(contact.otherInfo.info2).equals(testOtherInfo.info2);
    expect(contact.correspondingUserIds.length).equals(1);
    expect(contact.correspondingUserIds[0]).equals(editorId());
    expect(contact.dateOfLatestCorrespondingUsersChange).not.equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(adminId());
    expect(contact.updateHistory.length).equals(13);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(adminId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).equals(null);
    expect(contact.userIdOfArchivalChanger).equals(null);
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.editor;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await expect(Contacts.setContactToArchived(callState, contactId)).to.eventually.be.rejectedWith(Error);
    config.dataStorageState.currentWriteBatch = null; // NOTE: The "currentWriteBatch" must be set to null for test using "query" function type to write correctly in next step
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Contacts.setContactToArchived(callState, contactId);}
    else {await OpaDb.Contacts.queries.setToArchivalOption(config.dataStorageState, contactId, true, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(testAddress_Updated);
    expect(contact.message).equals(null);
    expect(contact.otherInfo).not.equals(true);
    expect(contact.otherInfo.info1).equals(testOtherInfo.info1);
    expect(contact.otherInfo.info2).equals(testOtherInfo.info2);
    expect(contact.correspondingUserIds.length).equals(1);
    expect(contact.correspondingUserIds[0]).equals(editorId());
    expect(contact.dateOfLatestCorrespondingUsersChange).not.equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(adminId());
    expect(contact.updateHistory.length).equals(14);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(ownerId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(true);
    expect(contact.dateOfArchivalChange).not.equals(null);
    expect(contact.userIdOfArchivalChanger).equals(ownerId());
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Contacts.setContactToNotArchived(callState, contactId);}
    else {await OpaDb.Contacts.queries.setToArchivalOption(config.dataStorageState, contactId, false, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(testAddress_Updated);
    expect(contact.message).equals(null);
    expect(contact.otherInfo).not.equals(true);
    expect(contact.otherInfo.info1).equals(testOtherInfo.info1);
    expect(contact.otherInfo.info2).equals(testOtherInfo.info2);
    expect(contact.correspondingUserIds.length).equals(1);
    expect(contact.correspondingUserIds[0]).equals(editorId());
    expect(contact.dateOfLatestCorrespondingUsersChange).not.equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(adminId());
    expect(contact.updateHistory.length).equals(15);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(adminId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).not.equals(null);
    expect(contact.userIdOfArchivalChanger).equals(adminId());
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    // NOTE: Set-and-UnSet a second time to verify logic
    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Contacts.setContactToArchived(callState, contactId);}
    else {await OpaDb.Contacts.queries.setToArchivalOption(config.dataStorageState, contactId, true, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(testAddress_Updated);
    expect(contact.message).equals(null);
    expect(contact.otherInfo).not.equals(true);
    expect(contact.otherInfo.info1).equals(testOtherInfo.info1);
    expect(contact.otherInfo.info2).equals(testOtherInfo.info2);
    expect(contact.correspondingUserIds.length).equals(1);
    expect(contact.correspondingUserIds[0]).equals(editorId());
    expect(contact.dateOfLatestCorrespondingUsersChange).not.equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(adminId());
    expect(contact.updateHistory.length).equals(16);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(ownerId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(true);
    expect(contact.dateOfArchivalChange).not.equals(null);
    expect(contact.userIdOfArchivalChanger).equals(ownerId());
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Contacts.setContactToNotArchived(callState, contactId);}
    else {await OpaDb.Contacts.queries.setToArchivalOption(config.dataStorageState, contactId, false, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(testAddress_Updated);
    expect(contact.message).equals(null);
    expect(contact.otherInfo).not.equals(true);
    expect(contact.otherInfo.info1).equals(testOtherInfo.info1);
    expect(contact.otherInfo.info2).equals(testOtherInfo.info2);
    expect(contact.correspondingUserIds.length).equals(1);
    expect(contact.correspondingUserIds[0]).equals(editorId());
    expect(contact.dateOfLatestCorrespondingUsersChange).not.equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(adminId());
    expect(contact.updateHistory.length).equals(17);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(ownerId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).not.equals(null);
    expect(contact.userIdOfArchivalChanger).equals(ownerId());
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.editor;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await expect(Contacts.markContactAsDeleted(callState, contactId)).to.eventually.be.rejectedWith(Error);
    config.dataStorageState.currentWriteBatch = null; // NOTE: The "currentWriteBatch" must be set to null for test using "query" function type to write correctly in next step
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(testAddress_Updated);
    expect(contact.message).equals(null);
    expect(contact.otherInfo).not.equals(true);
    expect(contact.otherInfo.info1).equals(testOtherInfo.info1);
    expect(contact.otherInfo.info2).equals(testOtherInfo.info2);
    expect(contact.correspondingUserIds.length).equals(1);
    expect(contact.correspondingUserIds[0]).equals(editorId());
    expect(contact.dateOfLatestCorrespondingUsersChange).not.equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(adminId());
    expect(contact.updateHistory.length).equals(17);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(ownerId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).not.equals(null);
    expect(contact.userIdOfArchivalChanger).equals(ownerId());
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).equals(null);
    expect(contact.userIdOfDeletionChanger).equals(null);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Contacts.markContactAsDeleted(callState, contactId);}
    else {await OpaDb.Contacts.queries.markWithDeletionState(config.dataStorageState, contactId, OPA.DeletionStates.deleted, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(testAddress_Updated);
    expect(contact.message).equals(null);
    expect(contact.otherInfo).not.equals(true);
    expect(contact.otherInfo.info1).equals(testOtherInfo.info1);
    expect(contact.otherInfo.info2).equals(testOtherInfo.info2);
    expect(contact.correspondingUserIds.length).equals(1);
    expect(contact.correspondingUserIds[0]).equals(editorId());
    expect(contact.dateOfLatestCorrespondingUsersChange).not.equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(adminId());
    expect(contact.updateHistory.length).equals(18);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(adminId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).not.equals(null);
    expect(contact.userIdOfArchivalChanger).equals(ownerId());
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(true);
    expect(contact.dateOfDeletionChange).not.equals(null);
    expect(contact.userIdOfDeletionChanger).equals(adminId());

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Contacts.markContactAsUnDeleted(callState, contactId);}
    else {await OpaDb.Contacts.queries.markWithDeletionState(config.dataStorageState, contactId, OPA.DeletionStates.undeleted, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(testAddress_Updated);
    expect(contact.message).equals(null);
    expect(contact.otherInfo).not.equals(true);
    expect(contact.otherInfo.info1).equals(testOtherInfo.info1);
    expect(contact.otherInfo.info2).equals(testOtherInfo.info2);
    expect(contact.correspondingUserIds.length).equals(1);
    expect(contact.correspondingUserIds[0]).equals(editorId());
    expect(contact.dateOfLatestCorrespondingUsersChange).not.equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(adminId());
    expect(contact.updateHistory.length).equals(19);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(ownerId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).not.equals(null);
    expect(contact.userIdOfArchivalChanger).equals(ownerId());
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).not.equals(null);
    expect(contact.userIdOfDeletionChanger).equals(ownerId());

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Contacts.markContactAsDeleted(callState, contactId);}
    else {await OpaDb.Contacts.queries.markWithDeletionState(config.dataStorageState, contactId, OPA.DeletionStates.deleted, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(testAddress_Updated);
    expect(contact.message).equals(null);
    expect(contact.otherInfo).not.equals(true);
    expect(contact.otherInfo.info1).equals(testOtherInfo.info1);
    expect(contact.otherInfo.info2).equals(testOtherInfo.info2);
    expect(contact.correspondingUserIds.length).equals(1);
    expect(contact.correspondingUserIds[0]).equals(editorId());
    expect(contact.dateOfLatestCorrespondingUsersChange).not.equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(adminId());
    expect(contact.updateHistory.length).equals(20);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(ownerId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).not.equals(null);
    expect(contact.userIdOfArchivalChanger).equals(ownerId());
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(true);
    expect(contact.dateOfDeletionChange).not.equals(null);
    expect(contact.userIdOfDeletionChanger).equals(ownerId());

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    if (functionType == "logic") {await Contacts.markContactAsUnDeleted(callState, contactId);}
    else {await OpaDb.Contacts.queries.markWithDeletionState(config.dataStorageState, contactId, OPA.DeletionStates.undeleted, ambientUserId());}
    contact = await TestUtils.assertContactDoesExist(config.dataStorageState, contactId);

    expect(contact.id).equals(contactId);
    expect(contact.organizationName).equals(testOrgName_Updated);
    expect(contact.firstName).equals(testFirstName);
    expect(contact.lastName).equals(testLastName);
    expect(contact.email).equals(null);
    expect(contact.phoneNumber).equals(null);
    expect(contact.address).equals(testAddress_Updated);
    expect(contact.message).equals(null);
    expect(contact.otherInfo).not.equals(true);
    expect(contact.otherInfo.info1).equals(testOtherInfo.info1);
    expect(contact.otherInfo.info2).equals(testOtherInfo.info2);
    expect(contact.correspondingUserIds.length).equals(1);
    expect(contact.correspondingUserIds[0]).equals(editorId());
    expect(contact.dateOfLatestCorrespondingUsersChange).not.equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(adminId());
    expect(contact.updateHistory.length).equals(21);
    expect(contact.dateOfCreation).not.equals(null);
    expect(contact.userIdOfCreator).equals(adminId());
    expect(contact.hasBeenUpdated).equals(true);
    expect(contact.dateOfLatestUpdate).not.equals(null);
    expect(contact.userIdOfLatestUpdater).equals(adminId());
    expect(contact.tags.length).equals(4);
    expect(contact.dateOfLatestTagging).not.equals(null);
    expect(contact.userIdOfLatestTagger).equals(ownerId());
    expect(contact.isArchived).equals(false);
    expect(contact.dateOfArchivalChange).not.equals(null);
    expect(contact.userIdOfArchivalChanger).equals(ownerId());
    expect(contact.hasBeenViewed).equals(true);
    expect(contact.dateOfLatestViewing).not.equals(null);
    expect(contact.userIdOfLatestViewer).equals(adminId());
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).not.equals(null);
    expect(contact.userIdOfDeletionChanger).equals(adminId());
  });
  test("checks that createContact(...) succeeds and Contact updates succeed when System is installed and User is Authorizer", testFunc3("query"));
  test("checks that createContact(...) succeeds and Contact updates succeed when System is installed and User is Authorizer", testFunc3("logic"));

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

    config.authenticationState = TestAuthData.owner;
    let callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const contactO1 = await Contacts.createContact(callState.dataStorageState, callState.authenticationState, "O1", null, null, null, null, null, null);
    const contactO2 = await Contacts.createContact(callState.dataStorageState, callState.authenticationState, "O2", null, null, null, null, null, null);
    const contactO3 = await Contacts.createContact(callState.dataStorageState, callState.authenticationState, "O3", null, null, null, null, null, null);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const contactA1 = await Contacts.createContact(callState.dataStorageState, callState.authenticationState, "A1", null, null, null, null, null, null);
    const contactA2 = await Contacts.createContact(callState.dataStorageState, callState.authenticationState, "A2", null, null, null, null, null, null);
    const contactA3 = await Contacts.createContact(callState.dataStorageState, callState.authenticationState, "A3", null, null, null, null, null, null);

    // NOTE: Test that Contacts can be created by User of any Role, and even unauthenticated users
    const contactE1 = await Contacts.createContact(callState.dataStorageState, TestAuthData.editor, "E1", null, null, null, null, null, null);
    const contactE2 = await Contacts.createContact(callState.dataStorageState, TestAuthData.editor, "E2", null, null, null, null, null, null);
    const contactE3 = await Contacts.createContact(callState.dataStorageState, TestAuthData.editor, "E3", null, null, null, null, null, null);
    const contactV1 = await Contacts.createContact(callState.dataStorageState, TestAuthData.viewer, "V1", null, null, null, null, null, null);
    const contactV2 = await Contacts.createContact(callState.dataStorageState, TestAuthData.viewer, "V2", null, null, null, null, null, null);
    const contactV3 = await Contacts.createContact(callState.dataStorageState, TestAuthData.viewer, "V3", null, null, null, null, null, null);
    const contactG1 = await Contacts.createContact(callState.dataStorageState, TestAuthData.guest, "G1", null, null, null, null, null, null);
    const contactG2 = await Contacts.createContact(callState.dataStorageState, TestAuthData.guest, "G2", null, null, null, null, null, null);
    const contactG3 = await Contacts.createContact(callState.dataStorageState, TestAuthData.guest, "G3", null, null, null, null, null, null);
    const contactUA1 = await Contacts.createContact(callState.dataStorageState, null, "UA1", null, null, null, null, null, null);
    const contactUA2 = await Contacts.createContact(callState.dataStorageState, null, "UA2", null, null, null, null, null, null);
    const contactUA3 = await Contacts.createContact(callState.dataStorageState, null, "UA3", null, null, null, null, null, null);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const contactO1DM = await Contacts.convertContactToDisplayModel(callState, contactO1);
    expect(contactO1DM.id).equals(contactO1.id);
    const contactO2DM = await Contacts.convertContactToDisplayModel(callState, contactO2);
    expect(contactO2DM.id).equals(contactO2.id);
    const contactO3DM = await Contacts.convertContactToDisplayModel(callState, contactO3);
    expect(contactO3DM.id).equals(contactO3.id);
    const contactA1DM = await Contacts.convertContactToDisplayModel(callState, contactA1);
    expect(contactA1DM.id).equals(contactA1.id);
    const contactA2DM = await Contacts.convertContactToDisplayModel(callState, contactA2);
    expect(contactA2DM.id).equals(contactA2.id);
    const contactA3DM = await Contacts.convertContactToDisplayModel(callState, contactA3);
    expect(contactA3DM.id).equals(contactA3.id);
    const contactE1DM = await Contacts.convertContactToDisplayModel(callState, contactE1);
    expect(contactE1DM.id).equals(contactE1.id);
    const contactE2DM = await Contacts.convertContactToDisplayModel(callState, contactE2);
    expect(contactE2DM.id).equals(contactE2.id);
    const contactE3DM = await Contacts.convertContactToDisplayModel(callState, contactE3);
    expect(contactE3DM.id).equals(contactE3.id);
    const contactV1DM = await Contacts.convertContactToDisplayModel(callState, contactV1);
    expect(contactV1DM.id).equals(contactV1.id);
    const contactV2DM = await Contacts.convertContactToDisplayModel(callState, contactV2);
    expect(contactV2DM.id).equals(contactV2.id);
    const contactV3DM = await Contacts.convertContactToDisplayModel(callState, contactV3);
    expect(contactV3DM.id).equals(contactV3.id);
    const contactG1DM = await Contacts.convertContactToDisplayModel(callState, contactG1);
    expect(contactG1DM.id).equals(contactG1.id);
    const contactG2DM = await Contacts.convertContactToDisplayModel(callState, contactG2);
    expect(contactG2DM.id).equals(contactG2.id);
    const contactG3DM = await Contacts.convertContactToDisplayModel(callState, contactG3);
    expect(contactG3DM.id).equals(contactG3.id);
    const contactUA1DM = await Contacts.convertContactToDisplayModel(callState, contactUA1);
    expect(contactUA1DM.id).equals(contactUA1.id);
    const contactUA2DM = await Contacts.convertContactToDisplayModel(callState, contactUA2);
    expect(contactUA2DM.id).equals(contactUA2.id);
    const contactUA3DM = await Contacts.convertContactToDisplayModel(callState, contactUA3);
    expect(contactUA3DM.id).equals(contactUA3.id);

    config.authenticationState = TestAuthData.owner;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const contactsOwnerAll = await Contacts.getListOfContacts(callState);
    const contactsOwnerAllIds = contactsOwnerAll.map((value) => (value.id));

    expect(contactsOwnerAllIds.length).equals(18);
    expect(contactsOwnerAllIds.includes(contactO1.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactO2.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactO3.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactA1.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactA2.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactA3.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactE1.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactE2.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactE3.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactV1.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactV2.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactV3.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactG1.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactG2.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactG3.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactUA1.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactUA2.id)).equals(true);
    expect(contactsOwnerAllIds.includes(contactUA3.id)).equals(true);

    config.authenticationState = TestAuthData.admin;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const contactsAdminAll = await Contacts.getListOfContacts(callState);
    const contactsAdminAllIds = contactsAdminAll.map((value) => (value.id));

    expect(contactsAdminAllIds.length).equals(18);
    expect(contactsAdminAllIds.includes(contactO1.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactO2.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactO3.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactA1.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactA2.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactA3.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactE1.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactE2.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactE3.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactV1.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactV2.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactV3.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactG1.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactG2.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactG3.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactUA1.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactUA2.id)).equals(true);
    expect(contactsAdminAllIds.includes(contactUA3.id)).equals(true);

    config.authenticationState = TestAuthData.editor;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    const contactsEditorAll = await Contacts.getListOfContacts(callState);
    const contactsEditorAllIds = contactsEditorAll.map((value) => (value.id));

    expect(contactsEditorAllIds.length).equals(18);
    expect(contactsEditorAllIds.includes(contactO1.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactO2.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactO3.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactA1.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactA2.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactA3.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactE1.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactE2.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactE3.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactV1.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactV2.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactV3.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactG1.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactG2.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactG3.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactUA1.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactUA2.id)).equals(true);
    expect(contactsEditorAllIds.includes(contactUA3.id)).equals(true);

    config.authenticationState = TestAuthData.viewer;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await expect(Contacts.getListOfContacts(callState)).to.eventually.be.rejectedWith(Error);

    config.authenticationState = TestAuthData.guest;
    callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await expect(Contacts.getListOfContacts(callState)).to.eventually.be.rejectedWith(Error);
  });
  test("checks that getListOfAccessRequests(...) succeeds and filters properly when System is installed", testFunc4());

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

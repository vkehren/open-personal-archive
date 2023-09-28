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

    await expect(Contacts.createContact(callState, testOrgName, testFirstName, testLastName, null, null, null, null)).to.eventually.be.rejectedWith(Error);
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

    await expect(Contacts.createContact(callState, testOrgName, testFirstName, testLastName, null, null, null, null)).to.eventually.be.rejectedWith(Error);
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

    let contact = await Contacts.createContact(callState, testOrgName, testFirstName, testLastName, null, null, null, null);
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
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(11);
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
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(12);
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
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(13);
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
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(14);
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
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(14);
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
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
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
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
    expect(contact.updateHistory.length).equals(16);
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
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
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
    expect(contact.correspondingUserIds.length).equals(0);
    expect(contact.dateOfLatestCorrespondingUsersChange).equals(null);
    expect(contact.userIdOfLatestCorrespondingUsersChanger).equals(null);
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
    expect(contact.isMarkedAsDeleted).equals(false);
    expect(contact.dateOfDeletionChange).not.equals(null);
    expect(contact.userIdOfDeletionChanger).equals(adminId());
  });
  test("checks that createContact(...) succeeds and Contact updates succeed when System is installed and User is Authorizer", testFunc3("query"));
  test("checks that createContact(...) succeeds and Contact updates succeed when System is installed and User is Authorizer", testFunc3("logic"));

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

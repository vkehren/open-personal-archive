import * as admin from "firebase-admin";
import {afterEach, beforeEach, describe, test} from "mocha";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
import * as CSU from "../CallStateUtilities";
import * as Application from "./Application";
import * as Users from "../authorization/Users";
import * as ActivityLog from "./ActivityLog";
import {TestAuthData} from "../TestData.test";
import * as TestConfig from "../TestConfiguration.test";
import * as TestUtils from "../TestUtilities.test";

const config = TestConfig.getTestConfiguration();
const localhost = "localhost";
const indexPage = "index.html";

describe("ActivityLog Tests using Firebase " + config.testEnvironment, function() {
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
    } else {
      await OPA.clearFirestoreCollectionByRef(config.dataStorageState, OpaDb.ActivityLogItems.getTypedCollection(config.dataStorageState));
    }

    // LATER: Consider terminating DB, deleting App, and re-creating App
  });

  const testFunc1 = (authState: OPA.DefaultFunc<TestConfig.IAuthenticationStateForTests | null>) => (async () => {
    const isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);

    // NOTE: For most tests, it would be incorrect to set the AuthState to null, but here we must be able to run the tests for that situation
    config.authenticationState = (authState() as TestConfig.IAuthenticationStateForTests);

    let firebaseAuthUserId: string | null = null;
    let userId: string | null = null;
    if (!OPA.isNullish(authState())) {
      const authStateNonNull = OPA.convertNonNullish(authState());
      firebaseAuthUserId = authStateNonNull.firebaseAuthUserId;

      if (isSystemInstalled) {
        const hasUser = (!OPA.isNullish(OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, firebaseAuthUserId)));
        userId = (hasUser && authStateNonNull.hasOpaUserId()) ? authStateNonNull.opaUserId : null;
      }
    }

    // NOTE: Assert what "firebaseAuthUserId" and "userId" should equal or not equal
    if (authState() == null) {
      expect(firebaseAuthUserId).equals(null);
      expect(userId).equals(null);
    } else if (authState() == TestAuthData.owner) {
      expect(firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
      expect(userId).equals(null);
    } else if (authState() == TestAuthData.admin) {
      expect(firebaseAuthUserId).equals(TestAuthData.admin.firebaseAuthUserId);
      expect(userId).equals(null);
    } else if (authState() == TestAuthData.editor) {
      expect(firebaseAuthUserId).equals(TestAuthData.editor.firebaseAuthUserId);
      expect(userId).equals(null);
    } else if (authState() == TestAuthData.viewer) {
      expect(firebaseAuthUserId).equals(TestAuthData.viewer.firebaseAuthUserId);
      expect(userId).equals(null);
    } else if (authState() == TestAuthData.guest) {
      expect(firebaseAuthUserId).equals(TestAuthData.guest.firebaseAuthUserId);
      expect(userId).equals(null);
    } else if (authState() == TestAuthData.testUser) {
      expect(firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
      expect(userId).equals(null);
    } else {
      throw Error("This case should be unreachable.");
    }

    const resource0 = indexPage;
    const webLogItem0 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.web_page_view, OPA.ExecutionStates.remote, localhost, resource0, null, {}, null);
    expect(webLogItem0).not.equals(null);
    expect(webLogItem0.id).not.equals(null);
    expect(webLogItem0.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem0.executionState).equals(OPA.ExecutionStates.remote);
    expect(webLogItem0.requestor).equals(localhost);
    expect(webLogItem0.resource).equals(resource0);
    expect(webLogItem0.resourceCanonical).equals(resource0);
    expect(webLogItem0.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(webLogItem0.userId).equals(userId);
    expect(webLogItem0.rootLogItemId).equals(webLogItem0.id);
    expect(webLogItem0.externalLogItemId).equals(null);
    config.dataStorageState.logWriteState.externalLogItemId = webLogItem0.id;
    const serverLogItem0_Entry = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.entry, localhost, resource0, null, {}, null); // eslint-disable-line camelcase, max-len
    expect(serverLogItem0_Entry).not.equals(null);
    expect(serverLogItem0_Entry.id).not.equals(null);
    expect(serverLogItem0_Entry.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem0_Entry.executionState).equals(OPA.ExecutionStates.entry);
    expect(serverLogItem0_Entry.requestor).equals(localhost);
    expect(serverLogItem0_Entry.resource).equals(resource0);
    expect(serverLogItem0_Entry.resourceCanonical).equals(resource0);
    expect(serverLogItem0_Entry.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem0_Entry.userId).equals(userId);
    expect(serverLogItem0_Entry.rootLogItemId).equals(serverLogItem0_Entry.id);
    expect(serverLogItem0_Entry.externalLogItemId).equals(webLogItem0.id);
    const serverLogItem0_Ready = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.ready, localhost, resource0, null, {}, null); // eslint-disable-line camelcase, max-len
    expect(serverLogItem0_Ready).not.equals(null);
    expect(serverLogItem0_Ready.id).not.equals(null);
    expect(serverLogItem0_Ready.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem0_Ready.executionState).equals(OPA.ExecutionStates.ready);
    expect(serverLogItem0_Ready.requestor).equals(localhost);
    expect(serverLogItem0_Ready.resource).equals(resource0);
    expect(serverLogItem0_Ready.resourceCanonical).equals(resource0);
    expect(serverLogItem0_Ready.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem0_Ready.userId).equals(userId);
    expect(serverLogItem0_Ready.rootLogItemId).equals(serverLogItem0_Ready.id);
    expect(serverLogItem0_Ready.externalLogItemId).equals(webLogItem0.id);
    config.dataStorageState.logWriteState.rootLogItemId = serverLogItem0_Ready.id;
    const serverLogItem0_Error = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_error, OPA.ExecutionStates.error, localhost, resource0, null, {}, null); // eslint-disable-line camelcase, max-len
    expect(serverLogItem0_Error).not.equals(null);
    expect(serverLogItem0_Error.id).not.equals(null);
    expect(serverLogItem0_Error.activityType).equals(OpaDm.ActivityTypes.server_function_error);
    expect(serverLogItem0_Error.executionState).equals(OPA.ExecutionStates.error);
    expect(serverLogItem0_Error.requestor).equals(localhost);
    expect(serverLogItem0_Error.resource).equals(resource0);
    expect(serverLogItem0_Error.resourceCanonical).equals(resource0);
    expect(serverLogItem0_Error.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem0_Error.userId).equals(userId);
    expect(serverLogItem0_Error.rootLogItemId).equals(serverLogItem0_Ready.id);
    expect(serverLogItem0_Error.externalLogItemId).equals(webLogItem0.id);
    config.dataStorageState.logWriteState.rootLogItemId = null;
    const serverLogItem0_Complete = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.complete, localhost, resource0, null, {}, null); // eslint-disable-line camelcase, max-len
    expect(serverLogItem0_Complete).not.equals(null);
    expect(serverLogItem0_Complete.id).not.equals(null);
    expect(serverLogItem0_Complete.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem0_Complete.executionState).equals(OPA.ExecutionStates.complete);
    expect(serverLogItem0_Complete.requestor).equals(localhost);
    expect(serverLogItem0_Complete.resource).equals(resource0);
    expect(serverLogItem0_Complete.resourceCanonical).equals(resource0);
    expect(serverLogItem0_Complete.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem0_Complete.userId).equals(userId);
    expect(serverLogItem0_Complete.rootLogItemId).equals(serverLogItem0_Complete.id);
    expect(serverLogItem0_Complete.externalLogItemId).equals(webLogItem0.id);
    config.dataStorageState.logWriteState.externalLogItemId = null;

    const resource1 = "https://somedomainname.com";
    const resourceCanonical1 = "https://somedomainname.com/index.html";
    const webLogItem1 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.web_page_view, OPA.ExecutionStates.remote, localhost, resource1, null, {}, null);
    expect(webLogItem1).not.equals(null);
    expect(webLogItem1.id).not.equals(null);
    expect(webLogItem1.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem1.executionState).equals(OPA.ExecutionStates.remote);
    expect(webLogItem1.requestor).equals(localhost);
    expect(webLogItem1.resource).equals(resource1);
    expect(webLogItem1.resourceCanonical).equals(resourceCanonical1);
    expect(webLogItem1.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(webLogItem1.userId).equals(userId);
    const serverLogItem1 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.ready, localhost, resource1, null, {}, null); // eslint-disable-line max-len
    expect(serverLogItem1).not.equals(null);
    expect(serverLogItem1.id).not.equals(null);
    expect(serverLogItem1.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem1.executionState).equals(OPA.ExecutionStates.ready);
    expect(serverLogItem1.requestor).equals(localhost);
    expect(serverLogItem1.resource).equals(resource1);
    expect(serverLogItem1.resourceCanonical).equals(resource1);
    expect(serverLogItem1.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem1.userId).equals(userId);

    const resource2 = "https://somedomainname.com/";
    const resourceCanonical2 = "https://somedomainname.com/index.html";
    const webLogItem2 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.web_page_view, OPA.ExecutionStates.remote, localhost, resource2, null, {}, null);
    expect(webLogItem2).not.equals(null);
    expect(webLogItem2.id).not.equals(null);
    expect(webLogItem2.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem2.executionState).equals(OPA.ExecutionStates.remote);
    expect(webLogItem2.requestor).equals(localhost);
    expect(webLogItem2.resource).equals(resource2);
    expect(webLogItem2.resourceCanonical).equals(resourceCanonical2);
    expect(webLogItem2.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(webLogItem2.userId).equals(userId);
    const serverLogItem2 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.ready, localhost, resource2, null, {}, null); // eslint-disable-line max-len
    expect(serverLogItem2).not.equals(null);
    expect(serverLogItem2.id).not.equals(null);
    expect(serverLogItem2.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem2.executionState).equals(OPA.ExecutionStates.ready);
    expect(serverLogItem2.requestor).equals(localhost);
    expect(serverLogItem2.resource).equals(resource2);
    expect(serverLogItem2.resourceCanonical).equals(resource2);
    expect(serverLogItem2.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem2.userId).equals(userId);

    const resource3 = "https://somedomainname.com/somefolder/";
    const resourceCanonical3 = "https://somedomainname.com/somefolder/index.html";
    const webLogItem3 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.web_page_view, OPA.ExecutionStates.remote, localhost, resource3, null, {}, null);
    expect(webLogItem3).not.equals(null);
    expect(webLogItem3.id).not.equals(null);
    expect(webLogItem3.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem3.executionState).equals(OPA.ExecutionStates.remote);
    expect(webLogItem3.requestor).equals(localhost);
    expect(webLogItem3.resource).equals(resource3);
    expect(webLogItem3.resourceCanonical).equals(resourceCanonical3);
    expect(webLogItem3.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(webLogItem3.userId).equals(userId);
    const serverLogItem3 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.ready, localhost, resource3, null, {}, null); // eslint-disable-line max-len
    expect(serverLogItem3).not.equals(null);
    expect(serverLogItem3.id).not.equals(null);
    expect(serverLogItem3.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem3.executionState).equals(OPA.ExecutionStates.ready);
    expect(serverLogItem3.requestor).equals(localhost);
    expect(serverLogItem3.resource).equals(resource3);
    expect(serverLogItem3.resourceCanonical).equals(resource3);
    expect(serverLogItem3.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem3.userId).equals(userId);

    const resource4 = "https://somedomainname.com/somefolder/?someArgument=hello&otherArgument=world";
    const resourceCanonical4 = "https://somedomainname.com/somefolder/index.html?someArgument=hello&otherArgument=world";
    const webLogItem4 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.web_page_view, OPA.ExecutionStates.remote, localhost, resource4, null, {}, null);
    expect(webLogItem4).not.equals(null);
    expect(webLogItem4.id).not.equals(null);
    expect(webLogItem4.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem4.executionState).equals(OPA.ExecutionStates.remote);
    expect(webLogItem4.requestor).equals(localhost);
    expect(webLogItem4.resource).equals(resource4);
    expect(webLogItem4.resourceCanonical).equals(resourceCanonical4);
    expect(webLogItem4.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(webLogItem4.userId).equals(userId);
    const serverLogItem4 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.ready, localhost, resource4, null, {}, null); // eslint-disable-line max-len
    expect(serverLogItem4).not.equals(null);
    expect(serverLogItem4.id).not.equals(null);
    expect(serverLogItem4.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem4.executionState).equals(OPA.ExecutionStates.ready);
    expect(serverLogItem4.requestor).equals(localhost);
    expect(serverLogItem4.resource).equals(resource4);
    expect(serverLogItem4.resourceCanonical).equals(resource4);
    expect(serverLogItem4.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem4.userId).equals(userId);

    config.authenticationState = TestAuthData.owner;
    const logItems = await ActivityLog.getListOfLogItems(config.dataStorageState, config.authenticationState, {groupItemsByExternalId: true, groupItemsByRootId: true});
    const logItemsMap = OPA.createMapFromArray(logItems, (logItem) => logItem.id);

    expect(logItems.length).equals(1 + (4 * 2));
    expect(logItemsMap.get(webLogItem0.id)?.id).equals(webLogItem0.id);
    expect(logItemsMap.get(webLogItem0.id)?.subItems.length).equals(3);
    expect(logItemsMap.get(webLogItem0.id)?.subItems[0].subItems.length).equals(0);
    expect(logItemsMap.get(webLogItem0.id)?.subItems[1].subItems.length).equals(1);
    expect(logItemsMap.get(webLogItem0.id)?.subItems[2].subItems.length).equals(0);
    expect(logItemsMap.get(webLogItem1.id)?.id).equals(webLogItem1.id);
    expect(logItemsMap.get(serverLogItem1.id)?.id).equals(serverLogItem1.id);
    expect(logItemsMap.get(webLogItem2.id)?.id).equals(webLogItem2.id);
    expect(logItemsMap.get(serverLogItem2.id)?.id).equals(serverLogItem2.id);
    expect(logItemsMap.get(webLogItem3.id)?.id).equals(webLogItem3.id);
    expect(logItemsMap.get(serverLogItem3.id)?.id).equals(serverLogItem3.id);
    expect(logItemsMap.get(webLogItem4.id)?.id).equals(webLogItem4.id);
    expect(logItemsMap.get(serverLogItem4.id)?.id).equals(serverLogItem4.id);

    const logItems_FirstPart = await ActivityLog.getListOfLogItems(config.dataStorageState, config.authenticationState, {groupItemsByExternalId: false, groupItemsByRootId: false, pagingOptions: {limit: 2, offset: 0}}); // eslint-disable-line camelcase, max-len
    const logItems_LastPart = await ActivityLog.getListOfLogItems(config.dataStorageState, config.authenticationState, {groupItemsByExternalId: false, groupItemsByRootId: false, pagingOptions: {limit: 2, offset: (logItems.length - 2)}}); // eslint-disable-line camelcase, max-len
    expect(logItems_FirstPart.length).equals(2);
    expect(logItems_LastPart.length).equals(2);
    expect(logItems_FirstPart[0].id == logItems_LastPart[0].id).equals(false);
    expect(logItems_FirstPart[1].id == logItems_LastPart[1].id).equals(false);
  });
  test("checks that recordLogItem(...) succeeds when System is not installed", testFunc1(() => null));
  test("checks that recordLogItem(...) succeeds when System is not installed", testFunc1(() => TestAuthData.owner));
  test("checks that recordLogItem(...) succeeds when System is not installed", testFunc1(() => TestAuthData.admin));
  test("checks that recordLogItem(...) succeeds when System is not installed", testFunc1(() => TestAuthData.editor));
  test("checks that recordLogItem(...) succeeds when System is not installed", testFunc1(() => TestAuthData.viewer));
  test("checks that recordLogItem(...) succeeds when System is not installed", testFunc1(() => TestAuthData.guest));
  test("checks that recordLogItem(...) succeeds when System is not installed", testFunc1(() => TestAuthData.testUser));

  const testFunc2 = (authState: OPA.DefaultFunc<TestConfig.IAuthenticationStateForTests | null>) => (async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);

    await TestUtils.performInstallForTest(config.dataStorageState, config.authenticationState);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);

    // NOTE: For most tests, it would be incorrect to set the AuthState to null, but here we must be able to run the tests for that situation
    config.authenticationState = (authState() as TestConfig.IAuthenticationStateForTests);

    let firebaseAuthUserId: string | null = null;
    let userId: string | null = null;
    if (!OPA.isNullish(authState())) {
      const authStateNonNull = OPA.convertNonNullish(authState());
      firebaseAuthUserId = authStateNonNull.firebaseAuthUserId;

      if (isSystemInstalled) {
        const hasUser = (!OPA.isNullish(OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, firebaseAuthUserId)));
        userId = (hasUser && authStateNonNull.hasOpaUserId()) ? authStateNonNull.opaUserId : null;
      }
    }

    // NOTE: Assert what "firebaseAuthUserId" and "userId" should equal or not equal
    if (authState() == null) {
      expect(firebaseAuthUserId).equals(null);
      expect(userId).equals(null);
    } else if (authState() == TestAuthData.owner) {
      expect(firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
      expect(userId).equals(OpaDm.User_OwnerId);
    } else if (authState() == TestAuthData.admin) {
      expect(firebaseAuthUserId).equals(TestAuthData.admin.firebaseAuthUserId);
      expect(userId).not.equals(null);
      expect(userId).not.equals(OpaDm.User_OwnerId);
      expect(userId).not.equals(TestAuthData.getPlaceholderIdValue());
    } else if (authState() == TestAuthData.editor) {
      expect(firebaseAuthUserId).equals(TestAuthData.editor.firebaseAuthUserId);
      expect(userId).not.equals(null);
      expect(userId).not.equals(OpaDm.User_OwnerId);
      expect(userId).not.equals(TestAuthData.getPlaceholderIdValue());
    } else if (authState() == TestAuthData.viewer) {
      expect(firebaseAuthUserId).equals(TestAuthData.viewer.firebaseAuthUserId);
      expect(userId).not.equals(null);
      expect(userId).not.equals(OpaDm.User_OwnerId);
      expect(userId).not.equals(TestAuthData.getPlaceholderIdValue());
    } else if (authState() == TestAuthData.guest) {
      expect(firebaseAuthUserId).equals(TestAuthData.guest.firebaseAuthUserId);
      expect(userId).not.equals(null);
      expect(userId).not.equals(OpaDm.User_OwnerId);
      expect(userId).not.equals(TestAuthData.getPlaceholderIdValue());
    } else if (authState() == TestAuthData.testUser) {
      expect(firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
      expect(userId).equals(null);
    } else {
      throw Error("This case should be unreachable.");
    }

    const resource0 = indexPage;
    const webLogItem0 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.web_page_view, OPA.ExecutionStates.remote, localhost, resource0, null, {}, null);
    expect(webLogItem0).not.equals(null);
    expect(webLogItem0.id).not.equals(null);
    expect(webLogItem0.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem0.executionState).equals(OPA.ExecutionStates.remote);
    expect(webLogItem0.requestor).equals(localhost);
    expect(webLogItem0.resource).equals(resource0);
    expect(webLogItem0.resourceCanonical).equals(resource0);
    expect(webLogItem0.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(webLogItem0.userId).equals(userId);
    expect(webLogItem0.rootLogItemId).equals(webLogItem0.id);
    expect(webLogItem0.externalLogItemId).equals(null);
    config.dataStorageState.logWriteState.externalLogItemId = webLogItem0.id;
    const serverLogItem0_Entry = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.entry, localhost, resource0, null, {}, null); // eslint-disable-line camelcase, max-len
    expect(serverLogItem0_Entry).not.equals(null);
    expect(serverLogItem0_Entry.id).not.equals(null);
    expect(serverLogItem0_Entry.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem0_Entry.executionState).equals(OPA.ExecutionStates.entry);
    expect(serverLogItem0_Entry.requestor).equals(localhost);
    expect(serverLogItem0_Entry.resource).equals(resource0);
    expect(serverLogItem0_Entry.resourceCanonical).equals(resource0);
    expect(serverLogItem0_Entry.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem0_Entry.userId).equals(userId);
    expect(serverLogItem0_Entry.rootLogItemId).equals(serverLogItem0_Entry.id);
    expect(serverLogItem0_Entry.externalLogItemId).equals(webLogItem0.id);
    const serverLogItem0_Ready = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.ready, localhost, resource0, null, {}, null); // eslint-disable-line camelcase, max-len
    expect(serverLogItem0_Ready).not.equals(null);
    expect(serverLogItem0_Ready.id).not.equals(null);
    expect(serverLogItem0_Ready.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem0_Ready.executionState).equals(OPA.ExecutionStates.ready);
    expect(serverLogItem0_Ready.requestor).equals(localhost);
    expect(serverLogItem0_Ready.resource).equals(resource0);
    expect(serverLogItem0_Ready.resourceCanonical).equals(resource0);
    expect(serverLogItem0_Ready.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem0_Ready.userId).equals(userId);
    expect(serverLogItem0_Ready.rootLogItemId).equals(serverLogItem0_Ready.id);
    expect(serverLogItem0_Ready.externalLogItemId).equals(webLogItem0.id);
    config.dataStorageState.logWriteState.rootLogItemId = serverLogItem0_Ready.id;
    const serverLogItem0_Error = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_error, OPA.ExecutionStates.error, localhost, resource0, null, {}, null); // eslint-disable-line camelcase, max-len
    expect(serverLogItem0_Error).not.equals(null);
    expect(serverLogItem0_Error.id).not.equals(null);
    expect(serverLogItem0_Error.activityType).equals(OpaDm.ActivityTypes.server_function_error);
    expect(serverLogItem0_Error.executionState).equals(OPA.ExecutionStates.error);
    expect(serverLogItem0_Error.requestor).equals(localhost);
    expect(serverLogItem0_Error.resource).equals(resource0);
    expect(serverLogItem0_Error.resourceCanonical).equals(resource0);
    expect(serverLogItem0_Error.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem0_Error.userId).equals(userId);
    expect(serverLogItem0_Error.rootLogItemId).equals(serverLogItem0_Ready.id);
    expect(serverLogItem0_Error.externalLogItemId).equals(webLogItem0.id);
    config.dataStorageState.logWriteState.rootLogItemId = null;
    const serverLogItem0_Complete = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.complete, localhost, resource0, null, {}, null); // eslint-disable-line camelcase, max-len
    expect(serverLogItem0_Complete).not.equals(null);
    expect(serverLogItem0_Complete.id).not.equals(null);
    expect(serverLogItem0_Complete.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem0_Complete.executionState).equals(OPA.ExecutionStates.complete);
    expect(serverLogItem0_Complete.requestor).equals(localhost);
    expect(serverLogItem0_Complete.resource).equals(resource0);
    expect(serverLogItem0_Complete.resourceCanonical).equals(resource0);
    expect(serverLogItem0_Complete.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem0_Complete.userId).equals(userId);
    expect(serverLogItem0_Complete.rootLogItemId).equals(serverLogItem0_Complete.id);
    expect(serverLogItem0_Complete.externalLogItemId).equals(webLogItem0.id);
    config.dataStorageState.logWriteState.externalLogItemId = null;

    const resource1 = "https://somedomainname.com";
    const resourceCanonical1 = "https://somedomainname.com/index.html";
    const webLogItem1 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.web_page_view, OPA.ExecutionStates.remote, localhost, resource1, null, {}, null);
    expect(webLogItem1).not.equals(null);
    expect(webLogItem1.id).not.equals(null);
    expect(webLogItem1.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem1.executionState).equals(OPA.ExecutionStates.remote);
    expect(webLogItem1.requestor).equals(localhost);
    expect(webLogItem1.resource).equals(resource1);
    expect(webLogItem1.resourceCanonical).equals(resourceCanonical1);
    expect(webLogItem1.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(webLogItem1.userId).equals(userId);
    const serverLogItem1 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.ready, localhost, resource1, null, {}, null); // eslint-disable-line max-len
    expect(serverLogItem1).not.equals(null);
    expect(serverLogItem1.id).not.equals(null);
    expect(serverLogItem1.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem1.executionState).equals(OPA.ExecutionStates.ready);
    expect(serverLogItem1.requestor).equals(localhost);
    expect(serverLogItem1.resource).equals(resource1);
    expect(serverLogItem1.resourceCanonical).equals(resource1);
    expect(serverLogItem1.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem1.userId).equals(userId);

    const resource2 = "https://somedomainname.com/";
    const resourceCanonical2 = "https://somedomainname.com/index.html";
    const webLogItem2 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.web_page_view, OPA.ExecutionStates.remote, localhost, resource2, null, {}, null);
    expect(webLogItem2).not.equals(null);
    expect(webLogItem2.id).not.equals(null);
    expect(webLogItem2.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem2.executionState).equals(OPA.ExecutionStates.remote);
    expect(webLogItem2.requestor).equals(localhost);
    expect(webLogItem2.resource).equals(resource2);
    expect(webLogItem2.resourceCanonical).equals(resourceCanonical2);
    expect(webLogItem2.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(webLogItem2.userId).equals(userId);
    const serverLogItem2 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.ready, localhost, resource2, null, {}, null); // eslint-disable-line max-len
    expect(serverLogItem2).not.equals(null);
    expect(serverLogItem2.id).not.equals(null);
    expect(serverLogItem2.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem2.executionState).equals(OPA.ExecutionStates.ready);
    expect(serverLogItem2.requestor).equals(localhost);
    expect(serverLogItem2.resource).equals(resource2);
    expect(serverLogItem2.resourceCanonical).equals(resource2);
    expect(serverLogItem2.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem2.userId).equals(userId);

    const resource3 = "https://somedomainname.com/somefolder/";
    const resourceCanonical3 = "https://somedomainname.com/somefolder/index.html";
    const webLogItem3 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.web_page_view, OPA.ExecutionStates.remote, localhost, resource3, null, {}, null);
    expect(webLogItem3).not.equals(null);
    expect(webLogItem3.id).not.equals(null);
    expect(webLogItem3.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem3.executionState).equals(OPA.ExecutionStates.remote);
    expect(webLogItem3.requestor).equals(localhost);
    expect(webLogItem3.resource).equals(resource3);
    expect(webLogItem3.resourceCanonical).equals(resourceCanonical3);
    expect(webLogItem3.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(webLogItem3.userId).equals(userId);
    const serverLogItem3 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.ready, localhost, resource3, null, {}, null); // eslint-disable-line max-len
    expect(serverLogItem3).not.equals(null);
    expect(serverLogItem3.id).not.equals(null);
    expect(serverLogItem3.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem3.executionState).equals(OPA.ExecutionStates.ready);
    expect(serverLogItem3.requestor).equals(localhost);
    expect(serverLogItem3.resource).equals(resource3);
    expect(serverLogItem3.resourceCanonical).equals(resource3);
    expect(serverLogItem3.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem3.userId).equals(userId);

    const resource4 = "https://somedomainname.com/somefolder/?someArgument=hello&otherArgument=world";
    const resourceCanonical4 = "https://somedomainname.com/somefolder/index.html?someArgument=hello&otherArgument=world";
    const webLogItem4 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.web_page_view, OPA.ExecutionStates.remote, localhost, resource4, null, {}, null);
    expect(webLogItem4).not.equals(null);
    expect(webLogItem4.id).not.equals(null);
    expect(webLogItem4.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem4.executionState).equals(OPA.ExecutionStates.remote);
    expect(webLogItem4.requestor).equals(localhost);
    expect(webLogItem4.resource).equals(resource4);
    expect(webLogItem4.resourceCanonical).equals(resourceCanonical4);
    expect(webLogItem4.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(webLogItem4.userId).equals(userId);
    const serverLogItem4 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.ready, localhost, resource4, null, {}, null); // eslint-disable-line max-len
    expect(serverLogItem4).not.equals(null);
    expect(serverLogItem4.id).not.equals(null);
    expect(serverLogItem4.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem4.executionState).equals(OPA.ExecutionStates.ready);
    expect(serverLogItem4.requestor).equals(localhost);
    expect(serverLogItem4.resource).equals(resource4);
    expect(serverLogItem4.resourceCanonical).equals(resource4);
    expect(serverLogItem4.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem4.userId).equals(userId);

    config.authenticationState = TestAuthData.owner;
    const logItems = await ActivityLog.getListOfLogItems(config.dataStorageState, config.authenticationState, {groupItemsByExternalId: true, groupItemsByRootId: true});
    const logItemsMap = OPA.createMapFromArray(logItems, (logItem) => logItem.id);

    expect(logItems.length).equals(1 + (4 * 2));
    expect(logItemsMap.get(webLogItem0.id)?.id).equals(webLogItem0.id);
    expect(logItemsMap.get(webLogItem0.id)?.subItems.length).equals(3);
    expect(logItemsMap.get(webLogItem0.id)?.subItems[0].subItems.length).equals(0);
    expect(logItemsMap.get(webLogItem0.id)?.subItems[1].subItems.length).equals(1);
    expect(logItemsMap.get(webLogItem0.id)?.subItems[2].subItems.length).equals(0);
    expect(logItemsMap.get(webLogItem1.id)?.id).equals(webLogItem1.id);
    expect(logItemsMap.get(serverLogItem1.id)?.id).equals(serverLogItem1.id);
    expect(logItemsMap.get(webLogItem2.id)?.id).equals(webLogItem2.id);
    expect(logItemsMap.get(serverLogItem2.id)?.id).equals(serverLogItem2.id);
    expect(logItemsMap.get(webLogItem3.id)?.id).equals(webLogItem3.id);
    expect(logItemsMap.get(serverLogItem3.id)?.id).equals(serverLogItem3.id);
    expect(logItemsMap.get(webLogItem4.id)?.id).equals(webLogItem4.id);
    expect(logItemsMap.get(serverLogItem4.id)?.id).equals(serverLogItem4.id);

    const logItems_FirstPart = await ActivityLog.getListOfLogItems(config.dataStorageState, config.authenticationState, {groupItemsByExternalId: false, groupItemsByRootId: false, pagingOptions: {limit: 2, offset: 0}}); // eslint-disable-line camelcase, max-len
    const logItems_LastPart = await ActivityLog.getListOfLogItems(config.dataStorageState, config.authenticationState, {groupItemsByExternalId: false, groupItemsByRootId: false, pagingOptions: {limit: 2, offset: (logItems.length - 2)}}); // eslint-disable-line camelcase, max-len
    expect(logItems_FirstPart.length).equals(2);
    expect(logItems_LastPart.length).equals(2);
    expect(logItems_FirstPart[0].id == logItems_LastPart[0].id).equals(false);
    expect(logItems_FirstPart[1].id == logItems_LastPart[1].id).equals(false);
  });
  test("checks that recordLogItem(...) succeeds when System is installed and User is Archive Owner", testFunc2(() => null));
  test("checks that recordLogItem(...) succeeds when System is installed and User is Archive Owner", testFunc2(() => TestAuthData.owner));
  test("checks that recordLogItem(...) succeeds when System is installed and User is Archive Owner", testFunc2(() => TestAuthData.admin));
  test("checks that recordLogItem(...) succeeds when System is installed and User is Archive Owner", testFunc2(() => TestAuthData.editor));
  test("checks that recordLogItem(...) succeeds when System is installed and User is Archive Owner", testFunc2(() => TestAuthData.viewer));
  test("checks that recordLogItem(...) succeeds when System is installed and User is Archive Owner", testFunc2(() => TestAuthData.guest));
  test("checks that recordLogItem(...) succeeds when System is installed and User is Archive Owner", testFunc2(() => TestAuthData.testUser));

  const testFunc3 = (authState: OPA.DefaultFunc<TestConfig.IAuthenticationStateForTests | null>) => (async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);

    await TestUtils.performInstallForTest(config.dataStorageState, config.authenticationState);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);

    // NOTE: Set the ambient AuthenticationState to TestUser before initializing that account
    config.authenticationState = TestAuthData.testUser;
    const callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email);
    const user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);
    const userNonNull = OPA.convertNonNullish(user);
    // NOTE: Since the TestUser is newly created, record the userId
    TestAuthData.testUser.opaUserId = userNonNull.id;

    // NOTE: For most tests, it would be incorrect to set the AuthState to null, but here we must be able to run the tests for that situation
    config.authenticationState = (authState() as TestConfig.IAuthenticationStateForTests);

    let firebaseAuthUserId: string | null = null;
    let userId: string | null = null;
    if (!OPA.isNullish(authState())) {
      const authStateNonNull = OPA.convertNonNullish(authState());
      firebaseAuthUserId = authStateNonNull.firebaseAuthUserId;

      if (isSystemInstalled) {
        const hasUser = (!OPA.isNullish(OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, firebaseAuthUserId)));
        userId = (hasUser && authStateNonNull.hasOpaUserId()) ? authStateNonNull.opaUserId : null;
      }
    }

    // NOTE: Assert what "firebaseAuthUserId" and "userId" should equal or not equal
    if (authState() == null) {
      expect(firebaseAuthUserId).equals(null);
      expect(userId).equals(null);
    } else if (authState() == TestAuthData.owner) {
      expect(firebaseAuthUserId).equals(TestAuthData.owner.firebaseAuthUserId);
      expect(userId).equals(OpaDm.User_OwnerId);
    } else if (authState() == TestAuthData.admin) {
      expect(firebaseAuthUserId).equals(TestAuthData.admin.firebaseAuthUserId);
      expect(userId).not.equals(null);
      expect(userId).not.equals(OpaDm.User_OwnerId);
      expect(userId).not.equals(TestAuthData.getPlaceholderIdValue());
    } else if (authState() == TestAuthData.editor) {
      expect(firebaseAuthUserId).equals(TestAuthData.editor.firebaseAuthUserId);
      expect(userId).not.equals(null);
      expect(userId).not.equals(OpaDm.User_OwnerId);
      expect(userId).not.equals(TestAuthData.getPlaceholderIdValue());
    } else if (authState() == TestAuthData.viewer) {
      expect(firebaseAuthUserId).equals(TestAuthData.viewer.firebaseAuthUserId);
      expect(userId).not.equals(null);
      expect(userId).not.equals(OpaDm.User_OwnerId);
      expect(userId).not.equals(TestAuthData.getPlaceholderIdValue());
    } else if (authState() == TestAuthData.guest) {
      expect(firebaseAuthUserId).equals(TestAuthData.guest.firebaseAuthUserId);
      expect(userId).not.equals(null);
      expect(userId).not.equals(OpaDm.User_OwnerId);
      expect(userId).not.equals(TestAuthData.getPlaceholderIdValue());
    } else if (authState() == TestAuthData.testUser) {
      expect(firebaseAuthUserId).equals(TestAuthData.testUser.firebaseAuthUserId);
      expect(userId).not.equals(null);
      expect(userId).not.equals(OpaDm.User_OwnerId);
      expect(userId).not.equals(TestAuthData.getPlaceholderIdValue());
    } else {
      throw Error("This case should be unreachable.");
    }

    const resource0 = indexPage;
    const webLogItem0 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.web_page_view, OPA.ExecutionStates.remote, localhost, resource0, null, {}, null);
    expect(webLogItem0).not.equals(null);
    expect(webLogItem0.id).not.equals(null);
    expect(webLogItem0.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem0.executionState).equals(OPA.ExecutionStates.remote);
    expect(webLogItem0.requestor).equals(localhost);
    expect(webLogItem0.resource).equals(resource0);
    expect(webLogItem0.resourceCanonical).equals(resource0);
    expect(webLogItem0.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(webLogItem0.userId).equals(userId);
    expect(webLogItem0.rootLogItemId).equals(webLogItem0.id);
    expect(webLogItem0.externalLogItemId).equals(null);
    config.dataStorageState.logWriteState.externalLogItemId = webLogItem0.id;
    const serverLogItem0_Entry = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.entry, localhost, resource0, null, {}, null); // eslint-disable-line camelcase, max-len
    expect(serverLogItem0_Entry).not.equals(null);
    expect(serverLogItem0_Entry.id).not.equals(null);
    expect(serverLogItem0_Entry.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem0_Entry.executionState).equals(OPA.ExecutionStates.entry);
    expect(serverLogItem0_Entry.requestor).equals(localhost);
    expect(serverLogItem0_Entry.resource).equals(resource0);
    expect(serverLogItem0_Entry.resourceCanonical).equals(resource0);
    expect(serverLogItem0_Entry.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem0_Entry.userId).equals(userId);
    expect(serverLogItem0_Entry.rootLogItemId).equals(serverLogItem0_Entry.id);
    expect(serverLogItem0_Entry.externalLogItemId).equals(webLogItem0.id);
    const serverLogItem0_Ready = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.ready, localhost, resource0, null, {}, null); // eslint-disable-line camelcase, max-len
    expect(serverLogItem0_Ready).not.equals(null);
    expect(serverLogItem0_Ready.id).not.equals(null);
    expect(serverLogItem0_Ready.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem0_Ready.executionState).equals(OPA.ExecutionStates.ready);
    expect(serverLogItem0_Ready.requestor).equals(localhost);
    expect(serverLogItem0_Ready.resource).equals(resource0);
    expect(serverLogItem0_Ready.resourceCanonical).equals(resource0);
    expect(serverLogItem0_Ready.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem0_Ready.userId).equals(userId);
    expect(serverLogItem0_Ready.rootLogItemId).equals(serverLogItem0_Ready.id);
    expect(serverLogItem0_Ready.externalLogItemId).equals(webLogItem0.id);
    config.dataStorageState.logWriteState.rootLogItemId = serverLogItem0_Ready.id;
    const serverLogItem0_Error = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_error, OPA.ExecutionStates.error, localhost, resource0, null, {}, null); // eslint-disable-line camelcase, max-len
    expect(serverLogItem0_Error).not.equals(null);
    expect(serverLogItem0_Error.id).not.equals(null);
    expect(serverLogItem0_Error.activityType).equals(OpaDm.ActivityTypes.server_function_error);
    expect(serverLogItem0_Error.executionState).equals(OPA.ExecutionStates.error);
    expect(serverLogItem0_Error.requestor).equals(localhost);
    expect(serverLogItem0_Error.resource).equals(resource0);
    expect(serverLogItem0_Error.resourceCanonical).equals(resource0);
    expect(serverLogItem0_Error.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem0_Error.userId).equals(userId);
    expect(serverLogItem0_Error.rootLogItemId).equals(serverLogItem0_Ready.id);
    expect(serverLogItem0_Error.externalLogItemId).equals(webLogItem0.id);
    config.dataStorageState.logWriteState.rootLogItemId = null;
    const serverLogItem0_Complete = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.complete, localhost, resource0, null, {}, null); // eslint-disable-line camelcase, max-len
    expect(serverLogItem0_Complete).not.equals(null);
    expect(serverLogItem0_Complete.id).not.equals(null);
    expect(serverLogItem0_Complete.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem0_Complete.executionState).equals(OPA.ExecutionStates.complete);
    expect(serverLogItem0_Complete.requestor).equals(localhost);
    expect(serverLogItem0_Complete.resource).equals(resource0);
    expect(serverLogItem0_Complete.resourceCanonical).equals(resource0);
    expect(serverLogItem0_Complete.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem0_Complete.userId).equals(userId);
    expect(serverLogItem0_Complete.rootLogItemId).equals(serverLogItem0_Complete.id);
    expect(serverLogItem0_Complete.externalLogItemId).equals(webLogItem0.id);
    config.dataStorageState.logWriteState.externalLogItemId = null;

    const resource1 = "https://somedomainname.com";
    const resourceCanonical1 = "https://somedomainname.com/index.html";
    const webLogItem1 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.web_page_view, OPA.ExecutionStates.remote, localhost, resource1, null, {}, null);
    expect(webLogItem1).not.equals(null);
    expect(webLogItem1.id).not.equals(null);
    expect(webLogItem1.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem1.executionState).equals(OPA.ExecutionStates.remote);
    expect(webLogItem1.requestor).equals(localhost);
    expect(webLogItem1.resource).equals(resource1);
    expect(webLogItem1.resourceCanonical).equals(resourceCanonical1);
    expect(webLogItem1.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(webLogItem1.userId).equals(userId);
    const serverLogItem1 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.ready, localhost, resource1, null, {}, null); // eslint-disable-line max-len
    expect(serverLogItem1).not.equals(null);
    expect(serverLogItem1.id).not.equals(null);
    expect(serverLogItem1.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem1.executionState).equals(OPA.ExecutionStates.ready);
    expect(serverLogItem1.requestor).equals(localhost);
    expect(serverLogItem1.resource).equals(resource1);
    expect(serverLogItem1.resourceCanonical).equals(resource1);
    expect(serverLogItem1.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem1.userId).equals(userId);

    const resource2 = "https://somedomainname.com/";
    const resourceCanonical2 = "https://somedomainname.com/index.html";
    const webLogItem2 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.web_page_view, OPA.ExecutionStates.remote, localhost, resource2, null, {}, null);
    expect(webLogItem2).not.equals(null);
    expect(webLogItem2.id).not.equals(null);
    expect(webLogItem2.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem2.executionState).equals(OPA.ExecutionStates.remote);
    expect(webLogItem2.requestor).equals(localhost);
    expect(webLogItem2.resource).equals(resource2);
    expect(webLogItem2.resourceCanonical).equals(resourceCanonical2);
    expect(webLogItem2.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(webLogItem2.userId).equals(userId);
    const serverLogItem2 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.ready, localhost, resource2, null, {}, null); // eslint-disable-line max-len
    expect(serverLogItem2).not.equals(null);
    expect(serverLogItem2.id).not.equals(null);
    expect(serverLogItem2.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem2.executionState).equals(OPA.ExecutionStates.ready);
    expect(serverLogItem2.requestor).equals(localhost);
    expect(serverLogItem2.resource).equals(resource2);
    expect(serverLogItem2.resourceCanonical).equals(resource2);
    expect(serverLogItem2.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem2.userId).equals(userId);

    const resource3 = "https://somedomainname.com/somefolder/";
    const resourceCanonical3 = "https://somedomainname.com/somefolder/index.html";
    const webLogItem3 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.web_page_view, OPA.ExecutionStates.remote, localhost, resource3, null, {}, null);
    expect(webLogItem3).not.equals(null);
    expect(webLogItem3.id).not.equals(null);
    expect(webLogItem3.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem3.executionState).equals(OPA.ExecutionStates.remote);
    expect(webLogItem3.requestor).equals(localhost);
    expect(webLogItem3.resource).equals(resource3);
    expect(webLogItem3.resourceCanonical).equals(resourceCanonical3);
    expect(webLogItem3.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(webLogItem3.userId).equals(userId);
    const serverLogItem3 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.ready, localhost, resource3, null, {}, null); // eslint-disable-line max-len
    expect(serverLogItem3).not.equals(null);
    expect(serverLogItem3.id).not.equals(null);
    expect(serverLogItem3.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem3.executionState).equals(OPA.ExecutionStates.ready);
    expect(serverLogItem3.requestor).equals(localhost);
    expect(serverLogItem3.resource).equals(resource3);
    expect(serverLogItem3.resourceCanonical).equals(resource3);
    expect(serverLogItem3.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem3.userId).equals(userId);

    const resource4 = "https://somedomainname.com/somefolder/?someArgument=hello&otherArgument=world";
    const resourceCanonical4 = "https://somedomainname.com/somefolder/index.html?someArgument=hello&otherArgument=world";
    const webLogItem4 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.web_page_view, OPA.ExecutionStates.remote, localhost, resource4, null, {}, null);
    expect(webLogItem4).not.equals(null);
    expect(webLogItem4.id).not.equals(null);
    expect(webLogItem4.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem4.executionState).equals(OPA.ExecutionStates.remote);
    expect(webLogItem4.requestor).equals(localhost);
    expect(webLogItem4.resource).equals(resource4);
    expect(webLogItem4.resourceCanonical).equals(resourceCanonical4);
    expect(webLogItem4.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(webLogItem4.userId).equals(userId);
    const serverLogItem4 = await ActivityLog.recordLogItem(config.dataStorageState, authState(), OpaDm.ActivityTypes.server_function_call, OPA.ExecutionStates.ready, localhost, resource4, null, {}, null); // eslint-disable-line max-len
    expect(serverLogItem4).not.equals(null);
    expect(serverLogItem4.id).not.equals(null);
    expect(serverLogItem4.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem4.executionState).equals(OPA.ExecutionStates.ready);
    expect(serverLogItem4.requestor).equals(localhost);
    expect(serverLogItem4.resource).equals(resource4);
    expect(serverLogItem4.resourceCanonical).equals(resource4);
    expect(serverLogItem4.firebaseAuthUserId).equals(firebaseAuthUserId);
    expect(serverLogItem4.userId).equals(userId);

    config.authenticationState = TestAuthData.owner;
    const logItems = await ActivityLog.getListOfLogItems(config.dataStorageState, config.authenticationState, {groupItemsByExternalId: true, groupItemsByRootId: true});
    const logItemsMap = OPA.createMapFromArray(logItems, (logItem) => logItem.id);

    expect(logItems.length).equals(1 + (4 * 2));
    expect(logItemsMap.get(webLogItem0.id)?.id).equals(webLogItem0.id);
    expect(logItemsMap.get(webLogItem0.id)?.subItems.length).equals(3);
    expect(logItemsMap.get(webLogItem0.id)?.subItems[0].subItems.length).equals(0);
    expect(logItemsMap.get(webLogItem0.id)?.subItems[1].subItems.length).equals(1);
    expect(logItemsMap.get(webLogItem0.id)?.subItems[2].subItems.length).equals(0);
    expect(logItemsMap.get(webLogItem1.id)?.id).equals(webLogItem1.id);
    expect(logItemsMap.get(serverLogItem1.id)?.id).equals(serverLogItem1.id);
    expect(logItemsMap.get(webLogItem2.id)?.id).equals(webLogItem2.id);
    expect(logItemsMap.get(serverLogItem2.id)?.id).equals(serverLogItem2.id);
    expect(logItemsMap.get(webLogItem3.id)?.id).equals(webLogItem3.id);
    expect(logItemsMap.get(serverLogItem3.id)?.id).equals(serverLogItem3.id);
    expect(logItemsMap.get(webLogItem4.id)?.id).equals(webLogItem4.id);
    expect(logItemsMap.get(serverLogItem4.id)?.id).equals(serverLogItem4.id);

    const logItems_FirstPart = await ActivityLog.getListOfLogItems(config.dataStorageState, config.authenticationState, {groupItemsByExternalId: false, groupItemsByRootId: false, pagingOptions: {limit: 2, offset: 0}}); // eslint-disable-line camelcase, max-len
    const logItems_LastPart = await ActivityLog.getListOfLogItems(config.dataStorageState, config.authenticationState, {groupItemsByExternalId: false, groupItemsByRootId: false, pagingOptions: {limit: 2, offset: (logItems.length - 2)}}); // eslint-disable-line camelcase, max-len
    expect(logItems_FirstPart.length).equals(2);
    expect(logItems_LastPart.length).equals(2);
    expect(logItems_FirstPart[0].id == logItems_LastPart[0].id).equals(false);
    expect(logItems_FirstPart[1].id == logItems_LastPart[1].id).equals(false);
  });
  test("checks that initializeUserAccount(...) succeeds when System is installed and User is not Archive Owner", testFunc3(() => null));
  test("checks that initializeUserAccount(...) succeeds when System is installed and User is not Archive Owner", testFunc3(() => TestAuthData.owner));
  test("checks that initializeUserAccount(...) succeeds when System is installed and User is not Archive Owner", testFunc3(() => TestAuthData.admin));
  test("checks that initializeUserAccount(...) succeeds when System is installed and User is not Archive Owner", testFunc3(() => TestAuthData.editor));
  test("checks that initializeUserAccount(...) succeeds when System is installed and User is not Archive Owner", testFunc3(() => TestAuthData.viewer));
  test("checks that initializeUserAccount(...) succeeds when System is installed and User is not Archive Owner", testFunc3(() => TestAuthData.guest));
  test("checks that initializeUserAccount(...) succeeds when System is installed and User is not Archive Owner", testFunc3(() => TestAuthData.testUser));

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

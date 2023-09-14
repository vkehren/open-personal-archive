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
import * as TestData from "../TestData.test";
import * as TestConfig from "../TestConfiguration.test";
import * as TestUtils from "../TestUtilities.test";

const config = TestConfig.getTestConfiguration();
const localhost = "localhost";
const indexPage = "index.html";

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

  test("checks that recordLogItem(...) succeeds when System is not installed", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);

    const resource0 = indexPage;
    const webLogItem0 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.web_page_view, localhost, resource0, null, {}, null, null, null);
    expect(webLogItem0).not.equals(null);
    expect(webLogItem0.id).not.equals(null);
    expect(webLogItem0.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem0.requestor).equals(localhost);
    expect(webLogItem0.resource).equals(resource0);
    expect(webLogItem0.resourceCanonical).equals(resource0);
    expect(webLogItem0.firebaseAuthUserId).equals(null);
    expect(webLogItem0.userId).equals(null);
    const serverLogItem0 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.server_function_call, localhost, resource0, null, {}, null, null, null);
    expect(serverLogItem0).not.equals(null);
    expect(serverLogItem0.id).not.equals(null);
    expect(serverLogItem0.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem0.requestor).equals(localhost);
    expect(serverLogItem0.resource).equals(resource0);
    expect(serverLogItem0.resourceCanonical).equals(resource0);
    expect(serverLogItem0.firebaseAuthUserId).equals(null);
    expect(serverLogItem0.userId).equals(null);

    const resource1 = "https://somedomainname.com";
    const resourceCanonical1 = "https://somedomainname.com/index.html";
    const webLogItem1 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.web_page_view, localhost, resource1, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(webLogItem1).not.equals(null);
    expect(webLogItem1.id).not.equals(null);
    expect(webLogItem1.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem1.requestor).equals(localhost);
    expect(webLogItem1.resource).equals(resource1);
    expect(webLogItem1.resourceCanonical).equals(resourceCanonical1);
    expect(webLogItem1.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(webLogItem1.userId).equals(null);
    const serverLogItem1 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.server_function_call, localhost, resource1, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(serverLogItem1).not.equals(null);
    expect(serverLogItem1.id).not.equals(null);
    expect(serverLogItem1.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem1.requestor).equals(localhost);
    expect(serverLogItem1.resource).equals(resource1);
    expect(serverLogItem1.resourceCanonical).equals(resource1);
    expect(serverLogItem1.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(serverLogItem1.userId).equals(null);

    const resource2 = "https://somedomainname.com/";
    const resourceCanonical2 = "https://somedomainname.com/index.html";
    const webLogItem2 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.web_page_view, localhost, resource2, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(webLogItem2).not.equals(null);
    expect(webLogItem2.id).not.equals(null);
    expect(webLogItem2.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem2.requestor).equals(localhost);
    expect(webLogItem2.resource).equals(resource2);
    expect(webLogItem2.resourceCanonical).equals(resourceCanonical2);
    expect(webLogItem2.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(webLogItem2.userId).equals(null);
    const serverLogItem2 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.server_function_call, localhost, resource2, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(serverLogItem2).not.equals(null);
    expect(serverLogItem2.id).not.equals(null);
    expect(serverLogItem2.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem2.requestor).equals(localhost);
    expect(serverLogItem2.resource).equals(resource2);
    expect(serverLogItem2.resourceCanonical).equals(resource2);
    expect(serverLogItem2.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(serverLogItem2.userId).equals(null);

    const resource3 = "https://somedomainname.com/somefolder/";
    const resourceCanonical3 = "https://somedomainname.com/somefolder/index.html";
    const webLogItem3 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.web_page_view, localhost, resource3, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(webLogItem3).not.equals(null);
    expect(webLogItem3.id).not.equals(null);
    expect(webLogItem3.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem3.requestor).equals(localhost);
    expect(webLogItem3.resource).equals(resource3);
    expect(webLogItem3.resourceCanonical).equals(resourceCanonical3);
    expect(webLogItem3.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(webLogItem3.userId).equals(null);
    const serverLogItem3 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.server_function_call, localhost, resource3, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(serverLogItem3).not.equals(null);
    expect(serverLogItem3.id).not.equals(null);
    expect(serverLogItem3.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem3.requestor).equals(localhost);
    expect(serverLogItem3.resource).equals(resource3);
    expect(serverLogItem3.resourceCanonical).equals(resource3);
    expect(serverLogItem3.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(serverLogItem3.userId).equals(null);

    const resource4 = "https://somedomainname.com/somefolder/?someArgument=hello&otherArgument=world";
    const resourceCanonical4 = "https://somedomainname.com/somefolder/index.html?someArgument=hello&otherArgument=world";
    const webLogItem4 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.web_page_view, localhost, resource4, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(webLogItem4).not.equals(null);
    expect(webLogItem4.id).not.equals(null);
    expect(webLogItem4.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem4.requestor).equals(localhost);
    expect(webLogItem4.resource).equals(resource4);
    expect(webLogItem4.resourceCanonical).equals(resourceCanonical4);
    expect(webLogItem4.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(webLogItem4.userId).equals(null);
    const serverLogItem4 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.server_function_call, localhost, resource4, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(serverLogItem4).not.equals(null);
    expect(serverLogItem4.id).not.equals(null);
    expect(serverLogItem4.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem4.requestor).equals(localhost);
    expect(serverLogItem4.resource).equals(resource4);
    expect(serverLogItem4.resourceCanonical).equals(resource4);
    expect(serverLogItem4.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(serverLogItem4.userId).equals(null);
  });

  test("checks that recordLogItem(...) succeeds when System is installed and User is Archive Owner", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);

    await TestUtils.performInstallForTest(config.dataStorageState, config.authenticationState);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);

    const user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);
    const userNonNull = OPA.convertNonNullish(user);

    const resource0 = indexPage;
    const webLogItem0 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.web_page_view, localhost, resource0, null, {}, null, null, null);
    expect(webLogItem0).not.equals(null);
    expect(webLogItem0.id).not.equals(null);
    expect(webLogItem0.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem0.requestor).equals(localhost);
    expect(webLogItem0.resource).equals(resource0);
    expect(webLogItem0.resourceCanonical).equals(resource0);
    expect(webLogItem0.firebaseAuthUserId).equals(null);
    expect(webLogItem0.userId).equals(null);
    const serverLogItem0 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.server_function_call, localhost, resource0, null, {}, null, null, null);
    expect(serverLogItem0).not.equals(null);
    expect(serverLogItem0.id).not.equals(null);
    expect(serverLogItem0.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem0.requestor).equals(localhost);
    expect(serverLogItem0.resource).equals(resource0);
    expect(serverLogItem0.resourceCanonical).equals(resource0);
    expect(serverLogItem0.firebaseAuthUserId).equals(null);
    expect(serverLogItem0.userId).equals(null);

    const resource1 = "https://somedomainname.com";
    const resourceCanonical1 = "https://somedomainname.com/index.html";
    const webLogItem1 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.web_page_view, localhost, resource1, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(webLogItem1).not.equals(null);
    expect(webLogItem1.id).not.equals(null);
    expect(webLogItem1.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem1.requestor).equals(localhost);
    expect(webLogItem1.resource).equals(resource1);
    expect(webLogItem1.resourceCanonical).equals(resourceCanonical1);
    expect(webLogItem1.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(webLogItem1.userId).equals(userNonNull.id);
    const serverLogItem1 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.server_function_call, localhost, resource1, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(serverLogItem1).not.equals(null);
    expect(serverLogItem1.id).not.equals(null);
    expect(serverLogItem1.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem1.requestor).equals(localhost);
    expect(serverLogItem1.resource).equals(resource1);
    expect(serverLogItem1.resourceCanonical).equals(resource1);
    expect(serverLogItem1.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(serverLogItem1.userId).equals(userNonNull.id);

    const resource2 = "https://somedomainname.com/";
    const resourceCanonical2 = "https://somedomainname.com/index.html";
    const webLogItem2 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.web_page_view, localhost, resource2, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(webLogItem2).not.equals(null);
    expect(webLogItem2.id).not.equals(null);
    expect(webLogItem2.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem2.requestor).equals(localhost);
    expect(webLogItem2.resource).equals(resource2);
    expect(webLogItem2.resourceCanonical).equals(resourceCanonical2);
    expect(webLogItem2.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(webLogItem2.userId).equals(userNonNull.id);
    const serverLogItem2 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.server_function_call, localhost, resource2, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(serverLogItem2).not.equals(null);
    expect(serverLogItem2.id).not.equals(null);
    expect(serverLogItem2.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem2.requestor).equals(localhost);
    expect(serverLogItem2.resource).equals(resource2);
    expect(serverLogItem2.resourceCanonical).equals(resource2);
    expect(serverLogItem2.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(serverLogItem2.userId).equals(userNonNull.id);

    const resource3 = "https://somedomainname.com/somefolder/";
    const resourceCanonical3 = "https://somedomainname.com/somefolder/index.html";
    const webLogItem3 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.web_page_view, localhost, resource3, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(webLogItem3).not.equals(null);
    expect(webLogItem3.id).not.equals(null);
    expect(webLogItem3.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem3.requestor).equals(localhost);
    expect(webLogItem3.resource).equals(resource3);
    expect(webLogItem3.resourceCanonical).equals(resourceCanonical3);
    expect(webLogItem3.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(webLogItem3.userId).equals(userNonNull.id);
    const serverLogItem3 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.server_function_call, localhost, resource3, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(serverLogItem3).not.equals(null);
    expect(serverLogItem3.id).not.equals(null);
    expect(serverLogItem3.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem3.requestor).equals(localhost);
    expect(serverLogItem3.resource).equals(resource3);
    expect(serverLogItem3.resourceCanonical).equals(resource3);
    expect(serverLogItem3.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(serverLogItem3.userId).equals(userNonNull.id);

    const resource4 = "https://somedomainname.com/somefolder/?someArgument=hello&otherArgument=world";
    const resourceCanonical4 = "https://somedomainname.com/somefolder/index.html?someArgument=hello&otherArgument=world";
    const webLogItem4 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.web_page_view, localhost, resource4, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(webLogItem4).not.equals(null);
    expect(webLogItem4.id).not.equals(null);
    expect(webLogItem4.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem4.requestor).equals(localhost);
    expect(webLogItem4.resource).equals(resource4);
    expect(webLogItem4.resourceCanonical).equals(resourceCanonical4);
    expect(webLogItem4.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(webLogItem4.userId).equals(userNonNull.id);
    const serverLogItem4 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.server_function_call, localhost, resource4, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(serverLogItem4).not.equals(null);
    expect(serverLogItem4.id).not.equals(null);
    expect(serverLogItem4.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem4.requestor).equals(localhost);
    expect(serverLogItem4.resource).equals(resource4);
    expect(serverLogItem4.resourceCanonical).equals(resource4);
    expect(serverLogItem4.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(serverLogItem4.userId).equals(userNonNull.id);
  });

  test("checks that initializeUserAccount(...) succeeds when System is installed and User is not Archive Owner", async () => {
    let isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(false);

    await TestUtils.performInstallForTest(config.dataStorageState, config.authenticationState);

    isSystemInstalled = await Application.isSystemInstalled(config.dataStorageState);
    expect(isSystemInstalled).equals(true);

    config.authenticationState = TestData.authenticationState_TestUser;
    // LATER: Consider testing that only "firebaseAuthUserId" is set (i.e. not "userId")

    const callState = await CSU.getCallStateForCurrentUser(config.dataStorageState, config.authenticationState);
    await Users.initializeUserAccount(callState, config.authenticationState.providerId, config.authenticationState.email);
    const user = await OpaDb.Users.queries.getByFirebaseAuthUserId(config.dataStorageState, config.authenticationState.firebaseAuthUserId);
    expect(user).not.equals(null);
    const userNonNull = OPA.convertNonNullish(user);

    const resource0 = indexPage;
    const webLogItem0 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.web_page_view, localhost, resource0, null, {}, null, null, null);
    expect(webLogItem0).not.equals(null);
    expect(webLogItem0.id).not.equals(null);
    expect(webLogItem0.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem0.requestor).equals(localhost);
    expect(webLogItem0.resource).equals(resource0);
    expect(webLogItem0.resourceCanonical).equals(resource0);
    expect(webLogItem0.firebaseAuthUserId).equals(null);
    expect(webLogItem0.userId).equals(null);
    const serverLogItem0 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.server_function_call, localhost, resource0, null, {}, null, null, null);
    expect(serverLogItem0).not.equals(null);
    expect(serverLogItem0.id).not.equals(null);
    expect(serverLogItem0.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem0.requestor).equals(localhost);
    expect(serverLogItem0.resource).equals(resource0);
    expect(serverLogItem0.resourceCanonical).equals(resource0);
    expect(serverLogItem0.firebaseAuthUserId).equals(null);
    expect(serverLogItem0.userId).equals(null);

    const resource1 = "https://somedomainname.com";
    const resourceCanonical1 = "https://somedomainname.com/index.html";
    const webLogItem1 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.web_page_view, localhost, resource1, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(webLogItem1).not.equals(null);
    expect(webLogItem1.id).not.equals(null);
    expect(webLogItem1.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem1.requestor).equals(localhost);
    expect(webLogItem1.resource).equals(resource1);
    expect(webLogItem1.resourceCanonical).equals(resourceCanonical1);
    expect(webLogItem1.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(webLogItem1.userId).equals(userNonNull.id);
    const serverLogItem1 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.server_function_call, localhost, resource1, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(serverLogItem1).not.equals(null);
    expect(serverLogItem1.id).not.equals(null);
    expect(serverLogItem1.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem1.requestor).equals(localhost);
    expect(serverLogItem1.resource).equals(resource1);
    expect(serverLogItem1.resourceCanonical).equals(resource1);
    expect(serverLogItem1.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(serverLogItem1.userId).equals(userNonNull.id);

    const resource2 = "https://somedomainname.com/";
    const resourceCanonical2 = "https://somedomainname.com/index.html";
    const webLogItem2 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.web_page_view, localhost, resource2, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(webLogItem2).not.equals(null);
    expect(webLogItem2.id).not.equals(null);
    expect(webLogItem2.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem2.requestor).equals(localhost);
    expect(webLogItem2.resource).equals(resource2);
    expect(webLogItem2.resourceCanonical).equals(resourceCanonical2);
    expect(webLogItem2.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(webLogItem2.userId).equals(userNonNull.id);
    const serverLogItem2 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.server_function_call, localhost, resource2, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(serverLogItem2).not.equals(null);
    expect(serverLogItem2.id).not.equals(null);
    expect(serverLogItem2.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem2.requestor).equals(localhost);
    expect(serverLogItem2.resource).equals(resource2);
    expect(serverLogItem2.resourceCanonical).equals(resource2);
    expect(serverLogItem2.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(serverLogItem2.userId).equals(userNonNull.id);

    const resource3 = "https://somedomainname.com/somefolder/";
    const resourceCanonical3 = "https://somedomainname.com/somefolder/index.html";
    const webLogItem3 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.web_page_view, localhost, resource3, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(webLogItem3).not.equals(null);
    expect(webLogItem3.id).not.equals(null);
    expect(webLogItem3.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem3.requestor).equals(localhost);
    expect(webLogItem3.resource).equals(resource3);
    expect(webLogItem3.resourceCanonical).equals(resourceCanonical3);
    expect(webLogItem3.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(webLogItem3.userId).equals(userNonNull.id);
    const serverLogItem3 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.server_function_call, localhost, resource3, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(serverLogItem3).not.equals(null);
    expect(serverLogItem3.id).not.equals(null);
    expect(serverLogItem3.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem3.requestor).equals(localhost);
    expect(serverLogItem3.resource).equals(resource3);
    expect(serverLogItem3.resourceCanonical).equals(resource3);
    expect(serverLogItem3.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(serverLogItem3.userId).equals(userNonNull.id);

    const resource4 = "https://somedomainname.com/somefolder/?someArgument=hello&otherArgument=world";
    const resourceCanonical4 = "https://somedomainname.com/somefolder/index.html?someArgument=hello&otherArgument=world";
    const webLogItem4 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.web_page_view, localhost, resource4, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(webLogItem4).not.equals(null);
    expect(webLogItem4.id).not.equals(null);
    expect(webLogItem4.activityType).equals(OpaDm.ActivityTypes.web_page_view);
    expect(webLogItem4.requestor).equals(localhost);
    expect(webLogItem4.resource).equals(resource4);
    expect(webLogItem4.resourceCanonical).equals(resourceCanonical4);
    expect(webLogItem4.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(webLogItem4.userId).equals(userNonNull.id);
    const serverLogItem4 = await ActivityLog.recordLogItem(config.dataStorageState, OpaDm.ActivityTypes.server_function_call, localhost, resource4, null, {}, config.authenticationState.firebaseAuthUserId, null, null);
    expect(serverLogItem4).not.equals(null);
    expect(serverLogItem4.id).not.equals(null);
    expect(serverLogItem4.activityType).equals(OpaDm.ActivityTypes.server_function_call);
    expect(serverLogItem4.requestor).equals(localhost);
    expect(serverLogItem4.resource).equals(resource4);
    expect(serverLogItem4.resourceCanonical).equals(resource4);
    expect(serverLogItem4.firebaseAuthUserId).equals(config.authenticationState.firebaseAuthUserId);
    expect(serverLogItem4.userId).equals(userNonNull.id);
  });

  afterEach(async () => {
    await config.dataStorageState.db.terminate();
    await admin.app().delete();
  });
});

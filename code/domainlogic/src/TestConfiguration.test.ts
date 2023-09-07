import * as firestore from "@google-cloud/firestore";
import * as admin from "firebase-admin";
import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import * as TestConfigurationFile from "../test-config.json";

export type TestEnvironment = "Cloud" | "Emulators";

export interface ITestConfiguration {
  testEnvironment: TestEnvironment;
  timeout: number;
  appInitializationArgs: admin.AppOptions;
  dataStorageState: OpaDm.IDataStorageState;
  authenticationState: OpaDm.IAuthenticationState;
  hasRunTests: boolean;
}

/**
 * Gets the Test Configuration for the Open Personal Archive™ (OPA) system.
 * @return {ITestConfiguration}
 */
export function getTestConfiguration(): ITestConfiguration {
  const testEnvironment: TestEnvironment = (TestConfigurationFile.use_emulators) ? "Emulators" : "Cloud";
  let timeout: number | null | undefined = TestConfigurationFile.timeout;
  let appInitializationArgs: any = {projectId: ""};

  if (testEnvironment == "Emulators") {
    const emulatorsConfig = TestConfigurationFile.test_emulators;
    timeout = emulatorsConfig.timeout ?? timeout;
    OPA.setFirebaseToUseEmulators(emulatorsConfig.project_id, emulatorsConfig.emulator_authentication_host, emulatorsConfig.emulator_firestore_host, emulatorsConfig.emulator_storage_host);
    appInitializationArgs = {projectId: emulatorsConfig.project_id_for_admin};
  } else {
    const cloudConfig = TestConfigurationFile.test_cloud;
    timeout = cloudConfig.timeout ?? timeout;
    OPA.setFirebaseToUseCloud(cloudConfig.path_to_credential);
    appInitializationArgs = {projectId: cloudConfig.project_id_for_admin};
  }

  const nullDb = ((null as unknown) as firestore.Firestore);
  const ownerFirebaseAuthUserId = "FB_" + OpaDm.User_OwnerId;

  const dataStorageState: OpaDm.IDataStorageState = {
    appName: "[DEFAULT]", // NOTE: This is the default name Firebase uses for unnamed apps
    projectId: appInitializationArgs.projectId,
    usesAdminAccess: true,
    usesEmulators: (testEnvironment == "Emulators"),
    db: nullDb,
  };
  const authenticationState: OpaDm.IAuthenticationState = {
    firebaseAuthUserId: ownerFirebaseAuthUserId,
    providerId: "google.com",
    email: (ownerFirebaseAuthUserId + "@gmail.com"),
    emailIsVerified: true,
  };

  const testConfiguration: ITestConfiguration = {
    testEnvironment,
    timeout,
    appInitializationArgs,
    dataStorageState,
    authenticationState,
    hasRunTests: false,
  };
  return testConfiguration;
}

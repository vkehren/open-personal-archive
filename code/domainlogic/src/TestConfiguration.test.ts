import * as firestore from "@google-cloud/firestore";
import * as admin from "firebase-admin";
import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {TestAuthData} from "./TestData.test";
import * as TestConfigurationFile from "../test-config.json";

export type TestEnvironment = "Cloud" | "Emulators";
export type TestFunctionType = "query" | "logic";

export interface IAuthenticationStateForTests extends OpaDm.IAuthenticationState {
  hasOpaUserId: OPA.DefaultFunc<boolean>;
  opaUserId: string;
}

export interface ITestConfiguration {
  testEnvironment: TestEnvironment;
  timeout: number;
  appInitializationArgs: admin.AppOptions;
  dataStorageState: OpaDm.IDataStorageState;
  authenticationState: IAuthenticationStateForTests;
  hasRunTests: boolean;
}

/**
 * Gets the Test Configuration for the Open Personal Archive™ (OPA) system.
 * @return {ITestConfiguration}
 */
export function getTestConfiguration(): ITestConfiguration {
  OpaDm.DataConfiguration.Locale_UseMin = true;
  OpaDm.DataConfiguration.TimeZoneGroup_UseMin = true;
  OpaDm.DataConfiguration.TimeZone_UseMin = true;

  const testEnvironment: TestEnvironment = (TestConfigurationFile.use_emulators) ? "Emulators" : "Cloud";
  let timeout: number | null | undefined = TestConfigurationFile.timeout;
  let appInitializationArgs = {projectId: ""};

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
  const dataStorageState: OpaDm.IDataStorageState = {
    appName: "[DEFAULT]", // NOTE: This is the default name Firebase uses for unnamed apps
    projectId: appInitializationArgs.projectId,
    usesAdminAccess: true,
    usesEmulators: (testEnvironment == "Emulators"),
    db: nullDb,
    constructorProvider: {
      timestampNow: firestore.Timestamp.now,
      timestampFromDate: firestore.Timestamp.fromDate,
      timestampFromTimestamp: (timestamp: firestore.Timestamp) => (new firestore.Timestamp(timestamp.seconds, timestamp.nanoseconds)),
      arrayRemove: firestore.FieldValue.arrayRemove,
      arrayUnion: firestore.FieldValue.arrayUnion,
      delete: firestore.FieldValue.delete,
      increment: firestore.FieldValue.increment,
      serverTimestamp: firestore.FieldValue.serverTimestamp,
      bulkWriter: () => {
        const writer = dataStorageState.db.bulkWriter();
        writer.onWriteError((error: firestore.BulkWriterError) => {
          return OPA.bulkWriterErrorHandler(dataStorageState, error);
        });
        return writer;
      },
      writeBatch: () => (dataStorageState.db.batch()),
    },
    logWriteState: {
      rootLogItemId: (null as string | null),
      externalLogItemId: (null as string | null),
    },
    currentBulkWriter: (null as firestore.BulkWriter | null),
    currentWriteBatch: (null as firestore.WriteBatch | null),
  };

  const testConfiguration: ITestConfiguration = {
    testEnvironment,
    timeout,
    appInitializationArgs,
    dataStorageState,
    authenticationState: TestAuthData.owner,
    hasRunTests: false,
  };
  return testConfiguration;
}

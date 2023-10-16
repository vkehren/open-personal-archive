import * as firestore from "@google-cloud/firestore";
import * as BT from "./BaseTypes";
import * as TC from "./TypeChecking";
import * as VC from "./ValueChecking";

export const DEFAULT_UNIQUENESS_INDEX_COLLECTION = "UniquenessIndices";
export const BULK_WRITER_MAX_RETRY_ATTEMPTS = 4;
export const FIREBASE_DEFAULT_REGION = "us-east1";
export const FIREBASE_DEFAULT_MAX_INSTANCES = 10;
export const FIREBASE_DEFAULT_OPTIONS = {region: FIREBASE_DEFAULT_REGION, maxInstances: FIREBASE_DEFAULT_MAX_INSTANCES};
export const DEFAULT_ANONYMOUS_DISPLAY_NAME = "(anonymous)";

export type FirebaseAuthType = "ADMIN" | "USER" | "UNAUTHENTICATED";
export const FirebaseAuthTypes = {
  _typeName: "FirebaseAuthType",
  _all: (["ADMIN", "USER", "UNAUTHENTICATED"] as Array<FirebaseAuthType>),
  admin: ("ADMIN" as FirebaseAuthType),
  user: ("USER" as FirebaseAuthType),
  unauthenticated: ("UNAUTHENTICATED" as FirebaseAuthType),
};

export type FirebaseProviderType = "password" | "google.com";
export const FirebaseProviderTypes = {
  _typeName: "FirebaseProviderType",
  _all: (["password", "google.com"] as Array<FirebaseProviderType>),
  password: ("password" as FirebaseProviderType), // email and password
  google: ("google.com" as FirebaseProviderType), // Google popup
};

export interface IFirebaseAuthUserData {
  authType: FirebaseAuthType;
  uid: string;
  providerId: FirebaseProviderType;
  email: string;
  emailVerified: boolean;
  isAnonymous: boolean;
  displayName?: string;
  username?: string;
  phoneNumber?: string;
  disabled: boolean;
  isNewUser?: boolean;
  locale?: string;
  ipAddress: string;
  timestamp: string;
}

export enum AuthActionRequirement {
  Automatic,
  EmailVerified = 1 << 1,
  NotDisabled = 1 << 2,
  EmailVerifiedAndNotDisabled = EmailVerified | NotDisabled,
  Manual = 1 << 8,
}
export const DEFAULT_AUTH_AUTO_INITIALIZATION_TYPE = AuthActionRequirement.NotDisabled;
export const DEFAULT_AUTH_AUTO_APPROVAL_TYPE = AuthActionRequirement.EmailVerifiedAndNotDisabled;
export const REQUIRED_AUTH_AUTO_SUSPEND_REASON = "AUTOMATIC SUSPENSION FROM AUTH: Account was disabled";
export const REQUIRED_AUTH_AUTO_UNSUSPEND_REASON = "AUTOMATIC UNSUSPENSION FROM AUTH: Account was no longer disabled";

/** Provides workarounds for issues constructing Firebase objects across multiple packages (see https://github.com/googleapis/nodejs-firestore/issues/760) */
export interface IFirebaseConstructorProvider {
  timestampNow: () => firestore.Timestamp;
  timestampFromDate: (date: Date) => firestore.Timestamp;
  timestampFromTimestamp: (timestamp: firestore.Timestamp) => firestore.Timestamp;
  arrayRemove: (...elements: any[]) => firestore.FieldValue; // eslint-disable-line @typescript-eslint/no-explicit-any
  arrayUnion: (...elements: any[]) => firestore.FieldValue; // eslint-disable-line @typescript-eslint/no-explicit-any
  delete: () => firestore.FieldValue;
  increment: (n: number) => firestore.FieldValue;
  serverTimestamp: () => firestore.FieldValue;
  bulkWriter: () => firestore.BulkWriter;
  writeBatch: () => firestore.WriteBatch;
}

export interface ILogWriteState {
  readonly entryModuleName: string;
  readonly entryFunctionName: string;
  rootLogItemId: string | null;
  externalLogItemId: string | null;
}

export interface IDataStorageState {
  appName: string;
  projectId: string;
  usesAdminAccess: boolean;
  usesEmulators: boolean;
  db: firestore.Firestore;
  // LATER: Add storage;
  constructorProvider: IFirebaseConstructorProvider;
  logWriteState: ILogWriteState;
  currentBulkWriter: firestore.BulkWriter | null;
  currentWriteBatch: firestore.WriteBatch | null;
}

export interface IAuthenticationState {
  readonly firebaseAuthUserId: string;
  readonly providerId: string;
  readonly email: string;
  readonly emailIsVerified: boolean;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly displayName?: string;
}

export interface ICallStateBase<DS extends IDataStorageState, ATC extends IAuthenticationState, SYS, ATZ> {
  readonly dataStorageState: DS;
  readonly authenticationState: ATC;
  readonly hasSystemState: boolean;
  readonly systemState?: SYS;
  readonly hasAuthorizationState: boolean;
  readonly authorizationState?: ATZ;
}

/**
 * Gets an IAuthenticationState object from the IFirebaseAuthUserData object provided.
 * @param {IFirebaseAuthUserData} authUserData The IFirebaseAuthUserData object.
 * @return {IAuthenticationState}
 */
export function getAuthenticationStateFromUserData(authUserData: IFirebaseAuthUserData): IAuthenticationState {
  TC.assertNonNullish(authUserData, "A valid IFirebaseAuthUserData object must be provided.");

  const authState: IAuthenticationState = {
    firebaseAuthUserId: authUserData.uid,
    providerId: authUserData.providerId,
    email: authUserData.email,
    emailIsVerified: authUserData.emailVerified,
    displayName: authUserData.displayName,
  };
  return authState;
}

const FieldValue_MethodName_Unrecognized = "[UNRECOGNIZED]"; // eslint-disable-line camelcase
const FieldValue_MethodName_ArrayRemove = (VC.getTypedPropertyKeyAsText<IFirebaseConstructorProvider>("arrayRemove") as string); // eslint-disable-line camelcase
const FieldValue_MethodName_ArrayUnion = (VC.getTypedPropertyKeyAsText<IFirebaseConstructorProvider>("arrayUnion") as string); // eslint-disable-line camelcase
const FieldValue_MethodName_Delete = (VC.getTypedPropertyKeyAsText<IFirebaseConstructorProvider>("delete") as string); // eslint-disable-line camelcase
const FieldValue_MethodName_Increment = (VC.getTypedPropertyKeyAsText<IFirebaseConstructorProvider>("increment") as string); // eslint-disable-line camelcase
const FieldValue_MethodName_ServerTimestamp = (VC.getTypedPropertyKeyAsText<IFirebaseConstructorProvider>("serverTimestamp") as string); // eslint-disable-line camelcase

export interface FieldValueSummary {
  isFieldValue: boolean;
  fieldValueTypeName: string;
  fieldValueMethodName: string;
  fieldValueData: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// NOTE: Add properties that are expected to exist in guard functions for firestore.FieldValue
interface FieldValueShim {
  isEqual(other: firestore.FieldValue): boolean;
  methodName: string;
}

/**
 * Changes any property values that are FieldValues to FieldValueSummaries.
 * @param {T} documentFragment The document or partial document to change.
 * @return {T} Returns the same document fragment that was passed in.
 */
export function replaceFieldValuesWithSummaries<T>(documentFragment: T): T {
  if (TC.isUndefined(documentFragment)) {
    return documentFragment;
  }
  if (TC.isNull(documentFragment)) {
    return documentFragment;
  }

  const propertyNames = VC.getOwnPropertyKeys(documentFragment);
  const documentFragmentAsRecord = (documentFragment as Record<string, unknown>);

  for (let i = 0; i < propertyNames.length; i++) {
    const propertyName = propertyNames[i];
    const propertyValue = documentFragmentAsRecord[propertyName];

    if (TC.isUndefined(propertyValue)) {
      continue;
    }
    if (TC.isNull(propertyValue)) {
      continue;
    }
    if (!isOfFieldValue<firestore.FieldValue>(propertyValue)) {
      continue;
    }

    const summary = getFieldValueSummary<firestore.FieldValue>(propertyValue);
    documentFragmentAsRecord[propertyName] = summary;
  }
  return documentFragment;
}

/**
 * Checks whether a given argument is of type "firestore.FieldValue".
 * @param {unknown} fieldValue The value to check.
 * @return {boolean} The result of checking.
 */
export function isOfFieldValue<T extends firestore.FieldValue>(fieldValue: unknown): fieldValue is T {
  if (TC.isNullish(fieldValue)) {
    throw new Error("The value to check the type of must not be null or undefined.");
  }

  const fieldValueAsShim = (fieldValue as FieldValueShim);
  const guardFunc = () => (!TC.isNullish(fieldValueAsShim.isEqual) && !TC.isNullish(fieldValueAsShim.methodName));
  const isFieldValue = TC.isOf<T>(fieldValue, guardFunc);
  return isFieldValue;
}

/**
 * Asserts that the value specified is a FieldValue, then gets a summary of the transform.
 * @param {unknown} fieldValue The possible field value.
 * @return {any} The actual value.
 */
export function getFieldValueSummary<T extends firestore.FieldValue>(fieldValue: unknown): FieldValueSummary {
  if (!isOfFieldValue<T>(fieldValue)) {
    throw new Error("The value specified is not a FieldValue.");
  }

  if (isOfFieldValue_ArrayRemove<T>(fieldValue)) {
    return getFieldValueSummary_ArrayRemove<T>(fieldValue);
  } else if (isOfFieldValue_ArrayUnion<T>(fieldValue)) {
    return getFieldValueSummary_ArrayUnion<T>(fieldValue);
  } else if (isOfFieldValue_Delete<T>(fieldValue)) {
    return getFieldValueSummary_Delete<T>(fieldValue);
  } else if (isOfFieldValue_Increment<T>(fieldValue)) {
    return getFieldValueSummary_Increment<T>(fieldValue);
  } else if (isOfFieldValue_ServerTimestamp<T>(fieldValue)) {
    return getFieldValueSummary_ServerTimestamp<T>(fieldValue);
  } else {
    const fieldValueAsShim = ((fieldValue as unknown) as FieldValueShim);
    const unrecognizedSummary: FieldValueSummary = {
      isFieldValue: true,
      fieldValueTypeName: FieldValue_MethodName_Unrecognized,
      fieldValueMethodName: fieldValueAsShim.methodName,
      fieldValueData: {},
    };
    return unrecognizedSummary;
  }
}

/**
 * Checks whether a given argument is of type "firestore.FieldValue" and specifies an "arrayRemove".
 * @param {unknown} fieldValue The value to check.
 * @return {boolean} The result of checking.
 */
export function isOfFieldValue_ArrayRemove<T extends firestore.FieldValue>(fieldValue: unknown): fieldValue is T { // eslint-disable-line camelcase
  if (TC.isNullish(fieldValue)) {
    throw new Error("The value to check the type of must not be null or undefined.");
  }
  if (TC.isNullishOrWhitespace(FieldValue_MethodName_ArrayRemove)) {
    throw new Error("The method name to check must not be null or undefined.");
  }
  if (!isOfFieldValue<T>(fieldValue)) {
    return false;
  }

  const fieldValueAsShim = ((fieldValue as unknown) as FieldValueShim);
  const guardFunc = () => (!TC.isNullish(fieldValueAsShim.methodName) && fieldValueAsShim.methodName.includes(FieldValue_MethodName_ArrayRemove));
  const isFieldValue = TC.isOf<T>(fieldValue, guardFunc);
  return isFieldValue;
}

/**
 * Asserts that the value specified is an "arrayRemove" FieldValue, then gets a summary of the transform.
 * @param {unknown} fieldValue The possible field value.
 * @return {any} The actual value.
 */
export function getFieldValueSummary_ArrayRemove<T extends firestore.FieldValue>(fieldValue: unknown): FieldValueSummary { // eslint-disable-line camelcase
  if (!isOfFieldValue_ArrayRemove<T>(fieldValue)) {
    throw new Error("The value specified is not an \"" + FieldValue_MethodName_ArrayRemove + "\" FieldValue."); // eslint-disable-line camelcase
  }

  const fieldValueAsShim = ((fieldValue as unknown) as FieldValueShim);
  const data = {elements: [...((fieldValue as any).elements)]}; // eslint-disable-line @typescript-eslint/no-explicit-any
  const summary: FieldValueSummary = {
    isFieldValue: true,
    fieldValueTypeName: FieldValue_MethodName_ArrayRemove,
    fieldValueMethodName: fieldValueAsShim.methodName,
    fieldValueData: data,
  };
  return summary;
}

/**
 * Checks whether a given argument is of type "firestore.FieldValue" and specifies an "arrayUnion".
 * @param {unknown} fieldValue The value to check.
 * @return {boolean} The result of checking.
 */
export function isOfFieldValue_ArrayUnion<T extends firestore.FieldValue>(fieldValue: unknown): fieldValue is T { // eslint-disable-line camelcase
  if (TC.isNullish(fieldValue)) {
    throw new Error("The value to check the type of must not be null or undefined.");
  }
  if (TC.isNullishOrWhitespace(FieldValue_MethodName_ArrayUnion)) {
    throw new Error("The method name to check must not be null or undefined.");
  }
  if (!isOfFieldValue<T>(fieldValue)) {
    return false;
  }

  const fieldValueAsShim = ((fieldValue as unknown) as FieldValueShim);
  const guardFunc = () => (!TC.isNullish(fieldValueAsShim.methodName) && fieldValueAsShim.methodName.includes(FieldValue_MethodName_ArrayUnion));
  const isFieldValue = TC.isOf<T>(fieldValue, guardFunc);
  return isFieldValue;
}

/**
 * Asserts that the value specified is an "arrayUnion" FieldValue, then gets a summary of the transform.
 * @param {unknown} fieldValue The possible field value.
 * @return {any} The actual value.
 */
export function getFieldValueSummary_ArrayUnion<T extends firestore.FieldValue>(fieldValue: unknown): FieldValueSummary { // eslint-disable-line camelcase
  if (!isOfFieldValue_ArrayUnion<T>(fieldValue)) {
    throw new Error("The value specified is not an \"" + FieldValue_MethodName_ArrayUnion + "\" FieldValue."); // eslint-disable-line camelcase
  }

  const fieldValueAsShim = ((fieldValue as unknown) as FieldValueShim);
  const data = {elements: [...((fieldValue as any).elements)]}; // eslint-disable-line @typescript-eslint/no-explicit-any
  const summary: FieldValueSummary = {
    isFieldValue: true,
    fieldValueTypeName: FieldValue_MethodName_ArrayUnion,
    fieldValueMethodName: fieldValueAsShim.methodName,
    fieldValueData: data,
  };
  return summary;
}

/**
 * Checks whether a given argument is of type "firestore.FieldValue" and specifies a "delete".
 * @param {unknown} fieldValue The value to check.
 * @return {boolean} The result of checking.
 */
export function isOfFieldValue_Delete<T extends firestore.FieldValue>(fieldValue: unknown): fieldValue is T { // eslint-disable-line camelcase
  if (TC.isNullish(fieldValue)) {
    throw new Error("The value to check the type of must not be null or undefined.");
  }
  if (TC.isNullishOrWhitespace(FieldValue_MethodName_Delete)) {
    throw new Error("The method name to check must not be null or undefined.");
  }
  if (!isOfFieldValue<T>(fieldValue)) {
    return false;
  }

  const fieldValueAsShim = ((fieldValue as unknown) as FieldValueShim);
  const guardFunc = () => (!TC.isNullish(fieldValueAsShim.methodName) && fieldValueAsShim.methodName.includes(FieldValue_MethodName_Delete));
  const isFieldValue = TC.isOf<T>(fieldValue, guardFunc);
  return isFieldValue;
}

/**
 * Asserts that the value specified is a "delete" FieldValue, then gets a summary of the transform.
 * @param {unknown} fieldValue The possible field value.
 * @return {any} The actual value.
 */
export function getFieldValueSummary_Delete<T extends firestore.FieldValue>(fieldValue: unknown): FieldValueSummary { // eslint-disable-line camelcase
  if (!isOfFieldValue_Delete<T>(fieldValue)) {
    throw new Error("The value specified is not an \"" + FieldValue_MethodName_Delete + "\" FieldValue."); // eslint-disable-line camelcase
  }

  const fieldValueAsShim = ((fieldValue as unknown) as FieldValueShim);
  const data = {};
  const summary: FieldValueSummary = {
    isFieldValue: true,
    fieldValueTypeName: FieldValue_MethodName_Delete,
    fieldValueMethodName: fieldValueAsShim.methodName,
    fieldValueData: data,
  };
  return summary;
}

/**
 * Checks whether a given argument is of type "firestore.FieldValue" and specifies an "increment".
 * @param {unknown} fieldValue The value to check.
 * @return {boolean} The result of checking.
 */
export function isOfFieldValue_Increment<T extends firestore.FieldValue>(fieldValue: unknown): fieldValue is T { // eslint-disable-line camelcase
  if (TC.isNullish(fieldValue)) {
    throw new Error("The value to check the type of must not be null or undefined.");
  }
  if (TC.isNullishOrWhitespace(FieldValue_MethodName_Increment)) {
    throw new Error("The method name to check must not be null or undefined.");
  }
  if (!isOfFieldValue<T>(fieldValue)) {
    return false;
  }

  const fieldValueAsShim = ((fieldValue as unknown) as FieldValueShim);
  const guardFunc = () => (!TC.isNullish(fieldValueAsShim.methodName) && fieldValueAsShim.methodName.includes(FieldValue_MethodName_Increment));
  const isFieldValue = TC.isOf<T>(fieldValue, guardFunc);
  return isFieldValue;
}

/**
 * Asserts that the value specified is an "increment" FieldValue, then gets a summary of the transform.
 * @param {unknown} fieldValue The possible field value.
 * @return {any} The actual value.
 */
export function getFieldValueSummary_Increment<T extends firestore.FieldValue>(fieldValue: unknown): FieldValueSummary { // eslint-disable-line camelcase
  if (!isOfFieldValue_Increment<T>(fieldValue)) {
    throw new Error("The value specified is not an \"" + FieldValue_MethodName_Increment + "\" FieldValue."); // eslint-disable-line camelcase
  }

  const fieldValueAsShim = ((fieldValue as unknown) as FieldValueShim);
  const data = {operand: (fieldValue as any).operand}; // eslint-disable-line @typescript-eslint/no-explicit-any
  const summary: FieldValueSummary = {
    isFieldValue: true,
    fieldValueTypeName: FieldValue_MethodName_Increment,
    fieldValueMethodName: fieldValueAsShim.methodName,
    fieldValueData: data,
  };
  return summary;
}

/**
 * Checks whether a given argument is of type "firestore.FieldValue" and specifies a "serverTimestamp".
 * @param {unknown} fieldValue The value to check.
 * @return {boolean} The result of checking.
 */
export function isOfFieldValue_ServerTimestamp<T extends firestore.FieldValue>(fieldValue: unknown): fieldValue is T { // eslint-disable-line camelcase
  if (TC.isNullish(fieldValue)) {
    throw new Error("The value to check the type of must not be null or undefined.");
  }
  if (TC.isNullishOrWhitespace(FieldValue_MethodName_ServerTimestamp)) {
    throw new Error("The method name to check must not be null or undefined.");
  }
  if (!isOfFieldValue<T>(fieldValue)) {
    return false;
  }

  const fieldValueAsShim = ((fieldValue as unknown) as FieldValueShim);
  const guardFunc = () => (!TC.isNullish(fieldValueAsShim.methodName) && fieldValueAsShim.methodName.includes(FieldValue_MethodName_ServerTimestamp));
  const isFieldValue = TC.isOf<T>(fieldValue, guardFunc);
  return isFieldValue;
}

/**
 * Asserts that the value specified is a "serverTimestamp" FieldValue, then gets a summary of the transform.
 * @param {unknown} fieldValue The possible field value.
 * @return {any} The actual value.
 */
export function getFieldValueSummary_ServerTimestamp<T extends firestore.FieldValue>(fieldValue: unknown): FieldValueSummary { // eslint-disable-line camelcase
  if (!isOfFieldValue_ServerTimestamp<T>(fieldValue)) {
    throw new Error("The value specified is not an \"" + FieldValue_MethodName_ServerTimestamp + "\" FieldValue."); // eslint-disable-line camelcase
  }

  const fieldValueAsShim = ((fieldValue as unknown) as FieldValueShim);
  const data = {};
  const summary: FieldValueSummary = {
    isFieldValue: true,
    fieldValueTypeName: FieldValue_MethodName_ServerTimestamp,
    fieldValueMethodName: fieldValueAsShim.methodName,
    fieldValueData: data,
  };
  return summary;
}

/**
 * Converts a Firebase key to a Firebase credential.
 * @param {any} key The Firebase key.
 * @return {ICallResult<T>} The Firebase credential.
 */
export function convertFirebaseKeyToCredential(key: any): any { // eslint-disable-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  const credential = {
    type: key.type,
    projectId: key.project_id,
    privateKeyId: key.private_key_id,
    privateKey: key.private_key,
    clientEmail: key.client_email,
    clientId: key.client_id,
    authUri: key.auth_uri,
    tokenUri: key.token_uri,
    authProviderX509CertUrl: key.auth_provider_x509_cert_url,
    clientC509CertUrl: key.client_x509_cert_url,
  };
  return credential;
}

const originalProcessEnv = ({} as BT.IDictionary<string | undefined>);
/**
 * Sets the environment variables for the process to use Firebase cloud with the specified credential.
 * @param {string} credential The credential.
 * @return {void}
 */
export function setFirebaseToUseCloud(credential: string): void {
  if (originalProcessEnv.GOOGLE_APPLICATION_CREDENTIALS == undefined) {
    originalProcessEnv.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  if ((originalProcessEnv.GCP_PROJECT != undefined) || (originalProcessEnv.GCLOUD_PROJECT != undefined)) {
    process.env.GCP_PROJECT = originalProcessEnv.GCP_PROJECT;
    process.env.GCLOUD_PROJECT = originalProcessEnv.GCLOUD_PROJECT; // deprecated (see https://cloud.google.com/functions/docs/configuring/env-var#runtime_environment_variables_set_automatically)
    process.env.FIREBASE_AUTH_EMULATOR_HOST = originalProcessEnv.FIREBASE_AUTH_EMULATOR_HOST;
    process.env.FIRESTORE_EMULATOR_HOST = originalProcessEnv.FIRESTORE_EMULATOR_HOST;
    process.env.STORAGE_EMULATOR_HOST = originalProcessEnv.STORAGE_EMULATOR_HOST;
  }
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credential;
}

/**
 * Sets the environment variables for the process to use Firebase emulators with the specified project settings.
 * @param {string} projectId The project ID (can be any valid Firebase project ID).
 * @param {string} authenticationHost The address and port of the authentication emulator host.
 * @param {string} firestoreHost The address and port of the firestore emulator host.
 * @param {string} storageHost The address and port of the storage emulator host.
 * @return {void}
 */
export function setFirebaseToUseEmulators(projectId: string, authenticationHost: string, firestoreHost: string, storageHost: string): void {
  if ((originalProcessEnv.GCP_PROJECT == undefined) || (originalProcessEnv.GCLOUD_PROJECT == undefined)) {
    originalProcessEnv.GCP_PROJECT = process.env.GCP_PROJECT;
    originalProcessEnv.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT; // deprecated (see https://cloud.google.com/functions/docs/configuring/env-var#runtime_environment_variables_set_automatically)
    originalProcessEnv.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
    originalProcessEnv.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
    originalProcessEnv.STORAGE_EMULATOR_HOST = process.env.STORAGE_EMULATOR_HOST;
  }
  if (originalProcessEnv.GOOGLE_APPLICATION_CREDENTIALS != undefined) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = originalProcessEnv.GOOGLE_APPLICATION_CREDENTIALS;
  }
  process.env.GCP_PROJECT = projectId;
  process.env.GCLOUD_PROJECT = projectId; // deprecated (see https://cloud.google.com/functions/docs/configuring/env-var#runtime_environment_variables_set_automatically)
  process.env.FIREBASE_AUTH_EMULATOR_HOST = authenticationHost;
  process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;
  process.env.STORAGE_EMULATOR_HOST = storageHost;
}

/**
 * Converts a typed document to a Firestore document.
 * @param {T} document The typed document.
 * @return {firestore.DocumentData}
 */
export function convertToFirestoreDocument<T extends firestore.DocumentData>(document: T): firestore.DocumentData {
  // LATER: If necessary, add hook to intercept specific property values for purpose of changing type
  const result = {...document};
  return result;
}

/**
 * Converts from a Firestore snapshot to a typed document.
 * @param {firestore.QueryDocumentSnapshot | firestore.DocumentSnapshot} snapshot The Firebase Firestore snapshot.
 * @return {T}
 */
export function convertFromFirestoreDocument<T>(snapshot: firestore.QueryDocumentSnapshot | firestore.DocumentSnapshot): T {
  const result = (snapshot.data() as T);
  return result;
}

/**
 * Asserts that the state container for data storage is NOT nullish.
 * @param {IDataStorageState | null | undefined} dataStorageState The state container for data storage.
 * @param {string} [message=default] The message to display on failure of assertion.
 * @return {void}
 */
export function assertDataStorageStateIsNotNullish(dataStorageState: IDataStorageState | null | undefined, message = "The Data Storage State must not be null."): void {
  if (TC.isNullish(dataStorageState)) {
    throw new Error(message);
  }
}

/**
 * Asserts that the Firebase Firestore database is NOT nullish.
 * @param {Firestore | null | undefined} db The Firebase Firestore database.
 * @param {string} [message=default] The message to display on failure of assertion.
 * @return {void}
 */
export function assertFirestoreIsNotNullish(db: firestore.Firestore | null | undefined, message = "A valid Firebase Firestore database must be provided."): void {
  if (TC.isNullish(db)) {
    throw new Error(message);
  }
}

/**
 * Asserts that the state container for authentication is NOT nullish.
 * @param {IAuthenticationState | null | undefined} authenticationState The state container for authentication.
 * @param {string} [message=default] The message to display on failure of assertion.
 * @return {void}
 */
export function assertAuthenticationStateIsNotNullish(authenticationState: IAuthenticationState | null | undefined, message = "The Authentication State must not be null."): void {
  if (TC.isNullish(authenticationState)) {
    throw new Error(message);
  }
}

/**
 * Asserts that the state container for the call is NOT nullish.
 * @param {ICallStateBase<S, T> | null | undefined} callState The state container for the call.
 * @param {string} [message=default] The message to display on failure of assertion.
 * @return {void}
 */
export function assertCallStateIsNotNullish<DS extends IDataStorageState, ATC extends IAuthenticationState, SYS, ATZ>(callState: ICallStateBase<DS, ATC, SYS, ATZ> | null | undefined, message = "The Call State must not be null."): void { // eslint-disable-line max-len
  if (TC.isNullish(callState)) {
    throw new Error(message);
  }
}

/**
 * Asserts that the Open Personal Archive™ (OPA) system is installed.
 * @param {boolean} isInstalled Whether the OPA system is installed or not.
 * @param {string} [message=default] The message to display on failure of assertion.
 * @return {boolean} Whether the OPA system is installed or not.
 */
export function assertSystemIsInstalled(isInstalled: boolean, message = "The Open Personal Archive™ (OPA) system is not currently installed."): boolean {
  if (!isInstalled) {
    throw new Error(message);
  }
  return isInstalled;
}

/**
 * Asserts that the Open Personal Archive™ (OPA) system is NOT installed.
 * @param {boolean} isInstalled Whether the OPA system is installed or not.
 * @param {string} [message=default] The message to display on failure of assertion.
 * @return {boolean} Whether the OPA system is installed or not.
 */
export function assertSystemIsNotInstalled(isInstalled: boolean, message = "The Open Personal Archive™ (OPA) system has already been installed."): boolean {
  if (isInstalled) {
    throw new Error(message);
  }
  return isInstalled;
}

/**
 * Handles re-trying writes using the specified maximum retry attempts.
 * @param {IDataStorageState} ds The state container for data storage.
 * @param {firestore.BulkWriterError} error The error that is being handled.
 * @param {number} [maxRetryAttempts=BULK_WRITER_MAX_RETRY_ATTEMPTS] The maximum number of retry attempts.
 * @return {boolean} Whether to retry the write again or not.
 */
export function bulkWriterErrorHandler(ds: IDataStorageState, error: firestore.BulkWriterError, maxRetryAttempts: number = BULK_WRITER_MAX_RETRY_ATTEMPTS): boolean {
  if (error.failedAttempts < maxRetryAttempts) {
    return true;
  } else {
    // LATER: Perhaps log this by other means, as well
    console.log("Failed write at document: ", error.documentRef.path);
    return false;
  }
}

/**
 * Deletes all documents from a Firebase Firestore collection within the given DB.
 * @param {IDataStorageState} ds The state container for data storage.
 * @param {string} collectionName The collection name to clear.
 * @return {Promise<void>}
 */
export async function clearFirestoreCollection(ds: IDataStorageState, collectionName: string): Promise<void> {
  assertDataStorageStateIsNotNullish(ds);
  assertFirestoreIsNotNullish(ds.db);

  const collectionRef = ds.db.collection(collectionName);
  return await clearFirestoreCollectionByRef(ds, collectionRef);
}

/**
 * Deletes all documents from a Firebase Firestore collection.
 * @param {IDataStorageState} ds The state container for data storage.
 * @param {CollectionReference<DocumentData>} collectionRef The Firebase Firestore collection.
 * @return {Promise<void>}
 */
export async function clearFirestoreCollectionByRef(ds: IDataStorageState, collectionRef: firestore.CollectionReference<firestore.DocumentData>): Promise<void> {
  if (TC.isNullish(collectionRef)) {
    throw new Error("A valid Firebase Firestore collection must be provided.");
  }

  const bulkWriter = TC.convertNonNullish(ds.currentBulkWriter, () => ds.constructorProvider.bulkWriter());

  try {
    const docSnapshots = await collectionRef.listDocuments();
    for (let j = 0; j < docSnapshots.length; j++) {
      const docSnapshot = docSnapshots[j];
      // NOTE: Calling "await docSnapshot.delete();" does NOT perform recursive deletion
      const docData = await docSnapshot.get();
      await collectionRef.firestore.recursiveDelete(docData.ref, bulkWriter);
    }
  } finally {
    if (bulkWriter != ds.currentBulkWriter) {
      await bulkWriter.close();
    }
  }
}

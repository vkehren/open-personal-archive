import * as firestore from "@google-cloud/firestore";
import * as BT from "./BaseTypes";
import * as TC from "./TypeChecking";

// export const name = "Firebase";
export const BULK_WRITER_MAX_RETRY_ATTEMPTS = 4;
export const FIREBASE_DEFAULT_REGION = "us-east1";

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
 * Asserts that the Firebase Firestore document and its corresponding ID is NOT nullish.
 * @param {T | null | undefined} document The Firebase Firestore document.
 * @param {string} [invalidDocMessage=default] The message to display on failure of document assertion.
 * @param {string} [invalidIdMessage=default] The message to display on failure of ID property assertion.
 * @return {void}
 */
export function assertDocumentIsValid<T extends BT.IDocument>(document: T | null | undefined, invalidDocMessage = "A valid document must be provided.", invalidIdMessage = "A valid document ID must be provided."): void { // eslint-disable-line max-len
  if (TC.isNullish(document)) {
    throw new Error(invalidDocMessage);
  }

  const documentNonNull = TC.convertNonNullish(document);
  assertIdentifierIsValid(documentNonNull.id, invalidIdMessage);
}

/**
 * Asserts that the Firebase Firestore document ID is NOT nullish.
 * @param {string | null | undefined} id The Firebase Firestore document ID.
 * @param {string} [message=default] The message to display on failure of assertion.
 * @return {void}
 */
export function assertIdentifierIsValid<T extends BT.IDocument>(id: string | null | undefined, message = "A valid document ID must be provided."): void {
  if (TC.isNullishOrWhitespace(id)) {
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
 * Deletes all documents from a Firebase Firestore collection within the given DB.
 * @param {Firestore} db The Firebase Firestore database.
 * @param {string} collectionName The collection name to clear.
 * @return {Promise<void>}
 */
export async function clearFirestoreCollectionInDb(db: firestore.Firestore, collectionName: string): Promise<void> {
  assertFirestoreIsNotNullish(db);

  const collectionRef = db.collection(collectionName);
  return await clearFirestoreCollection(collectionRef);
}

/**
 * Deletes all documents from a Firebase Firestore collection.
 * @param {CollectionReference<DocumentData>} collectionRef The Firebase Firestore collection.
 * @return {Promise<void>}
 */
export async function clearFirestoreCollection(collectionRef: firestore.CollectionReference<firestore.DocumentData>): Promise<void> {
  if (TC.isNullish(collectionRef)) {
    throw new Error("A valid Firebase Firestore collection must be provided.");
  }

  const bulkWriter = collectionRef.firestore.bulkWriter();
  bulkWriter.onWriteError((error: firestore.BulkWriterError) => {
    if (error.failedAttempts < BULK_WRITER_MAX_RETRY_ATTEMPTS) {
      return true;
    } else {
      console.log("Failed write at document: ", error.documentRef.path);
      return false;
    }
  });

  try {
    const docSnapshots = await collectionRef.listDocuments();
    for (let j = 0; j < docSnapshots.length; j++) {
      const docSnapshot = docSnapshots[j];
      // NOTE: Calling "await docSnapshot.delete();" does NOT perform recursive deletion
      const docData = await docSnapshot.get();
      await collectionRef.firestore.recursiveDelete(docData.ref, bulkWriter);
    }
  } finally {
    await bulkWriter.close();
  }
}

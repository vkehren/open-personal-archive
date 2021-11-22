import * as admin from "firebase-admin";
import * as BT from "./BaseTypes";
import * as TC from "./TypeChecking";

// export const name = "Firebase";

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
  if (originalProcessEnv.GCLOUD_PROJECT != undefined) {
    process.env.GCLOUD_PROJECT = originalProcessEnv.GCLOUD_PROJECT;
    process.env.FIREBASE_AUTH_EMULATOR_HOST = originalProcessEnv.FIREBASE_AUTH_EMULATOR_HOST;
    process.env.FIRESTORE_EMULATOR_HOST = originalProcessEnv.FIRESTORE_EMULATOR_HOST;
  }
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credential;
}

/**
 * Sets the environment variables for the process to use Firebase emulators with the specified project settings.
 * @param {string} projectId The project ID (can be any valid Firebase project ID).
 * @param {string} authenticationHost The address and port of the authentication emulator host.
 * @param {string} firestoreHost The address and port of the firestore emulator host.
 * @return {void}
 */
export function setFirebaseToUseEmulators(projectId: string, authenticationHost: string, firestoreHost: string): void {
  if (originalProcessEnv.GCLOUD_PROJECT == undefined) {
    originalProcessEnv.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT;
    originalProcessEnv.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
    originalProcessEnv.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
  }
  if (originalProcessEnv.GOOGLE_APPLICATION_CREDENTIALS != undefined) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = originalProcessEnv.GOOGLE_APPLICATION_CREDENTIALS;
  }
  process.env.GCLOUD_PROJECT = projectId;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = authenticationHost;
  process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;
}

/**
 * Converts a typed document to a Firestore document.
 * @param {T} document The typed document.
 * @return {admin.firestore.DocumentData}
 */
export function convertToFirestoreDocument<T>(document: T): admin.firestore.DocumentData {
  // LATER: If necessary, add hook to intercept specific property values for purpose of changing type
  const result = {...document};
  return result;
}

/**
 * Converts from a Firestore snapshot to a typed document.
 * @param {FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot} snapshot The Firebase Firestore snapshot.
 * @return {T}
 */
export function convertFromFirestoreDocument<T>(snapshot: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): T {
  const result = (snapshot.data() as T);
  return result;
}

/**
 * Deletes all documents from a Firebase Firestore collection within the given DB.
 * @param {Firestore} db The Firebase Firestore database.
 * @param {string} collectionName The collection name to clear.
 * @return {Promise<void>}
 */
export async function clearFirestoreCollectionInDb(db: admin.firestore.Firestore, collectionName: string): Promise<void> {
  if (TC.isNullish(db)) {
    throw new Error("A valid Firebase Firestore database must be provided.");
  }

  const collectionRef = db.collection(collectionName);
  return await clearFirestoreCollection(collectionRef);
}

/**
 * Deletes all documents from a Firebase Firestore collection.
 * @param {CollectionReference<DocumentData>} collectionRef The Firebase Firestore collection.
 * @return {Promise<void>}
 */
export async function clearFirestoreCollection(collectionRef: admin.firestore.CollectionReference<admin.firestore.DocumentData>): Promise<void> {
  if (TC.isNullish(collectionRef)) {
    throw new Error("A valid Firebase Firestore collection must be provided.");
  }

  const docSnapshots = await collectionRef.listDocuments();
  for (let j = 0; j < docSnapshots.length; j++) {
    const docSnapshot = docSnapshots[j];
    await docSnapshot.delete();
  }
}

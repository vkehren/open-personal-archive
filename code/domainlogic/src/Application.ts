import * as admin from "firebase-admin";
import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {createArchive, createSystem, IAuthenticationProvider, IArchive, ILocale, ITimeZoneGroup, IUser, OpaDbDescriptor as OpaDb} from "../../datamodel/src";
import * as SchemaConfig from "../../datamodel/package.json";
import * as ApplicationConfig from "../package.json";

export interface IInstallationScreenDisplayModel {
  readonly firebaseProjectName: string;
  readonly isInstalled: boolean;
  archiveName: string;
  archiveDescription: string;
  pathToStorageFolder: string;
  validLocales: Array<ILocale>;
  selectedLocale: ILocale;
  validTimeZoneGroups: Array<ITimeZoneGroup>;
  selectedTimeZoneGroup: ITimeZoneGroup;
}

/**
 * Determines whether the Open Personal Archive™ (OPA) system is currently installed.
 * @param {Firestore} db The Firestore Database to read from.
 * @return {Promise<boolean>} Whether the OPA system is installed.
 */
export async function isInstalled(db: admin.firestore.Firestore): Promise<boolean> {
  if (OPA.isNullish(db)) {
    throw new Error("The Firestore DB must NOT be null.");
  }

  const system = await OpaDb.OpaSystem.getTypedDocumentForId(db, OpaDm.OpaSystemId);
  return (!OPA.isNullish(system));
}

/**
 * Gets the screen display model for the Open Personal Archive™ (OPA) installation screen.
 * @param {Firestore} db The Firestore Database to read from.
 * @param {string | null | undefined} [firebaseAuthUserId=undefined] The ID for the current User within the Firebase Authentication system.
 * @return {Promise<InstallationScreenDisplayModel>}
 */
export async function getInstallationScreenDisplayModel(db: admin.firestore.Firestore, firebaseAuthUserId: string | null | undefined = undefined): Promise<IInstallationScreenDisplayModel> {
  const hasBeenInstalled = await isInstalled(db);
  const displayModel: IInstallationScreenDisplayModel = {
    firebaseProjectName: admin.app().name,
    isInstalled: hasBeenInstalled,
    archiveName: "(a name for the archive)",
    archiveDescription: "(a description for the archive)",
    pathToStorageFolder: "./",
    validLocales: OpaDb.Locales.requiredDocuments,
    selectedLocale: OpaDb.Locales.requiredDocuments.filter((value: ILocale) => value.isDefault)[0],
    validTimeZoneGroups: OpaDb.TimeZoneGroups.requiredDocuments,
    selectedTimeZoneGroup: OpaDb.TimeZoneGroups.requiredDocuments.filter((value: ITimeZoneGroup) => value.isDefault)[0],
  };

  if (!hasBeenInstalled) {
    return displayModel;
  }

  const currentUser = await OpaDb.Users.getTypedDocumentForId(db, firebaseAuthUserId);
  if (OPA.isNullish(currentUser)) {
    throw new Error("The current User must be authenticated.");
  }

  const currentUserNonNull = ((currentUser as unknown) as IUser);
  if (currentUserNonNull.id != OpaDm.User_OwnerId) {
    throw new Error("Only the Archive Owner is allowed to change the Archive configuration.");
  }

  const archive = await OpaDb.Archive.getTypedDocumentForId(db, OpaDm.ArchiveId);
  if (OPA.isNullish(archive)) {
    throw new Error("The Archive does not exist.");
  }

  const archiveNonNull = ((archive as unknown) as IArchive);
  const localeSnaps = await OpaDb.Locales.getTypedCollection(db).get();
  const locales = localeSnaps.docs.map((localeSnap) => localeSnap.data());
  const selectedLocales = locales.filter((locale) => (locale.id == archiveNonNull.defaultLocaleId));
  const timeZoneGroupSnaps = await OpaDb.TimeZoneGroups.getTypedCollection(db).get();
  const timeZoneGroups = timeZoneGroupSnaps.docs.map((timeZoneGroupSnap) => timeZoneGroupSnap.data());
  const selectedTimeZoneGroups = timeZoneGroups.filter((timeZoneGroup) => (timeZoneGroup.id == archiveNonNull.defaultTimeZoneGroupId));

  if (selectedLocales.length != 1) {
    throw new Error("The selected Locale could not be found.");
  }
  if (selectedTimeZoneGroups.length != 1) {
    throw new Error("The selected TimeZoneGroup could not be found.");
  }

  const selectedLocale = selectedLocales[0];
  const selectedTimeZoneGroup = selectedTimeZoneGroups[0];

  displayModel.archiveName = OPA.getLocalizedText(archiveNonNull.name, selectedLocale.optionName);
  displayModel.archiveDescription = OPA.getLocalizedText(archiveNonNull.description, selectedLocale.optionName);
  displayModel.pathToStorageFolder = archiveNonNull.pathToStorageFolder;
  displayModel.validLocales = locales;
  displayModel.selectedLocale = selectedLocale;
  displayModel.validTimeZoneGroups = timeZoneGroups;
  displayModel.selectedTimeZoneGroup = selectedTimeZoneGroup;
  return displayModel;
}

/**
 * Installs the Open Personal Archive™ (OPA) system by creating the necessary data in the Firestore DB.
 * @param {Firestore} db The Firestore Database to read from.
 * @param {string} archiveName The name of the Archive.
 * @param {string} archiveDescription A description of the Archive.
 * @param {string} pathToStorageFolder The path to the root folder for storing files in Firebase Storage.
 * @param {string} defaultLocaleId The ID of the default Locale for the Archive.
 * @param {string} defaultTimeZoneGroupId The ID of the default TimeZoneGroup for the Archive.
 * @param {string} ownerFirebaseAuthUserId The Firebase UUID for the owner of the Archive.
 * @param {string} ownerGoogleAccount The Google account (aka GMail address) of the owner of the Archive.
 * @param {string} ownerFirstName The first name of the owner of the Archive.
 * @param {string} ownerLastName The last name of the owner of the Archive.
 * @return {Promise<void>}
 */
export async function performInstall(db: admin.firestore.Firestore, archiveName: string, archiveDescription: string, pathToStorageFolder: string, defaultLocaleId: string, defaultTimeZoneGroupId: string, ownerFirebaseAuthUserId: string, ownerGoogleAccount: string, ownerFirstName: string, ownerLastName: string): Promise<void> { // eslint-disable-line max-len
  if (OPA.isNullish(db)) {
    throw new Error("The Firestore DB must NOT be null.");
  }

  if (await isInstalled(db)) {
    throw new Error("The Open Personal Archive™ (OPA) system has already been installed. Please un-install before re-installing.");
  }

  // 1) Create the OpaSystem document
  const system = createSystem(ApplicationConfig.version, SchemaConfig.version);
  const systemCollectionRef = OpaDb.OpaSystem.getTypedCollection(db);
  const systemDocumentRef = systemCollectionRef.doc(system.id);
  await systemDocumentRef.set(system, {merge: true});

  // 2) Load required data
  const requiredAuthProviderIds = OpaDm.AuthenticationProvider_RequiredIds;
  for (let i = 0; i < requiredAuthProviderIds.length; i++) {
    const requiredAuthProviderId = requiredAuthProviderIds[i];
    const authProviderExists = (OpaDb.AuthProviders.requiredDocuments.filter((doc) => doc.id == requiredAuthProviderId).length == 1);
    if (!authProviderExists) {
      throw new Error("A required Authentication Provider is missing from the set of Providers to load during installation.");
    }
  }

  const requiredRoleIds = OpaDm.Role_RequiredIds;
  for (let i = 0; i < requiredRoleIds.length; i++) {
    const requiredRoleId = requiredRoleIds[i];
    const roleExists = (OpaDb.Roles.requiredDocuments.filter((doc) => doc.id == requiredRoleId).length == 1);
    if (!roleExists) {
      throw new Error("A required Role is missing from the set of Roles to load during installation.");
    }
  }

  const eraseExistingData = true;
  await OpaDb.AuthProviders.loadRequiredDocuments(db, eraseExistingData);
  await OpaDb.Roles.loadRequiredDocuments(db, eraseExistingData);
  await OpaDb.Locales.loadRequiredDocuments(db, eraseExistingData);
  await OpaDb.TimeZones.loadRequiredDocuments(db, eraseExistingData);
  await OpaDb.TimeZoneGroups.loadRequiredDocuments(db, eraseExistingData);

  // 3) Create the User document for the Owner of the Archive
  const authProviderGoogle = await OpaDb.AuthProviders.getTypedDocumentForId(db, OpaDm.AuthenticationProvider_GoogleId);
  const localeDefault = await OpaDb.Locales.getTypedDocumentForId(db, defaultLocaleId);
  const timeZoneGroupDefault = await OpaDb.TimeZoneGroups.getTypedDocumentForId(db, defaultTimeZoneGroupId);
  const roleOwner = await OpaDb.Roles.getTypedDocumentForId(db, OpaDm.Role_OwnerId);

  if (OPA.isNullish(authProviderGoogle) || OPA.isNullish(localeDefault) || OPA.isNullish(timeZoneGroupDefault) || OPA.isNullish(roleOwner)) {
    throw new Error("Required data could not be created.");
  }

  const authProviderGoogleNonNull = ((authProviderGoogle as unknown) as IAuthenticationProvider);
  const localeDefaultNonNull = ((localeDefault as unknown) as ILocale);
  const timeZoneGroupDefaultNonNull = ((timeZoneGroupDefault as unknown) as ITimeZoneGroup);

  const userOwner = OpaDm.createArchiveOwner(ownerFirebaseAuthUserId, authProviderGoogleNonNull, ownerGoogleAccount, localeDefaultNonNull, timeZoneGroupDefaultNonNull, ownerFirstName, ownerLastName);
  const userCollectionRef = OpaDb.Users.getTypedCollection(db);
  const userOwnerDocumentRef = userCollectionRef.doc(userOwner.id);
  await userOwnerDocumentRef.set(userOwner, {merge: true});

  // 4) Create the Archive document for the Archive
  const archive = createArchive(archiveName, archiveDescription, pathToStorageFolder, userOwner, localeDefaultNonNull, timeZoneGroupDefaultNonNull);
  const archiveCollectionRef = OpaDb.Archive.getTypedCollection(db);
  const archiveDocumentRef = archiveCollectionRef.doc(archive.id);
  await archiveDocumentRef.set(archive, {merge: true});
}

/**
 * Uninstalls the Open Personal Archive™ (OPA) system by clearing the data in the Firestore DB.
 * @param {Firestore} db The Firestore Database to read from.
 * @param {boolean} [doBackupFirst=false] Whether to backup the data before deleting it (NOT IMPLEMENTED YET).
 * @return {Promise<void>}
 */
export async function performUninstall(db: admin.firestore.Firestore, doBackupFirst = false): Promise<void> {
  if (OPA.isNullish(db)) {
    throw new Error("The Firestore DB must NOT be null.");
  }

  if (doBackupFirst) {
    // LATER: Backup any existing data
    throw new Error("Backup of existing Archive data has not been implemented yet.");
  }

  const collectionDescriptors = OPA.getCollectionFromObject<OPA.ICollectionDescriptor>(OpaDb, (colDesc) => !OPA.isUndefined(colDesc.isNestedCollection));
  for (let i = 0; i < collectionDescriptors.length; i++) {
    const colDesc = collectionDescriptors[i];
    await OPA.clearFirestoreCollectionInDb(db, colDesc.collectionName);
  }
}

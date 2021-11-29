import * as OPA from "../../base/src";
import * as OpaDm from "../../datamodel/src";
import {createArchive, createSystem, getAuthorizationData, IArchivePartial, IAuthorizationData, ILocale, ITimeZoneGroup, OpaDbDescriptor as OpaDb} from "../../datamodel/src";
import * as SchemaConfig from "../../datamodel/package.json";
import * as ApplicationConfig from "../package.json";

export interface IInstallationScreenDisplayModel {
  readonly authorizationData: IAuthorizationData;
  archiveName: string;
  archiveDescription: string;
  pathToStorageFolder: string;
  validLocales: Array<ILocale>;
  selectedLocale: ILocale | null;
  validTimeZoneGroups: Array<ITimeZoneGroup>;
  selectedTimeZoneGroup: ITimeZoneGroup | null;
}

/**
 * Determines whether the Open Personal Archive™ (OPA) system is currently installed.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @return {Promise<boolean>} Whether the OPA system is installed.
 */
export async function isInstalled(dataStorageState: OpaDm.IDataStorageState): Promise<boolean> {
  OPA.assertNonNullish(dataStorageState, "The Data Storage State must not be null.");
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);

  const db = dataStorageState.db;
  const system = await OpaDb.OpaSystem.queries.getById(db, OpaDm.OpaSystemId);
  return (!OPA.isNullish(system));
}

/**
 * Gets the screen display model for the Open Personal Archive™ (OPA) installation screen.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @return {Promise<InstallationScreenDisplayModel>}
 */
export async function getInstallationScreenDisplayModel(callState: OpaDm.ICallState): Promise<IInstallationScreenDisplayModel> {
  OPA.assertNonNullish(callState, "The Call State must not be null.");
  OPA.assertNonNullish(callState.dataStorageState, "The Data Storage State must not be null.");
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  // NOTE: First handle case where OPA is NOT installed
  const firebaseProjectId = callState.dataStorageState.projectId;
  const usesFirebaseEmulators = callState.dataStorageState.usesEmulators;
  const isOpaSystemInstalled = await isInstalled(callState.dataStorageState);

  const defaultDisplayModel: IInstallationScreenDisplayModel = {
    authorizationData: {firebaseProjectId, usesFirebaseEmulators, isOpaSystemInstalled, userData: null, roleData: null},
    archiveName: "(a name for the archive)",
    archiveDescription: "(a description for the archive)",
    pathToStorageFolder: "./",
    validLocales: OpaDb.Locales.requiredDocuments,
    selectedLocale: OpaDb.Locales.requiredDocuments.filter((value: ILocale) => value.isDefault)[0],
    validTimeZoneGroups: OpaDb.TimeZoneGroups.requiredDocuments,
    selectedTimeZoneGroup: OpaDb.TimeZoneGroups.requiredDocuments.filter((value: ITimeZoneGroup) => value.isDefault)[0],
  };

  if (!isOpaSystemInstalled) {
    return defaultDisplayModel;
  }

  // NOTE: Handle case where OPA is installed
  OPA.assertNonNullish(callState.archiveState, "The Archive State must not be null.");
  OPA.assertNonNullish(callState.authenticationState, "The Authentication State must not be null.");
  OPA.assertNonNullish(callState.authorizationState, "The Authorization State must not be null.");

  const dataStorageStateNonNull = OPA.convertNonNullish(callState.dataStorageState);
  const archiveStateNonNull = OPA.convertNonNullish(callState.archiveState);
  const authorizationStateNonNull = OPA.convertNonNullish(callState.authorizationState);
  const authorizedRoleIds = [OpaDm.Role_OwnerId, OpaDm.Role_AdministratorId];

  authorizationStateNonNull.assertUserApproved();
  authorizationStateNonNull.assertRoleAllowed(authorizedRoleIds);

  const db = callState.dataStorageState.db;
  const archiveNonNull = archiveStateNonNull.archive;
  const localeNonNull = authorizationStateNonNull.locale;
  const localeToUse = localeNonNull.optionName;

  const localeSnaps = await OpaDb.Locales.getTypedCollection(db).get();
  const locales = localeSnaps.docs.map((localeSnap) => localeSnap.data());
  let selectedLocales = locales.filter((locale) => (locale.id == archiveNonNull.defaultLocaleId));
  const timeZoneGroupSnaps = await OpaDb.TimeZoneGroups.getTypedCollection(db).get();
  const timeZoneGroups = timeZoneGroupSnaps.docs.map((timeZoneGroupSnap) => timeZoneGroupSnap.data());
  let selectedTimeZoneGroups = timeZoneGroups.filter((timeZoneGroup) => (timeZoneGroup.id == archiveNonNull.defaultTimeZoneGroupId));

  if (selectedLocales.length < 1) {
    selectedLocales = locales.filter((locale) => locale.isDefault);
  }
  if (selectedTimeZoneGroups.length < 1) {
    selectedTimeZoneGroups = timeZoneGroups.filter((timeZoneGroup) => timeZoneGroup.isDefault);
  }
  const selectedLocale = (selectedLocales.length > 0) ? selectedLocales[0] : null;
  const selectedTimeZoneGroup = (selectedTimeZoneGroups.length > 0) ? selectedTimeZoneGroups[0] : null;

  // LATER: Pass IAuthorizationState to getAuthorizationData(...) and include locale and timezone for User
  const displayModel: IInstallationScreenDisplayModel = {
    authorizationData: getAuthorizationData(dataStorageStateNonNull, archiveStateNonNull, authorizationStateNonNull),
    archiveName: OPA.getLocalizedText(archiveNonNull.name, localeToUse),
    archiveDescription: OPA.getLocalizedText(archiveNonNull.description, localeToUse),
    pathToStorageFolder: archiveNonNull.pathToStorageFolder,
    validLocales: locales,
    selectedLocale: selectedLocale,
    validTimeZoneGroups: timeZoneGroups,
    selectedTimeZoneGroup: selectedTimeZoneGroup,
  };
  return displayModel;
}

/**
 * Installs the Open Personal Archive™ (OPA) system by creating the necessary data in the Firestore DB.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {OpaDm.IAuthenticationState} authenticationState The Firebase Authentication state for the User.
 * @param {string} archiveName The name of the Archive.
 * @param {string} archiveDescription A description of the Archive.
 * @param {string} pathToStorageFolder The path to the root folder for storing files in Firebase Storage.
 * @param {string} defaultLocaleId The ID of the default Locale for the Archive.
 * @param {string} defaultTimeZoneGroupId The ID of the default TimeZoneGroup for the Archive.
 * @param {string} ownerFirstName The first name of the owner of the Archive.
 * @param {string} ownerLastName The last name of the owner of the Archive.
 * @return {Promise<void>}
 */
export async function performInstall(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState, archiveName: string, archiveDescription: string, pathToStorageFolder: string, defaultLocaleId: string, defaultTimeZoneGroupId: string, ownerFirstName: string, ownerLastName: string): Promise<void> { // eslint-disable-line max-len
  OPA.assertNonNullish(dataStorageState, "The Data Storage State must not be null.");
  OPA.assertNonNullish(authenticationState, "The Authentication State must not be null.");
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);
  OPA.assertIdentifierIsValid(authenticationState.firebaseAuthUserId);
  OPA.assertNonNullishOrWhitespace(authenticationState.providerId, "The Authentication Provider ID for the User's account must not be null.");
  OPA.assertNonNullishOrWhitespace(authenticationState.email, "The email account of the User must not be null.");

  const db = dataStorageState.db;
  const ownerFirebaseAuthUserId = authenticationState.firebaseAuthUserId;
  const externalAuthProviderId = authenticationState.providerId;
  const ownerAccountName = authenticationState.email;
  const hasBeenInstalled = await isInstalled(dataStorageState);

  OPA.assertOpaIsNotInstalled(hasBeenInstalled, "The Open Personal Archive™ (OPA) system has already been installed. Please un-install before re-installing.");

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
  const authProvider = await OpaDb.AuthProviders.queries.getByExternalAuthProviderId(db, externalAuthProviderId);
  const localeDefault = await OpaDb.Locales.queries.getById(db, defaultLocaleId);
  const timeZoneGroupDefault = await OpaDb.TimeZoneGroups.queries.getById(db, defaultTimeZoneGroupId);
  const roleOwner = await OpaDb.Roles.queries.getById(db, OpaDm.Role_OwnerId);

  if (OPA.isNullish(authProvider) || OPA.isNullish(localeDefault) || OPA.isNullish(timeZoneGroupDefault) || OPA.isNullish(roleOwner)) {
    throw new Error("Required data could not be created.");
  }

  const authProviderNonNull = OPA.convertNonNullish(authProvider);
  const localeDefaultNonNull = OPA.convertNonNullish(localeDefault);
  const timeZoneGroupDefaultNonNull = OPA.convertNonNullish(timeZoneGroupDefault);

  const userOwner = OpaDm.createArchiveOwner(ownerFirebaseAuthUserId, authProviderNonNull, ownerAccountName, localeDefaultNonNull, timeZoneGroupDefaultNonNull, ownerFirstName, ownerLastName);
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
 * Updates the Open Personal Archive™ (OPA) installation settings.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string | undefined} archiveName The name of the Archive, if it was updated.
 * @param {string | undefined} archiveDescription A description of the Archive, if it was updated.
 * @param {string | undefined} defaultLocaleId The ID of the default Locale for the Archive, if it was updated.
 * @param {string | undefined} defaultTimeZoneGroupId The ID of the default TimeZoneGroup for the Archive, if it was updated.
 * @param {string | undefined} defaultTimeZoneId The ID of the default TimeZone for the Archive, if it was updated.
 * @return {Promise<void>}
 */
export async function updateInstallationSettings(callState: OpaDm.ICallState, archiveName: string | undefined, archiveDescription: string | undefined, defaultLocaleId: string | undefined, defaultTimeZoneGroupId: string | undefined, defaultTimeZoneId: string | undefined): Promise<void> { // eslint-disable-line max-len
  OPA.assertNonNullish(callState, "The Call State must not be null.");
  OPA.assertNonNullish(callState.dataStorageState, "The Data Storage State must not be null.");
  OPA.assertNonNullish(callState.authenticationState, "The Authentication State must not be null.");
  OPA.assertNonNullish(callState.authorizationState, "The Authorization State must not be null.");
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);
  OPA.assertIdentifierIsValid(callState.authenticationState.firebaseAuthUserId);

  const db = callState.dataStorageState.db;
  const isInstalled = (!OPA.isNullish(callState.archiveState));

  OPA.assertOpaIsInstalled(isInstalled);

  const authorizationStateNonNull = OPA.convertNonNullish(callState.authorizationState);
  const authorizedRoleIds = [OpaDm.Role_OwnerId, OpaDm.Role_AdministratorId];

  authorizationStateNonNull.assertUserApproved();
  authorizationStateNonNull.assertRoleAllowed(authorizedRoleIds);

  const currentUserNonNull = authorizationStateNonNull.user;
  const currentLocaleNonNull = authorizationStateNonNull.locale;

  const archive = await OpaDb.Archive.queries.getById(db, OpaDm.ArchiveId);
  OPA.assertDocumentIsValid(archive, "The Archive does not exist.");
  const archiveNonNull = OPA.convertNonNullish(archive);

  const localeToUse = currentLocaleNonNull.optionName;
  let hasUpdate = false;
  const archivePartial: IArchivePartial = {};
  if ((archiveName) && (archiveNonNull.name[localeToUse] != archiveName)) {
    archivePartial.name = {...archiveNonNull.name};
    archivePartial.name[localeToUse] = archiveName;
    hasUpdate = true;
  }
  if ((archiveDescription) && (archiveNonNull.description[localeToUse] != archiveDescription)) {
    archivePartial.description = {...archiveNonNull.description};
    archivePartial.description[localeToUse] = archiveDescription;
    hasUpdate = true;
  }
  // LATER: Consider allowing change to root storage folder if no files have been added yet
  if ((defaultLocaleId) && (archiveNonNull.defaultLocaleId != defaultLocaleId)) {
    archivePartial.defaultLocaleId = defaultLocaleId;
    hasUpdate = true;
  }
  if ((defaultTimeZoneGroupId) && (archiveNonNull.defaultTimeZoneGroupId != defaultTimeZoneGroupId)) {
    archivePartial.defaultTimeZoneGroupId = defaultTimeZoneGroupId;
    hasUpdate = true;
  }
  if ((defaultTimeZoneId) && (archiveNonNull.defaultTimeZoneId != defaultTimeZoneId)) {
    archivePartial.defaultTimeZoneId = defaultTimeZoneId;
    hasUpdate = true;
  }
  if (hasUpdate) {
    archivePartial.userIdForLatestUpdate = currentUserNonNull.id;
    archivePartial.dateOfLatestUpdate = OpaDm.now();
  }

  if (OPA.isEmpty(archivePartial)) {
    throw new Error("No updated information was provided.");
  }

  const archiveRef = OpaDb.Archive.getTypedCollection(db).doc(archiveNonNull.id);
  await archiveRef.set(archivePartial, {merge: true});
}

/**
 * Uninstalls the Open Personal Archive™ (OPA) system by clearing the data in the Firestore DB.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {OpaDm.IAuthenticationState} authenticationState The Firebase Authentication state for the User.
 * @param {OpaDm.IAuthorizationState | null | undefined} authorizationState The OPA Authorization state for the User.
 * @param {boolean} [doBackupFirst=false] Whether to backup the data before deleting it (NOT IMPLEMENTED YET).
 * @return {Promise<void>}
 */
export async function performUninstall(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState, authorizationState: OpaDm.IAuthorizationState | null | undefined, doBackupFirst = false): Promise<void> { // eslint-disable-line max-len
  OPA.assertNonNullish(dataStorageState, "The Data Storage State must not be null.");
  OPA.assertNonNullish(authenticationState, "The Authentication State must not be null.");
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);

  const db = dataStorageState.db;
  const owner = await OpaDb.Users.queries.getById(db, OpaDm.User_OwnerId);

  if (!OPA.isNullish(owner)) {
    OPA.assertNonNullish(authorizationState, "The Authorization State must not be null.");

    const authorizationStateNonNull = OPA.convertNonNullish(authorizationState);
    const authorizedRoleIds = [OpaDm.Role_OwnerId];

    authorizationStateNonNull.assertUserApproved();
    authorizationStateNonNull.assertRoleAllowed(authorizedRoleIds);
  }

  if (doBackupFirst) {
    // LATER: Backup any existing data
    throw new Error("Backup of existing Archive data has not been implemented yet.");
  }

  // LATER: If necessary, iterate over specific Documents and delete contents of nested Collections
  for (let i = 0; i < OpaDb.RootCollections.length; i++) {
    const colDesc = OpaDb.RootCollections[i];
    await OPA.clearFirestoreCollectionInDb(db, colDesc.collectionName);
  }
}

import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {createApplication, OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
import * as DMU from "../DisplayModelUtilities";
import * as SchemaInfo from "../../../datamodel/src/PackageInfo";
import * as ApplicationInfo from "../PackageInfo";

export interface IInstallationScreenDisplayModel {
  readonly authorizationData: DMU.IAuthorizationData;
  archiveName: string;
  archiveDescription: string;
  pathToStorageFolder: string;
  validLocales: Array<OpaDm.ILocale>;
  selectedLocale: OpaDm.ILocale | null;
  validTimeZoneGroups: Array<OpaDm.ITimeZoneGroup>;
  selectedTimeZoneGroup: OpaDm.ITimeZoneGroup | null;
}

/**
 * Determines whether the Open Personal Archive™ (OPA) system is currently installed.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @return {Promise<boolean>} Whether the OPA system is installed.
 */
export async function isSystemInstalled(dataStorageState: OpaDm.IDataStorageState): Promise<boolean> {
  OPA.assertNonNullish(dataStorageState, "The Data Storage State must not be null.");
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);

  const db = dataStorageState.db;
  const application = await OpaDb.Application.queries.getById(db, OpaDm.ApplicationId);
  return (!OPA.isNullish(application));
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
  const isSystemCurrentlyInstalled = await isSystemInstalled(callState.dataStorageState);

  const defaultDisplayModel: IInstallationScreenDisplayModel = {
    authorizationData: {firebaseProjectId, usesFirebaseEmulators, isSystemInstalled: isSystemCurrentlyInstalled, userData: null, roleData: null},
    archiveName: "(a name for the archive)",
    archiveDescription: "(a description for the archive)",
    pathToStorageFolder: "./",
    validLocales: OpaDb.Locales.requiredDocuments,
    selectedLocale: OpaDb.Locales.requiredDocuments.filter((value: OpaDm.ILocale) => value.isDefault)[0],
    validTimeZoneGroups: OpaDb.TimeZoneGroups.requiredDocuments,
    selectedTimeZoneGroup: OpaDb.TimeZoneGroups.requiredDocuments.filter((value: OpaDm.ITimeZoneGroup) => value.isDefault)[0],
  };

  if (!isSystemCurrentlyInstalled) {
    return defaultDisplayModel;
  }

  // NOTE: Handle case where OPA is installed
  OPA.assertNonNullish(callState.systemState, "The Archive State must not be null.");
  OPA.assertNonNullish(callState.authenticationState, "The Authentication State must not be null.");
  OPA.assertNonNullish(callState.authorizationState, "The Authorization State must not be null.");

  const dataStorageStateNonNull = OPA.convertNonNullish(callState.dataStorageState);
  const systemStateNonNull = OPA.convertNonNullish(callState.systemState);
  const authorizationStateNonNull = OPA.convertNonNullish(callState.authorizationState);
  const authorizedRoleIds = [OpaDm.Role_OwnerId, OpaDm.Role_AdministratorId];

  authorizationStateNonNull.assertUserApproved();
  authorizationStateNonNull.assertRoleAllowed(authorizedRoleIds);

  const db = callState.dataStorageState.db;
  const archiveNonNull = systemStateNonNull.archive;
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
    authorizationData: DMU.getAuthorizationDataForDisplayModel(dataStorageStateNonNull, systemStateNonNull, authorizationStateNonNull),
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
  const isSystemCurrentlyInstalled = await isSystemInstalled(dataStorageState);

  OPA.assertSystemIsNotInstalled(isSystemCurrentlyInstalled, "The Open Personal Archive™ (OPA) system has already been installed. Please un-install before re-installing.");

  // 1) Create the Application document
  const application = createApplication(ApplicationInfo.VERSION, SchemaInfo.VERSION);
  const applicationCollectionRef = OpaDb.Application.getTypedCollection(db);
  const applicationDocumentRef = applicationCollectionRef.doc(application.id);
  await applicationDocumentRef.set(application, {merge: true});

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
  OPA.assertDocumentIsValid(authProvider, "The required AuthProvider does not exist.");
  const roleOwner = await OpaDb.Roles.queries.getById(db, OpaDm.Role_OwnerId);
  OPA.assertDocumentIsValid(roleOwner, "The required Role does not exist.");
  const localeDefault = await OpaDb.Locales.queries.getById(db, defaultLocaleId);
  OPA.assertDocumentIsValid(localeDefault, "The required Locale does not exist.");
  const timeZoneGroupDefault = await OpaDb.TimeZoneGroups.queries.getById(db, defaultTimeZoneGroupId);
  OPA.assertDocumentIsValid(timeZoneGroupDefault, "The required TimeZoneGroup does not exist.");

  const authProviderNonNull = OPA.convertNonNullish(authProvider);
  const localeDefaultNonNull = OPA.convertNonNullish(localeDefault);
  const timeZoneGroupDefaultNonNull = OPA.convertNonNullish(timeZoneGroupDefault);

  const userOwner = OpaDm.createArchiveOwner(ownerFirebaseAuthUserId, authProviderNonNull, ownerAccountName, localeDefaultNonNull, timeZoneGroupDefaultNonNull, ownerFirstName, ownerLastName);
  const userCollectionRef = OpaDb.Users.getTypedCollection(db);
  const userOwnerDocumentRef = userCollectionRef.doc(userOwner.id);

  const batchUpdate = db.batch(); // REPLACES: await userOwnerDocumentRef.set(userOwner, {merge: true});
  batchUpdate.set(userOwnerDocumentRef, userOwner, {merge: true});
  const firebaseAuthUserIdIndexCollectionRef = db.collection(OpaDm.Index_User_FirebaseAuthUserId.indexCollectionName);
  const firebaseAuthUserIdIndexDocRef = firebaseAuthUserIdIndexCollectionRef.doc(OpaDm.Index_User_FirebaseAuthUserId.getDocumentId(userOwner.firebaseAuthUserId));
  batchUpdate.set(firebaseAuthUserIdIndexDocRef, {value: userOwner.id});
  const authAccountNameIndexCollectionRef = db.collection(OpaDm.Index_User_AuthAccountName.indexCollectionName);
  const authAccountNameIndexDocRef = authAccountNameIndexCollectionRef.doc(OpaDm.Index_User_AuthAccountName.getDocumentId(userOwner.authAccountName));
  batchUpdate.set(authAccountNameIndexDocRef, {value: userOwner.id});
  const authAccountNameLoweredIndexCollectionRef = dataStorageState.db.collection(OpaDm.Index_User_AuthAccountNameLowered.indexCollectionName);
  const authAccountNameLoweredIndexDocRef = authAccountNameLoweredIndexCollectionRef.doc(OpaDm.Index_User_AuthAccountNameLowered.getDocumentId(userOwner.authAccountNameLowered));
  batchUpdate.set(authAccountNameLoweredIndexDocRef, {value: userOwner.id});
  await batchUpdate.commit();

  // 4) Create the Archive document for the Archive
  await OpaDb.Archive.queries.createArchive(db, archiveName, archiveDescription, pathToStorageFolder, userOwner, localeDefaultNonNull, timeZoneGroupDefaultNonNull);
}

/**
 * Updates the Open Personal Archive™ (OPA) installation settings.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string | undefined} archiveName The name of the Archive, if it was updated.
 * @param {string | undefined} archiveDescription A description of the Archive, if it was updated.
 * @param {string | undefined} defaultLocaleId The ID of the default Locale for the Archive, if it was updated.
 * @param {string | undefined} defaultTimeZoneGroupId The ID of the default TimeZoneGroup for the Archive, if it was updated.
 * @param {string | undefined} defaultTimeZoneId The ID of the default TimeZone for the Archive, if it was updated.
 * @param {OPA.IFirebaseConstructorProvider} constructorProvider The provider for Firebase FieldValue constructors.
 * @return {Promise<void>}
 */
export async function updateInstallationSettings(callState: OpaDm.ICallState, archiveName: string | undefined, archiveDescription: string | undefined, defaultLocaleId: string | undefined, defaultTimeZoneGroupId: string | undefined, defaultTimeZoneId: string | undefined, constructorProvider: OPA.IFirebaseConstructorProvider): Promise<void> { // eslint-disable-line max-len
  OPA.assertNonNullish(callState, "The Call State must not be null.");
  OPA.assertNonNullish(callState.dataStorageState, "The Data Storage State must not be null.");
  OPA.assertNonNullish(callState.authenticationState, "The Authentication State must not be null.");
  OPA.assertNonNullish(callState.authorizationState, "The Authorization State must not be null.");
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);
  OPA.assertIdentifierIsValid(callState.authenticationState.firebaseAuthUserId);

  const db = callState.dataStorageState.db;
  const isSystemCurrentlyInstalled = (!OPA.isNullish(callState.systemState));

  OPA.assertSystemIsInstalled(isSystemCurrentlyInstalled);

  const authorizationStateNonNull = OPA.convertNonNullish(callState.authorizationState);
  const authorizedRoleIds = [OpaDm.Role_OwnerId, OpaDm.Role_AdministratorId];

  authorizationStateNonNull.assertUserApproved();
  authorizationStateNonNull.assertRoleAllowed(authorizedRoleIds);

  const currentUserNonNull = authorizationStateNonNull.user;
  const currentLocaleNonNull = authorizationStateNonNull.locale;
  const localeToUse = currentLocaleNonNull.optionName;

  const archive = await OpaDb.Archive.queries.getById(db, OpaDm.ArchiveId);
  OPA.assertDocumentIsValid(archive, "The Archive does not exist.");
  const archiveNonNull = OPA.convertNonNullish(archive);

  const archivePartial: OpaDm.IArchivePartial = {};
  if ((archiveName) && (archiveNonNull.name[localeToUse] != archiveName)) {
    archivePartial.name = {...archiveNonNull.name};
    archivePartial.name[localeToUse] = archiveName;
  }
  if ((archiveDescription) && (archiveNonNull.description[localeToUse] != archiveDescription)) {
    archivePartial.description = {...archiveNonNull.description};
    archivePartial.description[localeToUse] = archiveDescription;
  }
  if ((defaultLocaleId) && (archiveNonNull.defaultLocaleId != defaultLocaleId)) {
    const locale = await OpaDb.Locales.queries.getById(db, defaultLocaleId);
    OPA.assertDocumentIsValid(locale, "The Locale specified does not exist.");

    archivePartial.defaultLocaleId = defaultLocaleId;
  }
  if ((defaultTimeZoneGroupId) && (archiveNonNull.defaultTimeZoneGroupId != defaultTimeZoneGroupId)) {
    const timeZoneGroup = await OpaDb.TimeZoneGroups.queries.getById(db, defaultTimeZoneGroupId);
    OPA.assertDocumentIsValid(timeZoneGroup, "The TimeZoneGroup specified does not exist.");

    archivePartial.defaultTimeZoneGroupId = defaultTimeZoneGroupId;
  }
  if ((defaultTimeZoneId) && (archiveNonNull.defaultTimeZoneId != defaultTimeZoneId)) {
    const timeZone = await OpaDb.TimeZones.queries.getById(db, defaultTimeZoneId);
    OPA.assertDocumentIsValid(timeZone, "The TimeZone specified does not exist.");

    archivePartial.defaultTimeZoneId = defaultTimeZoneId;
  }
  // LATER: Consider allowing change to root storage folder if no files have been added yet

  if (OPA.isEmpty(archivePartial)) {
    throw new Error("No updated setting was provided.");
  }
  await OpaDb.Archive.queries.updateArchive(db, archivePartial, currentUserNonNull.id, constructorProvider);
}

/**
 * Upgrades the Open Personal Archive™ (OPA) system to the latest version.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {OPA.IFirebaseConstructorProvider} constructorProvider The provider for Firebase FieldValue constructors.
 * @param {boolean} [doBackupFirst=false] Whether to backup the data before upgrading it (NOT IMPLEMENTED YET).
 * @return {Promise<void>}
 */
export async function performUpgrade(callState: OpaDm.ICallState, constructorProvider: OPA.IFirebaseConstructorProvider, doBackupFirst = false): Promise<void> { // eslint-disable-line max-len
  OPA.assertNonNullish(callState, "The Call State must not be null.");
  OPA.assertNonNullish(callState.dataStorageState, "The Data Storage State must not be null.");
  OPA.assertNonNullish(callState.authenticationState, "The Authentication State must not be null.");
  OPA.assertNonNullish(callState.authorizationState, "The Authorization State must not be null.");
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);
  OPA.assertIdentifierIsValid(callState.authenticationState.firebaseAuthUserId);

  const db = callState.dataStorageState.db;
  const isInstalled = (!OPA.isNullish(callState.systemState));

  OPA.assertIsTrue(isInstalled, "The system has not yet been installed so upgrading is not possible.");

  const authorizationStateNonNull = OPA.convertNonNullish(callState.authorizationState);
  const currentUserNonNull = authorizationStateNonNull.user;
  const authorizedRoleIds = [OpaDm.Role_OwnerId, OpaDm.Role_AdministratorId];

  authorizationStateNonNull.assertUserApproved();
  authorizationStateNonNull.assertRoleAllowed(authorizedRoleIds);

  if (doBackupFirst) {
    // LATER: Backup any existing data
    throw new Error("Backup of existing Archive data has not been implemented yet.");
  }

  const application = await OpaDb.Application.queries.getById(db, OpaDm.ApplicationId);
  OPA.assertDocumentIsValid(application, "The Application does not exist.");
  const applicationNonNull = OPA.convertNonNullish(application);

  const applicationComparison = OPA.compareVersionNumberStrings(applicationNonNull.applicationVersion, ApplicationInfo.VERSION);
  const schemaComparison = OPA.compareVersionNumberStrings(applicationNonNull.schemaVersion, SchemaInfo.VERSION);

  OPA.assertNonNullish(applicationComparison, "The application version numbers provided are invalid.");
  OPA.assertNonNullish(schemaComparison, "The schema version numbers provided are invalid.");
  OPA.assertIsFalse((applicationComparison == -1), "The application version number currently cannot be downgraded.");
  OPA.assertIsFalse((schemaComparison == -1), "The schema version number currently cannot be downgraded.");
  OPA.assertIsFalse((applicationComparison == 0) && (schemaComparison == 0), "The application and schema version numbers match the latest build.");

  // LATER: Do upgrade work here

  const applicationPartial: OpaDm.IApplicationPartial = {};
  if (applicationComparison > 0) {
    applicationPartial.applicationVersion = ApplicationInfo.VERSION;
  }
  if (schemaComparison > 0) {
    applicationPartial.schemaVersion = SchemaInfo.VERSION;
  }

  if (OPA.isEmpty(applicationPartial)) {
    throw new Error("No upgraded version was provided.");
  }
  await OpaDb.Application.queries.updateApplication(db, applicationPartial, currentUserNonNull.id, constructorProvider);
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

  for (let i = 0; i < OpaDb.NestedCollections.length; i++) {
    const colDesc = OpaDb.NestedCollections[i];

    for (let j = 0; j < colDesc.propertyIndices.length; j++) {
      const propertyIndexDesc = colDesc.propertyIndices[j];
      await OPA.clearFirestoreCollectionInDb(db, propertyIndexDesc.indexCollectionName);
    }
    // LATER: If necessary, delete all documents from NestedCollection starting with leaves of Collection tree
  }

  for (let i = 0; i < OpaDb.RootCollections.length; i++) {
    const colDesc = OpaDb.RootCollections[i];

    for (let j = 0; j < colDesc.propertyIndices.length; j++) {
      const propertyIndexDesc = colDesc.propertyIndices[j];
      await OPA.clearFirestoreCollectionInDb(db, propertyIndexDesc.indexCollectionName);
    }
    await OPA.clearFirestoreCollectionInDb(db, colDesc.collectionName);
  }
}

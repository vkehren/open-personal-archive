import * as OPA from "../../../base/src";
import * as OpaDm from "../../../datamodel/src";
import {OpaDbDescriptor as OpaDb} from "../../../datamodel/src";
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
  OPA.assertDataStorageStateIsNotNullish(dataStorageState);
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);

  const application = await OpaDb.Application.queries.getById(dataStorageState, OpaDm.ApplicationId);
  return (!OPA.isNullish(application));
}

/**
 * Gets the screen display model for the Open Personal Archive™ (OPA) installation screen.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @return {Promise<InstallationScreenDisplayModel>}
 */
export async function getInstallationScreenDisplayModel(callState: OpaDm.ICallState): Promise<IInstallationScreenDisplayModel> {
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  // NOTE: First handle case where OPA is NOT installed
  const firebaseProjectId = callState.dataStorageState.projectId;
  const usesFirebaseEmulators = callState.dataStorageState.usesEmulators;
  const isInstalled = await isSystemInstalled(callState.dataStorageState);

  const defaultDisplayModel: IInstallationScreenDisplayModel = {
    authorizationData: {firebaseProjectId, usesFirebaseEmulators, isSystemInstalled: isInstalled, userData: null, roleData: null},
    archiveName: "(a name for the archive)",
    archiveDescription: "(a description for the archive)",
    pathToStorageFolder: "./",
    validLocales: OpaDb.Locales.requiredDocuments,
    selectedLocale: OpaDb.Locales.requiredDocuments.filter((value: OpaDm.ILocale) => value.isDefault)[0],
    validTimeZoneGroups: OpaDb.TimeZoneGroups.requiredDocuments,
    selectedTimeZoneGroup: OpaDb.TimeZoneGroups.requiredDocuments.filter((value: OpaDm.ITimeZoneGroup) => value.isDefault)[0],
  };

  if (!isInstalled) {
    return defaultDisplayModel;
  }

  // NOTE: Handle case where OPA is installed
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertSystemStateIsNotNullish(callState.systemState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);

  const systemState = OPA.convertNonNullish(callState.systemState);
  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizedRoleIds = [OpaDm.Role_OwnerId, OpaDm.Role_AdministratorId];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizedRoleIds);

  const archiveNonNull = systemState.archive;
  const localeNonNull = authorizationState.locale;
  const localeToUse = localeNonNull.optionName;

  const localeSnaps = await OpaDb.Locales.getTypedCollection(callState.dataStorageState).get();
  const locales = localeSnaps.docs.map((localeSnap) => localeSnap.data());
  let selectedLocales = locales.filter((locale) => (locale.id == archiveNonNull.defaultLocaleId));
  const timeZoneGroupSnaps = await OpaDb.TimeZoneGroups.getTypedCollection(callState.dataStorageState).get();
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
    authorizationData: DMU.getAuthorizationDataForDisplayModel(callState.dataStorageState, systemState, authorizationState),
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
 * @param {string} installationNotes Any notes of documentation about the installation.
 * @return {Promise<void>}
 */
export async function performInstall(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState, archiveName: string, archiveDescription: string, pathToStorageFolder: string, defaultLocaleId: string, defaultTimeZoneGroupId: string, installationNotes: string): Promise<void> { // eslint-disable-line max-len
  OPA.assertDataStorageStateIsNotNullish(dataStorageState);
  OPA.assertFirestoreIsNotNullish(dataStorageState.db);

  dataStorageState.currentWriteBatch = dataStorageState.constructorProvider.writeBatch();

  const isInstalled = await isSystemInstalled(dataStorageState);
  OPA.assertSystemIsNotInstalled(isInstalled, "The Open Personal Archive™ (OPA) system has already been installed. Please un-install before re-installing.");
  OPA.assertAuthenticationStateIsNotNullish(authenticationState);
  OPA.assertIdentifierIsValid(authenticationState.firebaseAuthUserId);
  OPA.assertNonNullishOrWhitespace(authenticationState.providerId, "The Authentication Provider ID for the User's account must not be null.");
  OPA.assertNonNullishOrWhitespace(authenticationState.email, "The email account of the User must not be null.");

  const ownerFirebaseAuthUserId = authenticationState.firebaseAuthUserId;
  const externalAuthProviderId = authenticationState.providerId;
  const ownerAccountName = authenticationState.email;
  const ownerFirstName = OPA.convertNonNullish(authenticationState.firstName, "");
  const ownerLastName = OPA.convertNonNullish(authenticationState.lastName, "");

  // 1) Create the Application document
  await OpaDb.Application.queries.create(dataStorageState, ApplicationInfo.VERSION, SchemaInfo.VERSION, installationNotes);

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
  await OpaDb.AuthProviders.loadRequiredDocuments(dataStorageState, eraseExistingData);
  await OpaDb.Roles.loadRequiredDocuments(dataStorageState, eraseExistingData);
  await OpaDb.Locales.loadRequiredDocuments(dataStorageState, eraseExistingData);
  await OpaDb.TimeZones.loadRequiredDocuments(dataStorageState, eraseExistingData);
  await OpaDb.TimeZoneGroups.loadRequiredDocuments(dataStorageState, eraseExistingData);

  // 3) Create the User document for the Owner of the Archive
  const authProvider = await OpaDb.AuthProviders.queries.getByExternalAuthProviderIdWithAssert(dataStorageState, externalAuthProviderId, "The required AuthProvider does not exist.");
  const localeDefault = await OpaDb.Locales.queries.getByIdWithAssert(dataStorageState, defaultLocaleId, "The required Locale does not exist.");
  const timeZoneGroupDefault = await OpaDb.TimeZoneGroups.queries.getByIdWithAssert(dataStorageState, defaultTimeZoneGroupId, "The required TimeZoneGroup does not exist.");
  const userOwner = await OpaDb.Users.queries.createArchiveOwner(dataStorageState, ownerFirebaseAuthUserId, authProvider, ownerAccountName, localeDefault, timeZoneGroupDefault, ownerFirstName, ownerLastName); // eslint-disable-line max-len

  // 4) Create the Archive document for the Archive
  await OpaDb.Archive.queries.create(dataStorageState, archiveName, archiveDescription, pathToStorageFolder, userOwner, localeDefault, timeZoneGroupDefault);
  await dataStorageState.currentWriteBatch.commit();
  dataStorageState.currentWriteBatch = null;
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
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isInstalled = await isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);
  OPA.assertIdentifierIsValid(callState.authenticationState.firebaseAuthUserId);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const authorizedRoleIds = [OpaDm.Role_OwnerId, OpaDm.Role_AdministratorId];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizedRoleIds);

  const currentUserNonNull = authorizationState.user;
  const currentLocaleNonNull = authorizationState.locale;
  const localeToUse = currentLocaleNonNull.optionName;

  const archive = await OpaDb.Archive.queries.getByIdWithAssert(callState.dataStorageState, OpaDm.ArchiveId, "The Archive does not exist.");

  const archivePartial: OpaDm.IArchivePartial = {};
  if ((archiveName) && (archive.name[localeToUse] != archiveName)) {
    archivePartial.name = {...archive.name};
    archivePartial.name[localeToUse] = archiveName;
  }
  if ((archiveDescription) && (archive.description[localeToUse] != archiveDescription)) {
    archivePartial.description = {...archive.description};
    archivePartial.description[localeToUse] = archiveDescription;
  }
  if ((defaultLocaleId) && (archive.defaultLocaleId != defaultLocaleId)) {
    await OpaDb.Locales.queries.getByIdWithAssert(callState.dataStorageState, defaultLocaleId, "The Locale specified does not exist.");
    archivePartial.defaultLocaleId = defaultLocaleId;
  }
  if ((defaultTimeZoneGroupId) && (archive.defaultTimeZoneGroupId != defaultTimeZoneGroupId)) {
    await OpaDb.TimeZoneGroups.queries.getByIdWithAssert(callState.dataStorageState, defaultTimeZoneGroupId, "The TimeZoneGroup specified does not exist.");
    archivePartial.defaultTimeZoneGroupId = defaultTimeZoneGroupId;
  }
  if ((defaultTimeZoneId) && (archive.defaultTimeZoneId != defaultTimeZoneId)) {
    await OpaDb.TimeZones.queries.getByIdWithAssert(callState.dataStorageState, defaultTimeZoneId, "The TimeZone specified does not exist.");
    archivePartial.defaultTimeZoneId = defaultTimeZoneId;
  }
  // LATER: Consider allowing change to root storage folder if no files have been added yet

  if (OPA.isEmpty(archivePartial)) {
    throw new Error("No updated setting was provided.");
  }

  await OpaDb.Archive.queries.update(callState.dataStorageState, archivePartial, currentUserNonNull.id);
  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;
}

/**
 * Upgrades the Open Personal Archive™ (OPA) system to the latest version.
 * @param {OpaDm.ICallState} callState The Call State for the current User.
 * @param {string} upgradeNotes Any notes of documentation about the installation.
 * @param {boolean} [doBackupFirst=false] Whether to backup the data before upgrading it (NOT IMPLEMENTED YET).
 * @return {Promise<void>}
 */
export async function performUpgrade(callState: OpaDm.ICallState, upgradeNotes: string, doBackupFirst = false): Promise<void> { // eslint-disable-line max-len
  OPA.assertCallStateIsNotNullish(callState);
  OPA.assertDataStorageStateIsNotNullish(callState.dataStorageState);
  OPA.assertFirestoreIsNotNullish(callState.dataStorageState.db);

  callState.dataStorageState.currentWriteBatch = callState.dataStorageState.constructorProvider.writeBatch();

  const isInstalled = await isSystemInstalled(callState.dataStorageState);
  OPA.assertSystemIsInstalled(isInstalled);
  OPA.assertAuthenticationStateIsNotNullish(callState.authenticationState);
  OpaDm.assertAuthorizationStateIsNotNullish(callState.authorizationState);
  OPA.assertIdentifierIsValid(callState.authenticationState.firebaseAuthUserId);

  const authorizationState = OPA.convertNonNullish(callState.authorizationState);
  const currentUserNonNull = authorizationState.user;
  const authorizedRoleIds = [OpaDm.Role_OwnerId, OpaDm.Role_AdministratorId];

  authorizationState.assertUserApproved();
  authorizationState.assertRoleAllowed(authorizedRoleIds);

  if (doBackupFirst) {
    // LATER: Backup any existing data
    throw new Error("Backup of existing Archive data has not been implemented yet.");
  }

  const application = await OpaDb.Application.queries.getByIdWithAssert(callState.dataStorageState, OpaDm.ApplicationId, "The Application does not exist.");
  const applicationComparison = OPA.compareVersionNumberStrings(application.applicationVersion, ApplicationInfo.VERSION);
  const schemaComparison = OPA.compareVersionNumberStrings(application.schemaVersion, SchemaInfo.VERSION);

  OPA.assertNonNullish(applicationComparison, "The application version numbers provided are invalid.");
  OPA.assertNonNullish(schemaComparison, "The schema version numbers provided are invalid.");
  OPA.assertIsFalse((applicationComparison < 0), "The application version number currently cannot be downgraded.");
  OPA.assertIsFalse((schemaComparison < 0), "The schema version number currently cannot be downgraded.");
  OPA.assertIsFalse((applicationComparison == 0) && (schemaComparison == 0), "The application and schema version numbers match the latest build.");

  let isVersionInfoValidForUpgrade = false;
  const applicationPartial: OpaDm.IApplicationPartial = {notes: upgradeNotes};
  if (applicationComparison > 0) {
    applicationPartial.applicationVersion = ApplicationInfo.VERSION;
    isVersionInfoValidForUpgrade = true;
  }
  if (schemaComparison > 0) {
    applicationPartial.schemaVersion = SchemaInfo.VERSION;
    isVersionInfoValidForUpgrade = true;
  }

  if (!isVersionInfoValidForUpgrade) {
    throw new Error("No upgraded version was provided.");
  }

  // LATER: Do upgrade work here

  await OpaDb.Application.queries.upgrade(callState.dataStorageState, applicationPartial, currentUserNonNull.id);
  await callState.dataStorageState.currentWriteBatch.commit();
  callState.dataStorageState.currentWriteBatch = null;
}

/**
 * Uninstalls the Open Personal Archive™ (OPA) system by clearing the data in the Firestore DB.
 * @param {OpaDm.IDataStorageState} dataStorageState A container for the Firebase database and storage objects to read from.
 * @param {OpaDm.IAuthenticationState} authenticationState The Firebase Authentication state for the User.
 * @param {OpaDm.IAuthorizationState | null | undefined} authorizationState The OPA Authorization state for the User.
 * @param {boolean} [doBackupFirst=false] Whether to backup the data before deleting it (NOT IMPLEMENTED YET).
 * @return {Promise<boolean>} Was the function successful.
 */
export async function performUninstall(dataStorageState: OpaDm.IDataStorageState, authenticationState: OpaDm.IAuthenticationState, authorizationState: OpaDm.IAuthorizationState | null | undefined, doBackupFirst = false): Promise<boolean> { // eslint-disable-line max-len
  let wasSuccessful = true;
  let bulkWriter = dataStorageState.currentBulkWriter;

  try {
    OPA.assertDataStorageStateIsNotNullish(dataStorageState);
    OPA.assertAuthenticationStateIsNotNullish(authenticationState);
    OPA.assertFirestoreIsNotNullish(dataStorageState.db);

    bulkWriter = dataStorageState.constructorProvider.bulkWriter();
    dataStorageState.currentBulkWriter = bulkWriter;

    const owner = await OpaDb.Users.queries.getById(dataStorageState, OpaDm.User_OwnerId);
    if (!OPA.isNullish(owner)) {
      const isInstalled = await isSystemInstalled(dataStorageState);
      OPA.assertSystemIsInstalled(isInstalled);
      OpaDm.assertAuthorizationStateIsNotNullish(authorizationState);

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
        await OPA.clearFirestoreCollection(dataStorageState, propertyIndexDesc.indexCollectionName);
      }
      // LATER: If necessary, delete all documents from NestedCollection starting with leaves of Collection tree
    }

    for (let i = 0; i < OpaDb.RootCollections.length; i++) {
      const colDesc = OpaDb.RootCollections[i];

      for (let j = 0; j < colDesc.propertyIndices.length; j++) {
        const propertyIndexDesc = colDesc.propertyIndices[j];
        await OPA.clearFirestoreCollection(dataStorageState, propertyIndexDesc.indexCollectionName);
      }
      await OPA.clearFirestoreCollection(dataStorageState, colDesc.collectionName);
    }
  } catch (error) {
    wasSuccessful = false;
  } finally {
    // NOTE: The "bulkWriter" constant is necessary to make this work
    await OPA.convertNonNullish(bulkWriter).close();
    dataStorageState.currentBulkWriter = null;
  }
  return wasSuccessful;
}

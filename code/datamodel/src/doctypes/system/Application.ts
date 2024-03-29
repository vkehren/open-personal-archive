import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../../../base/src";
import * as BT from "../../BaseTypes";

/* eslint-disable camelcase */

const SingularName = "Application";
const PluralName = "Applications";
const IsSingleton = true;
export const SingletonId = "OPA_Application";

export interface IApplicationPartial {
  applicationVersion?: string;
  schemaVersion?: string;
  notes: string;
}

type UpgradeHistoryItem = IApplicationPartial | OPA.IUpgradeable_ByUser;
interface IApplicationPartial_WithHistory extends IApplicationPartial, OPA.IUpgradeable_ByUser {
  upgradeHistory: Array<UpgradeHistoryItem> | firestore.FieldValue;
}

export interface IApplication extends OPA.IDocument_Upgradeable_ByUser_WithHistory<UpgradeHistoryItem> {
  applicationVersion: string;
  schemaVersion: string;
  notes: string;
  readonly dateOfInstallation: OPA.DateToUse;
}
const IApplication_ReadOnlyPropertyNames = [ // eslint-disable-line camelcase
  OPA.getTypedPropertyKeyAsText<IApplication>("dateOfInstallation"),
];

/**
 * Checks whether the specified updates to the specified Application document are valid.
 * @param {IApplication} document The Application document being updated.
 * @param {IApplicationPartial} updateObject The updates specified.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: IApplication, updateObject: IApplicationPartial, throwErrorOnInvalidUpdate = false): boolean {
  OPA.assertDocumentIsValid(document);
  OPA.assertNonNullish(updateObject, "The processed Update Object must not be null.");

  const updateObject_AsUnknown = (updateObject as unknown);

  if (!OPA.areUpdatesValid_ForDocument(document, updateObject_AsUnknown as OPA.IDocument, IApplication_ReadOnlyPropertyNames, throwErrorOnInvalidUpdate)) {
    return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  const preventUpdates_ForUpgradeable_ByUser = false;
  if (!OPA.areUpdatesValid_ForUpgradeable_ByUser(document, updateObject_AsUnknown as OPA.IUpgradeable_ByUser, preventUpdates_ForUpgradeable_ByUser, throwErrorOnInvalidUpdate)) {
    return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  // NOTE: If any properties are added that can be updated without upgrading, implement IUpdateable_ByUser on Application

  // NOTE: The "applicationVersion" cannot be downgraded or updated to same value as current value
  if (!OPA.isNullish(updateObject.applicationVersion)) {
    const applicationVersion_Updated = OPA.convertNonNullish(updateObject.applicationVersion);
    if (OPA.compareVersionNumberStrings(document.applicationVersion, applicationVersion_Updated) < 1) {
      return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The Application Version can only be upgraded.");
    }
  }
  // NOTE: The "schemaVersion" cannot be downgraded or updated to same value as current value
  if (!OPA.isNullish(updateObject.schemaVersion)) {
    const schemaVersion_Updated = OPA.convertNonNullish(updateObject.schemaVersion);
    if (OPA.compareVersionNumberStrings(document.schemaVersion, schemaVersion_Updated) < 1) {
      return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The Schema Version can only be upgraded.");
    }
  }
  return true;
}

/**
 * Creates an instance of the IApplication document type.
 * @param {string} applicationVersion The version of the OPA application code.
 * @param {string} schemaVersion The version of the OPA database schema.
 * @param {string} notes Any notes of documentation about the installation.
 * @return {IApplication} The new document instance.
 */
export function createSingleton(applicationVersion: string, schemaVersion: string, notes: string): IApplication {
  const now = OPA.nowToUse();
  const document: IApplication = {
    id: SingletonId,
    applicationVersion: applicationVersion,
    schemaVersion: schemaVersion,
    notes: notes,
    upgradeHistory: ([] as Array<UpgradeHistoryItem>),
    dateOfInstallation: now,
    hasBeenUpgraded: false,
    dateOfLatestUpgrade: null,
    userIdOfLatestUpgrader: null,
  };

  const documentCopy = {...document};
  delete ((documentCopy as unknown) as Record<string, unknown>).upgradeHistory;
  document.upgradeHistory.push(documentCopy);
  return document;
}

/** Class providing queries for Application collection. */
export class ApplicationQuerySet extends OPA.QuerySet<IApplication> {
  /**
   * Creates a ApplicationQuerySet.
   * @param {OPA.ITypedCollectionDescriptor<IApplication>} collectionDescriptor The collection descriptor to use for queries.
   */
  constructor(collectionDescriptor: OPA.ITypedCollectionDescriptor<IApplication>) {
    super(collectionDescriptor);
  }

  /**
   * The typed collection descriptor to use for queries.
   * @type {OPA.ITypedQueryableFactoryCollectionDescriptor<IApplication, ApplicationQuerySet, FactoryFunc>}
   */
  get typedCollectionDescriptor(): OPA.ITypedQueryableFactoryCollectionDescriptor<IApplication, ApplicationQuerySet, FactoryFunc> {
    return OPA.convertTo<OPA.ITypedQueryableFactoryCollectionDescriptor<IApplication, ApplicationQuerySet, FactoryFunc>>(this.collectionDescriptor);
  }

  /**
   * Creates an instance of the IApplication document type stored on the server.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} applicationVersion The version of the OPA application code.
   * @param {string} schemaVersion The version of the OPA database schema.
   * @param {string} notes Any notes of documentation about the installation.
   * @return {Promise<string>} The new document ID.
   */
  async create(ds: OPA.IDataStorageState, applicationVersion: string, schemaVersion: string, notes: string): Promise<string> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const document = createSingleton(applicationVersion, schemaVersion, notes);
    const proxiedDocument = this.documentProxyConstructor(document);
    const documentId = proxiedDocument.id;

    OPA.assertNonNullish(proxiedDocument);
    OPA.assertNonNullish(proxiedDocument.upgradeHistory);
    OPA.assertIsTrue(proxiedDocument.id == SingletonId);
    OPA.assertIsTrue(documentId == SingletonId);
    OPA.assertIsTrue(proxiedDocument.upgradeHistory.length == 1);

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, proxiedDocument, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
    return documentId;
  }

  /**
   * Updates the Application stored on the server using an IApplicationPartial object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {IApplicationPartial} updateObject The object containing the updates.
   * @param {string} userIdOfLatestUpgrader The ID for the Upgrader within the OPA system.
   * @return {Promise<void>}
   */
  async upgrade(ds: OPA.IDataStorageState, updateObject: IApplicationPartial, userIdOfLatestUpgrader: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);
    OPA.assertNonNullish(updateObject, "The incoming Update Object must not be null.");

    // NOTE: Get the document earlier to check validity before and after setting "upgradeHistory" to also make sure it was not set on the "updateObject" passed in
    const documentId = SingletonId;
    const document = await this.getByIdWithAssert(ds, documentId);

    const now = OPA.nowToUse();
    const updateObject_Upgradeable = ({hasBeenUpgraded: true, dateOfLatestUpgrade: now, userIdOfLatestUpgrader} as OPA.IUpgradeable_ByUser);
    updateObject = {...updateObject, ...updateObject_Upgradeable};
    let areValid = areUpdatesValid(document, updateObject, BT.DataConfiguration.ThrowErrorOnInvalidUpdate);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const updateObject_ForHistory = OPA.replaceFieldValuesWithSummaries({...updateObject});
    const upgradeHistory = ds.constructorProvider.arrayUnion(updateObject_ForHistory);
    const updateObject_WithHistory = ({...updateObject, upgradeHistory} as IApplicationPartial_WithHistory);
    areValid = areUpdatesValid(document, updateObject_WithHistory, BT.DataConfiguration.ThrowErrorOnInvalidUpdate);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }
}

export type FactoryFunc = (...[params]: Parameters<typeof createSingleton>) => ReturnType<typeof createSingleton>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IApplication, ApplicationQuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new ApplicationQuerySet(cd), null, []);

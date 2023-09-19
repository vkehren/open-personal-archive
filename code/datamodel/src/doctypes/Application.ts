import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../../base/src";

/* eslint-disable camelcase */

const SingularName = "Application";
const PluralName = "Applications";
const IsSingleton = true;
export const SingletonId = "OPA_Application";

export interface IApplicationPartial {
  applicationVersion?: string;
  schemaVersion?: string;
}

type UpgradeHistoryItem = IApplicationPartial | OPA.IUpgradeable_ByUser;
interface IApplicationPartial_WithHistory extends IApplicationPartial, OPA.IUpgradeable_ByUser {
  upgradeHistory: Array<UpgradeHistoryItem> | firestore.FieldValue;
}

export interface IApplication extends OPA.IDocument_Upgradeable_ByUser {
  applicationVersion: string;
  schemaVersion: string;
  readonly upgradeHistory: Array<UpgradeHistoryItem>;
  readonly dateOfInstallation: OPA.DateToUse;
}

/**
 * Checks whether the specified updates to the specified Application document are valid.
 * @param {IApplication} document The Application document being updated.
 * @param {IApplicationPartial} updateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: IApplication, updateObject: IApplicationPartial): boolean {
  OPA.assertNonNullish(document);
  OPA.assertNonNullish(updateObject);

  if (!OPA.areUpdatesValid_ForDocument(document, updateObject as OPA.IDocument)) {
    return false;
  }

  // NOTE: updateObject MUST implement IUpgradeable_ByUser, so check immediately and do NOT use "if (true) {...}"
  const updateObject_Updateable = (updateObject as OPA.IUpgradeable_ByUser);

  if (!updateObject_Updateable.hasBeenUpgraded || OPA.isNullish(updateObject_Updateable.dateOfLatestUpgrade) || OPA.isNullish(updateObject_Updateable.userIdOfLatestUpgrader)) {
    return false;
  }

  const propertyNames_ForUpdate = OPA.getOwnPropertyKeys(updateObject);
  const dateOfInstallation_IsUpdated = propertyNames_ForUpdate.includes(OPA.getTypedPropertyKeysAsText(document).dateOfInstallation);

  if (dateOfInstallation_IsUpdated) {
    return false;
  }

  // NOTE: updateObject MUST NOT erase read-only history of upgrades
  const upgradeHistory_KeyText = OPA.getTypedPropertyKeysAsText(document).upgradeHistory;
  const upgradeHistory_IsUpdated = propertyNames_ForUpdate.includes(upgradeHistory_KeyText);
  const upgradeHistory_Value = (updateObject as Record<string, unknown>)[upgradeHistory_KeyText];

  if (upgradeHistory_IsUpdated && !OPA.isOfFieldValue_ArrayUnion<firestore.FieldValue>(upgradeHistory_Value)) {
    return false;
  }

  // NOTE: The "applicationVersion" cannot be downgraded or updated to same value as current value
  if (!OPA.isNullish(updateObject.applicationVersion)) {
    const applicationVersion_Updated = OPA.convertNonNullish(updateObject.applicationVersion);
    if (OPA.compareVersionNumberStrings(document.applicationVersion, applicationVersion_Updated) < 1) {
      return false;
    }
  }
  // NOTE: The "schemaVersion" cannot be downgraded or updated to same value as current value
  if (!OPA.isNullish(updateObject.schemaVersion)) {
    const schemaVersion_Updated = OPA.convertNonNullish(updateObject.schemaVersion);
    if (OPA.compareVersionNumberStrings(document.schemaVersion, schemaVersion_Updated) < 1) {
      return false;
    }
  }
  return true;
}

/**
 * Creates an instance of the IApplication document type.
 * @param {string} applicationVersion The version of the OPA application code.
 * @param {string} schemaVersion The version of the OPA database schema.
 * @return {IApplication} The new document instance.
 */
export function createSingleton(applicationVersion: string, schemaVersion: string): IApplication {
  const now = OPA.nowToUse();
  const document: IApplication = {
    id: SingletonId,
    applicationVersion: applicationVersion,
    schemaVersion: schemaVersion,
    upgradeHistory: ([] as Array<UpgradeHistoryItem>),
    dateOfInstallation: now,
    hasBeenUpgraded: false,
    dateOfLatestUpgrade: null,
    userIdOfLatestUpgrader: null,
  };

  const documentCopy = OPA.copyObject(document);
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
   * @return {Promise<string>} The new document ID.
   */
  async create(ds: OPA.IDataStorageState, applicationVersion: string, schemaVersion: string): Promise<string> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const document = createSingleton(applicationVersion, schemaVersion);
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

    const documentId = SingletonId;
    const now = OPA.nowToUse();
    const updateObject_Upgradeable = ({hasBeenUpgraded: true, dateOfLatestUpgrade: now, userIdOfLatestUpgrader} as OPA.IUpgradeable_ByUser);
    updateObject = {...updateObject, ...updateObject_Upgradeable};
    const updateObject_ForHistory = OPA.replaceFieldValuesWithSummaries({...updateObject});
    const upgradeHistory = ds.constructorProvider.arrayUnion(updateObject_ForHistory);
    const updateObject_WithHistory = ({...updateObject, upgradeHistory} as IApplicationPartial_WithHistory);

    const document = await this.getById(ds, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
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

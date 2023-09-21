import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../../base/src";
import {ILocale} from "./Locale";
import {ITimeZoneGroup} from "./TimeZoneGroup";
import {IUser} from "./User";

/* eslint-disable camelcase */

const SingularName = "Archive";
const PluralName = "Archives";
const IsSingleton = true;
export const SingletonId = "OPA_Archive";

export interface IArchivePartial {
  name?: OPA.ILocalizable<string>;
  description?: OPA.ILocalizable<string>;
  defaultLocaleId?: string;
  defaultTimeZoneGroupId?: string;
  defaultTimeZoneId?: string;
}

type UpdateHistoryItem = IArchivePartial | OPA.IUpdateable_ByUser;
interface IArchivePartial_WithHistory extends IArchivePartial, OPA.IUpdateable_ByUser {
  updateHistory: Array<UpdateHistoryItem> | firestore.FieldValue;
}

export interface IArchive extends OPA.IDocument_Creatable_ByUser, OPA.IDocument_Updateable_ByUser_WithHistory<UpdateHistoryItem> {
  readonly ownerId: string;
  readonly pathToStorageFolder: string;
  name: OPA.ILocalizable<string>;
  description: OPA.ILocalizable<string>;
  defaultLocaleId: string;
  defaultTimeZoneGroupId: string;
  defaultTimeZoneId: string;
}
const IArchive_ReadOnlyPropertyNames = [ // eslint-disable-line camelcase
  OPA.getTypedPropertyKeyAsText<IArchive>("ownerId"),
  OPA.getTypedPropertyKeyAsText<IArchive>("pathToStorageFolder"),
];

/**
 * Checks whether the specified updates to the specified Archive document are valid.
 * @param {IArchive} document The Archive document being updated.
 * @param {IArchivePartial} updateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: IArchive, updateObject: IArchivePartial): boolean {
  OPA.assertNonNullish(document);
  OPA.assertNonNullish(updateObject);

  const updateObjectAsUnknown = (updateObject as unknown);
  if (!OPA.areUpdatesValid_ForDocument(document, updateObjectAsUnknown as OPA.IDocument, IArchive_ReadOnlyPropertyNames)) {
    return false;
  }
  if (!OPA.areUpdatesValid_ForCreatable_ByUser(document, updateObjectAsUnknown as OPA.ICreatable_ByUser)) {
    return false;
  }
  if (!OPA.areUpdatesValid_ForUpdateable_ByUser(document, updateObjectAsUnknown as OPA.IUpdateable_ByUser)) {
    return false;
  }

  return true;
}

/**
 * Creates an instance of the IArchive document type.
 * @param {string} name The name of the Archive.
 * @param {string} description A description of the Archive.
 * @param {string} pathToStorageFolder The path to the root folder for storing files in Firebase Storage.
 * @param {IUser} owner The User who owns the Archive.
 * @param {ILocale} defaultLocale The default Locale to use for the Archive.
 * @param {ITimeZoneGroup} defaultTimeZoneGroup The default TimeZoneGroup to use for the Archive.
 * @return {IArchive} The new document instance.
 */
export function createSingleton(name: string, description: string, pathToStorageFolder: string, owner: IUser, defaultLocale: ILocale, defaultTimeZoneGroup: ITimeZoneGroup): IArchive {
  const now = OPA.nowToUse();
  const names: OPA.ILocalizable<string> = {en: name};
  names[defaultLocale.optionName] = name;
  const descriptions: OPA.ILocalizable<string> = {en: name};
  descriptions[defaultLocale.optionName] = description;

  const document: IArchive = {
    id: SingletonId,
    ownerId: owner.id,
    pathToStorageFolder: pathToStorageFolder,
    name: names,
    description: descriptions,
    defaultLocaleId: defaultLocale.id,
    defaultTimeZoneGroupId: defaultTimeZoneGroup.id,
    defaultTimeZoneId: defaultTimeZoneGroup.primaryTimeZoneId,
    updateHistory: ([] as Array<UpdateHistoryItem>),
    dateOfCreation: now,
    userIdOfCreator: owner.id,
    hasBeenUpdated: false,
    dateOfLatestUpdate: null,
    userIdOfLatestUpdater: null,
  };

  const documentCopy = OPA.copyObject(document);
  delete ((documentCopy as unknown) as Record<string, unknown>).updateHistory;
  document.updateHistory.push(documentCopy);
  return document;
}

/** Class providing queries for Archive collection. */
export class ArchiveQuerySet extends OPA.QuerySet<IArchive> {
  /**
   * Creates a ArchiveQuerySet.
   * @param {OPA.ITypedCollectionDescriptor<IArchive>} collectionDescriptor The collection descriptor to use for queries.
   */
  constructor(collectionDescriptor: OPA.ITypedCollectionDescriptor<IArchive>) {
    super(collectionDescriptor);
  }

  /**
   * The typed collection descriptor to use for queries.
   * @type {OPA.ITypedQueryableFactoryCollectionDescriptor<IArchive, ArchiveQuerySet, FactoryFunc>}
   */
  get typedCollectionDescriptor(): OPA.ITypedQueryableFactoryCollectionDescriptor<IArchive, ArchiveQuerySet, FactoryFunc> {
    return OPA.convertTo<OPA.ITypedQueryableFactoryCollectionDescriptor<IArchive, ArchiveQuerySet, FactoryFunc>>(this.collectionDescriptor);
  }

  /**
   * Creates an instance of the IArchive document type stored on the server.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} name The name of the Archive.
   * @param {string} description A description of the Archive.
   * @param {string} pathToStorageFolder The path to the root folder for storing files in Firebase Storage.
   * @param {IUser} owner The User who owns the Archive.
   * @param {ILocale} defaultLocale The default Locale to use for the Archive.
   * @param {ITimeZoneGroup} defaultTimeZoneGroup The default TimeZoneGroup to use for the Archive.
   * @return {Promise<string>} The new document ID.
   */
  async create(ds: OPA.IDataStorageState, name: string, description: string, pathToStorageFolder: string, owner: IUser, defaultLocale: ILocale, defaultTimeZoneGroup: ITimeZoneGroup): Promise<string> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const document = createSingleton(name, description, pathToStorageFolder, owner, defaultLocale, defaultTimeZoneGroup);
    const proxiedDocument = this.documentProxyConstructor(document);
    const documentId = proxiedDocument.id;

    OPA.assertNonNullish(proxiedDocument);
    OPA.assertNonNullish(proxiedDocument.updateHistory);
    OPA.assertIsTrue(proxiedDocument.id == SingletonId);
    OPA.assertIsTrue(documentId == SingletonId);
    OPA.assertIsTrue(proxiedDocument.updateHistory.length == 1);

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, proxiedDocument, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
    return documentId;
  }

  /**
   * Updates the Archive stored on the server using an IArchivePartial object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {IArchivePartial} updateObject The object containing the updates.
   * @param {string} userIdOfLatestUpdater The ID for the Updater within the OPA system.
   * @return {Promise<void>}
   */
  async update(ds: OPA.IDataStorageState, updateObject: IArchivePartial, userIdOfLatestUpdater: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    // NOTE: Get the document earlier to check validity before and after setting "updateHistory" to also make sure it was not set on the "updateObject" passed in
    const documentId = SingletonId;
    const document = await this.getByIdWithAssert(ds, documentId);

    const now = OPA.nowToUse();
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater} as OPA.IUpdateable_ByUser);
    updateObject = {...updateObject, ...updateObject_Updateable};
    let areValid = areUpdatesValid(document, updateObject);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const updateObject_ForHistory = OPA.replaceFieldValuesWithSummaries({...updateObject});
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject_ForHistory);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IArchivePartial_WithHistory);
    areValid = areUpdatesValid(document, updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const batchUpdate = OPA.convertNonNullish(ds.currentWriteBatch, () => ds.constructorProvider.writeBatch());
    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const documentRef = collectionRef.doc(documentId);
    batchUpdate.set(documentRef, updateObject_WithHistory, {merge: true});
    if (batchUpdate != ds.currentWriteBatch) {await batchUpdate.commit();} // eslint-disable-line brace-style
  }
}

export type FactoryFunc = (...[params]: Parameters<typeof createSingleton>) => ReturnType<typeof createSingleton>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IArchive, ArchiveQuerySet, FactoryFunc>(SingularName, PluralName, IsSingleton, (cd) => new ArchiveQuerySet(cd), null, []);

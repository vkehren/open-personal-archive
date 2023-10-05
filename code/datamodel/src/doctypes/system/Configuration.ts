import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../../../base/src";
import * as BT from "../../BaseTypes";
import {ILocale} from "../Locale";
import {ITimeZoneGroup} from "../TimeZoneGroup";
import {IUser} from "../authorization/User";

/* eslint-disable camelcase */

const SingularName = "Configuration";
const PluralName = "Configurations";
const IsSingleton = true;
export const SingletonId = "OPA_Configuration";

export interface IConfigurationPartial {
  name?: OPA.ILocalizable<string>;
  description?: OPA.ILocalizable<string>;
  defaultLocaleId?: string;
  defaultTimeZoneGroupId?: string;
  defaultTimeZoneId?: string;
}

type UpdateHistoryItem = IConfigurationPartial | OPA.IUpdateable_ByUser;
interface IConfigurationPartial_WithHistory extends IConfigurationPartial, OPA.IUpdateable_ByUser {
  updateHistory: Array<UpdateHistoryItem> | firestore.FieldValue;
}

export interface IConfiguration extends OPA.IDocument_Creatable_ByUser, OPA.IDocument_Updateable_ByUser_WithHistory<UpdateHistoryItem> {
  readonly ownerId: string;
  readonly pathToRootStorageFolder: string;
  name: OPA.ILocalizable<string>;
  description: OPA.ILocalizable<string>;
  defaultLocaleId: string;
  defaultTimeZoneGroupId: string;
  defaultTimeZoneId: string;
}
const IConfiguration_ReadOnlyPropertyNames = [ // eslint-disable-line camelcase
  OPA.getTypedPropertyKeyAsText<IConfiguration>("ownerId"),
  OPA.getTypedPropertyKeyAsText<IConfiguration>("pathToRootStorageFolder"),
];

/**
 * Checks whether the specified updates to the specified Configuration document are valid.
 * @param {IConfiguration} document The Configuration document being updated.
 * @param {IConfigurationPartial} updateObject The updates specified.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: IConfiguration, updateObject: IConfigurationPartial, throwErrorOnInvalidUpdate = false): boolean {
  OPA.assertDocumentIsValid(document);
  OPA.assertNonNullish(updateObject, "The processed Update Object must not be null.");

  const updateObject_AsUnknown = (updateObject as unknown);

  if (!OPA.areUpdatesValid_ForDocument(document, updateObject_AsUnknown as OPA.IDocument, IConfiguration_ReadOnlyPropertyNames, throwErrorOnInvalidUpdate)) {
    return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  if (!OPA.areUpdatesValid_ForCreatable_ByUser(document, updateObject_AsUnknown as OPA.ICreatable_ByUser, throwErrorOnInvalidUpdate)) {
    return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  const preventUpdates_ForUpdateable_ByUser = false;
  if (!OPA.areUpdatesValid_ForUpdateable_ByUser(document, updateObject_AsUnknown as OPA.IUpdateable_ByUser, preventUpdates_ForUpdateable_ByUser, throwErrorOnInvalidUpdate)) {
    return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }

  return true;
}

/**
 * Creates an instance of the IConfiguration document type.
 * @param {string} name The name of the Archive.
 * @param {string} description A description of the Archive.
 * @param {string} pathToRootStorageFolder The path to the root folder for storing files in Firebase Storage.
 * @param {IUser} owner The User who owns the Archive.
 * @param {ILocale} defaultLocale The default Locale to use for the Archive.
 * @param {ITimeZoneGroup} defaultTimeZoneGroup The default TimeZoneGroup to use for the Archive.
 * @return {IConfiguration} The new document instance.
 */
export function createSingleton(name: string, description: string, pathToRootStorageFolder: string, owner: IUser, defaultLocale: ILocale, defaultTimeZoneGroup: ITimeZoneGroup): IConfiguration {
  OPA.assertDocumentIsValid(owner);
  OPA.assertDocumentIsValid(defaultLocale);
  OPA.assertDocumentIsValid(defaultTimeZoneGroup);

  const now = OPA.nowToUse();
  const names: OPA.ILocalizable<string> = {en: name};
  names[defaultLocale.optionName] = name;
  const descriptions: OPA.ILocalizable<string> = {en: name};
  descriptions[defaultLocale.optionName] = description;

  const document: IConfiguration = {
    id: SingletonId,
    ownerId: owner.id,
    pathToRootStorageFolder: pathToRootStorageFolder,
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

/** Class providing queries for Configuration collection. */
export class ConfigurationQuerySet extends OPA.QuerySet<IConfiguration> {
  /**
   * Creates a ConfigurationQuerySet.
   * @param {OPA.ITypedCollectionDescriptor<IConfiguration>} collectionDescriptor The collection descriptor to use for queries.
   */
  constructor(collectionDescriptor: OPA.ITypedCollectionDescriptor<IConfiguration>) {
    super(collectionDescriptor);
  }

  /**
   * The typed collection descriptor to use for queries.
   * @type {OPA.ITypedQueryableFactoryCollectionDescriptor<IConfiguration, ConfigurationQuerySet, FactoryFunc>}
   */
  get typedCollectionDescriptor(): OPA.ITypedQueryableFactoryCollectionDescriptor<IConfiguration, ConfigurationQuerySet, FactoryFunc> {
    return OPA.convertTo<OPA.ITypedQueryableFactoryCollectionDescriptor<IConfiguration, ConfigurationQuerySet, FactoryFunc>>(this.collectionDescriptor);
  }

  /**
   * Creates an instance of the IConfiguration document type stored on the server.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} name The name of the Archive.
   * @param {string} description A description of the Archive.
   * @param {string} pathToRootStorageFolder The path to the root folder for storing files in Firebase Storage.
   * @param {IUser} owner The User who owns the Archive.
   * @param {ILocale} defaultLocale The default Locale to use for the Archive.
   * @param {ITimeZoneGroup} defaultTimeZoneGroup The default TimeZoneGroup to use for the Archive.
   * @return {Promise<string>} The new document ID.
   */
  async create(ds: OPA.IDataStorageState, name: string, description: string, pathToRootStorageFolder: string, owner: IUser, defaultLocale: ILocale, defaultTimeZoneGroup: ITimeZoneGroup): Promise<string> { // eslint-disable-line max-len
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);
    OPA.assertDocumentIsValid(owner);
    OPA.assertDocumentIsValid(defaultLocale);
    OPA.assertDocumentIsValid(defaultTimeZoneGroup);

    const document = createSingleton(name, description, pathToRootStorageFolder, owner, defaultLocale, defaultTimeZoneGroup);
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
   * Updates the Configuration stored on the server using an IConfigurationPartial object.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {IConfigurationPartial} updateObject The object containing the updates.
   * @param {string} userIdOfLatestUpdater The ID for the Updater within the OPA system.
   * @return {Promise<void>}
   */
  async update(ds: OPA.IDataStorageState, updateObject: IConfigurationPartial, userIdOfLatestUpdater: string): Promise<void> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);
    OPA.assertNonNullish(updateObject, "The incoming Update Object must not be null.");

    // NOTE: Get the document earlier to check validity before and after setting "updateHistory" to also make sure it was not set on the "updateObject" passed in
    const documentId = SingletonId;
    const document = await this.getByIdWithAssert(ds, documentId);

    const now = OPA.nowToUse();
    const updateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater} as OPA.IUpdateable_ByUser);
    updateObject = {...updateObject, ...updateObject_Updateable};
    let areValid = areUpdatesValid(document, updateObject, BT.DataConfiguration.ThrowErrorOnInvalidUpdate);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const updateObject_ForHistory = OPA.replaceFieldValuesWithSummaries({...updateObject});
    const updateHistory = ds.constructorProvider.arrayUnion(updateObject_ForHistory);
    const updateObject_WithHistory = ({...updateObject, updateHistory} as IConfigurationPartial_WithHistory);
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
export const CollectionDescriptor = new OPA.CollectionDescriptor<IConfiguration, ConfigurationQuerySet, FactoryFunc>(SingularName, PluralName, IsSingleton, (cd) => new ConfigurationQuerySet(cd), null, []); // eslint-disable-line max-len

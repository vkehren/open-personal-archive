import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../../base/src";
import {ILocale} from "./Locale";
import {ITimeZoneGroup} from "./TimeZoneGroup";
import {IUser} from "./User";

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

export interface IArchive extends OPA.IDocument_Creatable_ByUser, OPA.IDocument_Updateable_ByUser {
  readonly id: string;
  readonly ownerId: string;
  readonly pathToStorageFolder: string;
  name: OPA.ILocalizable<string>;
  description: OPA.ILocalizable<string>;
  defaultLocaleId: string;
  defaultTimeZoneGroupId: string;
  defaultTimeZoneId: string;
  readonly updateHistory: Array<UpdateHistoryItem>;
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
  document.updateHistory.push(OPA.copyObject(document));
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
   * Updates the Archive stored on the server using an IArchivePartial object.
   * @param {Firestore} db The Firestore Database.
   * @param {string} archiveId The ID for the Archive within the OPA system.
   * @param {IArchivePartial} archiveUpdateObject The object containing the updates.
   * @param {string} userIdOfLatestUpdater The ID for the Updater within the OPA system.
   * @param {OPA.IFirebaseConstructorProvider} constructorProvider The provider for Firebase FieldValue constructors.
   * @return {Promise<void>}
   */
  async updateArchive(db: firestore.Firestore, archiveId: string, archiveUpdateObject: IArchivePartial, userIdOfLatestUpdater: string, constructorProvider: OPA.IFirebaseConstructorProvider): Promise<void> {
    const now = OPA.nowToUse();
    const archiveUpdateObject_Updateable = ({hasBeenUpdated: true, dateOfLatestUpdate: now, userIdOfLatestUpdater: userIdOfLatestUpdater} as OPA.IUpdateable_ByUser);
    archiveUpdateObject = {...archiveUpdateObject_Updateable, ...archiveUpdateObject};
    const updateHistory = constructorProvider.arrayUnion(archiveUpdateObject);
    const archiveUpdateObject_WithHistory = ({...archiveUpdateObject, updateHistory} as IArchivePartial_WithHistory);

    const archive = await this.getById(db, archiveId);
    OPA.assertNonNullish(archive);
    // NOTE: If needed, implement "areUpdatesValid" function
    // const areValid = areUpdatesValid(OPA.convertNonNullish(archive), archiveUpdateObject_WithHistory);
    // OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const archivesCollectionRef = this.collectionDescriptor.getTypedCollection(db);
    const archiveRef = archivesCollectionRef.doc(archiveId);
    await archiveRef.set(archiveUpdateObject_WithHistory, {merge: true});
  }
}

type createInstance = (id: string) => (IArchive);
export type FactoryFunc = (...[params]: Parameters<createInstance>) => ReturnType<createInstance>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IArchive, ArchiveQuerySet, FactoryFunc>(SingularName, PluralName, IsSingleton, (cd) => new ArchiveQuerySet(cd), null, []);

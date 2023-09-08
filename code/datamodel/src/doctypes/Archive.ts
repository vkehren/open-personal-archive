import * as OPA from "../../../base/src";
import {ILocale} from "./Locale";
import {ITimeZoneGroup} from "./TimeZoneGroup";
import {IUser} from "./User";

const SingularName = "Archive";
const PluralName = "Archives";
const IsSingleton = true;
export const SingletonId = "OPA_Archive";

// NOTE: Remove " extends OPA.IUpdateable_ByUser" after implementing update function in ArchiveQuerySet
export interface IArchivePartial extends OPA.IUpdateable_ByUser {
  name?: OPA.ILocalizable<string>;
  description?: OPA.ILocalizable<string>;
  defaultLocaleId?: string;
  defaultTimeZoneGroupId?: string;
  defaultTimeZoneId?: string;
}

type UpdateHistoryItem = IArchivePartial | OPA.IUpdateable_ByUser;

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
   * @type {OPA.ITypedQueryableFactoryCollectionDescriptor<IArchive, ArchiveQuerySet, null>}
   */
  get typedCollectionDescriptor(): OPA.ITypedQueryableFactoryCollectionDescriptor<IArchive, ArchiveQuerySet, null> {
    return OPA.convertTo<OPA.ITypedQueryableFactoryCollectionDescriptor<IArchive, ArchiveQuerySet, null>>(this.collectionDescriptor);
  }
}

export const CollectionDescriptor = new OPA.CollectionDescriptor<IArchive, ArchiveQuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new ArchiveQuerySet(cd), null, []);

import * as OPA from "../../../base/src";
import {ILocale} from "./Locale";
import {ITimeZoneGroup} from "./TimeZoneGroup";
import {IUser} from "./User";

const SingularName = "Archive";
const PluralName = "Archives";
const IsSingleton = true;
export const SingletonId = "OPA_Archive";

export interface IArchivePartial extends OPA.IUpdateable_ByUser {
  name?: OPA.ILocalizable<string>;
  description?: OPA.ILocalizable<string>;
  defaultLocaleId?: string;
  defaultTimeZoneGroupId?: string;
  defaultTimeZoneId?: string;
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
    dateOfCreation: now,
    userIdOfCreator: owner.id,
    hasBeenUpdated: false,
    dateOfLatestUpdate: null,
    userIdOfLatestUpdater: null,
  };
  return document;
}

export type QuerySet = OPA.QuerySet<IArchive>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IArchive, QuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new OPA.QuerySet(cd), null, []);

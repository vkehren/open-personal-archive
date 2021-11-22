import * as OPA from "../../base/src";
import * as UTL from "./Utilities";
import {ILocale, ITimeZoneGroup, IUser} from ".";

const SingularName = "Archive";
const PluralName = "Archives";
const IsSingleton = true;
export const SingletonId = "OPA_Archive";

export const CollectionDescriptor = new OPA.CollectionDescriptor<IArchive, void>(SingularName, PluralName, IsSingleton, null, []);

export interface IArchive extends OPA.IDocument {
  readonly id: string;
  name: OPA.ILocalizable<string>;
  description: OPA.ILocalizable<string>;
  readonly pathToStorageFolder: string;
  readonly ownerId: string;
  defaultLocaleId: string;
  defaultTimeZoneGroupId: string;
  defaultTimeZoneId: string;
  readonly userIdForCreation: string;
  readonly dateOfCreation: UTL.DateShim;
  userIdForLatestUpdate: string;
  dateOfLatestUpdate: UTL.DateShim;
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
export function createInstance(name: string, description: string, pathToStorageFolder: string, owner: IUser, defaultLocale: ILocale, defaultTimeZoneGroup: ITimeZoneGroup): IArchive {
  const now = UTL.now();
  const names: OPA.ILocalizable<string> = {en: name};
  names[defaultLocale.optionName] = name;
  const descriptions: OPA.ILocalizable<string> = {en: name};
  descriptions[defaultLocale.optionName] = description;

  const document: IArchive = {
    id: SingletonId,
    name: names,
    description: descriptions,
    pathToStorageFolder: pathToStorageFolder,
    ownerId: owner.id,
    defaultLocaleId: defaultLocale.id,
    defaultTimeZoneGroupId: defaultTimeZoneGroup.id,
    defaultTimeZoneId: defaultTimeZoneGroup.primaryTimeZoneId,
    userIdForCreation: owner.id,
    dateOfCreation: now,
    userIdForLatestUpdate: owner.id,
    dateOfLatestUpdate: now,
  };
  return document;
}

import * as OPA from "../../base/src";

const SingularName = "Archive";
const PluralName = "Archives";
const IsSingleton = true;
const IsNestedCollection = false;

export const CollectionDescriptor = new OPA.CollectionDescriptor<IArchive>(SingularName, PluralName, IsSingleton, IsNestedCollection);

export interface IArchive {
  readonly id: string;
  name: OPA.ILocalizable<string>;
  description: OPA.ILocalizable<string>;
  readonly ownerId: string;
  defaultLocaleId: string;
  defaultTimeZoneGroupId: string;
  defaultTimeZoneId: string;
  readonly userIdForCreation: string;
  readonly dateOfCreation: OPA.ITimestamp;
  userIdForLatestUpdate: string;
  dateOfLatestUpdate: OPA.ITimestamp;
}

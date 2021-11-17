import * as OPA from "../../base/src";
import * as CollectionData from "./TimeZoneGroups.json";

const SingularName = "TimeZoneGroup";
const PluralName = "TimeZoneGroups";
const IsSingleton = false;
const IsNestedCollection = false;
const RequiredDocuments: Array<ITimeZoneGroup> = CollectionData.requiredDocuments;

export const CollectionDescriptor = new OPA.CollectionDescriptor<ITimeZoneGroup>(SingularName, PluralName, IsSingleton, IsNestedCollection, RequiredDocuments);

export interface ITimeZoneGroup {
  readonly id: string;
  readonly name: string;
  readonly abbreviation: string;
  readonly utcOffset: string;
  readonly primaryTimeZoneId: string;
  readonly primaryTimeZoneName: string;
  readonly displayOrder: number;
  readonly isDefault: boolean;
}

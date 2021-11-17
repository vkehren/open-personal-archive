import * as OPA from "../../base/src";
import * as CollectionData from "./TimeZones.json";

const SingularName = "TimeZone";
const PluralName = "TimeZones";
const IsSingleton = false;
const IsNestedCollection = false;
const RequiredDocuments: Array<ITimeZone> = CollectionData.requiredDocuments;

export const CollectionDescriptor = new OPA.CollectionDescriptor<ITimeZone>(SingularName, PluralName, IsSingleton, IsNestedCollection, RequiredDocuments);

export interface ITimeZone {
  readonly id: string;
  readonly name: string;
  readonly countryCode: string;
  readonly geoCoordinates: string;
  readonly comments: string;
  readonly displayOrder: number;
}

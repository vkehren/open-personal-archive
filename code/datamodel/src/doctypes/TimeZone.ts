import * as OPA from "../../../base/src";
import * as CollectionData from "./TimeZones.json";

const SingularName = "TimeZone";
const PluralName = "TimeZones";
const IsSingleton = false;
const RequiredDocuments: Array<ITimeZone> = OPA.promoteDocumentsToCreatable(CollectionData.requiredDocuments, null);

export interface ITimeZone extends OPA.IDocument_Creatable {
  readonly id: string;
  readonly name: string;
  readonly countryCode: string;
  readonly geoCoordinates: string;
  readonly comments: string;
  readonly displayOrder: number;
}

export type QuerySet = OPA.QuerySet<ITimeZone>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<ITimeZone, QuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new OPA.QuerySet(cd), null, RequiredDocuments); // eslint-disable-line max-len

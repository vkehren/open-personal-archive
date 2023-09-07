import * as OPA from "../../../base/src";
import * as CollectionData from "./TimeZoneGroups.json";

const SingularName = "TimeZoneGroup";
const PluralName = "TimeZoneGroups";
const IsSingleton = false;
const RequiredDocuments: Array<ITimeZoneGroup> = OPA.promoteDocumentsToCreatable(CollectionData.requiredDocuments, null);
const DefaultDocument = (RequiredDocuments.find((v) => v.isDefault) as ITimeZoneGroup | undefined);
export const DefaultTimeZoneGroupId = (!OPA.isNullish(DefaultDocument)) ? OPA.convertNonNullish(DefaultDocument).id : "OPA_TimeZoneGroup_PST_-08:00";

export interface ITimeZoneGroup extends OPA.IDocument_Creatable {
  readonly id: string;
  readonly name: string;
  readonly abbreviation: string;
  readonly utcOffset: string;
  readonly primaryTimeZoneId: string;
  readonly primaryTimeZoneName: string;
  readonly displayOrder: number;
  readonly isDefault: boolean;
}

export type QuerySet = OPA.QuerySet<ITimeZoneGroup>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<ITimeZoneGroup, QuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new OPA.QuerySet(cd), null, RequiredDocuments); // eslint-disable-line max-len

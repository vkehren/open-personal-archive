import * as OPA from "../../../base/src";
import * as BT from "../BaseTypes";
import * as CollectionData_Full from "./TimeZoneGroups.json";
import * as CollectionData_Min from "./TimeZoneGroups.min.json";

/**
 * Dynamically gets the required documents.
 * @param {OPA.DateToUse | null} [dateOfCreation=null] The date to use as the value for the "dateOfCreation" property.
 * @return {Array<ILocale>}
 */
function getRequiredDocuments(dateOfCreation: OPA.DateToUse | null = null): Array<ITimeZoneGroup> {
  const collectionData = (BT.DataConfiguration.TimeZoneGroup_UseMin) ? CollectionData_Min : CollectionData_Full;
  const requiredDocuments: Array<ITimeZoneGroup> = OPA.promoteDocumentsToCreatable(collectionData.requiredDocuments, dateOfCreation);
  return requiredDocuments;
}

const SingularName = "TimeZoneGroup";
const PluralName = "TimeZoneGroups";
const IsSingleton = false;
const RequiredDocuments = getRequiredDocuments();
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

type ITimeZoneGroupPartial = any;
/**
 * Checks whether the specified updates to the specified TimeZoneGroup document are valid.
 * @param {ITimeZoneGroup} document The TimeZoneGroup document being updated.
 * @param {ITimeZoneGroupPartial} updateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: ITimeZoneGroup, updateObject: ITimeZoneGroupPartial): boolean {
  OPA.assertNonNullish(document);
  OPA.assertNonNullish(updateObject);

  // NOTE: Currently, TimeZoneGroups are not updateable
  return false;
}

export type QuerySet = OPA.QuerySet<ITimeZoneGroup>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<ITimeZoneGroup, QuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new OPA.QuerySet(cd), null, getRequiredDocuments); // eslint-disable-line max-len

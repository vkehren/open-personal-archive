import * as OPA from "../../../base/src";
import * as BT from "../BaseTypes";
import * as CollectionData_Full from "./TimeZoneGroups.json"; // eslint-disable-line camelcase
import * as CollectionData_Min from "./TimeZoneGroups.min.json"; // eslint-disable-line camelcase

/**
 * Dynamically gets the required documents.
 * @param {OPA.DateToUse | null} [dateOfCreation=null] The date to use as the value for the "dateOfCreation" property.
 * @return {Array<ILocale>}
 */
function getRequiredDocuments(dateOfCreation: OPA.DateToUse | null = null): Array<ITimeZoneGroup> {
  const collectionData = (BT.DataConfiguration.TimeZoneGroup_UseMin) ? CollectionData_Min : CollectionData_Full; // eslint-disable-line camelcase
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
  readonly name: string;
  readonly abbreviation: string;
  readonly utcOffset: string;
  readonly primaryTimeZoneId: string;
  readonly primaryTimeZoneName: string;
  readonly displayOrder: number;
  readonly isDefault: boolean;
}
const ITimeZoneGroup_ReadOnlyPropertyNames = [
  OPA.getTypedPropertyKeyAsText<ITimeZoneGroup>("name"),
  OPA.getTypedPropertyKeyAsText<ITimeZoneGroup>("abbreviation"),
  OPA.getTypedPropertyKeyAsText<ITimeZoneGroup>("utcOffset"),
  OPA.getTypedPropertyKeyAsText<ITimeZoneGroup>("primaryTimeZoneId"),
  OPA.getTypedPropertyKeyAsText<ITimeZoneGroup>("primaryTimeZoneName"),
  OPA.getTypedPropertyKeyAsText<ITimeZoneGroup>("displayOrder"),
  OPA.getTypedPropertyKeyAsText<ITimeZoneGroup>("isDefault"),
];

type ITimeZoneGroupPartial = unknown;
/**
 * Checks whether the specified updates to the specified TimeZoneGroup document are valid.
 * @param {ITimeZoneGroup} document The TimeZoneGroup document being updated.
 * @param {ITimeZoneGroupPartial} updateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: ITimeZoneGroup, updateObject: ITimeZoneGroupPartial): boolean {
  OPA.assertNonNullish(document);
  OPA.assertNonNullish(updateObject);

  if (!OPA.areUpdatesValid_ForDocument(document, updateObject as OPA.IDocument, ITimeZoneGroup_ReadOnlyPropertyNames)) {
    return false;
  }
  if (!OPA.areUpdatesValid_ForCreatable(document, updateObject as OPA.ICreatable)) {
    return false;
  }

  // NOTE: Currently, TimeZoneGroups are not updateable
  return false;
}

export type QuerySet = OPA.QuerySet<ITimeZoneGroup>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<ITimeZoneGroup, QuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new OPA.QuerySet(cd), null, getRequiredDocuments); // eslint-disable-line max-len

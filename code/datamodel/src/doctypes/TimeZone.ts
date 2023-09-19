import * as OPA from "../../../base/src";
import * as BT from "../BaseTypes";
import * as CollectionData_Full from "./TimeZones.json"; // eslint-disable-line camelcase
import * as CollectionData_Min from "./TimeZones.min.json"; // eslint-disable-line camelcase

/**
 * Dynamically gets the required documents.
 * @param {OPA.DateToUse | null} [dateOfCreation=null] The date to use as the value for the "dateOfCreation" property.
 * @return {Array<ILocale>}
 */
function getRequiredDocuments(dateOfCreation: OPA.DateToUse | null = null): Array<ITimeZone> {
  const collectionData = (BT.DataConfiguration.TimeZone_UseMin) ? CollectionData_Min : CollectionData_Full; // eslint-disable-line camelcase
  const requiredDocuments: Array<ITimeZone> = OPA.promoteDocumentsToCreatable(collectionData.requiredDocuments, dateOfCreation);
  return requiredDocuments;
}

const SingularName = "TimeZone";
const PluralName = "TimeZones";
const IsSingleton = false;
// const RequiredDocuments = getRequiredDocuments();

export interface ITimeZone extends OPA.IDocument_Creatable {
  readonly name: string;
  readonly countryCode: string;
  readonly geoCoordinates: string;
  readonly comments: string;
  readonly displayOrder: number;
}

type ITimeZonePartial = unknown;
/**
 * Checks whether the specified updates to the specified TimeZone document are valid.
 * @param {ITimeZone} document The TimeZone document being updated.
 * @param {ITimeZonePartial} updateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: ITimeZone, updateObject: ITimeZonePartial): boolean {
  OPA.assertNonNullish(document);
  OPA.assertNonNullish(updateObject);

  if (!OPA.areUpdatesValid_ForDocument(document, updateObject as OPA.IDocument)) {
    return false;
  }

  // NOTE: Currently, TimeZones are not updateable
  return false;
}

export type QuerySet = OPA.QuerySet<ITimeZone>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<ITimeZone, QuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new OPA.QuerySet(cd), null, getRequiredDocuments); // eslint-disable-line max-len

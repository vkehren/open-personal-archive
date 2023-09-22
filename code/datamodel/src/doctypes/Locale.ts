import * as OPA from "../../../base/src";
import * as BT from "../BaseTypes";
import * as CollectionData_Full from "./Locales.json"; // eslint-disable-line camelcase
import * as CollectionData_Min from "./Locales.min.json"; // eslint-disable-line camelcase

/* eslint-disable camelcase */

/**
 * Dynamically gets the required documents.
 * @param {OPA.DateToUse | null} [dateOfCreation=null] The date to use as the value for the "dateOfCreation" property.
 * @return {Array<ILocale>}
 */
function getRequiredDocuments(dateOfCreation: OPA.DateToUse | null = null): Array<ILocale> {
  const collectionData = (BT.DataConfiguration.Locale_UseMin) ? CollectionData_Min : CollectionData_Full; // eslint-disable-line camelcase
  const requiredDocuments: Array<ILocale> = OPA.promoteDocumentsToCreatable(collectionData.requiredDocuments, dateOfCreation);
  return requiredDocuments;
}

const SingularName = "Locale";
const PluralName = "Locales";
const IsSingleton = false;
const RequiredDocuments = getRequiredDocuments();
const DefaultDocument = (RequiredDocuments.find((v) => v.isDefault) as ILocale | undefined);
export const DefaultLocaleId = (!OPA.isNullish(DefaultDocument)) ? OPA.convertNonNullish(DefaultDocument).id : "OPA_Locale_en_US";
export const DefaultLocale = (!OPA.isNullish(DefaultDocument)) ? OPA.convertNonNullish(DefaultDocument).optionName : "en-US";

export interface ILocale extends OPA.IDocument_Creatable {
  readonly optionName: string;
  readonly optionBaseName: string;
  readonly displayName: string;
  readonly displayOrder: number;
  readonly isDefault: boolean;
}
const ILocale_ReadOnlyPropertyNames = [ // eslint-disable-line camelcase
  OPA.getTypedPropertyKeyAsText<ILocale>("optionName"),
  OPA.getTypedPropertyKeyAsText<ILocale>("optionBaseName"),
  OPA.getTypedPropertyKeyAsText<ILocale>("displayName"),
  OPA.getTypedPropertyKeyAsText<ILocale>("displayOrder"),
  OPA.getTypedPropertyKeyAsText<ILocale>("isDefault"),
];

type ILocalePartial = unknown;
/**
 * Checks whether the specified updates to the specified Locale document are valid.
 * @param {ILocale} document The Locale document being updated.
 * @param {ILocalePartial} updateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: ILocale, updateObject: ILocalePartial): boolean {
  OPA.assertDocumentIsValid(document);
  OPA.assertNonNullish(updateObject, "The processed Update Object must not be null.");

  const updateObject_AsUnknown = (updateObject as unknown);

  if (!OPA.areUpdatesValid_ForDocument(document, updateObject_AsUnknown as OPA.IDocument, ILocale_ReadOnlyPropertyNames)) {
    return false;
  }
  if (!OPA.areUpdatesValid_ForCreatable(document, updateObject_AsUnknown as OPA.ICreatable)) {
    return false;
  }

  // NOTE: Currently, Locales are not updateable
  return false;
}

export type QuerySet = OPA.QuerySet<ILocale>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<ILocale, QuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new OPA.QuerySet(cd), null, getRequiredDocuments);

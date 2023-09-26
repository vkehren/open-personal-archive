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

/** Class providing queries for Locale collection. */
export class LocaleQuerySet extends OPA.QuerySet<ILocale> {
  /**
   * Creates a LocaleQuerySet.
   * @param {OPA.ITypedCollectionDescriptor<ILocale>} collectionDescriptor The collection descriptor to use for queries.
   */
  constructor(collectionDescriptor: OPA.ITypedCollectionDescriptor<ILocale>) {
    super(collectionDescriptor);
  }

  /**
   * The typed collection descriptor to use for queries.
   * @type {OPA.ITypedQueryableCollectionDescriptor<ILocale, LocaleQuerySet>}
   */
  get typedCollectionDescriptor(): OPA.ITypedQueryableCollectionDescriptor<ILocale, LocaleQuerySet> {
    return OPA.convertTo<OPA.ITypedQueryableCollectionDescriptor<ILocale, LocaleQuerySet>>(this.collectionDescriptor);
  }

  /**
   * Gets the Locale by that Locale's Option Name, falling back to Option Base Name if none was found.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} optionName The Option name for the Locale.
   * @return {Promise<ILocale | null>}
   */
  async getByOptionName(ds: OPA.IDataStorageState, optionName: string): Promise<ILocale | null> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);
    OPA.assertNonNullishOrWhitespace(optionName, "A valid Locale option name must be provided.");

    // "optionBaseName": "bn",

    const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const optionNameFieldName = OPA.getTypedPropertyKeyAsText<ILocale>("optionName");
    const optionNameQuery = collectionRef.where(optionNameFieldName, "==", optionName);
    const optionNameQuerySnap = await optionNameQuery.get();

    if (optionNameQuerySnap.docs.length > 1) {
      throw new Error("The option name corresponds to more than one OPA-recognized Locale.");
    } else if (optionNameQuerySnap.docs.length == 1) {
      const locale = optionNameQuerySnap.docs[0].data();
      const proxiedLocale = this.documentProxyConstructor(locale);
      return proxiedLocale;
    } else {
      const optionBaseNameFieldName = OPA.getTypedPropertyKeyAsText<ILocale>("optionBaseName");
      const optionBaseNameQuery = collectionRef.where(optionBaseNameFieldName, "==", optionName);
      const optionBaseNameQuerySnap = await optionBaseNameQuery.get();

      if (optionBaseNameQuerySnap.docs.length < 1) {
        return null;
      }

      const locale = optionBaseNameQuerySnap.docs[0].data();
      const proxiedLocale = this.documentProxyConstructor(locale);
      return proxiedLocale;
    }
  }

  /**
   * Gets the Locale by that Locale's Option Name, falling back to Option Base Name if none was found, and asserts that the Locale is valid (i.e. is non-null and has non-null "id" property).
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {string} optionName The Option name for the Locale.
   * @param {string} [assertionFailureMessage=default] The message to include in the Error if the assertion fails.
   * @return {Promise<ILocale>}
   */
  async getByOptionNameWithAssert(ds: OPA.IDataStorageState, optionName: string, assertionFailureMessage = "The specified ID does not correspond to a valid Locale."): Promise<ILocale> { // eslint-disable-line max-len
    const locale = await this.getByOptionName(ds, optionName);
    OPA.assertDocumentIsValid(locale, assertionFailureMessage, assertionFailureMessage);
    const localeNonNull = OPA.convertNonNullish(locale);
    return localeNonNull;
  }
}

export const CollectionDescriptor = new OPA.CollectionDescriptor<ILocale, LocaleQuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new LocaleQuerySet(cd), null, getRequiredDocuments);

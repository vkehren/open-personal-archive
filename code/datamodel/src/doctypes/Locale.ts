import * as OPA from "../../../base/src";
import * as CollectionData from "./Locales.json";

const SingularName = "Locale";
const PluralName = "Locales";
const IsSingleton = false;
const RequiredDocuments: Array<ILocale> = OPA.promoteDocumentsToCreatable(CollectionData.requiredDocuments, null);
const DefaultDocument = (RequiredDocuments.find((v) => v.isDefault) as ILocale | undefined);
export const DefaultLocaleId = (!OPA.isNullish(DefaultDocument)) ? OPA.convertNonNullish(DefaultDocument).id : "OPA_Locale_en_US";
export const DefaultLocale = (!OPA.isNullish(DefaultDocument)) ? OPA.convertNonNullish(DefaultDocument).optionName : "en-US";

export interface ILocale extends OPA.IDocument_Creatable {
  readonly id: string;
  readonly optionName: string;
  readonly optionBaseName: string;
  readonly displayName: string;
  readonly displayOrder: number;
  readonly isDefault: boolean;
}

export type QuerySet = OPA.QuerySet<ILocale>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<ILocale, QuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new OPA.QuerySet(cd), null, RequiredDocuments);

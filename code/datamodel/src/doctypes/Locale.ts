import * as OPA from "../../../base/src";
import * as CollectionData from "./Locales.json";

const SingularName = "Locale";
const PluralName = "Locales";
const IsSingleton = false;
const RequiredDocuments: Array<ILocale> = CollectionData.requiredDocuments;

export interface ILocale extends OPA.IDocument {
  readonly id: string;
  readonly optionName: string;
  readonly optionBaseName: string;
  readonly displayName: string;
  readonly displayOrder: number;
  readonly isDefault: boolean;
}

export type QuerySet = OPA.QuerySet<ILocale>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<ILocale, QuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new OPA.QuerySet(cd), null, RequiredDocuments);

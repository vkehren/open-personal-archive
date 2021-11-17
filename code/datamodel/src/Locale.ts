import * as OPA from "../../base/src";
import * as CollectionData from "./Locales.json";

const SingularName = "Locale";
const PluralName = "Locales";
const IsSingleton = false;
const IsNestedCollection = false;
const RequiredDocuments: Array<ILocale> = CollectionData.requiredDocuments;

export const CollectionDescriptor = new OPA.CollectionDescriptor<ILocale>(SingularName, PluralName, IsSingleton, IsNestedCollection, RequiredDocuments);

export interface ILocale {
  readonly id: string;
  readonly optionName: string;
  readonly optionBaseName: string;
  readonly displayName: string;
  readonly displayOrder: number;
  readonly isDefault: boolean;
}

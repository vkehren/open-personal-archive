import * as OPA from "../../base/src";
import * as CollectionData from "./AuthenticationProviders.json";

const SingularName = "AuthenticationProvider";
const PluralName = "AuthenticationProviders";
const IsSingleton = false;
const IsNestedCollection = false;
const RequiredDocuments: Array<IAuthenticationProvider> = CollectionData.requiredDocuments;

export const CollectionDescriptor = new OPA.CollectionDescriptor<IAuthenticationProvider>(SingularName, PluralName, IsSingleton, IsNestedCollection, RequiredDocuments);

export interface IAuthenticationProvider {
  readonly id: string;
  readonly name: string;
  readonly displayOrder: number;
  readonly isDefault: boolean;
}

import * as OPA from "../../base/src";
import * as CollectionData from "./AuthenticationProviders.json";

const SingularName = "AuthenticationProvider";
const PluralName = "AuthenticationProviders";
const IsSingleton = false;
export const AuthenticationProvider_GoogleId = "OPA_AuthenticationProvider_Google"; // eslint-disable-line camelcase
export const AuthenticationProvider_RequiredIds = [AuthenticationProvider_GoogleId]; // eslint-disable-line camelcase
const RequiredDocuments: Array<IAuthenticationProvider> = CollectionData.requiredDocuments;

export const CollectionDescriptor = new OPA.CollectionDescriptor<IAuthenticationProvider, void>(SingularName, PluralName, IsSingleton, null, RequiredDocuments);

export interface IAuthenticationProvider extends OPA.IDocument {
  readonly id: string;
  readonly name: string;
  readonly displayOrder: number;
  readonly isDefault: boolean;
}

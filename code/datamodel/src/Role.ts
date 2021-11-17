import * as OPA from "../../base/src";
import * as CollectionData from "./Roles.json";

const SingularName = "Role";
const PluralName = "Roles";
const IsSingleton = false;
const IsNestedCollection = false;
const RequiredDocuments: Array<IRole> = CollectionData.requiredDocuments;

export const CollectionDescriptor = new OPA.CollectionDescriptor<IRole>(SingularName, PluralName, IsSingleton, IsNestedCollection, RequiredDocuments);

export interface IRole {
  readonly id: string;
  readonly name: string;
  readonly displayOrder: number;
  readonly isDefault: boolean;
}

import * as OPA from "../../base/src";
import * as CollectionData from "./Roles.json";

const SingularName = "Role";
const PluralName = "Roles";
const IsSingleton = false;
export const Role_OwnerId = "OPA_Role_Owner"; // eslint-disable-line camelcase
export const Role_AdministratorId = "OPA_Role_Administrator"; // eslint-disable-line camelcase
export const Role_EditorId = "OPA_Role_Editor"; // eslint-disable-line camelcase
export const Role_ViewerId = "OPA_Role_Viewer"; // eslint-disable-line camelcase
export const Role_GuestId = "OPA_Role_Guest"; // eslint-disable-line camelcase
export const Role_RequiredIds = [Role_OwnerId, Role_AdministratorId, Role_EditorId, Role_ViewerId, Role_GuestId]; // eslint-disable-line camelcase
const RequiredDocuments: Array<IRole> = CollectionData.requiredDocuments;

export const CollectionDescriptor = new OPA.CollectionDescriptor<IRole, void>(SingularName, PluralName, IsSingleton, null, RequiredDocuments);

export interface IRole extends OPA.IDocument {
  readonly id: string;
  readonly name: string;
  readonly displayOrder: number;
  readonly isDefault: boolean;
}

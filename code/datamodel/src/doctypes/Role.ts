import * as OPA from "../../../base/src";
import * as BT from "../BaseTypes";
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
const RequiredDocuments: Array<IRole> = OPA.promoteDocumentsToCreatable(CollectionData.requiredDocuments.map((value) => ({...{type: (value.type as BT.RoleType)}, ...value})), null); // eslint-disable-line max-len
const DefaultDocument = (RequiredDocuments.find((v) => v.isDefault) as IRole | undefined);
export const DefaultRoleId = (!OPA.isNullish(DefaultDocument)) ? OPA.convertNonNullish(DefaultDocument).id : Role_GuestId;

export interface IRole extends OPA.IDocument_Creatable {
  readonly id: string;
  readonly name: string;
  readonly type: BT.RoleType;
  readonly displayOrder: number;
  readonly isDefault: boolean;
}

type IRolePartial = any;
/**
 * Checks whether the specified updates to the specified Role document are valid.
 * @param {IRole} document The Role document being updated.
 * @param {IRolePartial} updateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: IRole, updateObject: IRolePartial): boolean {
  OPA.assertNonNullish(document);
  OPA.assertNonNullish(updateObject);

  // NOTE: Currently, Roles are not updateable
  return false;
}

/** Class providing queries for Role collection. */
export class RoleQuerySet extends OPA.QuerySet<IRole> {
  /**
   * Creates a RoleQuerySet.
   * @param {OPA.ITypedCollectionDescriptor<IRole>} collectionDescriptor The collection descriptor to use for queries.
   */
  constructor(collectionDescriptor: OPA.ITypedCollectionDescriptor<IRole>) {
    super(collectionDescriptor);
  }

  /**
   * The typed collection descriptor to use for queries.
   * @type {OPA.ITypedQueryableCollectionDescriptor<IRole, RoleQuerySet>}
   */
  get typedCollectionDescriptor(): OPA.ITypedQueryableCollectionDescriptor<IRole, RoleQuerySet> {
    return OPA.convertTo<OPA.ITypedQueryableCollectionDescriptor<IRole, RoleQuerySet>>(this.collectionDescriptor);
  }

  /**
   * Gets the Roles to which the RoleTypes passed in pertain.
   * @param {OPA.IDataStorageState} ds The state container for data storage.
   * @param {Array<BT.RoleType>} roleTypes The desired RoleTypes for which to obtain Roles.
   * @return {Promise<Map<string, IRole>>} The relevant Roles accessible by RoleId.
   */
  async getForRoleTypes(ds: OPA.IDataStorageState, roleTypes: Array<BT.RoleType>): Promise<Map<string, IRole>> {
    OPA.assertDataStorageStateIsNotNullish(ds);
    OPA.assertFirestoreIsNotNullish(ds.db);

    const rolesCollectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const getRolesForTypesQuery = rolesCollectionRef.where("type", "in", roleTypes);
    const matchingRolesSnap = await getRolesForTypesQuery.get();

    const roles = matchingRolesSnap.docs.map((doc) => this.documentProxyConstructor(doc.data()));
    const rolesMap = OPA.createMapFromArray(roles, (role) => role.id);
    return rolesMap;
  }
}

export const CollectionDescriptor = new OPA.CollectionDescriptor<IRole, RoleQuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new RoleQuerySet(cd), null, RequiredDocuments);

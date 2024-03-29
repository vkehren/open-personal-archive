import * as OPA from "../../../base/src";
import * as BT from "../BaseTypes";
import * as CollectionData from "./Roles.json";

/* eslint-disable camelcase */

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
export const DefaultRoleId = (!OPA.isNullish(DefaultDocument)) ? OPA.convertNonNullish(DefaultDocument).id : Role_GuestId; // eslint-disable-line camelcase

export interface IRole extends OPA.IDocument_Creatable {
  readonly name: string;
  readonly type: BT.RoleType;
  readonly displayOrder: number;
  readonly isDefault: boolean;
}
const IRole_ReadOnlyPropertyNames = [ // eslint-disable-line camelcase
  OPA.getTypedPropertyKeyAsText<IRole>("name"),
  OPA.getTypedPropertyKeyAsText<IRole>("type"),
  OPA.getTypedPropertyKeyAsText<IRole>("displayOrder"),
  OPA.getTypedPropertyKeyAsText<IRole>("isDefault"),
];

type IRolePartial = unknown;
/**
 * Checks whether the specified updates to the specified Role document are valid.
 * @param {IRole} document The Role document being updated.
 * @param {IRolePartial} updateObject The updates specified.
 * @param {boolean} [throwErrorOnInvalidUpdate=false] Whether to throw an error if the update is not valid.
 * @return {boolean} Whether the updates are valid or not.
 */
export function areUpdatesValid(document: IRole, updateObject: IRolePartial, throwErrorOnInvalidUpdate = false): boolean {
  OPA.assertDocumentIsValid(document);
  OPA.assertNonNullish(updateObject, "The processed Update Object must not be null.");

  const updateObject_AsUnknown = (updateObject as unknown);

  if (!OPA.areUpdatesValid_ForDocument(document, updateObject_AsUnknown as OPA.IDocument, IRole_ReadOnlyPropertyNames, throwErrorOnInvalidUpdate)) {
    return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }
  if (!OPA.areUpdatesValid_ForCreatable(document, updateObject_AsUnknown as OPA.ICreatable, throwErrorOnInvalidUpdate)) {
    return OPA.getUnlessThrowError(false, throwErrorOnInvalidUpdate, "The specified update is not valid.");
  }

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
    OPA.assertNonNullish(roleTypes);
    roleTypes.forEach((roleType) => OPA.assertIsOfLiteral<BT.RoleType>(roleType, BT.RoleTypes._all, BT.RoleTypes._typeName));

    if (roleTypes.length <= 0) {
      return new Map<string, IRole>();
    }

    const rolesCollectionRef = this.collectionDescriptor.getTypedCollection(ds);
    const typeFieldName = OPA.getTypedPropertyKeyAsText<IRole>("type");
    const getRolesForTypesQuery = rolesCollectionRef.where(typeFieldName, "in", roleTypes);
    const matchingRolesSnap = await getRolesForTypesQuery.get();

    const roles = matchingRolesSnap.docs.map((doc) => this.documentProxyConstructor(doc.data()));
    const rolesMap = OPA.createMapFromArray(roles, (role) => role.id);
    return rolesMap;
  }
}

export const CollectionDescriptor = new OPA.CollectionDescriptor<IRole, RoleQuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new RoleQuerySet(cd), null, RequiredDocuments);

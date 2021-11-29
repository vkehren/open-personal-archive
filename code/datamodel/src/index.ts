import * as OPA from "../../base/src";
import * as AccessRequest from "./AccessRequest";
import * as Archive from "./Archive";
import * as AuthProvider from "./AuthenticationProvider";
import * as Locale from "./Locale";
import * as OpaSystem from "./OpaSystem";
import * as Role from "./Role";
import * as TimeZone from "./TimeZone";
import * as TimeZoneGroup from "./TimeZoneGroup";
import * as User from "./User";

export const name = "open-personal-archive-data-model";
export const schemaVersion = "0.0.0.1";

// NOTE: If the CollectionDescriptor represents a singleton, export the singleton factory function directly later below
// NOTE: If the CollectionDescriptor represents pre-loaded system data, do NOT export ANY instance factory function (but do export required ID values)
// NOTE: If the CollectionDescriptor represents data that will dynamically be created during usage of system, expose factory function via ITypedFactoryCollectionDescriptor<T, F> interface
//         -> And for special case instances (e.g. User who is Archive Owner), export the special case factory function directly later below
export interface IOpaDbDescriptor extends OPA.ICollection {
  readonly AccessRequests: OPA.ITypedQueryableFactoryCollectionDescriptor<AccessRequest.IAccessRequest, AccessRequest.AccessRequestQuerySet, AccessRequest.FactoryFunc>;
  readonly Archive: OPA.ITypedQueryableCollectionDescriptor<Archive.IArchive, Archive.QuerySet>;
  readonly AuthProviders: OPA.ITypedQueryableCollectionDescriptor<AuthProvider.IAuthenticationProvider, AuthProvider.AuthenticationProviderQuerySet>;
  readonly Locales: OPA.ITypedQueryableCollectionDescriptor<Locale.ILocale, Locale.QuerySet>;
  readonly OpaSystem: OPA.ITypedQueryableCollectionDescriptor<OpaSystem.IOpaSystem, OpaSystem.QuerySet>;
  readonly Roles: OPA.ITypedQueryableCollectionDescriptor<Role.IRole, Role.QuerySet>;
  readonly TimeZones: OPA.ITypedQueryableCollectionDescriptor<TimeZone.ITimeZone, TimeZone.QuerySet>;
  readonly TimeZoneGroups: OPA.ITypedQueryableCollectionDescriptor<TimeZoneGroup.ITimeZoneGroup, TimeZoneGroup.QuerySet>;
  readonly Users: OPA.ITypedQueryableFactoryCollectionDescriptor<User.IUser, User.UserQuerySet, User.FactoryFunc>;
  readonly RootCollections: Array<OPA.ICollectionDescriptor>;
  readonly NestedCollections: Array<OPA.ICollectionDescriptor>;
}

const DbDescriptor = (OPA.CollectionDescriptors as OPA.ICollection);
DbDescriptor.AccessRequests = AccessRequest.CollectionDescriptor;
DbDescriptor.Archive = Archive.CollectionDescriptor;
DbDescriptor.AuthProviders = AuthProvider.CollectionDescriptor;
DbDescriptor.Locales = Locale.CollectionDescriptor;
DbDescriptor.OpaSystem = OpaSystem.CollectionDescriptor;
DbDescriptor.Roles = Role.CollectionDescriptor;
DbDescriptor.TimeZones = TimeZone.CollectionDescriptor;
DbDescriptor.TimeZoneGroups = TimeZoneGroup.CollectionDescriptor;
DbDescriptor.Users = User.CollectionDescriptor;
DbDescriptor.RootCollections = OPA.getCollectionFromObject<OPA.ICollectionDescriptor>(DbDescriptor, (colDesc) => (!OPA.isNullish(colDesc.collectionName)), (colDesc) => (!colDesc.isNestedCollection));
DbDescriptor.NestedCollections = OPA.getCollectionFromObject<OPA.ICollectionDescriptor>(DbDescriptor, (colDesc) => (!OPA.isNullish(colDesc.collectionName)), (colDesc) => (colDesc.isNestedCollection));
export const OpaDbDescriptor = OPA.convertTo<IOpaDbDescriptor>(DbDescriptor);

export {IAccessRequest, IAccessRequestPartial} from "./AccessRequest";
export {IArchive, IArchivePartial, createSingleton as createArchive, SingletonId as ArchiveId} from "./Archive";
export {IAuthenticationProvider, AuthenticationProvider_GoogleId, AuthenticationProvider_RequiredIds} from "./AuthenticationProvider"; // eslint-disable-line camelcase
export {AuthorizationState, IArchiveState, IAuthenticationState, IAuthorizationState, ICallState, IDataStorageState} from "./CallState";
export {ILocale} from "./Locale";
export {IOpaSystem, createSingleton as createSystem, SingletonId as OpaSystemId} from "./OpaSystem";
export {IRole, Role_OwnerId, Role_AdministratorId, Role_EditorId, Role_ViewerId, Role_GuestId, Role_RequiredIds} from "./Role"; // eslint-disable-line camelcase
export {ITimeZone} from "./TimeZone";
export {ITimeZoneGroup} from "./TimeZoneGroup";
export {IUser, IUserPartial, createArchiveOwner, User_OwnerId} from "./User"; // eslint-disable-line camelcase
export {ApprovalState, ApprovalStates, DateShim, getAuthorizationData, IAuthorizationData, IRoleAuthorizationData, IUserAuthorizationData, now, RoleType, RoleTypes} from "./Utilities";

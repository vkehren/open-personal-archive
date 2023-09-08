import * as OPA from "../../base/src";
// System Required
import * as ActivityLogItem from "./doctypes/ActivityLogItem";
import * as AuthProvider from "./doctypes/AuthenticationProvider";
import * as Locale from "./doctypes/Locale";
import * as Role from "./doctypes/Role";
import * as TimeZone from "./doctypes/TimeZone";
import * as TimeZoneGroup from "./doctypes/TimeZoneGroup";
// System Created
import * as Application from "./doctypes/Application";
import * as Archive from "./doctypes/Archive";
import * as User from "./doctypes/User";
// User Created
import * as AccessRequest from "./doctypes/AccessRequest";

export const name = "open-personal-archive-data-model";
export const schemaVersion = "0.0.0.1";

// NOTE: If the CollectionDescriptor represents a singleton, export the singleton factory function directly later below
// NOTE: If the CollectionDescriptor represents pre-loaded system data, do NOT export ANY instance factory function (but do export required ID values)
// NOTE: If the CollectionDescriptor represents data that will dynamically be created during usage of system, expose factory function via ITypedFactoryCollectionDescriptor<T, F> interface
//         -> And for special case instances (e.g. User who is Archive Owner), export the special case factory function directly later below
export interface IOpaDbDescriptor extends OPA.ICollection {
  readonly ActivityLogItems: OPA.ITypedQueryableFactoryCollectionDescriptor<ActivityLogItem.IActivityLogItem, ActivityLogItem.QuerySet, ActivityLogItem.FactoryFunc>;
  readonly AuthProviders: OPA.ITypedQueryableCollectionDescriptor<AuthProvider.IAuthenticationProvider, AuthProvider.AuthenticationProviderQuerySet>;
  readonly Locales: OPA.ITypedQueryableCollectionDescriptor<Locale.ILocale, Locale.QuerySet>;
  readonly Roles: OPA.ITypedQueryableCollectionDescriptor<Role.IRole, Role.QuerySet>;
  readonly TimeZones: OPA.ITypedQueryableCollectionDescriptor<TimeZone.ITimeZone, TimeZone.QuerySet>;
  readonly TimeZoneGroups: OPA.ITypedQueryableCollectionDescriptor<TimeZoneGroup.ITimeZoneGroup, TimeZoneGroup.QuerySet>;
  readonly Application: OPA.ITypedQueryableCollectionDescriptor<Application.IApplication, Application.ApplicationQuerySet>;
  readonly Archive: OPA.ITypedQueryableCollectionDescriptor<Archive.IArchive, Archive.ArchiveQuerySet>;
  readonly Users: OPA.ITypedQueryableFactoryCollectionDescriptor<User.IUser, User.UserQuerySet, User.FactoryFunc>;
  readonly AccessRequests: OPA.ITypedQueryableFactoryCollectionDescriptor<AccessRequest.IAccessRequest, AccessRequest.AccessRequestQuerySet, AccessRequest.FactoryFunc>;
  readonly RootCollections: Array<OPA.ICollectionDescriptor>;
  readonly NestedCollections: Array<OPA.ICollectionDescriptor>;
}

const DbDescriptor = (OPA.CollectionDescriptors as OPA.ICollection);
DbDescriptor.ActivityLogItems = ActivityLogItem.CollectionDescriptor;
DbDescriptor.AuthProviders = AuthProvider.CollectionDescriptor;
DbDescriptor.Locales = Locale.CollectionDescriptor;
DbDescriptor.Roles = Role.CollectionDescriptor;
DbDescriptor.TimeZones = TimeZone.CollectionDescriptor;
DbDescriptor.TimeZoneGroups = TimeZoneGroup.CollectionDescriptor;
DbDescriptor.Application = Application.CollectionDescriptor;
DbDescriptor.Archive = Archive.CollectionDescriptor;
DbDescriptor.Users = User.CollectionDescriptor;
DbDescriptor.AccessRequests = AccessRequest.CollectionDescriptor;
DbDescriptor.RootCollections = OPA.getCollectionFromObject<OPA.ICollectionDescriptor>(DbDescriptor, (colDesc) => (!OPA.isNullish(colDesc.collectionName)), (colDesc) => (!colDesc.isNestedCollection));
DbDescriptor.NestedCollections = OPA.getCollectionFromObject<OPA.ICollectionDescriptor>(DbDescriptor, (colDesc) => (!OPA.isNullish(colDesc.collectionName)), (colDesc) => (colDesc.isNestedCollection));
export const OpaDbDescriptor = OPA.convertTo<IOpaDbDescriptor>(DbDescriptor);

export {DefaultIndexCollection, localizableStringConstructor, DataConfiguration, ActivityType, ActivityTypes, ApprovalState, ApprovalStates, RoleType, RoleTypes} from "./BaseTypes";
export {AuthorizationState, ISystemState, IAuthenticationState, IAuthorizationState, ICallState, IDataStorageState} from "./CallStateTypes";
export {IActivityLogItem} from "./doctypes/ActivityLogItem";
export {IAuthenticationProvider, DefaultAuthenticationProviderId, AuthenticationProvider_GoogleId, AuthenticationProvider_RequiredIds} from "./doctypes/AuthenticationProvider"; // eslint-disable-line camelcase
export {ILocale, DefaultLocaleId, DefaultLocale} from "./doctypes/Locale";
export {IRole, DefaultRoleId, Role_OwnerId, Role_AdministratorId, Role_EditorId, Role_ViewerId, Role_GuestId, Role_RequiredIds} from "./doctypes/Role"; // eslint-disable-line camelcase
export {ITimeZone} from "./doctypes/TimeZone";
export {ITimeZoneGroup, DefaultTimeZoneGroupId} from "./doctypes/TimeZoneGroup";
export {IApplication, IApplicationPartial, createSingleton as createApplication, SingletonId as ApplicationId} from "./doctypes/Application";
export {IArchive, IArchivePartial, SingletonId as ArchiveId} from "./doctypes/Archive";
export {IUser, IUserPartial, createArchiveOwner, User_OwnerId, Index_User_FirebaseAuthUserId, Index_User_AuthAccountName, Index_User_AuthAccountNameLowered} from "./doctypes/User"; // eslint-disable-line camelcase
export {IAccessRequest, IAccessRequestPartial} from "./doctypes/AccessRequest";

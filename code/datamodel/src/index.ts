import * as OPA from "../../base/src";
// Required
import * as AuthProvider from "./doctypes/AuthenticationProvider";
import * as Locale from "./doctypes/Locale";
import * as Role from "./doctypes/Role";
import * as TimeZone from "./doctypes/TimeZone";
import * as TimeZoneGroup from "./doctypes/TimeZoneGroup";
// System
import * as ActivityLogItem from "./doctypes/system/ActivityLogItem";
import * as Application from "./doctypes/system/Application";
import * as Configuration from "./doctypes/system/Configuration";
// Authorization
import * as User from "./doctypes/authorization/User";
import * as Contact from "./doctypes/authorization/Contact";
import * as AccessRequest from "./doctypes/authorization/AccessRequest";

// NOTE: If the CollectionDescriptor represents a singleton, export the singleton factory function directly later below
// NOTE: If the CollectionDescriptor represents pre-loaded system data, do NOT export ANY instance factory function (but do export required ID values)
// NOTE: If the CollectionDescriptor represents data that will dynamically be created during usage of system, expose factory function via ITypedFactoryCollectionDescriptor<T, F> interface
//         -> And for special case instances (e.g. User who is Archive Owner), export the special case factory function directly later below
export interface IOpaDbDescriptor extends OPA.ICollection {
  readonly AuthProviders: OPA.ITypedQueryableCollectionDescriptor<AuthProvider.IAuthenticationProvider, AuthProvider.AuthenticationProviderQuerySet>;
  readonly Locales: OPA.ITypedQueryableCollectionDescriptor<Locale.ILocale, Locale.LocaleQuerySet>;
  readonly Roles: OPA.ITypedQueryableCollectionDescriptor<Role.IRole, Role.RoleQuerySet>;
  readonly TimeZones: OPA.ITypedQueryableCollectionDescriptor<TimeZone.ITimeZone, TimeZone.QuerySet>;
  readonly TimeZoneGroups: OPA.ITypedQueryableCollectionDescriptor<TimeZoneGroup.ITimeZoneGroup, TimeZoneGroup.QuerySet>;
  readonly ActivityLogItems: OPA.ITypedQueryableFactoryCollectionDescriptor<ActivityLogItem.IActivityLogItem, ActivityLogItem.ActivityLogItemQuerySet, ActivityLogItem.FactoryFunc>;
  readonly Application: OPA.ITypedQueryableCollectionDescriptor<Application.IApplication, Application.ApplicationQuerySet>;
  readonly Configuration: OPA.ITypedQueryableCollectionDescriptor<Configuration.IConfiguration, Configuration.ConfigurationQuerySet>;
  readonly Users: OPA.ITypedQueryableFactoryCollectionDescriptor<User.IUser, User.UserQuerySet, User.FactoryFunc>;
  readonly Contacts: OPA.ITypedQueryableFactoryCollectionDescriptor<Contact.IContact, Contact.ContactQuerySet, Contact.FactoryFunc>;
  readonly AccessRequests: OPA.ITypedQueryableFactoryCollectionDescriptor<AccessRequest.IAccessRequest, AccessRequest.AccessRequestQuerySet, AccessRequest.FactoryFunc>;
  readonly RootCollections: Array<OPA.ICollectionDescriptor>;
  readonly NestedCollections: Array<OPA.ICollectionDescriptor>;
}

const DbDescriptor = (OPA.CollectionDescriptors as OPA.ICollection);
DbDescriptor.AuthProviders = AuthProvider.CollectionDescriptor;
DbDescriptor.Locales = Locale.CollectionDescriptor;
DbDescriptor.Roles = Role.CollectionDescriptor;
DbDescriptor.TimeZones = TimeZone.CollectionDescriptor;
DbDescriptor.TimeZoneGroups = TimeZoneGroup.CollectionDescriptor;
DbDescriptor.ActivityLogItems = ActivityLogItem.CollectionDescriptor;
DbDescriptor.Application = Application.CollectionDescriptor;
DbDescriptor.Configuration = Configuration.CollectionDescriptor;
DbDescriptor.Users = User.CollectionDescriptor;
DbDescriptor.Contacts = Contact.CollectionDescriptor;
DbDescriptor.AccessRequests = AccessRequest.CollectionDescriptor;
DbDescriptor.RootCollections = OPA.getCollectionFromObject<OPA.ICollectionDescriptor>(DbDescriptor, (colDesc) => (!OPA.isNullish(colDesc.collectionName)), (colDesc) => (!colDesc.isNestedCollection));
DbDescriptor.NestedCollections = OPA.getCollectionFromObject<OPA.ICollectionDescriptor>(DbDescriptor, (colDesc) => (!OPA.isNullish(colDesc.collectionName)), (colDesc) => (colDesc.isNestedCollection));
export const OpaDbDescriptor = OPA.convertTo<IOpaDbDescriptor>(DbDescriptor);

export {DataConfiguration, ActivityType, ActivityTypes, RoleType, RoleTypes} from "./BaseTypes";
export {ICallState, IDataStorageState, IAuthenticationState, ISystemState, IAuthorizationState, AuthorizationState, assertSystemStateIsNotNullish, assertAuthorizationStateIsNotNullish} from "./CallStateTypes"; // eslint-disable-line max-len
export {IAuthenticationProvider, DefaultAuthenticationProviderId, AuthenticationProvider_GoogleId, AuthenticationProvider_PasswordId, AuthenticationProvider_RequiredIds} from "./doctypes/AuthenticationProvider"; // eslint-disable-line camelcase, max-len
export {ILocale, DefaultLocaleId, DefaultLocale} from "./doctypes/Locale";
export {IRole, DefaultRoleId, Role_OwnerId, Role_AdministratorId, Role_EditorId, Role_ViewerId, Role_GuestId, Role_RequiredIds} from "./doctypes/Role"; // eslint-disable-line camelcase
export {ITimeZone} from "./doctypes/TimeZone";
export {ITimeZoneGroup, DefaultTimeZoneGroupId} from "./doctypes/TimeZoneGroup";
export {IActivityLogItem} from "./doctypes/system/ActivityLogItem";
export {IApplication, IApplicationPartial, SingletonId as ApplicationId} from "./doctypes/system/Application";
export {IConfiguration, IConfigurationPartial, SingletonId as ConfigurationId} from "./doctypes/system/Configuration";
export {IUser, IUserPartial, User_OwnerId} from "./doctypes/authorization/User"; // eslint-disable-line camelcase
export {IContact, IContactPartial} from "./doctypes/authorization/Contact";
export {IAccessRequest, IAccessRequestPartial} from "./doctypes/authorization/AccessRequest";
export * as PackageInfo from "./PackageInfo";

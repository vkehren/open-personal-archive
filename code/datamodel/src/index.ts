import * as OPA from "../../base/src";
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

export interface IOpaDbDescriptor {
  Archive: OPA.ITypedCollectionDescriptor<Archive.IArchive>;
  AuthProviders: OPA.ITypedCollectionDescriptor<AuthProvider.IAuthenticationProvider>;
  Locales: OPA.ITypedCollectionDescriptor<Locale.ILocale>;
  OpaSystem: OPA.ITypedCollectionDescriptor<OpaSystem.IOpaSystem>;
  Roles: OPA.ITypedCollectionDescriptor<Role.IRole>;
  TimeZones: OPA.ITypedCollectionDescriptor<TimeZone.ITimeZone>;
  TimeZoneGroups: OPA.ITypedCollectionDescriptor<TimeZoneGroup.ITimeZoneGroup>;
  Users: OPA.ITypedCollectionDescriptor<User.IUser>;
}
export const OpaDbDescriptor = ((OPA.CollectionDescriptors as unknown) as IOpaDbDescriptor);
OpaDbDescriptor.Archive = Archive.CollectionDescriptor;
OpaDbDescriptor.AuthProviders = AuthProvider.CollectionDescriptor;
OpaDbDescriptor.Locales = Locale.CollectionDescriptor;
OpaDbDescriptor.OpaSystem = OpaSystem.CollectionDescriptor;
OpaDbDescriptor.Roles = Role.CollectionDescriptor;
OpaDbDescriptor.TimeZones = TimeZone.CollectionDescriptor;
OpaDbDescriptor.TimeZoneGroups = TimeZoneGroup.CollectionDescriptor;
OpaDbDescriptor.Users = User.CollectionDescriptor;

export {IArchive} from "./Archive";
export {IAuthenticationProvider} from "./AuthenticationProvider";
export {ILocale} from "./Locale";
export {IOpaSystem} from "./OpaSystem";
export {IRole} from "./Role";
export {ITimeZone} from "./TimeZone";
export {ITimeZoneGroup} from "./TimeZoneGroup";
export {IUser} from "./User";

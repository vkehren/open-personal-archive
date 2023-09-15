import * as OPA from "../../base/src";

export const DefaultIndexCollection = "Indices";
export const localizableStringConstructor = function (locale: string, desiredValue: string | null = null, defaultValue: string = ""): OPA.ILocalizable<string> {
  OPA.assertNonNullishOrWhitespace(locale);
  const localizableString = ({} as any);
  localizableString[locale] = (!OPA.isNullishOrWhitespace(desiredValue) ? OPA.convertNonNullish(desiredValue) : defaultValue);
  localizableString[OPA.Default_Locale] = localizableString[locale]; // NOTE: The base library default locale is actually "en"
  return localizableString;
};

export const DataConfiguration = {
  Locale_UseMin: false,
  TimeZoneGroup_UseMin: false,
  TimeZone_UseMin: false,
};

export const PropertyNames_ForUnDelete_ByUser: Array<string | symbol> = [
  OPA.IUpdateable_HasBeenUpdated_PropertyName,
  OPA.IUpdateable_DateOfLatestUpdate_PropertyName,
  OPA.IUpdateable_ByUser_UserIdOfLatestUpdater_PropertyName,
  OPA.IDeleteable_IsMarkedAsDeleted_PropertyName,
  OPA.IDeleteable_DateOfDeletion_PropertyName,
  OPA.IDeleteable_ByUser_UserIdOfDeleter_PropertyName,
];

export type ActivityType = "browser_page_load" | "browser_page_view" | "browser_page_action" | "browser_page_error" | "server_function_call" | "server_function_error";
export const ActivityTypes = {
  default: ("browser_page_view" as ActivityType),
  web_page_load: ("browser_page_load" as ActivityType),
  web_page_view: ("browser_page_view" as ActivityType),
  web_page_action: ("browser_page_action" as ActivityType),
  web_page_error: ("browser_page_error" as ActivityType),
  web_page_types: ([] as Array<ActivityType>),
  server_function_call: ("server_function_call" as ActivityType),
  server_function_error: ("server_function_error" as ActivityType),
  server_function_types: ([] as Array<ActivityType>),
};
ActivityTypes.web_page_types = [ActivityTypes.web_page_load, ActivityTypes.web_page_view, ActivityTypes.web_page_action, ActivityTypes.web_page_error];
ActivityTypes.server_function_types = [ActivityTypes.server_function_call, ActivityTypes.server_function_error];

export type RoleType = "owner" | "administrator" | "editor" | "viewer" | "guest";
export const RoleTypes = {
  default: ("guest" as RoleType),
  owner: ("owner" as RoleType),
  administrator: ("administrator" as RoleType),
  editor: ("editor" as RoleType),
  viewer: ("viewer" as RoleType),
  guest: ("guest" as RoleType),
  authorizers: ([] as Array<RoleType>),
};
RoleTypes.authorizers = [RoleTypes.owner, RoleTypes.administrator];

export type ApprovalState = "pending" | "approved" | "denied";
export const ApprovalStates = {
  default: ("pending" as ApprovalState),
  pending: ("pending" as ApprovalState),
  approved: ("approved" as ApprovalState),
  denied: ("denied" as ApprovalState),
  decided: ([] as Array<ApprovalState>),
};
ApprovalStates.decided = [ApprovalStates.approved, ApprovalStates.denied];

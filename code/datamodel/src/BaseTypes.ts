/** Controls whether the entire set of required Documents are loaded, or only the set needed for testing (i.e. the "min" or "minimal" set).
 * @constant
 * @type {{}}
 */
export const DataConfiguration = {
  Locale_UseMin: false,
  TimeZoneGroup_UseMin: false,
  TimeZone_UseMin: false,
  ThrowErrorOnInvalidUpdate: true,
};

export type ActivityType = "browser_page_load" | "browser_page_view" | "browser_page_action" | "browser_page_error" | "server_function_call" | "server_function_error";
export const ActivityTypes = {
  _typeName: "ActivityType",
  _all: (["browser_page_load", "browser_page_view", "browser_page_action", "browser_page_error", "server_function_call", "server_function_error"] as Array<ActivityType>),
  _default: ("browser_page_view" as ActivityType),
  web_page_load: ("browser_page_load" as ActivityType),
  web_page_view: ("browser_page_view" as ActivityType),
  web_page_action: ("browser_page_action" as ActivityType),
  web_page_error: ("browser_page_error" as ActivityType),
  _web_page_types: (["browser_page_load", "browser_page_view", "browser_page_action", "browser_page_error"] as Array<ActivityType>),
  server_function_call: ("server_function_call" as ActivityType),
  server_function_error: ("server_function_error" as ActivityType),
  _server_function_types: (["server_function_call", "server_function_error"] as Array<ActivityType>),
};

export type RoleType = "owner" | "administrator" | "editor" | "viewer" | "guest";
export const RoleTypes = {
  _typeName: "RoleType",
  _all: (["owner", "administrator", "editor", "viewer", "guest"] as Array<RoleType>),
  _default: ("guest" as RoleType),
  owner: ("owner" as RoleType),
  administrator: ("administrator" as RoleType),
  editor: ("editor" as RoleType),
  viewer: ("viewer" as RoleType),
  guest: ("guest" as RoleType),
  _authorizers: (["owner", "administrator"] as Array<RoleType>),
  _authViewers: (["owner", "administrator", "editor"] as Array<RoleType>),
  _editors: (["owner", "administrator", "editor"] as Array<RoleType>),
  _viewers: (["owner", "administrator", "editor", "viewer"] as Array<RoleType>),
};

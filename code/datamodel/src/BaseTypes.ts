/** Controls whether the entire set of required Documents are loaded, or only the set needed for testing (i.e. the "min" or "minimal" set).
 * @constant
 * @type {{}}
 */
export const DataConfiguration = {
  Locale_UseMin: false,
  TimeZoneGroup_UseMin: false,
  TimeZone_UseMin: false,
};

export type ActivityType = "browser_page_load" | "browser_page_view" | "browser_page_action" | "browser_page_error" | "server_function_call" | "server_function_error";
export const ActivityTypes = {
  _typeName: "ActivityType",
  default: ("browser_page_view" as ActivityType),
  web_page_load: ("browser_page_load" as ActivityType),
  web_page_view: ("browser_page_view" as ActivityType),
  web_page_action: ("browser_page_action" as ActivityType),
  web_page_error: ("browser_page_error" as ActivityType),
  web_page_types: ([] as Array<ActivityType>),
  server_function_call: ("server_function_call" as ActivityType),
  server_function_error: ("server_function_error" as ActivityType),
  server_function_types: ([] as Array<ActivityType>),
  all: ([] as Array<ActivityType>),
};
ActivityTypes.web_page_types = [ActivityTypes.web_page_load, ActivityTypes.web_page_view, ActivityTypes.web_page_action, ActivityTypes.web_page_error];
ActivityTypes.server_function_types = [ActivityTypes.server_function_call, ActivityTypes.server_function_error];
ActivityTypes.all = [ActivityTypes.web_page_load, ActivityTypes.web_page_view, ActivityTypes.web_page_action, ActivityTypes.web_page_error, ActivityTypes.server_function_call, ActivityTypes.server_function_error];

export type RoleType = "owner" | "administrator" | "editor" | "viewer" | "guest";
export const RoleTypes = {
  _typeName: "RoleType",
  default: ("guest" as RoleType),
  owner: ("owner" as RoleType),
  administrator: ("administrator" as RoleType),
  editor: ("editor" as RoleType),
  viewer: ("viewer" as RoleType),
  guest: ("guest" as RoleType),
  authorizers: ([] as Array<RoleType>),
  authViewers: ([] as Array<RoleType>),
  editors: ([] as Array<RoleType>),
  viewers: ([] as Array<RoleType>),
  all: ([] as Array<RoleType>),
};
RoleTypes.authorizers = [RoleTypes.owner, RoleTypes.administrator];
RoleTypes.editors = [RoleTypes.owner, RoleTypes.administrator, RoleTypes.editor];
RoleTypes.authViewers = [...RoleTypes.editors]; // NOTE: "editors" are also "authViewers"
RoleTypes.viewers = [RoleTypes.owner, RoleTypes.administrator, RoleTypes.editor, RoleTypes.viewer];
RoleTypes.all = [RoleTypes.owner, RoleTypes.administrator, RoleTypes.editor, RoleTypes.viewer, RoleTypes.guest];

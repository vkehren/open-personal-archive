import * as OPA from "../../base/src";
import {DefaultLocale} from "./doctypes/Locale";

export const DefaultIndexCollection = "Indices";
export const localizableStringConstructor = function (desiredValue: string | null, defaultValue: string, locale = DefaultLocale): OPA.ILocalizable<string> {
  OPA.assertNonNullishOrWhitespace(locale);
  const localizableString = ({} as any);
  localizableString[locale] = (!OPA.isNullishOrWhitespace(desiredValue) ? OPA.convertNonNullish(desiredValue) : defaultValue);
  localizableString[OPA.Default_Locale] = localizableString[locale]; // NOTE: The base library default locale is actually "en"
  return localizableString;
};

export type RoleType = "owner" | "administrator" | "editor" | "viewer" | "guest";
export const RoleTypes = {
  default: ("guest" as RoleType),
  owner: ("owner" as RoleType),
  administrator: ("administrator" as RoleType),
  editor: ("editor" as RoleType),
  viewer: ("viewer" as RoleType),
  guest: ("guest" as RoleType),
};

export type ApprovalState = "pending" | "approved" | "denied";
export const ApprovalStates = {
  default: ("pending" as ApprovalState),
  pending: ("pending" as ApprovalState),
  approved: ("approved" as ApprovalState),
  denied: ("denied" as ApprovalState),
};

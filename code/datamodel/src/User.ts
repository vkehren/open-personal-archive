import * as OPA from "../../base/src";

const SingularName = "User";
const PluralName = "Users";
const IsSingleton = false;
const IsNestedCollection = false;

export const CollectionDescriptor = new OPA.CollectionDescriptor<IUser>(SingularName, PluralName, IsSingleton, IsNestedCollection);

export interface IUser {
  readonly id: string;
  readonly accountName: string;
  readonly authProviderId: string;
  assignedRoleId: string;
  readonly viewableCitationIds: Array<string>;
  firstName: string;
  lastName: string;
  preferredName: string;
  localeId: string;
  timeZoneGroupId: string;
  timeZoneId: string;
  recentQueries: Array<string>;
  dateOfCreation: OPA.ITimestamp;
  dateOfLatestUpdate: OPA.ITimestamp;
  approvalState: "undecided" | "approved" | "denied";
  userIdOfApprover: string;
  dateOfApproval: OPA.ITimestamp;
}

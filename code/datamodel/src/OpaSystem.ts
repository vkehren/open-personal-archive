import * as OPA from "../../base/src";

const SingularName = "OpaSystem";
const PluralName = "OpaSystems";
const IsSingleton = true;
const IsNestedCollection = false;

export const CollectionDescriptor = new OPA.CollectionDescriptor<IOpaSystem>(SingularName, PluralName, IsSingleton, IsNestedCollection);

export interface IOpaSystem {
  applicationVersion: string;
  schemaVersion: string;
  readonly dateOfInstallation: OPA.ITimestamp;
  dateOfLatestUpgrade: OPA.ITimestamp;
}

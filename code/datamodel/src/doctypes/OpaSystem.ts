import * as OPA from "../../../base/src";
import * as BT from "../BaseTypes";

const SingularName = "OpaSystem";
const PluralName = "OpaSystems";
const IsSingleton = true;
export const SingletonId = "OPA_OpaSystem";

export interface IOpaSystem extends OPA.IDocument {
  readonly id: string;
  applicationVersion: string;
  schemaVersion: string;
  readonly dateOfInstallation: BT.DateShim;
  dateOfLatestUpgrade: BT.DateShim;
}

/**
  * Creates an instance of the IOpaSystem document type.
  * @param {string} applicationVersion The version of the OPA application code.
  * @param {string} schemaVersion The version of the OPA database schema.
  * @return {IOpaSystem} The new document instance.
  */
export function createSingleton(applicationVersion: string, schemaVersion: string): IOpaSystem {
  const now = BT.now();
  const document: IOpaSystem = {
    id: SingletonId,
    applicationVersion: applicationVersion,
    schemaVersion: schemaVersion,
    dateOfInstallation: now,
    dateOfLatestUpgrade: now,
  };
  return document;
}

export type QuerySet = OPA.QuerySet<IOpaSystem>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IOpaSystem, QuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new OPA.QuerySet(cd), null, []);

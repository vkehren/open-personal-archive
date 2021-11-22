import * as OPA from "../../base/src";
import * as UTL from "./Utilities";

const SingularName = "OpaSystem";
const PluralName = "OpaSystems";
const IsSingleton = true;
export const SingletonId = "OPA_OpaSystem";

export const CollectionDescriptor = new OPA.CollectionDescriptor<IOpaSystem, void>(SingularName, PluralName, IsSingleton, null, []);

export interface IOpaSystem extends OPA.IDocument {
  readonly id: string;
  applicationVersion: string;
  schemaVersion: string;
  readonly dateOfInstallation: UTL.DateShim;
  dateOfLatestUpgrade: UTL.DateShim;
}

/**
  * Creates an instance of the IOpaSystem document type.
  * @param {string} applicationVersion The version of the OPA application code.
  * @param {string} schemaVersion The version of the OPA database schema.
  * @return {IOpaSystem} The new document instance.
  */
export function createInstance(applicationVersion: string, schemaVersion: string): IOpaSystem {
  const now = UTL.now();
  const document: IOpaSystem = {
    id: SingletonId,
    applicationVersion: applicationVersion,
    schemaVersion: schemaVersion,
    dateOfInstallation: now,
    dateOfLatestUpgrade: now,
  };
  return document;
}

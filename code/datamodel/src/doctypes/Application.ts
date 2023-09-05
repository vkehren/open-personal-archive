import * as OPA from "../../../base/src";

const SingularName = "Application";
const PluralName = "Applications";
const IsSingleton = true;
export const SingletonId = "OPA_Application";

export interface IApplication extends OPA.IDocument {
  readonly id: string;
  applicationVersion: string;
  schemaVersion: string;
  readonly dateOfInstallation: OPA.DateToUse;
  dateOfLatestUpgrade: OPA.DateToUse;
}

/**
  * Creates an instance of the IApplication document type.
  * @param {string} applicationVersion The version of the OPA application code.
  * @param {string} schemaVersion The version of the OPA database schema.
  * @return {IApplication} The new document instance.
  */
export function createSingleton(applicationVersion: string, schemaVersion: string): IApplication {
  const now = OPA.nowToUse();
  const document: IApplication = {
    id: SingletonId,
    applicationVersion: applicationVersion,
    schemaVersion: schemaVersion,
    dateOfInstallation: now,
    dateOfLatestUpgrade: now,
  };
  return document;
}

export type QuerySet = OPA.QuerySet<IApplication>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IApplication, QuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new OPA.QuerySet(cd), null, []);

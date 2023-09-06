import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../../base/src";

const SingularName = "Application";
const PluralName = "Applications";
const IsSingleton = true;
export const SingletonId = "OPA_Application";

export interface IApplicationUpgradeData extends OPA.IUpgradeable_ByUser {
  applicationVersionAfterUpgrade: string;
  schemaVersionAfterUpgrade: string;
  applicationVersionBeforeUpgrade: string;
  schemaVersionBeforeUpgrade: string;
}

export interface IApplicationPartial extends OPA.IUpgradeable_ByUser {
  applicationVersion: string;
  schemaVersion: string;
  upgradeHistory: Array<IApplicationUpgradeData> | firestore.FieldValue;
}

export interface IApplication extends OPA.IDocument_Upgradeable_ByUser {
  readonly id: string;
  applicationVersion: string;
  schemaVersion: string;
  readonly upgradeHistory: Array<IApplicationUpgradeData>;
  readonly dateOfInstallation: OPA.DateToUse;
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
    upgradeHistory: ([] as Array<IApplicationUpgradeData>),
    dateOfInstallation: now,
    hasBeenUpgraded: false,
    dateOfLatestUpgrade: null,
    userIdOfLatestUpgrader: null,
  };
  return document;
}

export type QuerySet = OPA.QuerySet<IApplication>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IApplication, QuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new OPA.QuerySet(cd), null, []);

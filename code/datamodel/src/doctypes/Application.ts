import * as firestore from "@google-cloud/firestore";
import * as OPA from "../../../base/src";

const SingularName = "Application";
const PluralName = "Applications";
const IsSingleton = true;
export const SingletonId = "OPA_Application";

export interface IApplicationPartial {
  applicationVersion?: string;
  schemaVersion?: string;
}

type UpgradeHistoryItem = IApplicationPartial | OPA.IUpgradeable_ByUser;
interface IApplicationPartial_WithHistory extends IApplicationPartial, OPA.IUpgradeable_ByUser {
  upgradeHistory: Array<UpgradeHistoryItem> | firestore.FieldValue;
}

export interface IApplication extends OPA.IDocument_Upgradeable_ByUser {
  readonly id: string;
  applicationVersion: string;
  schemaVersion: string;
  readonly upgradeHistory: Array<UpgradeHistoryItem>;
  readonly dateOfInstallation: OPA.DateToUse;
}

/**
 * Checks whether the specified updates to a Application document are valid.
 * @param {IApplication} application The Application document being updated.
 * @param {IApplicationPartial} applicationUpdateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
function areUpdatesValid(application: IApplication, applicationUpdateObject: IApplicationPartial): boolean {
  OPA.assertNonNullish(application);
  OPA.assertNonNullish(applicationUpdateObject);

  // NOTE: The "applicationVersion" cannot be downgraded or updated to same value as current value
  if (!OPA.isNullish(applicationUpdateObject.applicationVersion)) {
    const applicationVersion_Updated = OPA.convertNonNullish(applicationUpdateObject.applicationVersion);
    if (OPA.compareVersionNumberStrings(application.applicationVersion, applicationVersion_Updated) < 1) {
      return false;
    }
  }
  // NOTE: The "schemaVersion" cannot be downgraded or updated to same value as current value
  if (!OPA.isNullish(applicationUpdateObject.schemaVersion)) {
    const schemaVersion_Updated = OPA.convertNonNullish(applicationUpdateObject.schemaVersion);
    if (OPA.compareVersionNumberStrings(application.schemaVersion, schemaVersion_Updated) < 1) {
      return false;
    }
  }
  return true;
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
    upgradeHistory: ([] as Array<UpgradeHistoryItem>),
    dateOfInstallation: now,
    hasBeenUpgraded: false,
    dateOfLatestUpgrade: null,
    userIdOfLatestUpgrader: null,
  };
  document.upgradeHistory.push(OPA.copyObject(document));
  return document;
}

/** Class providing queries for Application collection. */
export class ApplicationQuerySet extends OPA.QuerySet<IApplication> {
  /**
   * Creates a ApplicationQuerySet.
   * @param {OPA.ITypedCollectionDescriptor<IApplication>} collectionDescriptor The collection descriptor to use for queries.
   */
  constructor(collectionDescriptor: OPA.ITypedCollectionDescriptor<IApplication>) {
    super(collectionDescriptor);
  }

  /**
   * The typed collection descriptor to use for queries.
   * @type {OPA.ITypedQueryableFactoryCollectionDescriptor<IApplication, ApplicationQuerySet, FactoryFunc>}
   */
  get typedCollectionDescriptor(): OPA.ITypedQueryableFactoryCollectionDescriptor<IApplication, ApplicationQuerySet, FactoryFunc> {
    return OPA.convertTo<OPA.ITypedQueryableFactoryCollectionDescriptor<IApplication, ApplicationQuerySet, FactoryFunc>>(this.collectionDescriptor);
  }

  /**
   * Creates an instance of the IApplication document type stored on the server.
   * @param {Firestore} db The Firestore Database.
   * @param {string} applicationVersion The version of the OPA application code.
   * @param {string} schemaVersion The version of the OPA database schema.
   * @return {Promise<string>} The new document ID.
   */
  async createApplication(db: firestore.Firestore, applicationVersion: string, schemaVersion: string): Promise<string> {
    const application = createSingleton(applicationVersion, schemaVersion);
    const applicationId = application.id;

    OPA.assertNonNullish(application);
    OPA.assertNonNullish(application.upgradeHistory);
    OPA.assertIsTrue(application.id == SingletonId);
    OPA.assertIsTrue(applicationId == SingletonId);
    OPA.assertIsTrue(application.upgradeHistory.length == 1);

    const applicationsCollectionRef = this.collectionDescriptor.getTypedCollection(db);
    const applicationRef = applicationsCollectionRef.doc(applicationId);
    await applicationRef.set(application, {merge: true});
    return applicationId;
  }

  /**
   * Updates the Application stored on the server using an IApplicationPartial object.
   * @param {Firestore} db The Firestore Database.
   * @param {IApplicationPartial} applicationUpdateObject The object containing the updates.
   * @param {string} userIdOfLatestUpgrader The ID for the Upgrader within the OPA system.
   * @param {OPA.IFirebaseConstructorProvider} constructorProvider The provider for Firebase FieldValue constructors.
   * @return {Promise<void>}
   */
  async updateApplication(db: firestore.Firestore, applicationUpdateObject: IApplicationPartial, userIdOfLatestUpgrader: string, constructorProvider: OPA.IFirebaseConstructorProvider): Promise<void> {
    const applicationId = SingletonId;
    const now = OPA.nowToUse();
    const applicationUpdateObject_Upgradeable = ({hasBeenUpgraded: true, dateOfLatestUpgrade: now, userIdOfLatestUpgrader: userIdOfLatestUpgrader} as OPA.IUpgradeable_ByUser);
    applicationUpdateObject = {...applicationUpdateObject_Upgradeable, ...applicationUpdateObject};
    const upgradeHistory = constructorProvider.arrayUnion(applicationUpdateObject);
    const applicationUpdateObject_WithHistory = ({...applicationUpdateObject, upgradeHistory} as IApplicationPartial_WithHistory);

    const application = await this.getById(db, applicationId);
    OPA.assertNonNullish(application);
    const areValid = areUpdatesValid(OPA.convertNonNullish(application), applicationUpdateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const applicationsCollectionRef = this.collectionDescriptor.getTypedCollection(db);
    const applicationRef = applicationsCollectionRef.doc(applicationId);
    await applicationRef.set(applicationUpdateObject_WithHistory, {merge: true});
  }
}

export type FactoryFunc = (...[params]: Parameters<typeof createSingleton>) => ReturnType<typeof createSingleton>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IApplication, ApplicationQuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new ApplicationQuerySet(cd), null, []);

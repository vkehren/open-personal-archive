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
 * @param {IApplication} document The Application document being updated.
 * @param {IApplicationPartial} updateObject The updates specified.
 * @return {boolean} Whether the updates are valid or not.
 */
function areUpdatesValid(document: IApplication, updateObject: IApplicationPartial): boolean {
  OPA.assertNonNullish(document);
  OPA.assertNonNullish(updateObject);

  // NOTE: The "applicationVersion" cannot be downgraded or updated to same value as current value
  if (!OPA.isNullish(updateObject.applicationVersion)) {
    const applicationVersion_Updated = OPA.convertNonNullish(updateObject.applicationVersion);
    if (OPA.compareVersionNumberStrings(document.applicationVersion, applicationVersion_Updated) < 1) {
      return false;
    }
  }
  // NOTE: The "schemaVersion" cannot be downgraded or updated to same value as current value
  if (!OPA.isNullish(updateObject.schemaVersion)) {
    const schemaVersion_Updated = OPA.convertNonNullish(updateObject.schemaVersion);
    if (OPA.compareVersionNumberStrings(document.schemaVersion, schemaVersion_Updated) < 1) {
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

  const documentCopy = (OPA.copyObject(document) as any);
  delete documentCopy.upgradeHistory;
  document.upgradeHistory.push(documentCopy);
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
  async create(db: firestore.Firestore, applicationVersion: string, schemaVersion: string): Promise<string> {
    const document = createSingleton(applicationVersion, schemaVersion);
    const documentId = document.id;

    OPA.assertNonNullish(document);
    OPA.assertNonNullish(document.upgradeHistory);
    OPA.assertIsTrue(document.id == SingletonId);
    OPA.assertIsTrue(documentId == SingletonId);
    OPA.assertIsTrue(document.upgradeHistory.length == 1);

    const collectionRef = this.collectionDescriptor.getTypedCollection(db);
    const documentRef = collectionRef.doc(documentId);
    await documentRef.set(document, {merge: true});
    return documentId;
  }

  /**
   * Updates the Application stored on the server using an IApplicationPartial object.
   * @param {Firestore} db The Firestore Database.
   * @param {IApplicationPartial} updateObject The object containing the updates.
   * @param {string} userIdOfLatestUpgrader The ID for the Upgrader within the OPA system.
   * @param {OPA.IFirebaseConstructorProvider} constructorProvider The provider for Firebase FieldValue constructors.
   * @return {Promise<void>}
   */
  async upgrade(db: firestore.Firestore, updateObject: IApplicationPartial, userIdOfLatestUpgrader: string, constructorProvider: OPA.IFirebaseConstructorProvider): Promise<void> {
    const documentId = SingletonId;
    const now = OPA.nowToUse();
    const updateObject_Upgradeable = ({hasBeenUpgraded: true, dateOfLatestUpgrade: now, userIdOfLatestUpgrader} as OPA.IUpgradeable_ByUser);
    updateObject = {...updateObject_Upgradeable, ...updateObject};
    const upgradeHistory = constructorProvider.arrayUnion(updateObject);
    const updateObject_WithHistory = ({...updateObject, upgradeHistory} as IApplicationPartial_WithHistory);

    const document = await this.getById(db, documentId);
    OPA.assertNonNullish(document);
    const areValid = areUpdatesValid(OPA.convertNonNullish(document), updateObject_WithHistory);
    OPA.assertIsTrue(areValid, "The requested update is invalid.");

    const collectionRef = this.collectionDescriptor.getTypedCollection(db);
    const documentRef = collectionRef.doc(documentId);
    await documentRef.set(updateObject_WithHistory, {merge: true});
  }
}

export type FactoryFunc = (...[params]: Parameters<typeof createSingleton>) => ReturnType<typeof createSingleton>;
export const CollectionDescriptor = new OPA.CollectionDescriptor<IApplication, ApplicationQuerySet, void>(SingularName, PluralName, IsSingleton, (cd) => new ApplicationQuerySet(cd), null, []);

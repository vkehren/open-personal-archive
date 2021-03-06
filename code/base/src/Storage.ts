import * as admin from "firebase-admin";
import * as BT from "./BaseTypes";
import * as FB from "./Firebase";
import * as QR from "./Queries";
import * as TC from "./TypeChecking";

// export const name = "Storage";

export const CollectionDescriptors: BT.IDictionary<ICollectionDescriptor> = {};

export interface INestedCollectionStep {
  readonly distanceFromRoot: number;
  readonly collectionName: string;
  readonly documentId: string;
}

export interface ICollectionDescriptor {
  readonly singularName: string;
  readonly pluralName: string;
  readonly isSingleton: boolean;
  readonly isNestedCollection: boolean;
  readonly collectionName: string;
  readonly parentCollectionDescriptor: ICollectionDescriptor | null;
  getCollection(db: admin.firestore.Firestore, pathFromRoot?: Array<INestedCollectionStep>): admin.firestore.CollectionReference<admin.firestore.DocumentData>;
  getCollectionGroup(db: admin.firestore.Firestore): admin.firestore.CollectionGroup<admin.firestore.DocumentData>;
}

export interface ITypedCollectionDescriptor<T extends BT.IDocument> extends ICollectionDescriptor {
  readonly requiredDocuments: Array<T>;
  castTo(document: unknown): T;
  getTypedCollection(db: admin.firestore.Firestore, pathFromRoot?: Array<INestedCollectionStep>): admin.firestore.CollectionReference<T>;
  getTypedCollectionGroup(db: admin.firestore.Firestore): admin.firestore.CollectionGroup<T>;
  loadRequiredDocuments(db: admin.firestore.Firestore, eraseExistingDocs: boolean, pathFromRoot?: Array<INestedCollectionStep>): Promise<void>;
}

export interface ITypedQueryableCollectionDescriptor<T extends BT.IDocument, Q extends QR.IQuerySet<T>> extends ITypedCollectionDescriptor<T>, ICollectionDescriptor { // eslint-disable-line max-len
  readonly queries: Q;
}

export interface ITypedFactoryCollectionDescriptor<T extends BT.IDocument, F> extends ITypedCollectionDescriptor<T>, ICollectionDescriptor {
  readonly canCreateInstance: boolean;
  readonly createInstance: F;
}

export interface ITypedQueryableFactoryCollectionDescriptor<T extends BT.IDocument, Q extends QR.IQuerySet<T>, F> extends ITypedFactoryCollectionDescriptor<T, F>, ITypedQueryableCollectionDescriptor<T, Q>, ITypedCollectionDescriptor<T>, ICollectionDescriptor { // eslint-disable-line max-len
}

/** Class providing consistent, type-safe values for use in queries. */
export class CollectionDescriptor<T extends BT.IDocument, Q extends QR.IQuerySet<T>, F> implements ITypedQueryableFactoryCollectionDescriptor<T, Q, F>, ITypedFactoryCollectionDescriptor<T, F>, ITypedQueryableCollectionDescriptor<T, Q>, ITypedCollectionDescriptor<T>, ICollectionDescriptor { // eslint-disable-line max-len
  private _singularName: string;
  private _pluralName: string;
  private _isSingleton: boolean;
  private _parentCollectionDescriptor: ICollectionDescriptor | null;
  private _requiredDocuments: Array<T>;
  private _queries: Q;
  private _factoryFunction: F | null;

  /**
    * Creates a Firestore data converter to use with collection references and collection groups.
    * @return {admin.firestore.FirestoreDataConverter<T>} The Firestore data converter.
    */
  static getDataConverter<T>(): admin.firestore.FirestoreDataConverter<T> {
    const dataConverter = {toFirestore: FB.convertToFirestoreDocument, fromFirestore: FB.convertFromFirestoreDocument};
    return dataConverter;
  }

  /**
    * Creates a CollectionDescriptor<T>.
    * @param {string} singularName The name for a single document of the type T.
    * @param {string} pluralName The name for multiple documents of the type T.
    * @param {boolean} isSingleton Whether the collection is ONLY allowed to contain a single document of type T or not.
    * @param {QR.QuerySetConstructor<Q, T>} [querySetConstructor] The function that constructs the object containing the set of queries useful for reading and editing document instances of type T.
    * @param {ICollectionDescriptor | null} [parentCollectionDescriptor=null] The descriptor of the parent collection, if one exists.
    * @param {Array<T>} [requiredDocuments=[]] The list of documents that must exist in a valid installation of the system.
    * @param {F} [factoryFunction=null] The factory function that creates a document instance of type T.
    */
  constructor(singularName: string, pluralName: string, isSingleton: boolean, querySetConstructor: QR.QuerySetConstructor<Q, T>, parentCollectionDescriptor: ICollectionDescriptor | null = null, requiredDocuments: Array<T> = [], factoryFunction: F | null = null) { // eslint-disable-line max-len
    let rootDescriptor = parentCollectionDescriptor;
    while (!TC.isNullish(rootDescriptor)) {
      if (rootDescriptor == this) {
        throw new Error("Cycles are not permitted in collection references.");
      }
      rootDescriptor = (rootDescriptor as ICollectionDescriptor).parentCollectionDescriptor;
    }

    this._singularName = singularName;
    this._pluralName = pluralName;
    this._isSingleton = isSingleton;
    this._parentCollectionDescriptor = parentCollectionDescriptor;
    this._requiredDocuments = requiredDocuments;
    this._queries = querySetConstructor(this);
    this._factoryFunction = factoryFunction;
  }

  /**
    * The name for a single document of the type T.
    * @type {string}
    */
  get singularName(): string {
    return this._singularName;
  }

  /**
    * The name for multiple documents of the type T.
    * @type {string}
    */
  get pluralName(): string {
    return this._pluralName;
  }

  /**
    * Whether the collection is ONLY allowed to contain a single document of type T or not.
    * @type {boolean}
    */
  get isSingleton(): boolean {
    return this._isSingleton;
  }

  /**
    * Whether the collection is nested inside a parent collection or not.
    * @type {boolean}
    */
  get isNestedCollection(): boolean {
    return (!TC.isNullish(this._parentCollectionDescriptor));
  }

  /**
    * The name to use for querying the collection.
    * @type {string}
    */
  get collectionName(): string {
    return (this.isSingleton) ? this.singularName : this.pluralName;
  }

  /**
    * The descriptor of the parent collection, if one exists.
    * @type {ICollectionDescriptor | null}
    */
  get parentCollectionDescriptor(): ICollectionDescriptor | null {
    return this._parentCollectionDescriptor;
  }

  /**
    * The list of documents that must exist in a valid installation of the system.
    * @type {Array<T>}
    */
  get requiredDocuments(): Array<T> {
    return this._requiredDocuments.slice();
  }

  /**
    * Casts and returns typed document.
    * @param {unknown} document The untyped document to cast.
    * @return {T} The typed document.
    */
  castTo(document: unknown): T {
    const typedDocument = (document as (T | null | undefined));
    FB.assertDocumentIsValid(typedDocument);

    const typedDocumentNonNull = TC.convertNonNullish(typedDocument);
    return typedDocumentNonNull;
  }

  /**
    * Returns the corresponding Firebase Firestore collection reference for the document type.
    * @param {Firestore} db The Firebase Firestore database.
    * @param {Array<INestedCollectionStep>} [pathFromRoot=[]] The path to the nested collection from the root of the database.
    * @return {admin.firestore.CollectionReference<admin.firestore.DocumentData>} The corresponding collection reference.
    */
  getCollection(db: admin.firestore.Firestore, pathFromRoot: Array<INestedCollectionStep> = []): admin.firestore.CollectionReference<admin.firestore.DocumentData> {
    FB.assertFirestoreIsNotNullish(db);

    if (!this.isNestedCollection) {
      return db.collection(this.collectionName);
    }

    const descriptors: Array<ICollectionDescriptor> = [];
    let rootDescriptor = (this as ICollectionDescriptor);
    descriptors.unshift(rootDescriptor);

    while (!TC.isNullish(rootDescriptor.parentCollectionDescriptor)) {
      if (rootDescriptor.parentCollectionDescriptor == this) {
        throw new Error("Cycles are not permitted in collection references.");
      }
      rootDescriptor = (rootDescriptor.parentCollectionDescriptor as ICollectionDescriptor);
      descriptors.unshift(rootDescriptor);
    }

    let collectionRef = db.collection(rootDescriptor.collectionName);
    for (let i = 1; i < pathFromRoot.length; i++) {
      const step = pathFromRoot[i - 1];
      const descriptor = descriptors[i];
      collectionRef = collectionRef.doc(step.documentId).collection(descriptor.collectionName);
    }
    return collectionRef;
  }

  /**
    * Returns the corresponding Firebase Firestore collection group for the document type.
    * @param {Firestore} db The Firebase Firestore database.
    * @return {admin.firestore.CollectionGroup<admin.firestore.DocumentData>} The corresponding collection group.
    */
  getCollectionGroup(db: admin.firestore.Firestore): admin.firestore.CollectionGroup<admin.firestore.DocumentData> {
    FB.assertFirestoreIsNotNullish(db);

    if (!this.isNestedCollection) {
      // LATER: Consider throwing an Error here to force client code to use CollectionReference
      return db.collectionGroup(this.collectionName);
    }

    return db.collectionGroup(this.collectionName);
  }

  /**
    * Returns the corresponding Firebase Firestore typed collection reference for the document type.
    * @param {Firestore} db The Firebase Firestore database.
    * @param {Array<INestedCollectionStep>} [pathFromRoot=[]] The path to the nested collection from the root of the database.
    * @return {admin.firestore.CollectionReference<T>} The corresponding typed collection reference.
    */
  getTypedCollection(db: admin.firestore.Firestore, pathFromRoot: Array<INestedCollectionStep> = []): admin.firestore.CollectionReference<T> {
    const collection = this.getCollection(db, pathFromRoot);
    const dataConverter = CollectionDescriptor.getDataConverter<T>();
    return collection.withConverter(dataConverter);
  }

  /**
    * Returns the corresponding Firebase Firestore typed collection group for the document type.
    * @param {Firestore} db The Firebase Firestore database.
    * @return {admin.firestore.CollectionGroup<T>} The corresponding typed collection group.
    */
  getTypedCollectionGroup(db: admin.firestore.Firestore): admin.firestore.CollectionGroup<T> {
    const collectionGroup = this.getCollectionGroup(db);
    const dataConverter = CollectionDescriptor.getDataConverter<T>();
    return collectionGroup.withConverter(dataConverter);
  }

  /**
    * Loads the required document instances into the Firebase Firestore collection corresponding to the document type.
    * @param {Firestore} db The Firebase Firestore database.
    * @param {boolean} eraseExistingDocs Whether to erase the existing documents in the collection before loading the currently required documents.
    * @param {Array<INestedCollectionStep>} [pathFromRoot=[]] The path to the nested collection from the root of the database.
    * @return {Promise<void>} A Promise containing an empty result.
    */
  async loadRequiredDocuments(db: admin.firestore.Firestore, eraseExistingDocs: boolean, pathFromRoot: Array<INestedCollectionStep> = []): Promise<void> { // eslint-disable-line max-len
    const collectionRef = this.getTypedCollection(db, pathFromRoot);

    if (eraseExistingDocs) {
      await FB.clearFirestoreCollection(collectionRef);
    }

    for (let i = 0; i < this.requiredDocuments.length; i++) {
      const requiredDocument = this.requiredDocuments[i];
      const documentId = requiredDocument.id;
      const documentRef = collectionRef.doc(documentId);
      await documentRef.set(requiredDocument, {merge: true});
    }
  }

  /**
    * The set of queries useful for reading and editing document instances of type T.
    * @type {Q}
    */
  get queries(): Q {
    return this._queries;
  }

  /**
    * Whether a non-null factory function exists.
    * @type {boolean}
    */
  get canCreateInstance(): boolean {
    if (TC.isNullish(this._factoryFunction)) {
      return false;
    }
    return true;
  }

  /**
    * The factory function that creates an instance. Check canCreateInstance first, as this property throws Error if no factory function exists.
    * @type {F}
    */
  get createInstance(): F {
    if (TC.isNullish(this._factoryFunction)) {
      throw new Error("No factor function exists for the collection.");
    }
    return (this._factoryFunction as F);
  }
}

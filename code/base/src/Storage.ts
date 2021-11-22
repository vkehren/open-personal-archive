import * as admin from "firebase-admin";
import * as BT from "./BaseTypes";
import * as FB from "./Firebase";
import * as TC from "./TypeChecking";

// export const name = "Storage";

export const CollectionDescriptors: BT.IDictionary<ICollectionDescriptor> = {};
export const Default_DocumentId_PropertyName = "id"; // eslint-disable-line camelcase

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
  getDocumentForId(db: admin.firestore.Firestore, id: string | null | undefined): Promise<BT.IDocument | null>;
}

export interface ITypedCollectionDescriptor<T extends BT.IDocument> extends ICollectionDescriptor {
  readonly requiredDocuments: Array<T>;
  castTo(document: unknown): T;
  getTypedCollection(db: admin.firestore.Firestore, pathFromRoot?: Array<INestedCollectionStep>): admin.firestore.CollectionReference<T>;
  getTypedCollectionGroup(db: admin.firestore.Firestore): admin.firestore.CollectionGroup<T>;
  getTypedDocumentForId(db: admin.firestore.Firestore, id: string | null | undefined): Promise<T | null>;
  loadRequiredDocuments(db: admin.firestore.Firestore, eraseExistingDocs: boolean, documentIdPropertyName?: string, pathFromRoot?: Array<INestedCollectionStep>): Promise<void>;
}

export interface ITypedFactoryCollectionDescriptor<T extends BT.IDocument, F> extends ITypedCollectionDescriptor<T>, ICollectionDescriptor {
  readonly canCreateInstance: boolean;
  readonly createInstance: F;
}

/** Class providing consistent, type-safe values for use in queries. */
export class CollectionDescriptor<T extends BT.IDocument, F> extends Object implements ITypedFactoryCollectionDescriptor<T, F>, ITypedCollectionDescriptor<T>, ICollectionDescriptor {
  private _singularName: string;
  private _pluralName: string;
  private _isSingleton: boolean;
  private _parentCollectionDescriptor: ICollectionDescriptor | null;
  private _requiredDocuments: Array<T>;
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
    * @param {ICollectionDescriptor | null} [parentCollectionDescriptor=null] The descriptor of the parent collection, if one exists.
    * @param {Array<T>} [requiredDocuments=[]] The list of documents that must exist in a valid installation of the system.
    * @param {F} [factoryFunction=null] The factory function that creates a document instance of type T.
    */
  constructor(singularName: string, pluralName: string, isSingleton: boolean, parentCollectionDescriptor: ICollectionDescriptor | null = null, requiredDocuments: Array<T> = [], factoryFunction: F | null = null) { // eslint-disable-line max-len
    super();

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
    if (TC.isNullish(document)) {
      throw new Error("A valid document (i.e. non-undefined AND non-null) must be supplied for casting.");
    }

    return (document as T);
  }

  /**
    * Returns the corresponding Firebase Firestore collection reference for the document type.
    * @param {Firestore} db The Firebase Firestore database.
    * @param {Array<INestedCollectionStep>} [pathFromRoot=[]] The path to the nested collection from the root of the database.
    * @return {admin.firestore.CollectionReference<admin.firestore.DocumentData>} The corresponding collection reference.
    */
  getCollection(db: admin.firestore.Firestore, pathFromRoot: Array<INestedCollectionStep> = []): admin.firestore.CollectionReference<admin.firestore.DocumentData> {
    if (TC.isNullish(db)) {
      throw new Error("A valid Firebase Firestore database must be supplied.");
    }

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
    if (TC.isNullish(db)) {
      throw new Error("A valid Firebase Firestore database must be supplied.");
    }

    if (!this.isNestedCollection) {
      // LATER: Consider throwing an Error here to force client code to use CollectionReference
      return db.collectionGroup(this.collectionName);
    }

    return db.collectionGroup(this.collectionName);
  }

  /**
   * Gets a Document by that Document's ID.
   * @param {Firestore} db The Firestore Database to read from.
   * @param {string | null | undefined} id The ID for the Document within the OPA system.
   * @return {Promise<BT.IDocument | null>} The Document corresponding to the ID, or null if none exists.
   */
  async getDocumentForId(db: admin.firestore.Firestore, id: string | null | undefined): Promise<BT.IDocument | null> {
    const typedDocument = await this.getTypedDocumentForId(db, id);
    return typedDocument;
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
   * Gets a Document by that Document's ID.
   * @param {Firestore} db The Firestore Database to read from.
   * @param {string | null | undefined} id The ID for the Document within the OPA system.
   * @return {Promise<T | null>} The Document corresponding to the ID, or null if none exists.
   */
  async getTypedDocumentForId(db: admin.firestore.Firestore, id: string | null | undefined): Promise<T | null> {
    if (TC.isNullish(db)) {
      throw new Error("The Firestore DB must NOT be null.");
    }
    if (TC.isNullish(id)) {
      return null;
    }

    const collectionRef = this.getTypedCollection(db);
    const documentRef = collectionRef.doc(id as string);
    const documentSnap = await documentRef.get();
    const document = documentSnap.data();
    return (!TC.isNullish(document)) ? (document as T) : null;
  }

  /**
    * Loads the required document instances into the Firebase Firestore collection corresponding to the document type.
    * @param {Firestore} db The Firebase Firestore database.
    * @param {boolean} eraseExistingDocs Whether to erase the existing documents in the collection before loading the currently required documents.
    * @param {string} [documentIdPropertyName=Default_DocumentId_PropertyName] The property name to use to obtain the ID of the document instance.
    * @param {Array<INestedCollectionStep>} [pathFromRoot=[]] The path to the nested collection from the root of the database.
    * @return {Promise<void>} A Promise containing an empty result.
    */
  async loadRequiredDocuments(db: admin.firestore.Firestore, eraseExistingDocs: boolean, documentIdPropertyName: string = Default_DocumentId_PropertyName, pathFromRoot: Array<INestedCollectionStep> = []): Promise<void> { // eslint-disable-line max-len
    const collectionRef = this.getTypedCollection(db, pathFromRoot);

    if (eraseExistingDocs) {
      await FB.clearFirestoreCollection(collectionRef);
    }

    for (let i = 0; i < this.requiredDocuments.length; i++) {
      const requiredDocument = this.requiredDocuments[i];
      const requiredDocumentAsCollection = ((requiredDocument as unknown) as BT.ICollection);
      const documentId = (requiredDocumentAsCollection[documentIdPropertyName] as string);
      const documentRef = collectionRef.doc(documentId);
      await documentRef.set(requiredDocument, {merge: true});
    }
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

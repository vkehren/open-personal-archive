import * as firestore from "@google-cloud/firestore";
import * as BT from "./BaseTypes";
import * as DT from "./DocumentTypes";
import * as FB from "./Firebase";
import * as ST from "./Storage";
import * as TC from "./TypeChecking";
import * as VC from "./ValueChecking";

export type QuerySetConstructor<Q extends IQuerySet<T>, T extends DT.IDocument> = (collectionDescriptor: ST.ITypedCollectionDescriptor<T>) => Q;

export interface IQuerySet<T extends DT.IDocument> {
  readonly collectionDescriptor: ST.ITypedCollectionDescriptor<T>;
  documentProxyConstructor: BT.ProxyFunc<T>;
  getById(ds: FB.IDataStorageState, id: string): Promise<T | null>;
  getByIdWithAssert(ds: FB.IDataStorageState, id: string, assertionFailureMessage: string): Promise<T>;
  getForIds(ds: FB.IDataStorageState, ids: Array<string>): Promise<Array<T>>;
  getForIdsWithAssert(ds: FB.IDataStorageState, ids: Array<string>, assertionFailureMessage: string): Promise<Array<T>>;
  getAll(ds: FB.IDataStorageState, pathFromRoot?: Array<ST.INestedCollectionStep> | undefined): Promise<Array<T>>;
}

/** Base class for providing queries for a collection. */
export class QuerySet<T extends DT.IDocument> implements IQuerySet<T> {
  private _collectionDescriptor: ST.ITypedCollectionDescriptor<T>;
  private _documentProxyConstructor: BT.ProxyFunc<T>;

  /**
   * Creates a QuerySet<T>.
   * @param {ST.ITypedCollectionDescriptor<T>} collectionDescriptor The collection descriptor to use for queries.
   */
  constructor(collectionDescriptor: ST.ITypedCollectionDescriptor<T>) {
    this._collectionDescriptor = collectionDescriptor;
    this._documentProxyConstructor = (document: T) => document;
  }

  /**
   * Gets the collection descriptor corresponding to the document type for the QuerySet.
   * @type {ST.ITypedCollectionDescriptor<T>}
   */
  get collectionDescriptor(): ST.ITypedCollectionDescriptor<T> {
    return this._collectionDescriptor;
  }

  /**
   * Gets the document proxy constructor for proxying documents returned from QuerySet functions.
   * @type {BT.ProxyFunc<T>}
   */
  get documentProxyConstructor(): BT.ProxyFunc<T> {
    return this._documentProxyConstructor;
  }
  /**
   * Sets the document proxy constructor for proxying documents returned from QuerySet functions.
   * @type {BT.ProxyFunc<T>}
   * @param {BT.ProxyFunc<T>} proxyConstructorFunc The constructor function to use for proxying documents.
   */
  set documentProxyConstructor(proxyConstructorFunc: BT.ProxyFunc<T>) {
    this._documentProxyConstructor = proxyConstructorFunc;
  }

  /**
   * Gets a Document by that Document's ID.
   * @param {FB.IDataStorageState} ds The state container for data storage.
   * @param {string} id The ID for the Document within the OPA system.
   * @return {Promise<T | null>} The Document corresponding to the ID, or null if none exists.
   */
  async getById(ds: FB.IDataStorageState, id: string): Promise<T | null> {
    FB.assertDataStorageStateIsNotNullish(ds);
    FB.assertFirestoreIsNotNullish(ds.db);
    BT.assertIdentifierIsValid(id);

    let documentSnap: firestore.DocumentSnapshot<T> | null = null;

    if (this.collectionDescriptor.isNestedCollection) {
      const collectionGroup = this.collectionDescriptor.getTypedCollectionGroup(ds);
      const querySnap = await collectionGroup.where(DT.IDocument_DocumentId_PropertyName, "==", id).get();
      documentSnap = (querySnap.docs.length > 0) ? querySnap.docs[0] : null;
    } else {
      const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
      const documentRef = collectionRef.doc(id as string);
      documentSnap = await documentRef.get();
    }

    if (TC.isNullish(documentSnap)) {
      return null;
    }

    const document = TC.convertNonNullish(documentSnap).data();
    if (TC.isNullish(document)) {
      return null;
    }

    const documentNonNull = TC.convertNonNullish(document);
    const proxiedDocument = this.documentProxyConstructor(documentNonNull);
    return proxiedDocument;
  }

  /**
   * Gets a Document by that Document's ID and asserts that the Document is valid (i.e. is non-null and has non-null "id" property).
   * @param {FB.IDataStorageState} ds The state container for data storage.
   * @param {string} id The ID for the Document within the OPA system.
   * @param {string} [assertionFailureMessage=default] The message to include in the Error if the assertion fails.
   * @return {Promise<T>} The Document corresponding to the ID.
   */
  async getByIdWithAssert(ds: FB.IDataStorageState, id: string, assertionFailureMessage = "The specified ID does not correspond to a valid document."): Promise<T> {
    const document = await this.getById(ds, id);
    DT.assertDocumentIsValid(document, assertionFailureMessage, assertionFailureMessage);
    const documentNonNull = TC.convertNonNullish(document);
    return documentNonNull;
  }

  /**
   * Gets the Documents whose IDs are in the specified list.
   * @param {FB.IDataStorageState} ds The state container for data storage.
   * @param {Array<string>} ids The IDs for the Documents within the OPA system.
   * @return {Promise<Array<T>>} The Documents corresponding to the IDs.
   */
  async getForIds(ds: FB.IDataStorageState, ids: Array<string>): Promise<Array<T>> {
    FB.assertDataStorageStateIsNotNullish(ds);
    FB.assertFirestoreIsNotNullish(ds.db);
    TC.assertNonNullish(ids);
    VC.assertIsTrue((ids.length > 0), "No incoming IDs were specified.");
    ids.forEach((id) => BT.assertIdentifierIsValid(id));

    let documentSnaps: Array<firestore.QueryDocumentSnapshot<T>> = [];

    if (this.collectionDescriptor.isNestedCollection) {
      const collectionGroup = this.collectionDescriptor.getTypedCollectionGroup(ds);
      const querySnap = await collectionGroup.where(DT.IDocument_DocumentId_PropertyName, "in", ids).get();
      documentSnaps = querySnap.docs;
    } else {
      const collectionRef = this.collectionDescriptor.getTypedCollection(ds);
      const querySnap = await collectionRef.where(DT.IDocument_DocumentId_PropertyName, "in", ids).get();
      documentSnaps = querySnap.docs;
    }

    if (TC.isNullish(documentSnaps)) {
      return ([] as Array<T>);
    }

    const documents = documentSnaps.map((value) => value.data());
    const proxiedDocuments = documents.map((document) => this.documentProxyConstructor(document));
    return proxiedDocuments;
  }

  /**
   * Gets the Documents whose IDs are in the specified list and asserts that all Documents are present (i.e. length of result matches length of input)
   * and valid (i.e. are non-null and have non-null "id" property).
   * @param {FB.IDataStorageState} ds The state container for data storage.
   * @param {Array<string>} ids The IDs for the Documents within the OPA system.
   * @param {string} [assertionFailureMessage=default] The message to include in the Error if the assertion fails.
   * @return {Promise<Array<T>>} The Documents corresponding to the IDs.
   */
  async getForIdsWithAssert(ds: FB.IDataStorageState, ids: Array<string>, assertionFailureMessage = "The resulting list of documents does not match the requested list of IDs."): Promise<Array<T>> {
    const documents = await this.getForIds(ds, ids);
    TC.assertNonNullish(documents, assertionFailureMessage);
    VC.assertIsTrue((documents.length == ids.length), assertionFailureMessage);
    documents.forEach((document) => DT.assertDocumentIsValid(document, assertionFailureMessage, assertionFailureMessage));
    return documents;
  }

  /**
   * Gets all Documents in a specific Collection (or Collection Group, if no pathFromRoot is provided for a nested Collection).
   * @param {FB.IDataStorageState} ds The state container for data storage.
   * @param {Array<ST.INestedCollectionStep> | undefined} [pathFromRoot=undefined] The path to the nested Collection from the root of the database.
   * @return {Promise<Array<T>>} The list of Documents in the Collection.
   */
  async getAll(ds: FB.IDataStorageState, pathFromRoot?: Array<ST.INestedCollectionStep> | undefined): Promise<Array<T>> {
    FB.assertDataStorageStateIsNotNullish(ds);
    FB.assertFirestoreIsNotNullish(ds.db);

    let documents = ([] as Array<T>);
    if (TC.isNullish(pathFromRoot) && this.collectionDescriptor.isNestedCollection) {
      const collectionGroup = this.collectionDescriptor.getTypedCollectionGroup(ds);
      const querySnap = await collectionGroup.get();
      documents = querySnap.docs.map((value) => value.data());
    } else {
      const collectionRef = this.collectionDescriptor.getTypedCollection(ds, pathFromRoot);
      const querySnap = await collectionRef.get();
      documents = querySnap.docs.map((value) => value.data());
    }

    const proxiedDocuments = documents.map((document) => this.documentProxyConstructor(document));
    return proxiedDocuments;
  }
}

import * as firestore from "@google-cloud/firestore";
import * as BT from "./BaseTypes";
import * as CL from "./Collections";
import * as DT from "./DocumentTypes";
import * as FB from "./Firebase";
import * as ST from "./Storage";
import * as TC from "./TypeChecking";
import * as VC from "./ValueChecking";

export type CollectionSource<T> = (firestore.CollectionGroup<T> | firestore.CollectionReference<T>);
export type QuerySource<T> = (firestore.CollectionGroup<T> | firestore.CollectionReference<T> | firestore.Query<T>);

export const QueryOptions_Paging_Limit_PropertyName = VC.getTypedPropertyKeyAsText<IPagingQueryOptions>("limit"); // eslint-disable-line camelcase
export const QueryOptions_Paging_Offset_PropertyName = VC.getTypedPropertyKeyAsText<IPagingQueryOptions>("offset"); // eslint-disable-line camelcase
export interface IPagingQueryOptions {
  limit: number,
  offset?: number,
}

export const QueryOptions_Timing_DateField_PropertyName = VC.getTypedPropertyKeyAsText<ITimingQueryOptions>("dateField"); // eslint-disable-line camelcase
export const QueryOptions_Timing_Direction_PropertyName = VC.getTypedPropertyKeyAsText<ITimingQueryOptions>("direction"); // eslint-disable-line camelcase
export const QueryOptions_Timing_StartDate_PropertyName = VC.getTypedPropertyKeyAsText<ITimingQueryOptions>("startDate"); // eslint-disable-line camelcase
export const QueryOptions_Timing_EndDate_PropertyName = VC.getTypedPropertyKeyAsText<ITimingQueryOptions>("endDate"); // eslint-disable-line camelcase
export interface ITimingQueryOptions {
  dateField: string | firestore.FieldPath,
  direction?: firestore.OrderByDirection,
  // LATER: Consider allowing Timestamps, if doing so proves necessary
  startDate?: Date,
  endDate?: Date,
}

export interface IQueryOptions {
  pagingOptions?: IPagingQueryOptions,
  timingOptions?: ITimingQueryOptions,
}

/**
 * Extracts the query options from the data for the current request.
 * @param {Record<string, unknown>} data The query to which to apply the specified options.
 * @return {IQueryOptions} The extracted query options.
 */
export function extractQueryOptions(data: Record<string, unknown>): IQueryOptions {
  const queryOptions = ({} as IQueryOptions);

  if (TC.isNullish(data)) {
    return queryOptions;
  }

  if (data[QueryOptions_Paging_Limit_PropertyName]) {
    const limit = Number.parseInt("" + data[QueryOptions_Paging_Limit_PropertyName]);
    const offset = Number.parseInt("" + data[QueryOptions_Paging_Offset_PropertyName]);

    if (Number.isNaN(limit)) {
      throw new Error("The specified query limit must be an integer.");
    }

    queryOptions.pagingOptions = {
      limit: limit,
      offset: (!Number.isNaN(offset)) ? offset : undefined,
    };
  }

  if (data[QueryOptions_Timing_DateField_PropertyName]) {
    const startDate = new Date("" + data[QueryOptions_Timing_StartDate_PropertyName]);
    const endDate = new Date("" + data[QueryOptions_Timing_EndDate_PropertyName]);

    queryOptions.timingOptions = {
      dateField: (data[QueryOptions_Timing_DateField_PropertyName] as string | firestore.FieldPath),
      direction: (data[QueryOptions_Timing_Direction_PropertyName] as firestore.OrderByDirection | undefined),
      startDate: (!Number.isNaN(startDate.valueOf())) ? startDate : undefined,
      endDate: (!Number.isNaN(endDate.valueOf())) ? endDate : undefined,
    };
  }

  return queryOptions;
}

/**
 * Applies query options to a Firestore query.
 * @param {QuerySource<T>} query The query to which to apply the specified options.
 * @param {IQueryOptions | undefined} queryOptions The query options to apply prior to executing the query.
 * @return {QuerySource<T>} The query that results from the query options having been applied.
 */
export function applyQueryOptions<T>(query: QuerySource<T>, queryOptions: IQueryOptions | undefined): QuerySource<T> {
  TC.assertNonNullish(query, "The Query must not be null.");

  if (TC.isNullish(queryOptions)) {
    return query;
  }

  const optionsNonNull = TC.convertNonNullish(queryOptions);
  const hasTimingOptions = (!TC.isNullish(optionsNonNull.timingOptions));
  const hasPagingOptions = (!TC.isNullish(optionsNonNull.pagingOptions));

  if (hasTimingOptions) {
    const timingOptions = TC.convertNonNullish(optionsNonNull.timingOptions);

    if (!TC.isNullish(timingOptions.direction)) {
      const direction = TC.convertNonNullish(timingOptions.direction);
      query = query.orderBy(timingOptions.dateField, direction);
    } else {
      query = query.orderBy(timingOptions.dateField);
    }

    if (!TC.isNullish(timingOptions.startDate)) {
      query = query.startAt(timingOptions.startDate);
    }
    if (!TC.isNullish(timingOptions.endDate)) {
      query = query.endAt(timingOptions.endDate);
    }
  }

  if (hasPagingOptions) {
    const pagingOptions = TC.convertNonNullish(optionsNonNull.pagingOptions);

    query = query.limit(pagingOptions.limit);

    if (!TC.isNullish(pagingOptions.offset)) {
      const offset = TC.convertNonNullish(pagingOptions.offset);
      query = query.offset(offset);
    }
  }

  return query;
}

export type QuerySetConstructor<Q extends IQuerySet<T>, T extends DT.IDocument> = (collectionDescriptor: ST.ITypedCollectionDescriptor<T>) => Q;

export interface IQuerySet<T extends DT.IDocument> {
  readonly collectionDescriptor: ST.ITypedCollectionDescriptor<T>;
  documentProxyConstructor: BT.ProxyFunc<T>;
  getById(ds: FB.IDataStorageState, id: string): Promise<T | null>;
  getByIdWithAssert(ds: FB.IDataStorageState, id: string, assertionFailureMessage?: string): Promise<T>;
  getForIds(ds: FB.IDataStorageState, ids: Array<string>, pathFromRoot?: Array<ST.INestedCollectionStep> | undefined, queryOptions?: IQueryOptions | undefined): Promise<Array<T>>;
  getForIdsWithAssert(ds: FB.IDataStorageState, ids: Array<string>, pathFromRoot?: Array<ST.INestedCollectionStep> | undefined, queryOptions?: IQueryOptions | undefined, assertionFailureMessage?: string): Promise<Array<T>>; // eslint-disable-line max-len
  getAll(ds: FB.IDataStorageState, pathFromRoot?: Array<ST.INestedCollectionStep> | undefined, queryOptions?: IQueryOptions | undefined): Promise<Array<T>>;
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
   * @param {Array<ST.INestedCollectionStep> | undefined} [pathFromRoot=undefined] The path to the nested Collection from the root of the database.
   * @param {IQueryOptions | undefined} [queryOptions=undefined] The query options to apply prior to executing the query.
   * @return {Promise<Array<T>>} The Documents corresponding to the IDs.
   */
  async getForIds(ds: FB.IDataStorageState, ids: Array<string>, pathFromRoot?: Array<ST.INestedCollectionStep> | undefined, queryOptions?: IQueryOptions | undefined): Promise<Array<T>> {
    FB.assertDataStorageStateIsNotNullish(ds);
    FB.assertFirestoreIsNotNullish(ds.db);
    TC.assertNonNullish(ids);
    ids.forEach((id) => BT.assertIdentifierIsValid(id));

    if (ids.length <= 0) {
      return ([] as Array<T>);
    }

    let collectionSource = ((null as unknown) as CollectionSource<T>);
    if (TC.isNullish(pathFromRoot) && this.collectionDescriptor.isNestedCollection) {
      collectionSource = this.collectionDescriptor.getTypedCollectionGroup(ds);
    } else {
      collectionSource = this.collectionDescriptor.getTypedCollection(ds, pathFromRoot);
    }

    let querySource: QuerySource<T>;
    querySource = collectionSource.where(DT.IDocument_DocumentId_PropertyName, "in", ids);
    querySource = applyQueryOptions(querySource, queryOptions);
    const querySnap = await querySource.get();
    const documentSnaps = querySnap.docs;

    if (TC.isNullish(documentSnaps)) {
      return ([] as Array<T>);
    }

    const documents = documentSnaps.map((value) => value.data());
    const documentsMap = CL.createMapFromArray(documents, (document) => document.id);
    const documentsInputOrdered = ids.map((id) => TC.convertNonNullish(documentsMap.get(id)));
    const proxiedDocuments = documentsInputOrdered.map((document) => this.documentProxyConstructor(document));
    return proxiedDocuments;
  }

  /**
   * Gets the Documents whose IDs are in the specified list and asserts that all Documents are present (i.e. length of result matches length of input)
   * and valid (i.e. are non-null and have non-null "id" property).
   * @param {FB.IDataStorageState} ds The state container for data storage.
   * @param {Array<string>} ids The IDs for the Documents within the OPA system.
   * @param {Array<ST.INestedCollectionStep> | undefined} [pathFromRoot=undefined] The path to the nested Collection from the root of the database.
   * @param {IQueryOptions | undefined} [queryOptions=undefined] The query options to apply prior to executing the query.
   * @param {string} [assertionFailureMessage=default] The message to include in the Error if the assertion fails.
   * @return {Promise<Array<T>>} The Documents corresponding to the IDs.
   */
  async getForIdsWithAssert(ds: FB.IDataStorageState, ids: Array<string>, pathFromRoot?: Array<ST.INestedCollectionStep> | undefined, queryOptions?: IQueryOptions | undefined, assertionFailureMessage = "The resulting list of documents does not match the requested list of IDs."): Promise<Array<T>> { // eslint-disable-line max-len
    const documents = await this.getForIds(ds, ids, pathFromRoot, queryOptions);
    TC.assertNonNullish(documents, assertionFailureMessage);
    VC.assertIsTrue((documents.length == ids.length), assertionFailureMessage);
    documents.forEach((document) => DT.assertDocumentIsValid(document, assertionFailureMessage, assertionFailureMessage));
    return documents;
  }

  /**
   * Gets all Documents in a specific Collection (or Collection Group, if no pathFromRoot is provided for a nested Collection).
   * @param {FB.IDataStorageState} ds The state container for data storage.
   * @param {Array<ST.INestedCollectionStep> | undefined} [pathFromRoot=undefined] The path to the nested Collection from the root of the database.
   * @param {IQueryOptions | undefined} [queryOptions=undefined] The query options to apply prior to executing the query.
   * @return {Promise<Array<T>>} The list of Documents in the Collection.
   */
  async getAll(ds: FB.IDataStorageState, pathFromRoot?: Array<ST.INestedCollectionStep> | undefined, queryOptions?: IQueryOptions | undefined): Promise<Array<T>> {
    FB.assertDataStorageStateIsNotNullish(ds);
    FB.assertFirestoreIsNotNullish(ds.db);

    let collectionSource = ((null as unknown) as CollectionSource<T>);
    if (TC.isNullish(pathFromRoot) && this.collectionDescriptor.isNestedCollection) {
      collectionSource = this.collectionDescriptor.getTypedCollectionGroup(ds);
    } else {
      collectionSource = this.collectionDescriptor.getTypedCollection(ds, pathFromRoot);
    }

    let querySource: QuerySource<T>;
    querySource = collectionSource;
    querySource = applyQueryOptions(querySource, queryOptions);
    const querySnap = await querySource.get();
    const documentSnaps = querySnap.docs;

    if (TC.isNullish(documentSnaps)) {
      return ([] as Array<T>);
    }

    const documents = documentSnaps.map((value) => value.data());
    const proxiedDocuments = documents.map((document) => this.documentProxyConstructor(document));
    return proxiedDocuments;
  }
}

import * as BT from "./BaseTypes";
import * as TC from "./TypeChecking";

// export const name = "Storage";

export const CollectionDescriptors: BT.IDictionary<ICollectionDescriptor> = {};

export interface ICollectionDescriptor {
  readonly singularName: string;
  readonly pluralName: string;
  readonly isSingleton: boolean;
  readonly isNestedCollection: boolean;
  readonly collectionName: string;
}

export interface ITypedCollectionDescriptor<T> extends ICollectionDescriptor {
  readonly requiredDocuments: Array<T>;
  castTo(document: unknown): T;
}

/** Class providing consistent, type-safe values for use in queries. */
export class CollectionDescriptor<T> extends Object implements ITypedCollectionDescriptor<T>, ICollectionDescriptor {
  private _singularName: string;
  private _pluralName: string;
  private _isSingleton: boolean;
  private _isNestedCollection: boolean;
  private _requiredDocuments: Array<T>;

  /**
    * Creates a CollectionDescriptor<T>.
    * @param {string} singularName The name for a single document of the type T.
    * @param {string} pluralName The name for multiple documents of the type T.
    * @param {boolean} isSingleton Whether the collection is ONLY allowed to contain a single document of type T or not.
    * @param {boolean} isNestedCollection Whether the collection is nested inside a parent collection or not.
    * @param {Array<T>} [requiredDocuments=[]] The list of documents that must exist in a valid installation of the system.
    */
  constructor(singularName: string, pluralName: string, isSingleton: boolean, isNestedCollection: boolean, requiredDocuments: Array<T> = []) {
    super();
    this._singularName = singularName;
    this._pluralName = pluralName;
    this._isSingleton = isSingleton;
    this._isNestedCollection = isNestedCollection;
    this._requiredDocuments = requiredDocuments;
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
    return this._isNestedCollection;
  }

  /**
    * The name to use for querying the collection.
    * @type {string}
    */
  get collectionName(): string {
    return (this.isSingleton) ? this.singularName : this.pluralName;
  }

  /**
    * The list of documents that must exist in a valid installation of the system.
    * @type {Array<T>}
    */
  get requiredDocuments(): Array<T> {
    return this._requiredDocuments.slice();
  }

  /**
    * Casts and
    * @param {unknown} document The untyped document to cast.
    * @return {T} The typed document.
    */
  castTo(document: unknown): T {
    if (TC.isNullish(document)) {
      throw new Error("A valid document (i.e. non-undefined AND non-null) must be supplied for casting.");
    }

    return (document as T);
  }
}

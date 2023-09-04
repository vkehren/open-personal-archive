import * as firestore from "@google-cloud/firestore";
import * as BT from "./BaseTypes";
import * as FB from "./Firebase";
import * as ST from "./Storage";
import * as TC from "./TypeChecking";

// export const name = "Queries";

export type QuerySetConstructor<Q extends IQuerySet<T>, T extends BT.IDocument> = (collectionDescriptor: ST.ITypedCollectionDescriptor<T>) => Q;

export interface IQuerySet<T extends BT.IDocument> {
  readonly collectionDescriptor: ST.ITypedCollectionDescriptor<T>;
  getById(db: firestore.Firestore, id: string): Promise<T | null>;
  getAll(db: firestore.Firestore, pathFromRoot?: Array<ST.INestedCollectionStep> | undefined): Promise<Array<T>>;
}

/** Base class for providing queries for a collection. */
export class QuerySet<T extends BT.IDocument> implements IQuerySet<T> {
  private _collectionDescriptor: ST.ITypedCollectionDescriptor<T>;

  /**
    * Creates a QuerySet<T>.
    * @param {ST.ITypedCollectionDescriptor<T>} collectionDescriptor The collection descriptor to use for queries.
    */
  constructor(collectionDescriptor: ST.ITypedCollectionDescriptor<T>) {
    this._collectionDescriptor = collectionDescriptor;
  }

  /**
    * The collection descriptor to use for queries.
    * @type {ST.ITypedCollectionDescriptor<T>}
    */
  get collectionDescriptor(): ST.ITypedCollectionDescriptor<T> {
    return this._collectionDescriptor;
  }

  /**
   * Gets a Document by that Document's ID.
   * @param {Firestore} db The Firestore Database to read from.
   * @param {string} id The ID for the Document within the OPA system.
   * @return {Promise<T | null>} The Document corresponding to the ID, or null if none exists.
   */
  async getById(db: firestore.Firestore, id: string): Promise<T | null> {
    FB.assertFirestoreIsNotNullish(db);
    FB.assertIdentifierIsValid(id);

    let documentSnap: firestore.DocumentSnapshot<T> | null = null;

    if (this.collectionDescriptor.isNestedCollection) {
      const collectionGroup = this.collectionDescriptor.getTypedCollectionGroup(db);
      const querySnap = await collectionGroup.where(BT.IDocument_DocumentId_PropertyName, "==", id).get();
      documentSnap = (querySnap.docs.length > 0) ? querySnap.docs[0] : null;
    } else {
      const collectionRef = this.collectionDescriptor.getTypedCollection(db);
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
    return TC.convertNonNullish(document);
  }

  /**
   * Gets all Documents in a specific Collection (or Collection Group, if no pathFromRoot is provided for a nested Collection).
   * @param {Firestore} db The Firestore Database to read from.
   * @param {Array<ST.INestedCollectionStep> | undefined} [pathFromRoot=undefined] The path to the nested Collection from the root of the database.
   * @return {Promise<Array<T>>} The list of Documents in the Collection.
   */
  async getAll(db: firestore.Firestore, pathFromRoot?: Array<ST.INestedCollectionStep> | undefined): Promise<Array<T>> {
    FB.assertFirestoreIsNotNullish(db);

    if (TC.isNullish(pathFromRoot) && this.collectionDescriptor.isNestedCollection) {
      const collectionGroup = this.collectionDescriptor.getTypedCollectionGroup(db);
      const querySnap = await collectionGroup.get();
      const documents = querySnap.docs.map((value) => value.data());
      return documents;
    } else {
      const collectionRef = this.collectionDescriptor.getTypedCollection(db, pathFromRoot);
      const querySnap = await collectionRef.get();
      const documents = querySnap.docs.map((value) => value.data());
      return documents;
    }
  }
}

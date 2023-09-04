import * as BT from "./BaseTypes";
import * as TC from "./TypeChecking";
import * as VC from "./ValueChecking";

// export const name = "Collections";

/**
 * Creates a Map from the specified Array of complex values.
 * @param {Array<T>} array The Array of values.
 * @param {BT.GetterFunc<T, K>} keyGetterFunc The getter function for getting a key from an element in the Array.
 * @param {BT.GetterFunc<T, V> | undefined} valueGetterFunc The getter function for getting a value from an element in the Array.
 * @return {Map<K, V>} The size of the value.
 */
export function createMapFromComplexArray<T, K, V>(array: Array<T>, keyGetterFunc: BT.GetterFunc<T, K>, valueGetterFunc: BT.GetterFunc<T, V> | undefined = undefined): Map<K, V> {
  if (TC.isNullish(array)) {
    throw new Error("The incoming array of values must NOT be undefined or null.");
  }
  if (TC.isNullish(keyGetterFunc)) {
    throw new Error("The key getter function must NOT be undefined or null.");
  }
  if (TC.isNullish(valueGetterFunc)) {
    valueGetterFunc = (t) => TC.convertTo<V>(t);
  }
  const valueGetterFuncNonNull = TC.convertNonNullish(valueGetterFunc);

  const map = new Map<K, V>();
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    const key = keyGetterFunc(element);
    const value = valueGetterFuncNonNull(element);
    map.set(key, value);
  }
  return map;
}

/**
 * Creates a Map from the specified Array.
 * @param {Array<V>} array The Array of values.
 * @param {BT.GetterFunc<V, K>} keyGetterFunc The getter function for getting a key from an element in the Array.
 * @return {Map<K, V>} The size of the value.
 */
export function createMapFromArray<K, V>(array: Array<V>, keyGetterFunc: BT.GetterFunc<V, K>): Map<K, V> {
  if (TC.isNullish(array)) {
    throw new Error("The incoming array of values must NOT be undefined or null.");
  }
  if (TC.isNullish(keyGetterFunc)) {
    throw new Error("The key getter function must NOT be undefined or null.");
  }

  const map = new Map<K, V>();
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    const key = keyGetterFunc(element);
    map.set(key, element);
  }
  return map;
}

/**
 * Takes in a container object and returns an array of values of type T contained in that object.
 * @param {unknown} container The container object.
 * @param {BT.GuardFunc<T>} guardFunc The guard function to apply to check type T.
 * @param {BT.FilterFunc<T> | undefined} [filterFunc=undefined] The filter function to apply to include results.
 * @return {Array<T>} The list of contained values of type T.
 */
export function getCollectionFromObject<T>(container: unknown, guardFunc: BT.GuardFunc<T>, filterFunc: BT.FilterFunc<T> | undefined = undefined): Array<T> {
  const result: Array<T> = [];
  if (TC.isNullishOrEmpty(container)) {
    return result;
  }
  if (!TC.isObject(container)) {
    return result;
  }

  const containerDict = (container as BT.IDictionary<T>);
  const ownPropertyKeys = VC.getOwnPropertyKeys(container);

  for (let i = 0; i < ownPropertyKeys.length; i++) {
    const key = ownPropertyKeys[i];
    const value = containerDict[key];

    if (!TC.isNullish(value) && TC.isOf<T>(value, guardFunc)) {
      if (TC.isNullish(filterFunc)) {
        result.push(value);
      } else {
        const filterFuncNonNull = TC.convertTo<BT.FilterFunc<T>>(filterFunc);
        if (filterFuncNonNull(value)) {
          result.push(value);
        }
      }
    }
  }
  return result;
}

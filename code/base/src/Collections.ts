import * as BT from "./BaseTypes";
import * as TC from "./TypeChecking";

// export const name = "Collections";

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

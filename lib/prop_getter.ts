function getNestedProperty(obj: Record<string, any>, key: string) {
  // Split the key by dots
  let keys = key.split(".");
  // Start with the given object
  let value = obj;
  // Loop through the keys array
  for (let k of keys) {
    // If the current value is an object and has the current key as a property
    if (typeof value === "object" && value.hasOwnProperty(k)) {
      // Update the value to be that property's value
      value = value[k];
    } else {
      // Otherwise return undefined
      return undefined;
    }
  }
  // Return the final value
  return value;
}
export default getNestedProperty;

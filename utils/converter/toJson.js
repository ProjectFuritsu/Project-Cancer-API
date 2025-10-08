
/**
 * 
 * @param {Array} arr 
 * @param {Array<String> || <int>} keysPerObject 
 * @returns Json Array
 */
function arrayToJson(arr, keysPerObject = ["name", "desc"]) {
  const result = [];
  for (let i = 0; i < arr.length; i += keysPerObject.length) {
    const obj = {};
    keysPerObject.forEach((key, j) => {
      obj[key] = arr[i + j];
    });
    result.push(obj);
  }
  return result;
}
export default arrayToJson;
/**
 * 
 * @param {Object} obj - Object to parse 
 * @param {String} keyname - Keyname to search for
 * @returns 
 */
 export function recurseForObjectKey(obj, keyname) {
     let foundKeyVals = {};
     const recurse = (obj) => {
        if (!obj) { return {} }
        for (let key of Object.keys(obj)) {
            // Found ABI
            if (key === keyname) {
                foundKeyVals = obj[key];
            }
            // If not ABI, try and recurse
            if (typeof obj[key] === "object") {
                recurse(obj[key]);
            } else {
                continue;
            }
        }
    }
    recurse(obj)
    return foundKeyVals;
}
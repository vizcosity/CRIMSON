var acr_sample = require('./frontend/src/assets/acr/acr_sample_full.json');

// Performs a deep search across the JSON object for instances of a given field by key, and returns an array of all values discovered.
function findAllInstancesOfPropertyByKeyInJSON(object, desiredKey, values = []) {

    // console.log(object, desiredKey);

    if (object[desiredKey]) return values.concat([object[desiredKey]])

    if (!object || typeof object !== 'object')
        return values;

    for (var key in object) {
        values = values.concat(findAllInstancesOfPropertyByKeyInJSON(object[key], desiredKey, []));
    }

    return values
}
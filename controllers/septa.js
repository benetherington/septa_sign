const {getStops} = require('../septa/api');

const stops = {};

module.exports.getStops = async (routeId) => {
    // Cache stops while the server is awake
    if (!stops[routeId]) stops[routeId] = await getStops(routeId);
    return stops[routeId];
};

const db = require('../db');
const api = require('../septa/api');
const routes = require('../septa/bus_routes');

module.exports.getConfig = async () => {
    const rawConfig = await db.getConfig();

    const stops = await Promise.all(rawConfig.stops.map(getStopFromAddr));
    return {config: {stops}};
};

const getStopFromAddr = async (addr) => {
    const [routeId, stopId] = addr.split('/');

    // Get route info
    const routeName = routes.find(([id]) => id === routeId)[1];

    // Get stop info
    const stops = await api.getStops(routeId);
    const stop = stops.find(({stopid}) => stopid === stopId);
    const stopName = stops.stopname;

    return {routeId, stopId, routeName, stopName};
};

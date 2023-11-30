const api = require('../septa/api');
const db = require('../db');
const routes = require('../septa/bus_routes');

const stops = {};

module.exports.getStops = async (routeId) => {
    // Cache stops while the server is awake
    if (!stops[routeId]) stops[routeId] = await api.getStops(routeId);
    return stops[routeId];
};

module.exports.getArrivals = async () => {
    const config = await db.getConfig();
    const addrs = config.stops;
    const arrivals = await Promise.all(
        addrs.map(async (addr) => {
            // Get arrivals for this stop
            const [routeId, stopid] = addr.split('/');
            const arrivals = await api.getBusArrivals(routeId, {stopid});

            // Add stop name
            const route = routes.find(([id]) => id === routeId);
            arrivals.forEach((arrival) => {
                arrival.routeName = route[1];
            });

            return arrivals;
        }),
    );

    return arrivals.flat();
};

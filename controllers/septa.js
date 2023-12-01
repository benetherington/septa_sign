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

            // Get route name
            const route = routes.find(([id]) => id === routeId);
            const routeName = route[1];

            // Get stop name
            const stops = await this.getStops(routeId);
            const stop = stops.find((stop) => stop.stopid === stopid);
            const stopName = stop.stopname;

            // Filter down to needed info
            return arrivals.map(
                ({
                    arrival,
                    Direction: direction,
                    estimated_seat_availability: seats,
                    isNextStop,
                }) => ({
                    arrival,
                    direction,
                    seats,
                    isNextStop,
                    routeName,
                    stopName,
                }),
            );
        }),
    );

    return arrivals.flat();
};

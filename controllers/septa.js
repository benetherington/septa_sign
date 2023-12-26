const api = require('../septa/api');
const db = require('../db');
const routes = require('../septa/bus_routes');

const stops = {};

module.exports.getStops = async (routeId) => {
    // Cache stops while the server is awake
    if (!stops[routeId]) stops[routeId] = await api.getStops(routeId);
    return stops[routeId];
};

/**
 * @typedef EnrichedBusArrivalObject
 * @property {number} arrival
 * @property {string} direction
 * @property {string} seats
 * @property {boolean} isNextStop
 * @property {string} routeName
 * @property {string} stopName
 * @property {[number, number, number][]} colors
 */
/**
 * @returns {EnrichedBusArrivalObject[]}
 */
module.exports.getArrivals = async () => {
    const config = await db.getConfig();
    const addrs = config.stops;
    const arrivals = await Promise.all(
        addrs.map(async (addr) => {
            // Get display config
            const displayConfig = await db.getStopDisplayConfig(addr);

            // Get arrivals for this stop
            const [routeId, stopid] = addr.split('/');
            const arrivals = await api.getBusArrivals(routeId, {stopid});

            // Get route name
            const route = routes.find(([id]) => id === routeId);
            const routeName = route[1];

            // Get saved nickname
            let stopName = displayConfig.nickname;

            // Use actual stop name if nickname isn't set
            if (!stopName) {
                const stops = await this.getStops(routeId);
                const stop = stops.find((stop) => stop.stopid === stopid);
                if (stop == null) return [];
                stopName = stop.stopname;
            }

            // Get route colors
            const colors = [
                displayConfig.routeColor,
                displayConfig.arrivalColor,
            ];

            // Filter, rename, and add stop data to each arrival
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
                    colors,
                }),
            );
        }),
    );

    return arrivals.flat();
};

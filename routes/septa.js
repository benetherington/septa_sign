const busRoutes = require('../septa/bus_routes.js');
const controller = require('../controllers/septa');

module.exports = (app) => {
    app.get('/septa/bus/routes', (req, res) => res.send(busRoutes));

    app.get('/septa/bus/route/:route_id', async (req, res) => {
        const data = await controller.getStops(req.params.route_id);
        res.send(data);
    });

    /**
     * Arrivals route returns EnrichedBusArrivalObject[]:
     * @property {number} arrival
     * @property {string} direction
     * @property {string} seats
     * @property {boolean} isNextStop
     * @property {string} routeName
     * @property {string} stopName
     * @property {[number, number, number][]} colors
     */
    app.get('/septa/bus/arrivals', async (req, res) => {
        const data = await controller.getArrivals();
        res.send(data);
    });
};

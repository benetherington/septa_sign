const busRoutes = require('../septa/bus_routes.js');
const controller = require('../controllers/septa');

module.exports = (app) => {
    app.get('/septa/bus/routes', (req, res) => res.send(busRoutes));

    app.get('/septa/bus/route/:route_id', async (req, res) => {
        const data = await controller.getStops(req.params.route_id);
        res.send(data);
    });

    /**
     * Arrivals route returns a list with objects like:
     * @property {*} lat
     * @property {*} lng
     * @property {*} label
     * @property {*} route_id
     * @property {*} trip
     * @property {*} VehicleID
     * @property {*} BlockID
     * @property {*} Direction
     * @property {*} destination
     * @property {*} heading
     * @property {*} late
     * @property {*} next_stop_id
     * @property {*} next_stop_name
     * @property {*} next_stop_sequence
     * @property {*} estimated_seat_availability
     * @property {*} Offset
     * @property {*} Offset_sec
     * @property {*} timestamp
     * @property {*} isNextStop
     * @property {*} arrival
     * @property {*} routeName
     */
    app.get('/septa/bus/arrivals', async (req, res) => {
        const data = await controller.getArrivals();
        res.send(data);
    });
};

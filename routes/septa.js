const busRoutes = require('../septa/bus_routes.js');
const controller = require('../controllers/septa');

module.exports = (app) => {
    app.get('/septa/bus/routes', (req, res) => res.send(busRoutes));

    app.get('/septa/bus/route/:route_id', async (req, res) => {
        const data = await controller.getStops(req.params.route_id);
        res.send(data);
    });

    app.get('/septa/bus/arrivals', async (req, res) => {
        const data = await controller.getArrivals();
        res.send(data);
    });
};

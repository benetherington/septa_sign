const busRoutes = require('../septa/bus_routes.js');
const {getStops, getBusArrivals} = require('../septa/api');

module.exports = (app) => {
    app.get('/septa/bus/routes', (req, res) => res.send(busRoutes));

    app.get('/septa/bus/route/:route_id', async (req, res) => {
        const data = await getStops(req.params.route_id);
        res.send(data);
    });

    app.get('/septa/bus/route/:route_id/stopArrivals', async (req, res) => {
        const data = await getBusArrivals(req.params.route_id, req.query);
        res.send(data);
    });
};

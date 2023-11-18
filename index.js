const {
    getStops,
    getBusses,
    getBusSchedule,
    getBusArrivals,
} = require('./septa/api.js');

/*------*\
  SERVER
\*------*/
const express = require('express');
const app = express();
const port = 8080;

/*-------------*\
  STATIC ROUTES
\*-------------*/
app.use(express.static('./src'));

/*------------*\
  SEPTA ROUTES
\*------------*/
app.get('/septa/bus/routes', (req, res) =>
    res.send(require('./septa/bus_routes.js')),
);

app.get('/septa/bus/route/:route_id', async (req, res) => {
    const data = await getStops(req.params.route_id);
    res.send(data);
});

app.get('/septa/bus/route/:route_id/stopArrivals', async (req, res) => {
    const data = await getBusArrivals(req.params.route_id, req.query);
    res.send(data);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

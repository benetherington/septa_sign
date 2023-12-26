const db = require('../db.js');
const controller = require('../controllers/config');

module.exports = (app) => {
    app.get('/config', async (req, res) => {
        const data = await controller.getConfig();
        res.send(data);
    });

    app.get('/config/:routeId/:stopId', async (req, res) => {
        const {routeId, stopId} = req.params;
        const stop = `${routeId}/${stopId}`;

        const data = await db.getStopDisplayConfig(stop);
        res.send(data);
    });

    app.post('/config/stop', async (req, res) => {
        const [status, message] = await db.addStop(req.body);
        res.status(status);
        if (message) return res.send(message);
        else res.send();
    });

    app.put('/config/:routeId/:stopId', async (req, res) => {
        const {routeId, stopId} = req.params;
        const stop = `${routeId}/${stopId}`;

        const [status, message] = await db.updateStopDisplayConfig(
            stop,
            req.body,
        );
        res.status(status);
        if (message) return res.send(message);
        else res.send();
    });

    app.delete('/config/stop', async (req, res) => {
        const [status, message] = await db.removeStop(req.body);
        res.status(status);
        if (message) return res.send(message);
        else res.send();
    });
};

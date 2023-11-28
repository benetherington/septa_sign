const db = require('../db.js');

module.exports = (app) => {
    app.get('/config', async (req, res) => {
        const data = await db.getConfig();
        res.send(data);
    });

    app.post('/config/stop', async (req, res) => {
        const [status, message] = await db.addStop(req.body);
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

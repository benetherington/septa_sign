const db = require('../db');
const controller = require('../controllers/directive');

module.exports = (app) => {
    app.get('/septa-sign/directive', async (req, res) => {
        const directive = await controller.get();
        res.send(directive);
    });

    app.get('/septa-sign/schedule', async (req, res) => {
        const schedule = await db.getSchedule();
        res.send(schedule);
    });
    app.put('/septa-sign/schedule', async (req, res) => {
        const [status, message] = await db.setSchedule(req.body);
        res.status(status);
        if (message) return res.send(message);
        else res.send();
    });
};

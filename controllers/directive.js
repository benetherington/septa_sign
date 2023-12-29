const db = require('../db');
const septa = require('./septa');

/**
 * @typedef ScheduleDay
 * @type {ScheduleHour[]}
 */
/**
 * @typedef ScheduleHour
 * @property {String} [image]
 * @property {Array} [arrivals]
 */
module.exports.get = async () => {
    // Get today's schedule
    const scheduleToday = await db.getScheduleToday();

    // Get this hour's schedule
    const hourIdx = new Date().getUTCHours() - 1;
    const scheduleHour = scheduleToday[hourIdx];

    // Return arrivals as default
    if (scheduleHour == null || scheduleHour === 'arrivals') {
        const arrivals = await septa.getArrivals();
        return {arrivals};
    }

    // Return an image
    return {image: scheduleHour};
};

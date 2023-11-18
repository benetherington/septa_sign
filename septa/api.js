const apiFetch = async (path, params = {}) => {
    const url = new URL('https://www3.septa.org/api/' + path);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

    const headers = {Accept: 'application/json'};
    const mode = 'cors';

    const resp = await fetch(url, {headers, mode});
    try {
        return resp.json();
    } catch {
        console.error(`Opaque fetch failed for ${url}`);
    }
};

/*---*\
  BUS
\*---*/

/**
 * @typedef StopsBus
 * @type {object}
 * @property {string} lng
 * @property {string} lat
 * @property {string} stopid
 * @property {string} stopname
 */

/**
 * @param {string} route route ID
 * @returns {Promise<StopsBus[]>}
 */
module.exports.getStops = (route) => apiFetch('Stops/index.php', {req1: route});

/**
 * @typedef TransitViewBus
 * @type {object}
 * @property {string} lat
 * @property {string} lng
 * @property {string} label
 * @property {string} route_id
 * @property {string} trip
 * @property {string} VehicleID
 * @property {string} BlockID
 * @property {string} Direction
 * @property {string} destination
 * @property {number} heading
 * @property {number} late
 * @property {string} next_stop_id
 * @property {string} next_stop_name
 * @property {number} next_stop_sequence
 * @property {string} estimated_seat_availability
 * @property {number} Offset
 * @property {string} Offset_sec
 * @property {number} timestamp
 * @property {number} [arrival] Estimated time to arrive in ms
 * @property {boolean} [isNextStop] Bus is headed to this stop next
 */
/**
 * @param {string} route route ID
 * @returns {Promise<{bus: TransitViewBus[]}>}
 */
module.exports.getBusses = (route) =>
    apiFetch('TransitView/index.php', {route});

/**
 * @typedef BusSchedulesSchedule
 * @type {object}
 * @property {string} StopName
 * @property {string} Route
 * @property {string} trip_id
 * @property {string} date
 * @property {string} day
 * @property {string} Direction
 * @property {string} DateCalender
 * @property {string} DirectionDesc
 */
/**
 * @param {string} stop_id
 * @returns {Promise<BusSchedulesSchedule[]>}
 */
module.exports.getBusSchedule = (stop_id) =>
    apiFetch('BusSchedules/index.php', {stop_id});

/**
 * @param {string} route The name of the route to check
 * @param {object} stop The name or ID of the stop to check
 * @param {string} [stop.stopname]
 * @param {string} [stop.stopid]
 * @returns
 */
module.exports.getBusArrivals = async (route, {stopname, stopid}) => {
    // Check that we got a valid stop
    if (!stopname && !stopid)
        throw new Error(`getBusArrivals: Must provide a name or id`);

    // Convert name to ID
    if (!stopid) {
        const stops = await this.getStops(route);
        const stop = stops.find((stop) => stop.stopname === stopname);
        if (!stop)
            throw new Error(`getBusArrivals: Invalid stopname ${stopname}`);
        stopid = stop.stopid;
    }

    // Get this stop's schedule
    const schedules = await this.getBusSchedule(stopid);
    const schedule = schedules[route];
    if (!schedule) return [];

    // Get busses on this route
    const {bus: busses} = await this.getBusses(route);

    // Save busses on trips headed to this stop
    const arrivals = [];
    busses.forEach((bus) => {
        bus.isNextStop = bus.next_stop_id === stopid;

        // Get this bus' schedule
        const trip = schedule.find((s) => s.trip_id === bus.trip);

        // Don't save this bus if it's not coming to this stop
        if (!bus.isNextStop || trip) return;

        // Estimate arrival from timetable
        if (trip) {
            const scheduledArrival = new Date(trip.DateCalender).getTime();
            bus.arrival = scheduledArrival + bus.late * 60 * 1000;
        }

        arrivals.push(bus);
    });

    return arrivals;
};

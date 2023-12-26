const DB_DEFAULT_DATA = {
    config: {
        stops: [],
        display: {},
    },
};
const DEFAULT_DISPLAY_CONFIG = {
    routeColor: [2, 2, 2],
    arrivalColor: [3, 3, 3],
};

/*--------*\
  DB SETUP
\*--------*/
let db;
const doSetup = async () => {
    const {JSONPreset} = await import('lowdb/node');
    db = await JSONPreset('db.json', DB_DEFAULT_DATA);
};
const setup = doSetup();

/*-------*\
  GETTERS
\*-------*/
module.exports.getConfig = async () => {
    await setup;
    await db.read();
    return db.data.config;
};

module.exports.getStopDisplayConfig = async (stop) => {
    await setup;

    // Get display config
    const display = db.data.config.display;
    const stopConfig = display?.[stop];

    // Return saved or default config
    return stopConfig || DEFAULT_DISPLAY_CONFIG;
};

/*-------*\
  SETTERS
\*-------*/
module.exports.addStop = async (stop) => {
    await setup;
    // Check incoming data
    const message = validateStop(stop);
    if (message) return [400, message];

    // Add stop to config
    const stops = new Set(db.data.config.stops);
    stops.add(stop);
    db.data.config.stops = [...stops];

    // Commit data
    await db.write();

    return [201];
};

module.exports.updateStopDisplayConfig = async (stop, displayConfig) => {
    await setup;

    // Check incoming data
    const message = validateStop(stop);
    if (message) return [400, message];

    // Update data
    db.data.config.display[stop] = displayConfig;

    // Commit data
    await db.write();

    return [200];
};

module.exports.removeStop = async (stop) => {
    await setup;

    // Remove stop from list
    const stops = new Set(db.data.config.stops);
    stops.delete(stop);
    db.data.config.stops = [...stops];

    // Commit data
    await db.write();

    return [200];
};

/*----------*\
  VALIDATION
\*----------*/
const validateStop = (stop) => {
    if (stop == null) return 'No stop specified';
    if (typeof stop !== 'string') return 'Stop name must be a string';
    if (!/\w+\/\w+/.test(stop)) return 'Bad format for stop name';
};

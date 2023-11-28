/*--------*\
  DB SETUP
\*--------*/
let db;
const doSetup = async () => {
    const {JSONPreset} = await import('lowdb/node');
    const defaultData = {
        config: {
            stops: [],
        },
    };
    db = await JSONPreset('db.json', defaultData);
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

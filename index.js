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

app.use(express.json({type: 'application/json'}));
app.use(express.text({type: '*/*'}));

/*-------------*\
  STATIC ROUTES
\*-------------*/
app.use(express.static('./src'));

/*--------------*\
  DYNAMIC ROUTES
\*--------------*/
require('./routes/septa.js')(app);
require('./routes/config.js')(app);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

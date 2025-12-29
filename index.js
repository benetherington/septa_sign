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
app.use('/septa-sign', express.static('./src'));

/*--------------*\
  DYNAMIC ROUTES
\*--------------*/
require('./routes/septa.js')(app);
require('./routes/config.js')(app);
require('./routes/directive.js')(app);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

const keys = require('./keys');
var mysql = require('mysql');
// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
var con = mysql.createConnection({
  host: keys.dbHost,
  user: keys.dbUsername,
  password: keys.dbPassword,
  database: keys.dbName
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});
const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get('/', (req, res) => {
  res.send('Hi');
});

app.get('/values/all', (req, res) => {
  con.query('SELECT * FROM `values`', function (err, result, fields) {
    if (err) throw err;
    var string=JSON.stringify(result);
    var json =  JSON.parse(string);

    console.log(json);
    
    res.send(json);
  });

});

app.get('/values/current', (req, res) => {
  con.query('SELECT * FROM `values`', function (err, result, fields) {
    if (err) throw err;
    var string=JSON.stringify(result);
    var json =  JSON.parse(string);

    console.log(json);
    
    res.send(json);
  });
});

app.post('/values', async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  redisClient.hset('values', index, 'Nothing yet!');
  redisPublisher.publish('insert', index);
  con.query('INSERT INTO `values`(number) VALUES(?)', Number([index]));

  res.send({ working: true });
});

app.listen(5000, (err) => {
  console.log('Listening');
});

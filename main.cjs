const mysql = require('mysql2');

const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const _ = require('lodash');
const bodyParser = require('body-parser');

const app = express();


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'project',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

module.exports = promisePool;

import('./JS/login.js')
  .then((login) => {
    login.login(app, __dirname);
  })
  .catch((err) => {
    console.error(err);
  });
  import('./JS/forget.js')
  .then((forget) => {
    forget.forget(app, __dirname);
  })
  .catch((err) => {
    console.error(err);
  });
  
import('./JS/reception.js')
.then((reception) => {
  reception.reception(app, __dirname);
})
.catch((err) => {
  console.error(err);
});
app.use(cors());
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/HTML/login.html');
});

app.listen(8084, function (req, res) {
    console.log('server started on port 8084');
});
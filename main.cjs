// Import required libraries
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');



// Create an instance of Express app
const app = express();

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'complex',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create a promise-based wrapper for the pool
const promisePool = pool.promise();

// Export the promise pool for use in other modules
module.exports = promisePool;

// Import and use userInfo module
import('./JS/userInfo.js')
  .then((userInfo) => {
    userInfo.userInfo(app, __dirname);
  })
  .catch((err) => {
    console.error(err);
  });

// Import and use forget module
import('./JS/invoice.js')
  .then((admin) => {
    admin.admin(app, __dirname);
  })
  .catch((err) => {
    console.error(err);
  });
// Import and use finance module
  import('./JS/finance.js')
  .then((finance) => {
    finance.finance(app, __dirname);
  })
  .catch((err) => {
    console.error(err);
  });

// Import and use patient module
import('./JS/patient.js')
  .then((patient) => {
    patient.patient(app, __dirname);
  })
  .catch((err) => {
    console.error(err);
  });

// Set up middleware
app.use(cors());
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json())

// Define a route to serve the login page
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/HTML/login.html');
});

// Start the server on port 8084
app.listen(8084, function () {
  console.log('Server started on port 8084');
});

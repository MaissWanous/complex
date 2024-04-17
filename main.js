import mysql from 'mysql2';
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const_ = require("lodash");
const bodyparser = require("body-parser");

const app = express();
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'complex'
}).promise()
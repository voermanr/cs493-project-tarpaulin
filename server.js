const express = require('express');
const morgan = require('morgan');

const api = require('./api')

const app = express();

const port = process.env.API_PORT;

app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'));

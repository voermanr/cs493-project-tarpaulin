const express = require('express');
const morgan = require('morgan');
const initDB = require('./config/initDB');

const api = require('./api')
const {connectDB} = require("./lib/mongoConnection");

const app = express();

const port = process.env.API_PORT;

app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'));

async function startYourEngines() {
    await initDB();
    await connectDB();
}

startYourEngines().then(() =>
    app.listen(port, () => {
        console.log(`Server started on port: ${port}`);
}))


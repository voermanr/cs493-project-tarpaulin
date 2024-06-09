const express = require('express');
const morgan = require('morgan');
const initDB = require('./config/initDB');

const api = require('./api')

const app = express();

const port = process.env.API_PORT;

app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'));

async function startYourEngines() {
    await initDB();
}

startYourEngines().then(() =>
    app.listen(port, () => {
        console.log(`Server started on port: ${port}`);
}))

app.use('/', api);

app.use('*', (req, res) => {
    return res.status(404).json({
        error: req.originalUrl + " not found. Move along, citizen."
    });
});

app.use('*', (err, req, res) => {
    console.error("\t>> Error:", err)
    return res.status(500).json({
        error: "Server error. Try that again and see what happens."
    });
});
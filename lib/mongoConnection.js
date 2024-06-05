const {MongoClient} = require("mongodb");
const mongoose = require("mongoose");

let _db;
let _client = null;

module.exports = {
    connectDB: async () => {
            try {
                const mongoHost = process.env.MONGO_HOST;
                const mongoPort = process.env.MONGO_PORT;
                const mongoUser = process.env.MONGO_USER;
                const mongoPassword = process.env.MONGO_PASSWORD;
                const mongoDBName = process.env.MONGO_DB_NAME;
                let mongoURL = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/admin`;

                _client = await MongoClient.connect(mongoURL, {
                    serverSelectionTimeoutMS: 30000,
                })
                mongoURL = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDBName}`;
                await mongoose.connect(mongoURL, {
                    authSource: 'admin'
                });
            }
            catch (err) {
                console.log("Error connecting during connectDB:");
                throw err;
            }
    },

    getDB: () => {
        if (!_client) {
            throw new Error("MongoClient needs to be connected first!");
        }
        else {
            if (!_db) {
                _db = _client.db(process.env.MONGO_DB_NAME);
            }
            return _db
        }
    },
};
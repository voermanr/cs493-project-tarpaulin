const {MongoClient} = require("mongodb");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const mongoose = require("mongoose");


module.exports = async function () {
    let client = null;

    try {
        const mongoURL = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}` +
            `@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/admin`
        client = await MongoClient.connect(mongoURL,
            { serverSelectionTimeoutMS: 30000 }
        );

        const db = client.db();
        await db.command({
            createUser: "dude",
            pwd: "hunter2",
            roles: [{role: "readWrite", db: process.env.MONGO_DB_NAME}]
        });


        await client.close();

    }
    catch (e) {
        console.error("Error creating first user.");
        throw e;
    }

    const db = client.db(process.env.MONGO_DB_NAME);

    try {
        const mongoHost = process.env.MONGO_HOST;
        const mongoPort = process.env.MONGO_PORT;
        const mongoUser = process.env.MONGO_USER;
        const mongoPassword = process.env.MONGO_PASSWORD;
        const mongoDBName = process.env.MONGO_DB_NAME;

        let mongoURL = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDBName}`;
        await mongoose.connect(mongoURL, {
            authSource: 'admin'
        });
        const user = await new User({
            name: "admin administroni",
            passwordHash: await bcrypt.hash("admin", 10),
            email: "admin@gmail.com",
            role: "admin",
        }).save()
    } catch (e) {
        throw e;
    }
}

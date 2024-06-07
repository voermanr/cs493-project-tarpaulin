const mongoConnection = require('./mongoConnection');
const {ObjectId} = require("mongodb");
const User = require('../models/user');

async function isAdmin (req, res, next) {
    const email = req.email;

    try {
        const user = await User.findOne({
            email: email
        });

        if (user) {
            const admin = user.role === 'admin';

            if (admin) {
                next();
            } else {
                res.status(403).json({error: 'Unauthorized'});
            }
        }
        else {
            res.status(401).json({error: 'No user found'});
        }
    } catch (e) { next(e); }
}

async function isOwner (req, res, next) {
    const collectionMap = {
        "users": User
    }

    const email = req.email;

    let user;
    try {
        user = await User.findOne({
            email: email,
        })
    } catch (e) { next(e); }

    let resource;

    if (user) {
        const urlSegments = req.originalUrl.split('/').filter(segment => segment);

        if (urlSegments.length < 2) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        const resourceType = collectionMap[urlSegments[urlSegments.length - 2]];
        const resourceId = new ObjectId(urlSegments[urlSegments.length - 1])

        try {
            resource = await resourceType.findOne({ _id: resourceId });

            if (!resource) {
                return res.status(404).json({error: 'Resource not found'});
            }

            if (user._id.toString() !== resourceId.toString()) {
                return res.status(403).json({error: 'You do not have access to this resource'});
            }

            req.resource = resource;
            next();
        } catch (e) {
            next(e);
        }
    }
}


module.exports = { isAdmin: isAdmin, isOwner: isOwner };
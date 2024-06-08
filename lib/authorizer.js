const mongoConnection = require('./mongoConnection');
const {ObjectId} = require("mongodb");
const User = require('../models/user');
const Course = require('../models/course');

async function isAdmin (req, res, next) {
    const email = req.email;

    try {
        if (!req.user) {
            await User.findOne({ email: email })
        }
        if (req.user) {
            if (req.user.role === 'admin') {
                next();
            } else {
                res.status(403).json({ error: 'Unauthorized' });
            }
        }
        else {
            res.status(401).json({error: 'No user found'});
        }
    } catch (e) { next(e); }
}

async function isOwner (req, res, next) {
    const collectionMap = {
        "users": User,
        "courses": Course,
    }
    try {
        if (!req.user) {
            await User.findOne({ email: email })
        }
        if (req.user) {
            const urlSegments = req.originalUrl.split('/').filter(segment => segment);

            if (urlSegments.length < 2) {
                return res.status(400).json({ error: 'Invalid URL format' });
            }

            const resourceType = collectionMap[urlSegments[urlSegments.length - 2]];
            //console.log(resourceType);


            let urlSegment = urlSegments[urlSegments.length - 1];
            const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(urlSegment);
            if (!isValidObjectId) {
                return res.status(404).json({ error: 'Resource definitely not found.'})
            }
            const resourceId = new ObjectId(urlSegment)
            //console.log(resourceId);

            const resource = await resourceType.findOne({ _id: resourceId });

            if (!resource) {
                return res.status(404).json({error: 'Resource not found'});
            }

            if (req.user._id.toString() !== resourceId.toString() &&
                req.user.role !== 'admin' &&
                req.user._id.toString() !== resource.instructorId?.toString()) {
                return res.status(403).json({error: 'You do not have access to this resource'});
            }

            req.resource = resource;
            next();
        }
        else {
           return res.status(401).json({error: 'No user found'});
        }
    } catch (e) { next(e); }
}


module.exports = { isAdmin: isAdmin, isOwner: isOwner };
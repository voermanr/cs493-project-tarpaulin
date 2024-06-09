const mongoConnection = require('./mongoConnection');
const {ObjectId} = require("mongodb");
const User = require('../models/user');
const Course = require('../models/course');
const Assignment = require('../models/assignment');

async function isAdmin (req, res, next) {
    const email = req.email;

    try {
        //console.log(`\t>> isAdmin()::req.user => ${req.user}\n\t\tlooking up email: ${email}`)
        if (!req.user) {
            req.user = await User.findOne({ email: email })

            //console.log(`\t>> isAdmin()::req.user => ${req.user}`)
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
        "assignments": Course,
    }
    try {
        if (!req.user) {
            req.user = User.findOne({ email: email })
        }
        if (req.user.role === 'admin') {
            next();
        }
        if (req.user) {
            const urlSegments = req.originalUrl.split('/').filter(segment => segment);
            console.log("\t>> old: [0] [1]", urlSegments[0], urlSegments[1]);
            if (urlSegments[0] === 'assignments' && urlSegments[1] === undefined) {
                urlSegments[1] = req.body.courseId
            } else if (urlSegments[0] === 'assignments') {
                const assignment = await Assignment.findById(urlSegments[1]);
                urlSegments[1] = assignment.courseId;
            }
            console.log("\t>> new: [0] [1]", urlSegments[0], urlSegments[1]);

            if (urlSegments.length < 2) {
                return res.status(400).json({ error: 'Invalid URL format' });
            }

            const resourceType = collectionMap[urlSegments[0]];
            //console.log(resourceType);
            let urlSegment = urlSegments[1];
            //console.log('urlSegment: ', urlSegment);
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
                req.user._id.toString() !== resource.instructorId?.toString() &&
                !(resource.courseId in req.user.coursesTeaching) ) {
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
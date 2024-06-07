const {isAuthenticated} = require("../lib/authenicator");
const {isAdmin} = require("../lib/authorizer");
const router = require('express').Router();
const Course = require("../models/course");

exports.router = router;

router.use(isAuthenticated);

router.use(isAdmin);

router.post('/', async (req, res, next) => {
    try {
        const course = await new Course(req.body);
        await course.save();

        res.status(201).json({
            id: course._id,
        })
    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
})
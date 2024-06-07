const {isAuthenticated} = require("../lib/authenicator");
const {isAdmin} = require("../lib/authorizer");
const router = require('express').Router();
const Course = require("../models/course");

exports.router = router;

router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const courses = await Course.find({}).skip(skip).limit(limit).lean()
        res.status(200).json(courses)
    } catch (err) {
        next(err);
    }
})

router.get('/:id', async (req, res, next) => {
    try {
        const course = await Course.findOne(
            { _id: req.params.id },
            '-studentIds -assignmentIds',
        );
        res.status(200).json(course);
    } catch (err) {
        res.status(404).json(
            { error: err.message}
        )}
})

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


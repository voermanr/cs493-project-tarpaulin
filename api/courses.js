const {isAuthenticated} = require("../lib/authenicator");
const {isAdmin, isOwner} = require("../lib/authorizer");
const router = require('express').Router();
const Course = require("../models/course");
const User = require("../models/user");
const err = require("jsonwebtoken/lib/JsonWebTokenError");

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

router.post('/', isAdmin, async (req, res, next) => {
    try {
        const instructor = await User.findById(req.body.instructorId);
        if (!(instructor?.role === 'instructor')) {
            res.status(404).json(
                { error: "Instructor with id: ${req.body.instructorId} not found" }
            )
        }
        else {
            const course = await new Course(req.body);
            await course.save();

            await User.findByIdAndUpdate(
                instructor._id,
                { $addToSet: {coursesTeaching: course._id } },
            );

            res.status(201).json({
                id: course._id,
            })
        }
    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
});

router.delete('/:id', isAdmin, async (req, res, next) => {
    try {
        const deletedCourse = await Course.findByIdAndDelete(req.params.id)
        if (!deletedCourse) {
            console.log('couldnt delete course')
            return res.status(404).json({
                error: "Course not found",
            })
        }
        return res.sendStatus(204);
    } catch (error) {
        next(error);
    }
})

router.use(isOwner);

router.patch('/:id', async (req, res, next) => {
    const id = req.params.id;

    const { studentIds, assignmentIds, instructorId, ...updateData } = req.body;

    if (studentIds || assignmentIds) {
        return res.status(420).status({
            error: "Can't change studentIds or assignmentIds"
        })
    }

    try {
        if (!req.resource) {
            await Course.findById(id)
        }
        const course = req.resource;

        const originalInstructorId = course.instructorId;

        const newInstructorId = req.body.instructorId;
        if (newInstructorId) {
            const instructor = await User.findById(newInstructorId);

            if (!(instructor?.role === 'instructor')) {
                return res.status(404).json(
                    {error: `Instructor with id: ${newInstructorId} not found`}
                )
            }
        }

        const updatedCourse = await Course.findByIdAndUpdate(id, updateData);

        if (!updatedCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const updatedInstructorId = updatedCourse.instructorId;

        if (originalInstructorId !== updatedInstructorId) {
            await User.findByIdAndUpdate(
                updatedInstructorId,
                { $addToSet: { coursesTeaching: updatedCourse._id} }
            );
            await User.findByIdAndUpdate(originalInstructorId,
                { $pull: { coursesTeaching: updatedCourse._id } },
                );
        }

        return res.sendStatus(200);
    } catch (err) {
        next(err);
    }
})


const {isOwner} = require("../lib/authorizer");
const Assignment = require("../models/assignment");
const {isAuthenticated} = require("../lib/authenicator");
const Course = require("../models/course");
const User = require("../models/user");
const router = require('express').Router();
exports.router = router;

router.get('/:id', async (req, res, next) => {
    try {
        const assignment = await Assignment.findById(req.params.id, '-submissionIds')

        if (!assignment) {
            res.status(404).json({error: "No assignment with this id"});
        }

        return res.status(200).send(assignment)
    } catch (error) {
        next(error)
    }

})

router.use(isAuthenticated, isOwner);

router.post('/', async (req, res, next) => {
    try {
        const assignment = await new Assignment(req.body);
        await assignment.save();

        await Course.findByIdAndUpdate(
            assignment.courseId,
            { $addToSet: { assignmentIds: assignment._id } },
        )
        return res.status(201).json({
            id: assignment._id,
        })
    } catch(err) {
        return res.status(400).json({
            error: err.message
        })
    }
})

router.patch('/:id', async (req, res, next) => {
    const id = req.params.id;

    const { submissionIds, ...updateData } = req.body;

    if (submissionIds) {
        return res.status(400).status({
            error: "Can't change submissionIds"
        })
    }

    try {
        const assignment = await Assignment.findById(id)
        const origCourseId = assignment.courseId

        console.log("assignment:", assignment);
        console.log("origCourseId:", origCourseId);
        console.log("updateData:", updateData);

        const updatedAssignment = await Assignment.findByIdAndUpdate(id, updateData);
        console.log("updatedAssignment", updatedAssignment);

        if (!updatedAssignment) {
            return res.status(404).json({ error: 'Course not found' });
        }
        const updatedCourseId = updatedAssignment.courseId;

        if (origCourseId !== updatedCourseId) {
            await Course.findByIdAndUpdate(
                updatedCourseId,
                { $addToSet: { assignmentIds: updatedAssignment._id} }
            );
            await Course.findByIdAndUpdate(
                origCourseId,
                { $pull: { assignmentIds: updatedAssignment._id } },
            );
        }

        return res.sendStatus(200);
    } catch (err) {
        next(err);
    }
})

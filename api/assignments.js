const {isOwner} = require("../lib/authorizer");
const Assignment = require("../models/assignment");
const {isAuthenticated} = require("../lib/authenicator");
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
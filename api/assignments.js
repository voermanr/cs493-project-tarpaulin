const {isOwner, isEnrolled} = require("../lib/authorizer");
const Assignment = require("../models/assignment");
const {isAuthenticated} = require("../lib/authenicator");
const Course = require("../models/course");
const {isValidId, validateId} = require("../lib/validators");
const mongoose = require("mongoose");
const multer = require("multer");
const streamifier = require("streamifier")
const crypto = require("crypto");
const {ObjectId} = require("mongodb");
const router = require('express').Router();
exports.router = router;

router.get('/:id', isValidId, async (req, res, next) => {
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

router.post('/', isAuthenticated, isOwner, async (req, res) => {
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

router.patch('/:id', isValidId, isAuthenticated, isOwner, async (req, res, next) => {
    const id = req.params.id;

    const { submissionIds, ...updateData } = req.body;

    if (submissionIds) {
        return res.status(400).status({
            error: "Can't change submissionIds"
        })
    }

    try {
        const assignment = await Assignment.findById(id)
        if (!assignment) { res.status(404).json({error: "No assignment with this id"}); }

        const origCourseId = assignment.courseId

        ///console.log("assignment:", assignment);
        //console.log("origCourseId:", origCourseId);
        //console.log("updateData:", updateData);

        if (updateData.courseId) {
            if (!validateId(updateData.courseId)) {
                return res.status(404).json({error: "Course not found"});
            }
        }
        const updatedAssignment = await Assignment.findByIdAndUpdate(id, updateData);
        //console.log("updatedAssignment", updatedAssignment);

        if (!updatedAssignment) {
            return res.status(404).json({ error: 'Course not found' });
        }
        const updatedCourseId = updatedAssignment.courseId;

        if (origCourseId !== updatedCourseId) {
            const addedCourse = await Course.findByIdAndUpdate(
                updatedCourseId,
                { $addToSet: { assignmentIds: updatedAssignment._id} }
            );
            if (!addedCourse) {
                return res.status(404).json({ error: 'Course not found' });
            }

            const removedCourse = await Course.findByIdAndUpdate(
                origCourseId,
                { $pull: { assignmentIds: updatedAssignment._id } },
            );
            if (!removedCourse) {
                return res.status(404).json({ error: 'Course not found' });
            }
        }

        return res.sendStatus(200);
    } catch (err) {
        next(err);
    }
})

router.delete('/:id', isValidId, isAuthenticated, isOwner, async (req, res, next) => {
    try {
        const deletedAssignment = await Assignment.findByIdAndDelete(req.params.id)
        if (!deletedAssignment) {
            return res.status(404).json({
                error: "Assignment not found",
            })
        }
        return res.sendStatus(204);
    } catch (error) {
        next(error);
    }
})

function saveFile(submission, metadata) {
    return new Promise((resolve, reject) => {
        try {
            const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
                bucketName: 'submissions',
            });
            console.log("Got a bucket");

            const uploadStream = bucket.openUploadStream(submission.filename, { metadata: metadata });
            console.log("Got upload stream with filename", submission.filename);

            // Ensure proper stream piping and closing
            streamifier.createReadStream(submission.buffer).pipe(uploadStream).on('finish', async () => {
                console.log('Piping finished');
                resolve(uploadStream.id)
            });

        } catch (err) {
            console.log("Caught exception:", err);
            reject(err);
        }
    });
}


const upload = multer({
    storage: multer.memoryStorage()
});

router.post('/:id/submissions', isValidId, isAuthenticated, isEnrolled, upload.single('submission'), async (req, res, next) => {
    if (req.file) {
        console.log("req.file:", req.file);
        req.file.filename = `${crypto.randomBytes(16).toString('hex')}.dat`;

        try {
            const metadata = {
                contentType: req.file.mimetype,
                assignmentId: req.params.id,
                studentId: req.user._id.toString(),
                timestamp: Date.now(),
                grade: 0.0,
            }
            console.log("Trying to save submission.")
            const id = await saveFile(req.file, metadata);

            console.log('I want req.resource to be and Assignment:', req.resource)
            if (!req.resource) {
                req.resource = await Assignment.findById(req.params.id);
            }

            const updatedAssignment = await Assignment.findByIdAndUpdate(req.params.id, {
                $addToSet: {submissionIds: id},
            })
            console.log('I want this assignemnt to be updated:', updatedAssignment)

            if (!updatedAssignment) {
                return res.status(404).json({
                    error: "Assignment not found"
                })
            }

            return res.status(201).json({ id: id})
        } catch (err) {
            next(err);
        }
    } else {
        return res.status(400).json({ error: "Bad body or file"})
    }
})

router.get('/:id/submissions', isValidId, isAuthenticated, isOwner, async (req, res, next) => {
    const studentId = req.query.studentId;
    const assignmentId = req.params.id;
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * limit;

    try {
        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({
                error: "Assignment not found"
            })
        }
        //console.log("assignment:", assignment)
        const submissionIds = assignment.submissionIds.map(id => new ObjectId(id));

        /* query 'submissions.files' for studentId, timestamp, grade, and file for each submissionId in submissionIds */

        const submissions = await mongoose.connection.db.collection('submissions.files').find(
            { _id: { $in: submissionIds },
            ...(studentId && { "metadata.studentId": studentId })
            }).project({
            _id: 0,
            'metadata.assignmentId': 1,
            'metadata.studentId': 1,
            'metadata.timestamp': 1,
            'metadata.grade': 1,
            filename: 1
        }).skip(skip).limit(limit).toArray()
        console.log("Got submissions:", submissions);

        let result = {
            submissions: submissions.map((submission) => ({
                assignmentId: submission.metadata.assignmentId,
                studentId: submission.metadata.studentId,
                timestamp: submission.metadata.timestamp,
                grade: submission.metadata.grade,
                file: submission.filename
            }))
        };
        console.log(result)
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
})
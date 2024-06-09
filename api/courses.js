const {isAuthenticated} = require("../lib/authenicator");
const {isAdmin, isOwner} = require("../lib/authorizer");
const router = require('express').Router();
const Course = require("../models/course");
const User = require("../models/user");
const {stringify} = require('csv-stringify')

exports.router = router;

router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const courses = await Course.find({}).skip(skip).limit(limit).lean()
        return res.status(200).json(courses)
    } catch (err) {
        next(err);
    }
})

router.get('/:id', async (req, res, next) => {
    try {
        let id = req.params.id;
        const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(id);
        if (!isValidObjectId) {
            return res.status(404).json({ error: 'Resource definitely not found.'})
        }
        const course = await Course.findOne(
            { _id: id },
            '-studentIds -assignmentIds',
        );
        if (!course) {
            return res.status(404).json(
                { message: 'Course not found.' }
            )
        }
        return res.status(200).json(course);
    } catch (err) {
        next(err);
    }
})

router.get('/:id/assignments', async (req, res, next) => {
        try {
            const assignments = await Course.findById(
                req.params.id,
                '-_id assignmentIds',
            ).populate('assignmentIds', 'title points due')

            if (!assignments) {
                return res.status(404).json({ error: 'No course with this id'});
            } else {
                return res.status(200).json(assignments);
            }

        } catch(err) {
            next(err);
        }
})

router.use(isAuthenticated)

router.post('/', isAdmin, async (req, res, next) => {
    try {
        const instructor = await User.findById(req.body.instructorId);
        if (!(instructor?.role === 'instructor')) {
            return res.status(404).json(
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

            return res.status(201).json({
                id: course._id,
            })
        }
    } catch (err) {
        return res.status(400).json({
            error: err.message
        });
    }
});

router.delete('/:id', isAdmin, async (req, res, next) => {
    try {
        const deletedCourse = await Course.findByIdAndDelete(req.params.id)
        if (!deletedCourse) {
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

/* Enrollment and Withdrawal functions */
router.post('/:id/students', async (req, res, next) => {
    /* validate request body */
    const validOperations = ['add','remove']
    if (!validOperations.some(key => key in req.body)) {
        return res.status(400).json({
            error: 'You got a bad built, beach blonde butch body.'
        })
    }

    /* verify studentId's are walid and update enrollment*/
    let courseId = req.params.id;
    for (const operation in req.body) {
        if (req.body.hasOwnProperty(operation)) {
            console.log(`req.body[${operation}]`, req.body[operation]);
            for (const studentId of req.body[operation]) {
                console.log('studentId: ', studentId)
                try {
                    if (operation === 'add') {
                        const user = await User.findByIdAndUpdate(
                            {_id: studentId},
                            {$addToSet: {coursesEnrolled: courseId}})
                    }
                    if (operation === 'remove') {
                        const user = await User.findByIdAndUpdate(
                            {_id: studentId},
                            {pull: {coursesEnrolled: courseId}})
                    }
                } catch(err) {
                    next(err);
                }
            }
        }
    }

    try {
        /* update course with new students */
        await Course.findByIdAndUpdate(
            courseId,
            {
                $addToSet: { studentIds: req.body['add'] },
                $pull: { studentIds: req.body['remove'] }
            }
        )
        return res.sendStatus(200);
    } catch (err) {
        next(err);
    }
})

router.get('/:id/students', async (req, res, next) => {
    try {
        const students = await Course.findById(
            req.params.id,
            '-_id studentIds'
        )
        if (!students) {
            return res.status(404).json({
                error: 'Course not found'
            })
        }
        return res.status(200).send(students);
    } catch(err) {
        next(err);
    }
})

/* roster functions */
router.get('/:id/roster', async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id).populate('studentIds', 'name email');

        if (!course) {
            return res.status(404).json({
                error: "Course not found"
            })
        }

        const students = course.studentIds.map(student => ({
            id: student._id.toString(),
            name: student.name,
            email: student.email
        }));

        stringify(students, {}, (err, output) => {
            if (err) {
                return next(err);
            }
            return res.status(200).type('text/csv').send(output);
        });
    } catch (err) {
        next(err);
    }
})
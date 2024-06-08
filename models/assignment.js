const mongoose = require('mongoose');

module.exports = Assignment = new mongoose.model('Assignment', new mongoose.Schema({
    courseId: { type: mongoose.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    points: { type: Number, required: true },
    due : {type: Date, required: true },
    submissionIds: [{ type: mongoose.Types.ObjectId, ref: 'Submission' }],
    })
)
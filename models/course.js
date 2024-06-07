const mongoose = require('mongoose');

module.exports = Course = new mongoose.model('Course', new mongoose.Schema({
    subject: { type: String, required: true },
    number: { type: String, required: true },
    title: { type: String, required: true },
    term: { type: String, required: true },
    instructorId: { type: mongoose.Types.ObjectId, ref: 'User' },
    studentIds: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    assignmentIds: [{ type: mongoose.Types.ObjectId, ref: 'Assignment' }],
})
)
const mongoose = require('mongoose');

module.exports = User = new mongoose.model('User', new mongoose.Schema({
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        role: {
            type: String,
            enum: ['admin', 'instructor', 'student'],
            default: 'student',
            required: true
        },
        coursesEnrolled: [{ type: mongoose.Types.ObjectId, ref: "Course"}],
        coursesTeaching: [{ type: mongoose.Types.ObjectId, ref: "Course"}]
    })
)

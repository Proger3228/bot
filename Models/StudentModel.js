const mongoose = require("mongoose");

const Roles = {
    student: "STUDENT",
    admin: "ADMIN",
    contributor: "CONTRIBUTOR"
};

const studentSchema = mongoose.Schema({
    class: {
        type: mongoose.Schema.ObjectId,
        ref: "Class",
        autopopulate: true
    },
    role: {
        type: String,
        default: Roles.student,
        validate: {
            validator: (role) => Roles[role],
            message: "Role must be one of defined"
        }
    },
    vkId: {
        type: Number,
        required: true,
        unique: true
    },
    isSubscribedToMailing: {
        type: Boolean,
        default: true
    }
});
studentSchema.plugin(require("mongoose-autopopulate"));


module.exports.Roles = Roles;

module.exports = mongoose.model("Student", studentSchema);
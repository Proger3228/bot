const mongoose = require("mongoose");
const {Roles} = require("./utils");

//TODO add validate to vk id (must be integer (not float))
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

module.exports = mongoose.model("Student", studentSchema);
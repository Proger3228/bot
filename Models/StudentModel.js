const mongoose = require("mongoose");
const {Roles} = require("./utils");

const settingsSchema = mongoose.Schema({
    _id: false,
    notificationsEnabled: {
        type: Boolean,
        default: true
    },
    notificationTime: {
        type: String,
        default: "17:00",
        validate: {
            validator: (str) => /[1-9][1-9]:[1-9][1-9]/.test(str),
            message: "Notification time should match template like 00:00"
        }
    }
});

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
            validator: (role) => Roles.includes(role),
            message: "Role must be one of defined"
        }
    },
    vkId: {
        type: Number,
        required: true,
        unique: true,
        validate: {
            validator: Number.isInteger,
            message: "VkId must be integer"
        }
    },
    settings: settingsSchema
});

studentSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Student", studentSchema);
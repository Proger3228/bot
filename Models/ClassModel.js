const mongoose = require("mongoose");

const Lessons = [
    "Математика",
    "Английский",
    "Русский",
    "Экономика",
    "География",
    "Физика",
    "Алгебра",
    "Геометрия",
    "Литература",
    "История",
    "Обществознание",
    "Астрономия",
    "ОБЖ",
    "Информатика",
];

const classSchema = mongoose.Schema({
    students: {
        type: [{
            type: mongoose.Schema.ObjectId,
            ref: "Student",
            autopopulate: true
        }],
        default: []
    },
    name: {
        type: String,
        validate: {
            validator: (name) => {
                if (/(\d)+([A-Z])+/.test(name)) {
                    if ((name.match(/\d/)[0] !== "0" && +name.match(/\d/)[0] <= 11) || name === "0Z") {
                        return true;
                    }
                }
                return false;
            },
            message: "Class name must match digit + letter"
        },
        required: true,
        unique: true
    },
    homework: {
        type: [{
            lesson: {
                required: true,
                type: String,
                validate: {
                    validator: (lessonName) => Lessons.includes(lessonName),
                    message: "Lesson must have one of defined names"
                }
            },
            task: {
                required: true,
                type: String
            },
            to: {
                type: Date,
                default: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
            }
        }],
        default: []
    },
    schedule: {
        type: [[
            {
                name: {
                    required: true,
                    type: String,
                    validate: {
                        validator: (lessonName) => Lessons.includes(lessonName),
                        message: "Lesson must have one of defined names"
                    }
                },
                classRoom: String
            }
        ]],
        default: [],
        validate: {
            validator: (arr) => arr.length <= 7,
            message: "Schedule must contain only one item per day of a week"
        },
    },
    changes: [{
        value: String,
        to: Date
    }],
    roleUpCodes: {
        type: [String],
        default: []
    }
});
classSchema.plugin(require("mongoose-autopopulate"));

module.exports.Lessons = Lessons;

module.exports = mongoose.model("Class", classSchema);
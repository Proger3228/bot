const
    Student = require("./Models/StudentModel"),
    Class = require("./Models/ClassModel"),
    mongoose = require("mongoose");

afterAll(async () => {
    console.log("Clean");
    Student.deleteMany({});
    Class.deleteMany({});
    await mongoose.disconnect();
});
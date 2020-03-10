const Student = require("./Models/StudentModel"),
      Class = require("./Models/ClassModel");

afterAll(async () => {
    console.log("Clean");
    Student.deleteMany({});
    Class.deleteMany({});
});
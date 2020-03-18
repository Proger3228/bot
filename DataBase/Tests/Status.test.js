const
    mongoose = require("mongoose"),
    Student = require("../../Models/StudentModel"),
    {DataBase} = require("../DataBase");

describe("banUser", () => {
    let MockStudent;
    beforeAll(async () => {
        MockStudent = await DataBase.createStudent(Math.ceil(Math.random() * 100));
    });
    afterAll(async () => {
        await Student.deleteMany({});
    });

    it("should set user banned to true", async () => {
        await DataBase.banUser(MockStudent.vkId);

        const updatedStudent = await DataBase.getStudentBy_Id(MockStudent._id);

        return expect(updatedStudent.banned).toBe(true);
    });
    it("should set user banned to false if false is passed as second parameter", async () => {
        await DataBase.banUser(MockStudent.vkId);
        await DataBase.banUser(MockStudent.vkId, false);

        const updatedStudent = await DataBase.getStudentBy_Id(MockStudent._id);

        return expect(updatedStudent.banned).toBe(false);
    })
});
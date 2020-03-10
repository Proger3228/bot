const
    mongoose = require("mongoose"),
    Student = require("../../Models/StudentModel"),
    Class = require("../../Models/ClassModel"),
    {DataBase} = require("../DataBase"),
    {toObject} = require("./utils"),
    {Roles} = require("../../Models/utils");

const createTestData = async () => {
    const Class = await DataBase.createClass(Math.ceil(Math.random() * 100) + "A");
    await Class.save();
    const Student = await DataBase.createStudent(Math.ceil(Math.random() * 100), Class._id);
    await Student.save();
    Class.students.push(Student._id);
    await Class.save();
    await Student.save();
    return {
        Student: await DataBase.getStudentBy_Id(Student._id),
        Class: await DataBase.getClassBy_Id(Class._id)
    }
};

describe("addStudentToClass", () => {
    let MockStudent;
    let MockClass;
    beforeAll(async () => {
        await mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        }, () => console.log("Mongoose successfully connected"));
        mongoose.set("debug", false);
        const {Student: s, Class: c} = await createTestData();
        MockClass = c;
        MockStudent = s;
    });
    afterAll(async () => {
        await Student.deleteMany({});
        await Class.deleteMany({});
        await mongoose.disconnect();
    });
    afterEach(async () => {
        const _class = await DataBase.getClassBy_Id(MockClass._id);
        await _class.updateOne({students: [MockStudent._id]});
        await _class.save();
        const student = await DataBase.getStudentBy_Id(MockStudent._id);
        await student.updateOne({class: MockClass._id});
        await student.save();
    });

    it("should return true if all is ok", async () => {
        const result = await DataBase.addStudentToClass(MockStudent.vkId, MockClass.name);

        return expect(result).toBe(true);
    });
    it("should add student to class and class to student", async () => {
        const newStudent = await DataBase.createStudent(Math.ceil(Math.random() * 100));
        await DataBase.addStudentToClass(newStudent.vkId, MockClass.name);
        const updatedClass = await DataBase.getClassBy_Id(MockClass._id);
        const updatedStudent = await DataBase.getStudentBy_Id(newStudent._id);
        expect(updatedClass.students.some(student => student._id.toString() === updatedStudent._id.toString())).toBe(true);
        expect(updatedStudent.class).toBeTruthy();
        expect(updatedStudent.class._id.toString()).toEqual(updatedClass._id.toString());
        return expect(true).toBe(true);
    });
    it("should return false if class/student are undefined", async () => {
        const resultWithWrongVkId = await DataBase.addStudentToClass(0, MockClass.name);
        const resultWithWrongClassName= await DataBase.addStudentToClass(MockStudent.vkId, "not a name");
        const resultWithBothWrong = await DataBase.addStudentToClass(0, "not a name");

        expect(resultWithWrongVkId).toBe(false);
        expect(resultWithWrongClassName).toBe(false);
        expect(resultWithBothWrong).toBe(false);
        return expect(true).toBe(true);
    });
});

describe("removeStudentFromClass", () => {
    let MockStudent;
    let MockClass;
    beforeAll(async () => {
        await mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        }, () => console.log("Mongoose successfully connected"));
        mongoose.set("debug", false);
        const {Student: s, Class: c} = await createTestData();
        MockClass = c;
        MockStudent = s;
    });
    afterAll(async () => {
        await Student.deleteMany({});
        await Class.deleteMany({});
        await mongoose.disconnect();
    });
    afterEach(async () => {
        const _class = await DataBase.getClassBy_Id(MockClass._id);
        await _class.updateOne({students: [MockStudent._id]});
        await _class.save();
        const student = await DataBase.getStudentBy_Id(MockStudent._id);
        await student.updateOne({class: MockClass._id});
        await student.save();
    });

    it("should return true if all is ok", async () => {
        const result = await DataBase.removeStudentFromClass(MockStudent.vkId);

        return expect(result).toBe(true);
    });
    it("should remove student from class and make student`s class undefined", async () => {
        await DataBase.removeStudentFromClass(MockStudent.vkId);
        const updatedClass = await DataBase.getClassBy_Id(MockClass._id);
        const updatedStudent = await DataBase.getStudentBy_Id(MockStudent._id);
        expect(updatedClass.students.every(student => student._id.toString() !== updatedStudent._id.toString())).toBeTruthy();
        expect(updatedStudent.class).toBeNull();
        return expect(true).toBe(true);
    });
    it("should return true if student haven`t class", async () => {
        await MockStudent.updateOne({class: null});

        const result = await DataBase.removeStudentFromClass(MockStudent.vkId);

        return expect(result).toBe(true);
    });
    it("should return false if student is undefined", async () => {
        const result = await DataBase.removeStudentFromClass(-1);

        return expect(result).toBe(false);
    });
});

describe("changeClass", () => {
    let MockStudent;
    let MockClass;
    beforeAll(async () => {
        await mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        }, () => console.log("Mongoose successfully connected"));
        mongoose.set("debug", false);
        const {Student: s, Class: c} = await createTestData();
        MockClass = c;
        MockStudent = s;
    });
    afterAll(async () => {
        // await Student.deleteMany({});
        // await Class.deleteMany({});
        await mongoose.disconnect();
    });
    afterEach(async () => {
        const _class = await DataBase.getClassBy_Id(MockClass._id);
        await _class.updateOne({students: [MockStudent._id]});
        await _class.save();
        const student = await DataBase.getStudentBy_Id(MockStudent._id);
        await student.updateOne({class: MockClass._id});
        await student.save();
    });

    it("should return true if all is ok", async () => {
        const newClass = await DataBase.createClass(Math.ceil(Math.random() * 100) + "A");
        await newClass.save();
        const result = await DataBase.changeClass(MockStudent.vkId, newClass.name);

        return expect(result).toBe(true);
    });
    it("should change student's class to new class and add student to new class's students", async () => {
        await DataBase.changeClass(MockStudent.vkId, MockClass.name);
        const updatedClass = await DataBase.getClassBy_Id(MockClass._id);
        const updatedStudent = await DataBase.getStudentBy_Id(MockStudent._id);
        expect(updatedClass.students.some(student => student._id.toString() === updatedStudent._id.toString())).toBe(true);
        expect(updatedStudent.class.toString()).toBe(updatedClass._id.toString());
        return expect(true).toBe(true);
    });
    it("should return false if newClass/student are undefined", async () => {
        const newClass = await DataBase.createClass(Math.ceil(Math.random() * 100) + "A");
        await newClass.save();   
        const resultWithWrongVkId = await DataBase.changeClass(0, newClass.name);
        const resultWithWrongClassName= await DataBase.changeClass(MockStudent.vkId, "not a name");
        const resultWithBothWrong = await DataBase.changeClass(0, "not a name");

        expect(resultWithWrongVkId).toBe(false);
        expect(resultWithWrongClassName).toBe(false);
        expect(resultWithBothWrong).toBe(false);
        return expect(true).toBe(true);
    });
    it("should return false if newClass is current user's class", async () => {
        const result = await DataBase.changeClass(MockStudent.vkId, MockClass.name);

        return expect(result).toBe(false);
    })
});

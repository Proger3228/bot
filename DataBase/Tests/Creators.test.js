const
    mongoose = require("mongoose"),
    Student = require("../../Models/StudentModel"),
    Class = require("../../Models/ClassModel"),
    {DataBase} = require("../DataBase");
const {toObject} = require("./stuff/utils");

describe("createStudent", () => {
    beforeAll(async () => {
        mongoose.connect(
            "mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority",
            {
                useNewUrlParser: true,
                useCreateIndex: true,
                useUnifiedTopology: true
            })
        // mongoose.set("debug", true);
    });
    afterAll(async () => {
        Student.deleteMany({});
        Class.deleteMany({});
        await mongoose.disconnect();
    });
    it("should create new student", async () => {
        const vkId = Math.ceil(Math.random() * 100);
        const student = await DataBase.createStudent(vkId);
        return expect(student).toBeTruthy();
    });
    it("should throw TypeError if vkId is not defined", async () => {
        return await DataBase.createStudent()
            .catch(e => expect(e).toBeInstanceOf(TypeError));
    });
    it("should throw TypeError if vkId is not a number", async () => {
        return await DataBase.createStudent()
            .catch(e => expect(e).toBeInstanceOf(TypeError));
    });
    it("should add class property if class_id is passed", async () => {
        const _class = await DataBase.createClass(Math.ceil(Math.random() * 10) + "A");
        const vkId = Math.ceil(Math.random() * 100);
        const student = await DataBase.createStudent(vkId, _class._id);
        return expect(student.class).toBeTruthy();
    });
    it("should not add class property if class with class_id is not exists", async () => {
        const vkId = Math.ceil(Math.random() * 100);
        const student = await DataBase.createStudent(vkId, "5e666472b5e95352409392ec");//not real class_id
        return expect(student.class).toBeFalsy();
    })
});

describe("createClass", () => {
    beforeAll(async () => {
        mongoose.connect(
            "mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority",
            {
                useNewUrlParser: true,
                useCreateIndex: true,
                useUnifiedTopology: true
            })
        // mongoose.set("debug", true);
    });
    afterAll(async () => {
        Class.deleteMany({});
        await mongoose.disconnect();
    });
    it("should create new class", async () => {
        const ClassName = Math.ceil(Math.random() * 10) + "A";
        const _class = await DataBase.createClass(ClassName);
        expect(_class).toBeTruthy();
        expect(_class.name).toBe(ClassName);
        expect(toObject(_class).students).toEqual([]);
        expect(toObject(_class).roleUpCodes).toEqual([]);
        expect(toObject(_class).homework).toEqual([]);
        expect(toObject(_class).schedule).toEqual([]);
        expect(toObject(_class).changes).toEqual([]);
    });
    it("should throw TypeError if className is not defined", async () => {
        return await DataBase.createClass()
            .catch(e => expect(e).toBeInstanceOf(TypeError));
    });
    it("should throw TypeError if className is not a string", async () => {
        return DataBase.createClass(123)
            .catch(e => expect(e).toBeInstanceOf(TypeError));
    });
});
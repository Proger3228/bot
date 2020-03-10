const
    mongoose = require("mongoose"),
    Student = require("../../Models/StudentModel"),
    {DataBase} = require("../DataBase"),
    {Roles} = require("../../Models/utils");


//Getters by _id
describe("getStudentBy_Id", () => {
    beforeAll(async () => {
        await mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        }, () => console.log("Mongoose successfully connected"));
    });
    afterAll(async () => {
        Student.deleteMany({});
        await mongoose.disconnect();
    });

    it("should return right model", async () => {
        const newStudent = await DataBase.createStudent(Math.ceil(Math.random() * 100));
        const student = await DataBase.getStudentBy_Id(newStudent._id);

        return expect(student).toEqual(newStudent);
    });
    it("should null if _id is not in collection", async () => {
        const result = await DataBase.getStudentBy_Id("not even id");

        return expect(result).toBeNull();
    });
    it("should throw error if _id is undefined", async () => {
        return DataBase.getStudentBy_Id()
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
    it("should throw error if _id is not type of string", () => {
        return DataBase.getStudentBy_Id(1488)
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
});
describe("getClassBy_Id", () => {
    beforeAll(async () => {
        await mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        }, () => console.log("Mongoose successfully connected"));
    });
    afterAll(async () => {
        Student.deleteMany({});
        await mongoose.disconnect();
    });

    it("should return right model", async () => {
        const newClass = await DataBase.createClass(Math.ceil(Math.random() * 10) + "A");
        const _class = await DataBase.getClassBy_Id(newClass._id);

        return expect(_class).toEqual(newClass);
    });
    it("should null if _id is not in collection", async () => {
        const result = await DataBase.getClassBy_Id("not and id");

        return expect(result).toBeNull();
    });
    it("should throw error if _id is undefined", () => {
        return DataBase.getClassBy_Id()
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
    it("should throw error if _id is not type of string", () => {
        return DataBase.getClassBy_Id(1488)
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
});

//Getters by properties
describe("getStudentByVkId", () => {
    beforeAll(async () => {
        await mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        }, () => console.log("Mongoose successfully connected"));
    });
    afterAll(async () => {
        Student.deleteMany({});
        await mongoose.disconnect();
    });

    it("should return right model", async () => {
        const newStudent = await DataBase.createStudent(Math.ceil(Math.random() * 100));

        const student = await DataBase.getStudentByVkId(newStudent.vkId);

        return expect(student).toEqual(newStudent);
    });
    it("should null if vkId is not in collection", async () => {
        const result = await DataBase.getStudentByVkId(1488);

        return expect(result).toBeNull();
    });
    it("should throw error if VkId is undefined", () => {
        return DataBase.getStudentByVkId()
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
    it("should throw error if VkId is not type of number", () => {
        return DataBase.getStudentByVkId("not a number")
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
});
describe("getClassByName", () => {
    beforeAll(async () => {
        await mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        }, () => console.log("Mongoose successfully connected"));
    });
    afterAll(async () => {
        Student.deleteMany({});
        await mongoose.disconnect();
    });

    it("should return right model", async () => {
        const newClass = await DataBase.createClass(Math.ceil(Math.random() * 10) + "A");
        const _class = await DataBase.getClassByName(newClass.name);

        return expect(_class).toEqual(newClass);
    });
    it("should null if _id is not in collection", async () => {
        const result = await DataBase.getClassByName("not even name");

        return expect(result).toBeNull();
    });
    it("should throw error if name is undefined", () => {
        return DataBase.getClassByName()
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
    it("should throw error if name is not type of string", () => {
        return DataBase.getClassByName(1488)
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
});

//Others
describe("getAllContributors", () => {
    beforeAll(async () => {
        await mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        }, () => console.log("Mongoose successfully connected"));
        const Student1 = await DataBase.createStudent(1);
        const Student2 = await DataBase.createStudent(2);
        await DataBase.createStudent(3);
        Student1.role = Roles.contributor;
        Student2.role = Roles.contributor;

        return;
    });
    afterAll(async () => {
        await Student.deleteMany({});
        await mongoose.disconnect();
    });

    it("should return array of contributors", async () => {
        const result = await DataBase.getAllContributors();

        expect(Array.isArray(result)).toBe(true);
        expect(result.every(st => st.vkId === 1 || st.vkId === 2)).toBe(true);
    });
});
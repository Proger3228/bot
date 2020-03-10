const
    mongoose = require("mongoose"),
    mockingoose = require("mockingoose").default,
    Student = require("../../Models/StudentModel"),
    Class = require("../../Models/ClassModel"),
    {DataBase} = require("../DataBase"),
    {toObject} = require("./utils"),
    {MockStudent, MockClass} = require("./mocks");
const {Roles} = require("../../Models/utils");


//Getters by _id
describe("getStudentBy_Id", () => {
    it("should return right model", () => {
        mockingoose(Student).toReturn(MockStudent, "findOne");
        return DataBase.getStudentBy_Id(MockStudent._id)
            .then(res => expect(toObject(res)).toMatchObject(MockStudent))
    });
    it("should null if _id is not in collection", () => {
        mockingoose(Student).toReturn(null, "findOne");
        return DataBase.getStudentBy_Id("not even id")
            .then(res => expect(toObject(res)).toBeNull())
    });
    it("should throw error if _id is undefined", () => {
        mockingoose(Student).toReturn(null, "findOne");
        return DataBase.getStudentBy_Id()
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
    it("should throw error if _id is not type of string", () => {
        mockingoose(Student).toReturn(null, "findOne");
        return DataBase.getStudentBy_Id("not a number")
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
});
describe("getClassBy_Id", () => {
    it("should return right model", () => {
        mockingoose(Class).toReturn(MockClass, "findOne");
        return DataBase.getClassBy_Id(MockClass._id)
            .then(res => expect(toObject(res)).toMatchObject(MockClass))
    });
    it("should null if _id is not in collection", () => {
        mockingoose(Class).toReturn(null, "findOne");
        return DataBase.getClassBy_Id("not even id")
            .then(res => expect(toObject(res)).toBeNull())
    });
    it("should throw error if _id is undefined", () => {
        mockingoose(Class).toReturn(null, "findOne");
        return DataBase.getClassBy_Id()
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
    it("should throw error if _id is not type of string", () => {
        mockingoose(Class).toReturn(null, "findOne");
        return DataBase.getClassBy_Id("not a number")
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
});

//Getters by properties
describe("getStudentByVkId", () => {
    it("should return right model", () => {
        mockingoose(Student).toReturn(MockStudent, "findOne");
        return DataBase.getStudentByVkId(MockStudent.vkId)
            .then(res => expect(toObject(res)).toMatchObject(MockStudent))
    });
    it("should null if vkId is not in collection", () => {
        mockingoose(Student).toReturn(null, "findOne");
        return DataBase.getStudentByVkId(1241)
            .then(res => expect(toObject(res)).toBeNull())
    });
    it("should throw error if VkId is undefined", () => {
        mockingoose(Student).toReturn(null, "findOne");
        return DataBase.getStudentByVkId()
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
    it("should throw error if VkId is not type of number", () => {
        mockingoose(Student).toReturn(null, "findOne");
        return DataBase.getStudentByVkId("not a number")
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
});
describe("getClassByName", () => {
    it("should return right model", () => {
        mockingoose(Class).toReturn(MockClass, "findOne");
        return DataBase.getClassByName(MockClass.name)
            .then(res => expect(toObject(res)).toMatchObject(MockClass))
    });
    it("should null if _id is not in collection", () => {
        mockingoose(Class).toReturn(null, "findOne");
        return DataBase.getClassByName("not even name")
            .then(res => expect(toObject(res)).toBeNull())
    });
    it("should throw error if name is undefined", () => {
        mockingoose(Class).toReturn(null, "findOne");
        return DataBase.getClassByName()
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
    it("should throw error if name is not type of string", () => {
        mockingoose(Class).toReturn(null, "findOne");
        return DataBase.getClassByName("not a number")
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
});

//Others
// describe("getAllContributors", () => {
//     beforeAll(async () => {
//         const a = await mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority", {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//             useCreateIndex: true
//         }, () => console.log("Mongoose successfully connected"));
//         console.log(a);
//         const Students = await Student.find({});
//         const Classes = await Class.find({});
//         const Student1 = await DataBase.createStudent(1);
//         const Student2 = await DataBase.createStudent(2);
//         await DataBase.createStudent(3);
//         Student1.role = Roles.contributor;
//         Student2.role = Roles.contributor;
//
//         return;
//     });
//     afterAll(async () => {
//         Student.deleteMany({});
//         await mongoose.disconnect();
//     });
//
//     it("should return array of contributors", async () => {
//         const result = await DataBase.getAllContributors();
//
//         expect(Array.isArray(result)).toBe(true);
//         expect(result.every(st => st.vkId === 1 || st.vkId === 2)).toBe(true);
//     })
// });
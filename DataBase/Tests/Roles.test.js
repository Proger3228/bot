const
    mongoose = require("mongoose"),
    Student = require("../../Models/StudentModel"),
    Class = require("../../Models/ClassModel"),
    {DataBase} = require("../DataBase"),
    {Roles} = require("../../Models/utils"),
    //{MockStudent, MockClass} = require("./mocks"),
    uuid4 = require("uuid4");
const StudentModel = require("../../Models/StudentModel");

const createTestData = async () => {
    const Class = await DataBase.createClass(Math.ceil(Math.random() * 10) + "A");
    await Class.save();
    const Student = await DataBase.createStudent(Math.ceil(Math.random() * 100), Class._id);
    await Student.save();
    Class.students.push(Student._id);
    await Class.save();
    await Student.save();
    // console.log(Student, await DataBase.getStudentBy_Id(Student._id));
    return {
        Student: await DataBase.getStudentBy_Id(Student._id),
        Class: await DataBase.getClassBy_Id(Class._id)
    }
};

describe("generateNewRoleUpCode", () => {
    let MockStudent;
    let MockClass;
    beforeAll(async () => {
        const connect = await mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true
        }, (err) => console.log("Mongoose successfully connected"));
        const newStudent = new Student({
            vkId: Math.random() * 10
        });
        const newClass = new Class({
            name: (Math.random() * 10 + 1) + "A",
        });
        newStudent.class = newClass._id;
        newClass.students.push(newStudent._id);
        await newStudent.save();
        await newClass.save();
        MockClass = await DataBase.getClassByName(newClass.name).then(res => res.toObject());
        MockStudent = await DataBase.getStudentByVkId(newStudent.vkId).then(res => res.toObject());

    });
    afterAll(async () => {
        await Class.deleteMany({});
        await Student.deleteMany({});
        await mongoose.disconnect();
    });
    afterEach(async () => {
        const _class = await DataBase.getClassBy_Id(MockClass._id);
        await _class.updateOne({roleUpCodes: []});
        await _class.save();
    });

    it("should return valid uuid4 code", async () => {
        await DataBase.generateNewRoleUpCode(MockClass.name)
            .then(res => expect(uuid4.valid(res)).toBe(true))
    });
    it("should add code to class found by class name", async () => {
        const code = await DataBase.generateNewRoleUpCode(MockClass.name);
        const updatedClass = await DataBase.getClassBy_Id(MockClass._id);
        await expect(updatedClass.roleUpCodes.includes(code)).toBe(true)
    });
    it("should save old codes if they were", async () => {
        const givenClass = await DataBase.getClassBy_Id(MockClass._id);
        const code = uuid4();
        givenClass.roleUpCodes.push(code);
        await givenClass.save();
        await DataBase.generateNewRoleUpCode(MockClass.name);
        const updatedClass = await DataBase.getClassBy_Id(MockClass._id);
        await expect(updatedClass.roleUpCodes.includes(code)).toBe(true);
    });
    it("should return null if can`t find class by name", async () => {
        const code = await DataBase.generateNewRoleUpCode("not real class name");
        await expect(code).toBeNull();
    });
    it("should add only one code", async () => {
        const length = MockClass.roleUpCodes.length;
        await DataBase.generateNewRoleUpCode(MockClass.name);

        return expect((await DataBase.getClassBy_Id(MockClass._id)).roleUpCodes.length).toBe(length + 1);
    });
});

describe("removeRoleUpCode", () => {
    let MockStudent;
    let MockClass;
    beforeAll(async () => {
        await mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        }, () => console.log("Mongoose successfully connected"));
        const newStudent = new Student({
            vkId: Math.random() * 10
        });
        const newClass = new Class({
            name: (Math.random() * 10 + 1) + "A",
        });
        newStudent.class = newClass._id;
        newClass.students.push(newStudent._id);
        await newStudent.save();
        await newClass.save();
        MockClass = await DataBase.getClassByName(newClass.name).then(res => res.toObject());
        MockStudent = await DataBase.getStudentByVkId(newStudent.vkId).then(res => res.toObject());
    });
    afterAll(async () => {
        await Student.deleteMany({});
        await Class.deleteMany({});
        await mongoose.disconnect();
    });
    afterEach(async () => {
        const _class = await DataBase.getClassBy_Id(MockClass._id);
        await _class.updateOne({roleUpCodes: []});
        await _class.save();
    });

    it("should return false if con`t find class by name", async () => {
        const isDeleted = await DataBase.removeRoleUpCode("not a name", uuid4());
        await expect(isDeleted).toBe(false);
    });
    it("should return return true if code is deleted", async () => {
        const code = await DataBase.generateNewRoleUpCode(MockClass.name);
        const isDeleted = await DataBase.removeRoleUpCode(MockClass.name, code);
        await expect(isDeleted).toBe(true);
    });
    it("should remove code from class` roleUp codes", async () => {
        const code = await DataBase.generateNewRoleUpCode(MockClass.name);
        await DataBase.removeRoleUpCode(MockClass.name, code);
        const classWithoutCode = await DataBase.getClassBy_Id(MockClass._id);
        await expect(classWithoutCode.roleUpCodes.includes(code)).toBe(false);
    })
    it("should throw type error if code is not valid uuid4 code", async () => {
        return DataBase.removeRoleUpCode(MockClass.name, "not valid code")
            .catch(err => expect(err).toBeInstanceOf(TypeError))
    });
});

describe("checkCodeValidity", () => {
    let MockStudent;
    let MockClass;
    beforeAll(async () => {
        await mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        }, () => console.log("Mongoose successfully connected"));
        const newStudent = new Student({
            vkId: Math.random() * 10
        });
        const newClass = new Class({
            name: (Math.random() * 10 + 1) + "A",
        });
        newStudent.class = newClass._id;
        newClass.students.push(newStudent._id);
        await newStudent.save();
        await newClass.save();
        MockClass = await DataBase.getClassByName(newClass.name).then(res => res.toObject());
        MockStudent = await DataBase.getStudentByVkId(newStudent.vkId).then(res => res.toObject());
    });
    afterAll(async () => {
        await Student.deleteMany({});
        await Class.deleteMany({});
        await mongoose.disconnect();
    });
    afterEach(async () => {
        const _class = await DataBase.getClassBy_Id(MockClass._id);
        await _class.updateOne({roleUpCodes: []});
        await _class.save();
    });

    it("should return false if code is not valid uuid4 code", async () => {
        const response = await DataBase.checkCodeValidity(MockClass, "not valid code");
        await expect(response).toBe(false);
    });
    it("should return true if code is in class` roleUp codes", async () => {
        const code = await DataBase.generateNewRoleUpCode(MockClass.name);
        const isValid = await DataBase.checkCodeValidity(MockClass.name, code);
        await expect(isValid).toBe(true);
    });
    it("should not change saved codes", async () => {
        const c = await DataBase.getClassBy_Id(MockClass._id);
        const code1 = uuid4();
        const code2 = uuid4();
        c.roleUpCodes.push(code1, code2);
        await c.save();
        await DataBase.checkCodeValidity(MockClass.name, code2);
        const reUpdatedClass = await DataBase.getClassBy_Id(MockClass._id);
        await expect(reUpdatedClass.roleUpCodes.includes(code2)).toBe(true);
        await expect(reUpdatedClass.roleUpCodes.includes(code1)).toBe(true);
    });
    it("shouldn`t add codes to class", async () => {
        const code = await DataBase.generateNewRoleUpCode(MockClass.name);
        await DataBase.checkCodeValidity(MockClass.name, code);
        await expect((await DataBase.getClassBy_Id(MockClass._id)).roleUpCodes.length).toBe(1);
    });
    it("should return true if code isn`t in class` roleUp codes", async () => {
        const code = uuid4();
        const response = await DataBase.checkCodeValidity(MockClass.name, code);
        expect(response).toBe(false);
    })
});

describe("activateRoleUpCode", () => {
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
        await _class.updateOne({roleUpCodes: []});
        await _class.save();
        const student = await DataBase.getStudentBy_Id(MockStudent._id);
        await student.updateOne({role: Roles.student, class: MockClass._id});
        await student.save();
    });
 
    it("should throw error if code is invalid uuid4 code", async () => {
        return DataBase.activateCode(MockStudent.vkId, "not a code")
            .catch(err => expect(err).toBeInstanceOf(TypeError));
    });
    it("should throw error if student don`t have class property", async () => {
        const student = await DataBase.getStudentBy_Id(MockStudent._id);
        student.class = undefined;
        await student.save();
        const code = await DataBase.generateNewRoleUpCode(MockClass.name);
        return DataBase.activateCode(MockStudent.vkId, code)
            .catch(err => expect(err).toBeInstanceOf(TypeError));
    });
    it("should return false if can`t find student by VkId", async () => {
        const response = await DataBase.activateCode(1488, uuid4());
        await expect(response).toBe(false);
    });
    it("should return false if code is not pass validity test", async () => {
        // console.log(MockStudent, await DataBase.getStudentBy_Id(MockStudent._id));
        const response = await DataBase.activateCode(MockStudent.vkId, uuid4());
        await expect(response).toBe(false);
    });
    it("should change student role to contributor", async () => {
        const code = await DataBase.generateNewRoleUpCode(MockClass.name);
        await DataBase.activateCode(MockStudent.vkId, code);
        const updatedStudent = await DataBase.getStudentBy_Id(MockStudent._id);
        return await expect(updatedStudent.role).toBe(Roles.contributor);
    });
});

describe("backStudentToInitialRole", () => {
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
        s.role = Roles.contributor;
        MockClass = c;
        MockStudent = s;//not sure //check
    });
    afterAll(async () => {
        await Student.deleteMany({});
        await Class.deleteMany({});
        await mongoose.disconnect();
    });
    afterEach(async () => {
        const _class = await DataBase.getClassBy_Id(MockClass._id);
        await _class.updateOne({roleUpCodes: []});
        await _class.save();
        const student = await DataBase.getStudentBy_Id(MockStudent._id);
        await student.updateOne({role: Roles.student, class: MockClass._id});
        await student.save();
    });
    it("should return true if all is ok", async () => {
        const result = await DataBase.backStudentToInitialRole(MockStudent.vkId);

        return expect(result).toBe(true);
    });
    it("should change student`s role to STUDENT", async () => {
        await DataBase.backStudentToInitialRole(MockStudent.vkId);

        const updatedUser = await DataBase.getStudentByVkId(MockStudent.vkId);

        return expect(updatedUser.role).toBe(Roles.student);
    });
    it("should throw error if vkId is not valid (number)", () => {
        return DataBase.backStudentToInitialRole("not a number")
            .catch(e => expect(e).toBeInstanceOf(TypeError))
    });
    it("should return false if can`t find student with this vkId", async () => {
        const result = await DataBase.backStudentToInitialRole(1488);

        return expect(result).toBe(false);
    })
});

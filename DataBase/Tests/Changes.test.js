const
    {DataBase} = require('../DataBase'),
    mongoose = require("mongoose"),
    Class = require('../../Models/ClassModel'),
    Student = require("../../Models/StudentModel"),
    {toObject} = require('../utils/functions');

const createTestData = async (stAmt = 1) => {
    const students = [];
    const clas = await DataBase.createClass(Math.ceil(Math.random() * 10) + "A");
    for (let i = 0; i < stAmt; i++) {
        let newS = await DataBase.createStudent(Math.ceil(Math.random() * 100 + 1), clas._id);
        students.push(newS);
        await clas.updateOne({students: [...clas.students, newS]})
    }
    return {
        Student: students.length > 1 ? students : students[0],
        Class: clas
    }
};

describe("addChanges", () => {
    let MockClass;
    let MockStudent;
    let StudentWithoutClass;
    let ClassWithoutStudent;
    beforeAll(async () => {
        const {Class: c, Student: s} = await createTestData();
        const wcu = await DataBase.createStudent(Math.floor(Math.random() * 100 + 1));
        const wsc = await DataBase.createClass(Math.floor(Math.random() * 10) + "B");
        MockStudent = s;
        MockClass = c;
        StudentWithoutClass = wcu;
        ClassWithoutStudent = wsc;
    });
    afterAll(async () => {
        await Class.deleteMany({});
        await Student.deleteMany({});
    });
    afterEach(async () => {
        await MockClass.updateOne({changes: []});
    });

    it("should return true if all is ok", async () => {
        const attachments = [
            "photo123_123_as41", "video321_321_a12d"
        ];

        const result = await DataBase.addChanges(MockStudent.vkId, attachments);

        return expect(result).toBe(true);
    });
    it("should add changes all to class", async () => {
        const attachments = [
            "photo123_123_as41", "video321_321_a12d"
        ];

        await DataBase.addChanges(MockStudent.vkId, attachments);

        const updatedClass = await DataBase.getClassBy_Id(MockClass._id);
        expect(updatedClass.changes.length).toBe(2);
        expect(updatedClass.changes.some(ch => ch.value === attachments[0])).toBe(true);
        expect(updatedClass.changes.some(ch => ch.value === attachments[1])).toBe(true);
    });
    it("should add changes to all classes if toAll prop passed", async () => {
        const attachments = [
            "photo123_123_as41", "video321_321_a12d"
        ];

        await DataBase.addChanges(MockStudent.vkId, attachments, undefined, true);

        const updatedClass = await DataBase.getClassBy_Id(MockClass._id);
        const updatedClass1 = await DataBase.getClassBy_Id(ClassWithoutStudent._id);

        expect(updatedClass.changes.length).toBe(2);
        expect(updatedClass.changes.some(ch => ch.value === attachments[0])).toBe(true);
        expect(updatedClass.changes.some(ch => ch.value === attachments[1])).toBe(true);
        expect(updatedClass1.changes.length).toBe(2);
        expect(updatedClass1.changes.some(ch => ch.value === attachments[0])).toBe(true);
        expect(updatedClass1.changes.some(ch => ch.value === attachments[1])).toBe(true);
    });
    it("shouldn\'t add changes if student is not in any class and toAll prop isn\'t passed", async () => {
        const attachments = [
            "photo123_123_as41", "video321_321_a12d"
        ];

        const result = await DataBase.addChanges(StudentWithoutClass.vkId, attachments, undefined);

        const updatedClass = await DataBase.getClassBy_Id(MockClass._id);

        expect(result).toBe(false);
        expect(updatedClass.changes.length).toBe(0);
    });
    it("should add changes if student is not in any class and toAll prop is passed", async () => {
        const attachments = [
            "photo123_123_as41", "video321_321_a12d"
        ];
        const result = await DataBase.addChanges(StudentWithoutClass.vkId, attachments, undefined, true);
        const updatedClass = await DataBase.getClassBy_Id(MockClass._id);

        expect(result).toBe(true);
        expect(updatedClass.changes.length).toBe(2);
        expect(updatedClass.changes.some(ch => ch.value === attachments[0])).toBe(true);
        expect(updatedClass.changes.some(ch => ch.value === attachments[1])).toBe(true);
    });
});

describe("getChanges", () => {
    const changes = ["photo123_123_awd1", "photo123_123_awd1"];
    let className;
    beforeAll(async () => {
        const {Class: c, Student: s} = await createTestData();
        className = c.name;
        await DataBase.addChanges(s.vkId, changes);
        await DataBase.addChanges(s.vkId, ["photo123_123_123"]);
    });
    afterAll(async () => {
        await Class.deleteMany({});
        await Student.deleteMany({});
    });

    it("should return array of changes for that class", async () => {
        const result = await DataBase.getChanges(className);

        expect(result.length).toBe(changes.length);
        for (let i = 0; i < changes.length; i++) {
            expect(result.includes(changes[i]));
        }
    });
});
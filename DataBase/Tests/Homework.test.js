const
    {DataBase} = require('../DataBase'),
    mongoose = require("mongoose"),
    Class = require('../../Models/ClassModel');

describe("addHomework", () => {
    let MockClass;
    beforeAll(async () => {
        MockClass = await DataBase.createClass("1B");
        await MockClass.updateOne({
            schedule: [
                ["Математика", "Русский", "Английский"],
                ["Английский", "История", "ОБЖ"],
                ["Математика", "История", "Обществознание"],
                ["Русский", "Английский", "Обществознание"]
            ]
        })
    });
    afterEach(async () => {
        const _class = await DataBase.getClassBy_Id(MockClass._id);
        await _class.updateOne({homework: []});
    });
    afterAll(async () => {
        Class.deleteMany({}).then(() => console.log("Class removed"))
    });

    it("should return true if all is ok", async () => {
        const task = "Сделай дз уже блять сука блять";
        const result = await DataBase.addHomework(MockClass.name, "Обществознание", task);

        return expect(result).toBe(true);
    });
    it("should add one homework with right params", async () => {
        const task = "Сделай дз уже блять сука блять";
        const initialLength = MockClass.homework.length;

        await DataBase.addHomework(MockClass.name, "Обществознание", task);
        const updatedClass = await DataBase.getClassBy_Id(MockClass._id);
        const homework = updatedClass.homework.find(dz => dz.task === task);

        expect(updatedClass.homework.length - 1).toBe(initialLength);
        expect(homework).toBeTruthy();
        expect(homework.lesson).toBe("Обществознание");
        expect(homework.to).toEqual(new Date(2020, 2, 18));
    });
    it("should set homework's 'to' to given date if it passes", async () => {
        const task = "Сделай дз уже блять сука блять";

        await DataBase.addHomework(MockClass.name, "Обществознание", task, new Date(2020, 9, 22));
        const updatedClass = await DataBase.getClassBy_Id(MockClass._id);
        const homework = updatedClass.homework.find(dz => dz.task === task);

        expect(homework.to).toEqual(new Date(2020, 9, 22));
    })
});

describe("getHomework", () => {
    let MockClass;
    beforeAll(async () => {
        MockClass = await DataBase.createClass("1B");
        await MockClass.updateOne({
            schedule: [
                ["Математика", "Русский", "Английский"]
            ]
        });

        await DataBase.addHomework(MockClass.name, "Русский", "Пошалить )");
        await DataBase.addHomework(MockClass.name, "Математика", "Да");
    });
    afterAll(async () => {
        await Class.deleteMany({})
    });

    it("should return list of homework", async () => {
        const result = await DataBase.getHomework(MockClass.name);

        expect(result.length).toBe(2);
        expect(result[0].lesson).toBe("Русский");
        expect(result[1].lesson).toBe("Математика");
    });
});
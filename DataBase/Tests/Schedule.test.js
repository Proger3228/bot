const
    {DataBase} = require('../DataBase'),
    mongoose = require("mongoose"),
    Class = require('../../Models/ClassModel');

describe("lessonsIndexesToLessonsNames", () => {
    it("should convert indexes to names", () => {
        const lessons = [
            "1", "2", "3"
        ];
        const indexes = [
            [0, 1, 2],
            [2, 1, 0]
        ];
        const result = DataBase.lessonsIndexesToLessonsNames(lessons, indexes);
        const expected = [
            ["1", "2", "3"],
            ["3", "2", "1"]
        ];

        expect(result).toEqual(expected);
    });
    it("should throw error if some of indexes is bigger than lessons length", () => {
        const lessons = [
            "1",
            "2",
            "3"
        ];
        const indexes = [
            [0, 1, 2],
            [3, 1, 0]
        ];

        expect(() => DataBase.lessonsIndexesToLessonsNames(lessons, indexes)).toThrowError(ReferenceError);
    })
    it("should throw error if some of lessons is not type of string / it's length is 0 / it's not an array ", () => {
        expect(() => DataBase.lessonsIndexesToLessonsNames(["1", 2], [])).toThrowError(new TypeError("LessonList must be array of strings")); //not type of string
        expect(() => DataBase.lessonsIndexesToLessonsNames([], [])).toThrowError(new TypeError("LessonList must be array of strings")); //length is 0
        expect(() => DataBase.lessonsIndexesToLessonsNames("not an array", [])).toThrowError(new TypeError("LessonList must be array of strings")); //not an array
    })
    it("should throw error if indexes is not array / indexes length is 0  / some of array elements isn't array of integers", () => {
        expect(() =>
            DataBase.lessonsIndexesToLessonsNames(["1", "2"], "not an array")).toThrowError(new TypeError("lessonsIndexesByDays must be array of arrays of integers")); //not an array
        expect(() =>
            DataBase.lessonsIndexesToLessonsNames(["1", "2"], [])).toThrowError(new TypeError("lessonsIndexesByDays must be array of arrays of integers")); //length is 0
        expect(() =>
            DataBase.lessonsIndexesToLessonsNames(["1", "2"], [["1", 2]])).toThrowError(new TypeError("lessonsIndexesByDays must be array of arrays of integers")); //some of elements isn't numbers
        expect(() =>
            DataBase.lessonsIndexesToLessonsNames(["1", "2"], [[1.4, 2]])).toThrowError(new TypeError("lessonsIndexesByDays must be array of arrays of integers")); //some of elements isn't integers
    })
});

describe("setSchedule", () => {
    let MockClass;
    beforeAll(async () => {
        await mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/test?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        }, () => console.log("Mongoose successfully connected"));
        MockClass = await DataBase.createClass("1B");
    });
    afterEach(async () => {
        const _class = await DataBase.getClassBy_Id(MockClass._id);
        _class.schedule = [];
    });
    afterAll(async () => Class.deleteMany({}).then(() => console.log("Class removed")));

    it("should return true if all is ok", async () => {
        const lessons = [
            "1", "2", "3"
        ];
        const indexes = [
            [0, 1, 2],
            [2, 1, 0]
        ];

        const result = await DataBase.setSchedule(MockClass.name, lessons, indexes);

        return expect(result).toBe(true);
    });
    it("should change class's schedule to new", async () => {
        const lessons = [
            "1", "2", "3"
        ];
        const indexes = [
            [0, 1, 2],
            [2, 1, 0]
        ];

        await DataBase.setSchedule(MockClass.name, lessons, indexes);

        const updatedClass = await DataBase.getClassBy_Id(MockClass._id);

        return expect(JSON.parse(JSON.stringify(updatedClass.schedule))).toEqual(DataBase.lessonsIndexesToLessonsNames(lessons, indexes));
    });
    it("should throw error if className is not type of string", async () => {
        return DataBase.setSchedule()
            .catch(e => expect(e).toBeInstanceOf(TypeError));
    });
    it("should return false if className is not belongs to any class", async () => {
        const result = await DataBase.setSchedule("not real class name");
        return expect(result).toBe(false);
    });
});

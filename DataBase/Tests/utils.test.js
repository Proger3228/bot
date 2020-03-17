const {findNextDayWithLesson,findNextLessonDate, findNotifiedStudents} = require("./utils/functions");
const config = require("config");

const createMockStudent = ({ne: notificationsEnabled = true, nt: notificationTime = "00:00", lhc: lastHomeworkCheck = new Date(0)} = {}) => {
    return {
        settings: {
            notificationsEnabled,
            notificationTime,
            lastHomeworkCheck
        }
    }
};

describe("findNextDayWithLesson", () => {
   it("should return index of last day in a week with this lesson or -1", () => {
       const lessons = [
           ["1","2","4"],
           ["2","1","3"],
           ["1","3","4"]
       ];

       expect(findNextDayWithLesson(lessons, "1", 1)).toBe(2);
       expect(findNextDayWithLesson(lessons, "2", 2)).toBe(1);
       expect(findNextDayWithLesson(lessons, "3", 3)).toBe(2);
       expect(findNextDayWithLesson(lessons, "4", 2)).toBe(3);
       expect(findNextDayWithLesson(lessons, "5", 1)).toBe(-1);
   })
});

describe("findNextLessonDate", () => {
    it("should return date of next this week day", () => {
        expect(findNextLessonDate(1, {currentDate: new Date(2020, 0, 1)})).toEqual(new Date(2020, 0, 6));
        expect(findNextLessonDate(2, {currentDate: new Date(2020, 1, 28)})).toEqual(new Date(2020, 2, 3));
        expect(findNextLessonDate(1, {currentDate: new Date(2020, 2, 13)})).toEqual(new Date(2020, 2, 16));
        expect(findNextLessonDate(1, {currentDate: new Date(2020, 3, 30)})).toEqual(new Date(2020, 4, 4));
        expect(findNextLessonDate(1, {currentDate: new Date(2020, 4, 30)})).toEqual(new Date(2020, 5, 1));
        expect(findNextLessonDate(1, {currentDate: new Date(2020, 4, 31)})).toEqual(new Date(2020, 5, 1));
        expect(findNextLessonDate(6, {currentDate: new Date(2020, 2, 13)})).toEqual(new Date(2020, 2, 14));
        expect(findNextLessonDate(7, {currentDate: new Date(2020, 2, 13)})).toEqual(new Date(2020, 2, 15));
        expect(findNextLessonDate(1, {currentDate: new Date(2020, 2, 15)})).toEqual(new Date(2020, 2, 16));
    })
});

describe("findNotifiedStudents", () => {
    it("should filter students that shouldn't get notification", () => {
        const notificationDate = new Date(2020, 0, 1, 0, 0, 0); //Wed Jan 01 2020 00:01:00
        const studentP = createMockStudent({ne: true}); //pass
        const studentP1 = createMockStudent({lhc:  new Date(2019,11,31, 0)});
        const studentP2 = createMockStudent({nt: `00:01`});
        const studentNP = createMockStudent({ne: false}); //not pass
        const studentNP1 = createMockStudent({nt: `00:05`});
        const studentNP2 = createMockStudent({lhc: new Date(2020, 0, 1, 0, 0, 0)});
        const maxRemindFreq = config.get("REMIND_AFTER");

        const notificationsArray = findNotifiedStudents([studentP,studentP1,studentP2,studentNP,studentNP1,studentNP2], notificationDate, maxRemindFreq);

        expect(notificationsArray).toBeInstanceOf(Array);
        console.log(notificationsArray);
        expect(notificationsArray.length).toBe(3);
        expect(notificationsArray.includes(studentP) && notificationsArray.includes(studentP1) && notificationsArray.includes(studentP2)).toBe(true);
    })
});
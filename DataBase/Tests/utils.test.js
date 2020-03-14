const {findNextDayWithLesson,findNextLessonDate} = require("./stuff/utils");

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
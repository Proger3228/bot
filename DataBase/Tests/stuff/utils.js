const {DataBase} = require("../../DataBase");

const findNextDayWithLesson = (schedule, lesson, currentWeekDay) => {
    let lastIndex = -2;
    if (schedule.slice(currentWeekDay).find(e => e.includes(lesson))) {
        lastIndex = schedule.slice(currentWeekDay).findIndex(e => e.includes(lesson)) + currentWeekDay;
    } else if (schedule.find(e => e.includes(lesson))){
        lastIndex = schedule.findIndex(e => e.includes(lesson));
    }
    return lastIndex + 1;
};

const findNextLessonDate = (nextLessonWeekDay, {currentDate = new Date(), monthWith31 = [0, 2, 4, 6, 7, 9, 11]} = {}) => {
    if (nextLessonWeekDay <= 7) {
        const weekDay = currentDate.getDay() || 7;
        const isThisWeek = nextLessonWeekDay > weekDay;
        const addition = isThisWeek ? 0 : 7;
        if (monthWith31.includes(currentDate.getMonth())) {
            if (currentDate.getDate() + 7 - (weekDay - nextLessonWeekDay) <= 31) {
                return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + addition - (weekDay - nextLessonWeekDay))
            } else {
                return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, (currentDate.getDate() + addition - (weekDay - nextLessonWeekDay)) - 31)
            }
        } else if (currentDate.getMonth() === 1) {
            if (currentDate.getFullYear() % 4 === 0) {
                if (currentDate.getDate() + 7 - (weekDay - nextLessonWeekDay) <= 29) {
                    return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + addition - (weekDay - nextLessonWeekDay))
                } else {
                    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, (currentDate.getDate() + addition - (weekDay - nextLessonWeekDay)) - 29)
                }
            } else {
                if (currentDate.getDate() + 7 - (weekDay - nextLessonWeekDay) <= 28) {
                    return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + addition - (weekDay - nextLessonWeekDay))
                } else {
                    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, (currentDate.getDate() + addition - (weekDay - nextLessonWeekDay)) - 28)
                }
            }
        } else {
            if (currentDate.getDate() + 7 - (weekDay - nextLessonWeekDay) <= 30) {
                return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + addition - (weekDay - nextLessonWeekDay))
            } else {
                return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, (currentDate.getDate() + addition - (weekDay - nextLessonWeekDay)) - 30)
            }
        }
    } else {
        throw new TypeError("Week day must be less or equal to 7")
    }
};

const toObject = Document => JSON.parse(JSON.stringify(Document));
const isObjectId = id => {
    if (typeof id === "object" && !Array.isArray(id) && id !== null) {
        return id.toString() !== "[object Object]";
    } else {
        return false
    }
};
const createTestData = async () => {
    const Student = await DataBase.createStudent(Math.ceil(Math.random() * 100));
    const Class = await DataBase.createClass(Math.ceil(Math.random() * 10) + "A");
    return {
        Student,
        Class
    }
};


module.exports = {
    toObject,
    isObjectId,
    createTestData,
    findNextDayWithLesson,
    findNextLessonDate
};




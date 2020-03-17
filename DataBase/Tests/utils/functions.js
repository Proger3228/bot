const {DataBase} = require("../../DataBase");

const findNextDayWithLesson = (schedule, lesson, currentWeekDay) => {
    let lastIndex = -1;
    if (schedule.slice(currentWeekDay).find(e => e.includes(lesson))) {
        lastIndex = schedule.slice(currentWeekDay).findIndex(e => e.includes(lesson)) + currentWeekDay + 1;
    } else if (schedule.find(e => e.includes(lesson))) {
        lastIndex = schedule.findIndex(e => e.includes(lesson)) + 1;
    }
    return lastIndex;
};

const findNextLessonDate = (nextLessonWeekDay, {currentDate = new Date(), monthWith31 = [0, 2, 4, 6, 7, 9, 11]} = {}) => {
    if (nextLessonWeekDay <= 7) {
        const weekDay = currentDate.getDay() || 7; //Чтобы воскресенье было 7 днем недели
        const addition = nextLessonWeekDay <= weekDay && 7; //Равно 7 если урок на следующей неделе
        const maxDate = monthWith31.includes(currentDate.getMonth()) ? 31 :
            currentDate.getMonth() !== 1 ? 30 :
                (currentDate.getFullYear() % 4 === 0 ? 29 : 28); //Возвращает количество дней в текущем месяце

        let date = currentDate.getDate() + addition - (weekDay - nextLessonWeekDay);
        let month = currentDate.getMonth();

        if (date > maxDate) {
            date -= maxDate;
            month++;
        }
        
        return new Date(currentDate.getFullYear(), month, date);
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

const findNotifiedStudents = (students, notificationDate,maxRemindFrequency) => {
    return students
        .filter(({settings: sets}) => sets.notificationsEnabled &&
            notificationDate.getHours() === +sets.notificationTime.match(/^\d*/)[0] && //Проверяет что сейчас тот же час в который чел хочет что бы его оповещали
            Math.abs(notificationDate.getMinutes() - +sets.notificationTime.match(/\d*$/)) <= 1 && //Проверяет что разница минуты которая сейчас и минуты в которую чел хочет что бы его оповещали меньше или = 1
            (notificationDate - sets.lastHomeworkCheck) >= maxRemindFrequency //Проверяет что чел недавно (3 часа) сам не чекал дз
        )
};

module.exports = {
    toObject,
    isObjectId,
    createTestData,
    findNextDayWithLesson,
    findNextLessonDate,
    findNotifiedStudents
};




const ClassModel = require( "../../Models/ClassModel.js" );

const { DataBase } = require( "../DataBase.js" );


const letters = "ABCDEFGHIJKLNOPQRSTUVWXYZАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
let currentClassNumber = 1;
let currentClassLetterIndex = 0;
let curentVkId = 0;

const findNextDayWithLesson = ( schedule, lesson, currentWeekDay ) => {
    let lastIndex = -1;
    if ( schedule.slice( currentWeekDay ).find( e => e.includes( lesson ) ) ) {
        lastIndex = schedule.slice( currentWeekDay ).findIndex( e => e.includes( lesson ) ) + currentWeekDay + 1;
    } else if ( schedule.find( e => e.includes( lesson ) ) ) {
        lastIndex = schedule.findIndex( e => e.includes( lesson ) ) + 1;
    }
    return lastIndex;
};

const findNextLessonDate = ( nextLessonWeekDay, { currentDate = new Date(), monthWith31 = [ 0, 2, 4, 6, 7, 9, 11 ] } = {} ) => {
    if ( nextLessonWeekDay <= 7 ) {
        const weekDay = currentDate.getDay() || 7; //Чтобы воскресенье было 7 днем недели
        const addition = nextLessonWeekDay <= weekDay && 7; //Равно 7 если урок на следующей неделе
        const maxDate = monthWith31.includes( currentDate.getMonth() ) ? 31 :
            currentDate.getMonth() !== 1 ? 30 :
                ( currentDate.getFullYear() % 4 === 0 ? 29 : 28 ); //Возвращает количество дней в текущем месяце

        let date = currentDate.getDate() + addition - ( weekDay - nextLessonWeekDay );
        let month = currentDate.getMonth();

        if ( date > maxDate ) {
            date -= maxDate;
            month++;
        }

        return new Date( currentDate.getFullYear(), month, date );
    } else {
        throw new TypeError( "Week day must be less or equal to 7" )
    }
};

const toObject = Document => JSON.parse( JSON.stringify( Document ) );
const isObjectId = id => {
    if ( typeof id === "object" && !Array.isArray( id ) && id !== null ) {
        return id.toString() !== "[object Object]";
    } else {
        return false
    }
};

const createTestData = async () => {
    const Class = await DataBase.createClass( getUniqueClassName() );
    const Student = await DataBase.createStudent( getUniqueVkId(), Class._id );
    await Class.updateOne( { students: [ Student._id ] } );
    return {
        Student: await DataBase.getStudentBy_Id( Student._id ),
        Class: await DataBase.getClassBy_Id( Class._id )
    }
};

const findNotifiedStudents = ( students, notificationDate, maxRemindFrequency ) => {
    return students
        .filter( ( { settings: sets, lastHomeworkCheck } ) => {
            if ( sets.notificationsEnabled ) { //Проверяет что уведомления включены
                if (
                    notificationDate.getHours() === +sets.notificationTime.match( /^\d*/ )[ 0 ] &&
                    Math.abs( notificationDate.getMinutes() - +sets.notificationTime.match( /\d*$/ ) ) <= 1 ) { //Проверяет что время совпадает или почти
                    if ( ( notificationDate - lastHomeworkCheck ) >= maxRemindFrequency ) { //Проверяет что чел недавно (3 часа) сам не чекал дз}
                        return true;
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }
        )
};

const lessonsIndexesToLessonsNames = ( lessonList, indexes ) => {
    if ( Array.isArray( lessonList ) && lessonList.length && lessonList.every( el => typeof el === "string" ) ) {
        if (
            Array.isArray( indexes ) &&
            indexes.length > 0 &&
            indexes.every( lesson =>
                Array.isArray( lesson ) &&
                lesson.every( Number.isInteger )
            ) //lessonList должен быть массивом массивов целых чисел
        ) {
            if ( lessonList.length - 1 < Math.max( ...indexes.flat() ) ) {
                throw new ReferenceError( "Index in indexes array can`t be bigger than lesson list length" )
            }
            return indexes.map( dayIdxs => dayIdxs.map( idx => lessonList[ idx ] ) ) //превращает массив индексов в массив предметов
        } else {
            throw new TypeError( "lessonsIndexesByDays must be array of arrays of integers" );
        }
    } else {
        throw new TypeError( "LessonList must be array of strings" );
    }
};

const checkIsToday = ( date, to = new Date() ) => {
    return to.getDate() === date.getDate() && date.getMonth() === to.getMonth() && date.getFullYear() === to.getFullYear();
};

const getUniqueClassName = () => {
    if ( currentClassNumber === 11 ) {
        currentClassNumber = 1;
        currentClassLetterIndex++;
        if ( currentClassLetterIndex > letters.length ) {
            throw new Error( "Too many classes, can't find unique class name" );
        }
    }
    const num = ( currentClassNumber++ ).toString();
    const letter = letters[ currentClassLetterIndex ];

    const className = num + letter;
    return className
}
const getUniqueVkId = () => {
    const id = curentVkId++;

    return id;
}



module.exports = {
    toObject,
    isObjectId,
    createTestData,
    findNextDayWithLesson,
    findNextLessonDate,
    findNotifiedStudents,
    lessonsIndexesToLessonsNames,
    checkIsToday,
    getUniqueClassName,
    getUniqueVkId
};




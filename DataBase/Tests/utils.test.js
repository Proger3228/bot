const StudentModel = require( "../../Models/StudentModel" );

const ClassModel = require( "../../Models/ClassModel" );

const { findNextDayWithLesson, findNextLessonDate, findNotifiedStudents, lessonsIndexesToLessonsNames, createTestData } = require( "../utils/functions" );
const config = require( "config" );

const createMockStudent = ( { ne: notificationsEnabled = true, nt: notificationTime = "00:00", lhc: lastHomeworkCheck = new Date( 0 ) } = {} ) => {
    return {
        settings: {
            notificationsEnabled,
            notificationTime
        },
        lastHomeworkCheck
    }
};

describe( "findNextDayWithLesson", () => {
    it( "should return index of last day in a week with this lesson or -1", () => {
        const lessons = [
            [ "1", "2", "4" ],
            [ "2", "1", "3" ],
            [ "1", "3", "4" ]
        ];

        expect( findNextDayWithLesson( lessons, "1", 1 ) ).toBe( 2 );
        expect( findNextDayWithLesson( lessons, "2", 2 ) ).toBe( 1 );
        expect( findNextDayWithLesson( lessons, "3", 3 ) ).toBe( 2 );
        expect( findNextDayWithLesson( lessons, "4", 2 ) ).toBe( 3 );
        expect( findNextDayWithLesson( lessons, "5", 1 ) ).toBe( -1 );
    } )
} );

describe( "findNextLessonDate", () => {
    it( "should return date of next this week day", () => {
        expect( findNextLessonDate( 1, { currentDate: new Date( 2020, 0, 1 ) } ) ).toEqual( new Date( 2020, 0, 6 ) );
        expect( findNextLessonDate( 2, { currentDate: new Date( 2020, 1, 28 ) } ) ).toEqual( new Date( 2020, 2, 3 ) );
        expect( findNextLessonDate( 1, { currentDate: new Date( 2020, 2, 13 ) } ) ).toEqual( new Date( 2020, 2, 16 ) );
        expect( findNextLessonDate( 1, { currentDate: new Date( 2020, 3, 30 ) } ) ).toEqual( new Date( 2020, 4, 4 ) );
        expect( findNextLessonDate( 1, { currentDate: new Date( 2020, 4, 30 ) } ) ).toEqual( new Date( 2020, 5, 1 ) );
        expect( findNextLessonDate( 1, { currentDate: new Date( 2020, 4, 31 ) } ) ).toEqual( new Date( 2020, 5, 1 ) );
        expect( findNextLessonDate( 6, { currentDate: new Date( 2020, 2, 13 ) } ) ).toEqual( new Date( 2020, 2, 14 ) );
        expect( findNextLessonDate( 7, { currentDate: new Date( 2020, 2, 13 ) } ) ).toEqual( new Date( 2020, 2, 15 ) );
        expect( findNextLessonDate( 1, { currentDate: new Date( 2020, 2, 15 ) } ) ).toEqual( new Date( 2020, 2, 16 ) );
    } )
} );

describe( "findNotifiedStudents", () => {
    it( "should filter students that shouldn't get notification", () => {
        const notificationDate = new Date( 2020, 0, 1, 0, 0, 0 ); //Wed Jan 01 2020 00:01:00
        const studentP = createMockStudent( { ne: true } ); //pass
        const studentP1 = createMockStudent( { lhc: new Date( 2019, 11, 31, 0 ) } );
        const studentP2 = createMockStudent( { nt: `00:01` } );
        const studentNP = createMockStudent( { ne: false } ); //not pass
        const studentNP1 = createMockStudent( { nt: `00:05` } );
        const studentNP2 = createMockStudent( { lhc: new Date( 2020, 0, 1, 0, 0, 0 ) } );
        const maxRemindFreq = config.get( "REMIND_AFTER" );

        const notificationsArray = findNotifiedStudents( [ studentP, studentP1, studentP2, studentNP, studentNP1, studentNP2 ], notificationDate, maxRemindFreq );

        expect( notificationsArray ).toBeInstanceOf( Array );
        expect( notificationsArray.length ).toBe( 3 );
        expect( notificationsArray.includes( studentP ) && notificationsArray.includes( studentP1 ) && notificationsArray.includes( studentP2 ) ).toBe( true );
    } )
} );

describe( "lessonsIndexesToLessonsNames", () => {
    it( "should convert indexes to names", () => {
        const lessons = [
            "1", "2", "3"
        ];
        const indexes = [
            [ 0, 1, 2 ],
            [ 2, 1, 0 ]
        ];
        const result = lessonsIndexesToLessonsNames( lessons, indexes );
        const expected = [
            [ "1", "2", "3" ],
            [ "3", "2", "1" ]
        ];

        expect( result ).toEqual( expected );
    } );
    it( "should throw error if some of indexes is bigger than lessons length", () => {
        const lessons = [
            "1",
            "2",
            "3"
        ];
        const indexes = [
            [ 0, 1, 2 ],
            [ 3, 1, 0 ]
        ];

        expect( () => lessonsIndexesToLessonsNames( lessons, indexes ) ).toThrowError( ReferenceError );
    } )
    it( "should throw error if some of lessons is not type of string / it's length is 0 / it's not an array ", () => {
        expect( () => lessonsIndexesToLessonsNames( [ "1", 2 ], [] ) ).toThrowError( new TypeError( "LessonList must be array of strings" ) ); //not type of string
        expect( () => lessonsIndexesToLessonsNames( [], [] ) ).toThrowError( new TypeError( "LessonList must be array of strings" ) ); //length is 0
        expect( () => lessonsIndexesToLessonsNames( "not an array", [] ) ).toThrowError( new TypeError( "LessonList must be array of strings" ) ); //not an array
    } )
    it( "should throw error if indexes is not array / indexes length is 0  / some of array elements isn't array of integers", () => {
        expect( () =>
            lessonsIndexesToLessonsNames( [ "1", "2" ], "not an array" ) ).toThrowError( new TypeError( "lessonsIndexesByDays must be array of arrays of integers" ) ); //not an array
        expect( () =>
            lessonsIndexesToLessonsNames( [ "1", "2" ], [] ) ).toThrowError( new TypeError( "lessonsIndexesByDays must be array of arrays of integers" ) ); //length is 0
        expect( () =>
            lessonsIndexesToLessonsNames( [ "1", "2" ], [ [ "1", 2 ] ] ) ).toThrowError( new TypeError( "lessonsIndexesByDays must be array of arrays of integers" ) ); //some of elements isn't numbers
        expect( () =>
            lessonsIndexesToLessonsNames( [ "1", "2" ], [ [ 1.4, 2 ] ] ) ).toThrowError( new TypeError( "lessonsIndexesByDays must be array of arrays of integers" ) ); //some of elements isn't integers
    } )
} );

describe( "createTestData", () => {
    afterAll( async () => {
        await ClassModel.remove( {} );
        await StudentModel.remove( {} );
    } )

    it( "should return class with all properties", async () => {
        const { Class } = await createTestData();

        expect( Class ).toBeDefined();
        expect( Class ).toEqual( expect.objectContaining( {
            name: expect.any( String ),
            students: expect.arrayContaining( [ expect.any( Object ) ] ),
            schedule: expect.arrayContaining( [ expect.arrayContaining( [] ) ] ),
            roleUpCodes: expect.arrayContaining( [] ),
            changes: expect.arrayContaining( [] ),
            homework: expect.arrayContaining( [] ),
        } ) )
    } )

    it( "should return student with all properties", async () => {
        const { Student } = await createTestData();

        expect( Student ).toBeDefined();
        expect( Student ).toEqual( expect.objectContaining( {
            role: expect.any( String ),
            vkId: expect.any( Number ),
            class: expect.any( Object ),
            banned: expect.any( Boolean ),
            settings: expect.objectContaining( {
                notificationsEnabled: expect.any( Boolean ),
                notificationTime: expect.any( String )
            } ),
            lastHomeworkCheck: expect.any( Date )
        } ) )
    } )

} )
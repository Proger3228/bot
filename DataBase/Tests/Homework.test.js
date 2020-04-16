const
    { DataBase } = require( '../DataBase' ),
    mongoose = require( "mongoose" ),
    Class = require( '../../Models/ClassModel' ),
    Student = require( "../../Models/StudentModel" );
const { getUniqueClassName, getUniqueVkId } = require( "../utils/functions" );

//TODO remove this sheat
const createTestData = async ( studentVkIds, className, isAddHomework = true ) => {
    let MockClass = await DataBase.createClass( className );

    await MockClass.updateOne( {
        schedule: [
            [ "Математика", "Русский", "Английский" ]
        ]
    } );

    if ( isAddHomework ) {
        await DataBase.addHomework( MockClass.name, 1488, "Русский", "1", new Date( 2020, 0, 2 ) );
        await DataBase.addHomework( MockClass.name, 1488, "Математика", "2", new Date( 2020, 0, 2 ) );
        await DataBase.addHomework( MockClass.name, 1488, "Математика", "2", new Date( 2019, 0, 2 ) ); //Не должен добавляться
    }

    for ( let id of studentVkIds ) {
        await DataBase.createStudent( id, MockClass._id );
    }

    return MockClass;
};

describe( "addHomework", () => {
    let MockClass;
    beforeAll( async () => {
        MockClass = await DataBase.createClass( getUniqueClassName() );
        await MockClass.updateOne( {
            schedule: [
                [ "Математика", "Русский", "Английский" ],
                [ "Английский", "История", "ОБЖ" ],
                [ "Математика", "История", "Обществознание" ],
                [ "Русский", "Английский", "Обществознание" ]
            ]
        } )
    } );
    afterEach( async () => {
        const _class = await DataBase.getClassBy_Id( MockClass._id );
        await _class.updateOne( { homework: [] } );
    } );
    afterAll( async () => {
        await Class.deleteMany( {} )
    } );

    it( "should return true if all is ok", async () => {
        const task = "Сделай дз уже блять сука блять";
        const lesson = "Обществознание";
        const studentVkId = 1488;
        const result = await DataBase.addHomework( MockClass.name, studentVkId, lesson, task );

        return expect( result ).toBe( true );
    } );
    it( "should add one homework with right params", async () => {
        const task = "Сделай дз уже блять сука блять";
        const lesson = "Обществознание";
        const studentVkId = 1488;
        const initialLength = MockClass.homework.length;

        await DataBase.addHomework( MockClass.name, studentVkId, lesson, task, new Date( 2020, 2, 18 ) );
        const updatedClass = await DataBase.getClassBy_Id( MockClass._id );
        const homework = updatedClass.homework.find( dz => dz.task === task );

        expect( updatedClass.homework.length - 1 ).toBe( initialLength );
        expect( homework ).toBeTruthy();
        expect( homework.lesson ).toBe( lesson );
        expect( homework.to ).toEqual( new Date( 2020, 2, 18 ) );
        expect( homework.createdBy ).toEqual( studentVkId );
    } );
    it( "should set homework's 'to' to given date if it passes", async () => {
        const task = "Сделай дз уже блять сука блять";
        const lesson = "Обществознание";
        const studentVkId = 1488;

        await DataBase.addHomework( MockClass.name, studentVkId, lesson, task, new Date( 2019, 9, 22 ) );
        const updatedClass = await DataBase.getClassBy_Id( MockClass._id );
        const homework = updatedClass.homework.find( dz => dz.task === task );

        expect( homework.to ).toEqual( new Date( 2019, 9, 22 ) );
    } )
} );

describe( "getHomework", () => {
    let MockClass;
    beforeAll( async () => {
        MockClass = await DataBase.createClass( getUniqueClassName() );
        await MockClass.updateOne( {
            schedule: [
                [ "Математика", "Русский", "Английский" ]
            ]
        } );

        await DataBase.addHomework( MockClass.name, 1488, "Русский", "Пошалить )" );
        await DataBase.addHomework( MockClass.name, 1488, "Математика", "Да" );
        await DataBase.addHomework( MockClass.name, 1488, "Английский", "Нет", new Date( 2020, 0, 1 ) );
    } );
    afterAll( async () => {
        await Class.deleteMany( {} )
    } );

    it( "should return list of homework", async () => {
        const result = await DataBase.getHomework( MockClass.name );

        expect( result.length ).toBe( 3 );
        expect( result[ 0 ].lesson ).toBe( "Русский" );
        expect( result[ 1 ].lesson ).toBe( "Математика" );
    } );
    it( "if date is passed should return homework only for this date", async () => {
        const result = await DataBase.getHomework( MockClass.name, new Date( 2020, 0, 1 ) );

        expect( result.length ).toBe( 1 );
        expect( result[ 0 ].lesson ).toBe( "Английский" );
    } )
} );

describe( "parseHomeworkToNotifications", () => {
    let MockClass1;
    let MockClass2;
    let studentVkIds1 = [ 1, 2 ];
    let studentVkIds2 = [ 3, 4 ];
    beforeAll( async () => {
        MockClass1 = await createTestData( studentVkIds1, "1A" );
        MockClass2 = await createTestData( studentVkIds2, "2A", false );
    } );
    afterAll( async () => {
        await Class.deleteMany( {} );
        await Student.deleteMany( {} );
    } );

    it( "should return array of arrays where first element is array of vkIds and second is array of homework for them", async () => {
        const [ notificationArray1, notificationArray2 ] = await DataBase.parseHomeworkToNotifications( new Date( 2020, 0, 1, 17 ) );
        expect( notificationArray1 instanceof Array ).toBe( true );
        expect( notificationArray2 ).toBeUndefined(); //Потому что дз нету
        expect( notificationArray1[ 0 ] instanceof Array ).toBe( true );
        expect( notificationArray1[ 1 ] instanceof Array ).toBe( true );
        expect( notificationArray1[ 0 ].length ).toBe( 2 );
        expect( notificationArray1[ 0 ].includes( 1 ) && notificationArray1[ 0 ].includes( 2 ) ).toBe( true );
        expect( notificationArray1[ 1 ].length ).toBe( 2 );
        expect( notificationArray1[ 1 ].find( e => e.task === "1" ) && notificationArray1[ 1 ].find( e => e.task === "2" ) ).toBeTruthy();
    } )
} );
const
    { DataBase } = require( '../DataBase' ),
    mongoose = require( "mongoose" ),
    Student = require( '../../Models/ClassModel' );

const { getUniqueVkId } = require( "../utils/functions" )

describe( "changeSettings", () => {
    let MockStudent;
    let defaultSettings;
    beforeAll( async () => {
        MockStudent = await DataBase.createStudent( getUniqueVkId() );
        defaultSettings = MockStudent.settings;
    } );
    afterEach( async () => {
        await MockStudent.updateOne( { settings: defaultSettings } )
    } );

    it( "should return true if all is ok", async () => {
        const newSettings = {
            notificationsEnabled: false,
            notificationTime: "12:00"
        };

        const result = await DataBase.changeSettings( MockStudent.vkId, newSettings );

        return expect( result ).toBe( true );
    } );
    it( "should change settings by diff", async () => {
        const newSettings1 = {
            notificationsEnabled: false,
            notificationTime: "12:00"
        };
        await DataBase.changeSettings( MockStudent.vkId, newSettings1 );
        const updatedStudent1 = await DataBase.getStudentBy_Id( MockStudent._id );
        expect( Object.keys( newSettings1 ).every( key => updatedStudent1.settings[ key ] === newSettings1[ key ] ) ).toBe( true ); //Проверяет, что все поля из newSettings1 соотвествуют новым настройкам пользователя

        const newSettings2 = {
            notificationTime: "12:00"
        };
        await DataBase.changeSettings( MockStudent.vkId, newSettings2 );
        const updatedStudent2 = await DataBase.getStudentBy_Id( MockStudent._id );
        expect( Object.keys( newSettings2 ).every( key => updatedStudent2.settings[ key ] === newSettings2[ key ] ) ).toBe( true ); //Проверяет, что все поля из newSettings2 соотвествуют новым настройкам пользователя
    } );
    it( "shouldn`t add settings that are in diffObject but not in default settings", async () => {
        const newSettings1 = {
            notificationsEnabled: false,
            notificationTime: "12:00",
            baz: "bar"
        };
        await DataBase.changeSettings( MockStudent.vkId, newSettings1 );
        const updatedStudent = await DataBase.getStudentBy_Id( MockStudent._id );
        return expect( !Object.keys( updatedStudent.settings ).includes( "baz" ) ).toBe( true );
    } )
} );
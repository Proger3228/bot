const { getUniqueClassName, getUniqueVkId } = require( "../utils/functions" );

const
    { DataBase } = require( '../DataBase' ),
    mongoose = require( "mongoose" ),
    Class = require( '../../Models/ClassModel' ),
    Student = require( "../../Models/StudentModel" ),
    { toObject, createTestData } = require( '../utils/functions' );

describe( "addChanges", () => {
    let MockClass;
    let MockStudent;
    let StudentWithoutClass;
    let ClassWithoutStudent;
    beforeAll( async () => {
        const { Class: c, Student: s } = await createTestData();
        const wcu = await DataBase.createStudent( getUniqueVkId() );
        const wsc = await DataBase.createClass( getUniqueClassName() );
        MockStudent = s;
        MockClass = c;
        StudentWithoutClass = wcu;
        ClassWithoutStudent = wsc;
    } );
    afterAll( async () => {
        await Class.deleteMany( {} );
        await Student.deleteMany( {} );
    } );
    afterEach( async () => {
        await Class.deleteMany( {} );
        await Student.deleteMany( {} );
        const { Class: c, Student: s } = await createTestData();
        const wcu = await DataBase.createStudent( getUniqueVkId() );
        const wsc = await DataBase.createClass( getUniqueClassName() );
        MockStudent = s;
        MockClass = c;
        StudentWithoutClass = wcu;
        ClassWithoutStudent = wsc;
    } );

    it( "should return true if all is ok", async () => {
        const content = {
            attachments: "photo123_123_as41",
            text: "changes"
        };

        const result = await DataBase.addChanges( MockStudent.vkId, content );

        return expect( result ).toBe( true );
    } );
    it( "should add all changes to class", async () => {
        const content = {
            attachments: "photo123_123_as41",
            text: "changes"
        };

        await DataBase.addChanges( MockStudent.vkId, content );

        const updatedClass = await DataBase.getClassBy_Id( MockClass._id );

        expect( updatedClass.changes.length ).toBe( 1 );
        expect( updatedClass.changes.find( change => change.attachments === content.attachments && change.text === content.text ) ).not.toBeUndefined();
    } );
    it( "should add changes to all classes if toAll prop passed", async () => {
        const content = {
            attachments: "photo123_123_as41",
            text: "changes"
        };

        await DataBase.addChanges( MockStudent.vkId, content, undefined, true );

        const updatedClass = await DataBase.getClassBy_Id( MockClass._id );
        const updatedClass1 = await DataBase.getClassBy_Id( ClassWithoutStudent._id );

        expect( updatedClass.changes.length ).toBe( 1 );
        expect( updatedClass.changes.find( change => change.attachments === content.attachments && change.text === content.text ) ).not.toBeUndefined();
        expect( updatedClass1.changes.length ).toBe( 1 );
        expect( updatedClass1.changes.find( change => change.attachments === content.attachments && change.text === content.text ) ).not.toBeUndefined();
    } );
    it( "shouldn't add changes if student is not in any class and toAll prop isn\'t passed", async () => {
        const content = {
            attachments: "photo123_123_as41",
            text: "changes"
        };

        const result = await DataBase.addChanges( StudentWithoutClass.vkId, content );

        const updatedClass = await DataBase.getClassBy_Id( MockClass._id );

        expect( result ).toBe( false );
        expect( updatedClass.changes.length ).toBe( 0 );
    } );

    it( "should add changes if student is not in any class and toAll prop is passed", async () => {
        const content = {
            attachments: "photo123_123_as41",
            text: "changes"
        };

        const result = await DataBase.addChanges( StudentWithoutClass.vkId, content, undefined, true );
        const updatedClass = await DataBase.getClassBy_Id( MockClass._id );

        expect( result ).toBe( true );
        expect( updatedClass.changes.length ).toBe( 1 );
        expect( updatedClass.changes.find( change => change.attachments === content.attachments && change.text === content.text ) ).not.toBeUndefined();
    } );
} );

describe( "getChanges", () => {
    const content1 = {
        attachments: "photo111_111_as41",
        text: "changes1"
    };
    const content2 = {
        attachments: "photo222_222_as41",
        text: "changes2"
    };

    let className;
    beforeAll( async () => {
        const { Class: c, Student: s } = await createTestData();
        className = c.name;
        await DataBase.addChanges( s.vkId, content1 );
        await DataBase.addChanges( s.vkId, content2 );
    } );
    afterAll( async () => {
        await Class.deleteMany( {} );
        await Student.deleteMany( {} );
    } )
    afterEach( async () => {
        await Student.deleteMany( {} );
        await Class.deleteMany( {} );
        const { Class: c, Student: s } = await createTestData();
        className = c.name;
        await DataBase.addChanges( s.vkId, content1 );
        await DataBase.addChanges( s.vkId, content2 );
    } )
    it( "should return array of changes for that class", async () => {
        const result = await DataBase.getChanges( className );

        expect( Array.isArray( result ) ).toBe( true );
        expect( result.length ).toBe( 2 );
        expect( result.find( change => change.attachments === content1.attachments && change.text === content1.text ) ).not.toBeUndefined();
        expect( result.find( change => change.attachments === content2.attachments && change.text === content2.text ) ).not.toBeUndefined();
    } );
} );
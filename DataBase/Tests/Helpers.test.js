const ClassModel = require( "../../Models/ClassModel" );

const StudentModel = require( "../../Models/StudentModel" );

const { getUniqueClassName, createTestData } = require( "../utils/functions" );
const { DataBase } = require( "../DataBase" );

describe( "populate", () => {
    afterEach( () => {
        ClassModel.deleteMany( {} );
        StudentModel.deleteMany( {} );
    } )

    it( "should populate class property on student", async () => {
        const { Student, Class } = await createTestData();

        expect( typeof Student.class ).toBe( "object" );

        const populatedStudent = await DataBase.populate( Student );

        expect( populatedStudent.class ).not.toBeNull();
        expect( populatedStudent.class.name ).toBe( Class.name );
    } )

    it( "should populate students property on class", async () => {
        const { Student, Class } = await createTestData();

        expect( Class.students.every( st => typeof st === "object" ) ).toBe( true );

        const populatedClass = await DataBase.populate( Class );

        expect( populatedClass.students.every( st => st !== null ) ).toBe( true );
        expect( populatedClass.students[ 0 ].vkId ).toBe( Student.vkId );
    } )
} )

describe( "checkChangeContentValidity", () => {
    it( "should return true if all poles is passed valid", () => {
        const data = {
            attachments: "photo227667805_457239951_d18b007165cb0d264e",
            text: "text"
        }

        const result = DataBase.validateChangeContent( data );

        expect( result ).toBe( true );
    } )

    it( "should return true if only text is passed and it's valid", () => {
        const data = {
            text: "text"
        }

        const result = DataBase.validateChangeContent( data );

        expect( result ).toBe( true );
    } )
    it( "should return true if only attachments is passed and it's valid", () => {
        const data = {
            attachments: "photo227667805_457239951_d18b007165cb0d264e"
        }

        const result = DataBase.validateChangeContent( data );

        expect( result ).toBe( true );
    } )

    it( "should return false if all poles is passed and all of them is not valid", () => {
        const data = {
            attachments: 1,
            text: {}
        }

        const result = DataBase.validateChangeContent( data );

        expect( result ).toBe( false );
    } )

    it( "should return false if all poles is passed and one of them is not valid", () => {
        const data1 = {
            attachments: 1,
            text: "text"
        }
        const data2 = {
            attachments: "photo227667805_457239951_d18b007165cb0d264e",
            text: 1
        }

        const result1 = DataBase.validateChangeContent( data1 );
        const result2 = DataBase.validateChangeContent( data2 );

        expect( result1 ).toBe( false );
        expect( result2 ).toBe( false );
    } )

    it( "should return false if attachments is string but not valid", () => {
        const data = {
            attachments: "not valid"
        }

        const result = DataBase.validateChangeContent( data );

        expect( result ).toBe( false );
    } )

    it( "should return false if no poles passed", () => {
        const data = {}

        const result = DataBase.validateChangeContent( data );

        expect( result ).toBe( false );
    } )

    it( "should return false if passed more than 2 poles", () => {
        const data = {
            attachments: "photo227667805_457239951_d18b007165cb",
            text: "text",
            somethingElse: ""
        }

        const result = DataBase.validateChangeContent( data );

        expect( result ).toBe( false );
    } )

    it( "should return false if passed valid amount of poles but it's not valid", () => {
        const data = {
            attachments: "photo227667805_457239951_d18b007165cb",
            notText: "text",
        }

        const result = DataBase.validateChangeContent( data );

        expect( result ).toBe( false );
    } )

    it( "should return false if passed object but not plain (array, promise, null)", () => {
        const data1 = null;
        const data2 = new Promise( () => { } );
        const data3 = []

        const result1 = DataBase.validateChangeContent( data1 );
        const result2 = DataBase.validateChangeContent( data2 );
        const result3 = DataBase.validateChangeContent( data3 );

        expect( result1 ).toBe( false );
        expect( result2 ).toBe( false );
        expect( result3 ).toBe( false );
    } )
} ) 
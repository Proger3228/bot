const
    mongoose = require( "mongoose" ),
    Student = require( "../../Models/StudentModel" ),
    Class = require( "../../Models/ClassModel" ),
    { DataBase } = require( "../DataBase" ),
    { Roles } = require( "../../Models/utils" ),
    uuid4 = require( "uuid4" );
const { getUniqueClassName, getUniqueVkId } = require( "../utils/functions" );


const createTestData = async () => {
    const Class = await DataBase.createClass( getUniqueClassName() );
    const Student = await DataBase.createStudent( getUniqueVkId(), Class._id );

    await Class.students.push( Student._id );

    return {
        Student: await DataBase.getStudentBy_Id( Student._id ),
        Class: await DataBase.getClassBy_Id( Class._id )
    }
};

describe( "generateNewRoleUpCode", () => {
    let MockStudent;
    let MockClass;
    beforeAll( async () => {
        const { Student: s, Class: c } = await createTestData();
        MockClass = c;
        MockStudent = s;
    } );
    afterAll( async () => {
        await Class.deleteMany( {} );
        await Student.deleteMany( {} );
    } );
    afterEach( async () => {
        Class.deleteMany( {} );
        Student.deleteMany( {} );
        const { Student: s, Class: c } = await createTestData();
        MockClass = c;
        MockStudent = s;
    } );

    it( "should return valid uuid4 code", async () => {
        const code = await DataBase.generateNewRoleUpCode( MockClass.name );

        return expect( uuid4.valid( code ) );
    } );
    it( "should add code to class found by class name", async () => {
        const code = await DataBase.generateNewRoleUpCode( MockClass.name );

        const updatedClass = await DataBase.getClassBy_Id( MockClass._id );

        return expect( updatedClass.roleUpCodes.includes( code ) ).toBe( true )
    } );
    it( "should save old codes if they were", async () => {
        const givenClass = await DataBase.getClassBy_Id( MockClass._id );
        const code = uuid4();

        await givenClass.updateOne( { roleUpCodes: [ code ] } );
        await DataBase.generateNewRoleUpCode( MockClass.name );

        const updatedClass = await DataBase.getClassBy_Id( MockClass._id );

        return expect( updatedClass.roleUpCodes.includes( code ) ).toBe( true );
    } );
    it( "should return null if can`t find class by name", async () => {
        const code = await DataBase.generateNewRoleUpCode( "not real class name" );

        return expect( code ).toBeNull();
    } );
    it( "should add only one code", async () => {
        const length = MockClass.roleUpCodes.length;

        await DataBase.generateNewRoleUpCode( MockClass.name );

        const updatedClass = await DataBase.getClassBy_Id( MockClass._id );

        return expect( updatedClass.roleUpCodes.length ).toBe( length + 1 );
    } );
} );

describe( "removeRoleUpCode", () => {
    let MockStudent;
    let MockClass;
    beforeAll( async () => {
        const { Student: s, Class: c } = await createTestData();
        MockClass = c;
        MockStudent = s;
    } );
    afterEach( async () => {
        await Student.deleteMany( {} );
        await Class.deleteMany( {} );
        const { Student: s, Class: c } = await createTestData();
        MockClass = c;
        MockStudent = s;
    } );

    it( "should return false if con`t find class by name", async () => {
        const isDeleted = await DataBase.removeRoleUpCode( "not a name", uuid4() );

        return expect( isDeleted ).toBe( false );
    } );
    it( "should return return true if code is deleted", async () => {
        const code = await DataBase.generateNewRoleUpCode( MockClass.name );
        const isDeleted = await DataBase.removeRoleUpCode( MockClass.name, code );

        return expect( isDeleted ).toBe( true );
    } );
    it( "should remove code from class` roleUp codes", async () => {
        const code = await DataBase.generateNewRoleUpCode( MockClass.name );

        await DataBase.removeRoleUpCode( MockClass.name, code );

        const classWithoutCode = await DataBase.getClassBy_Id( MockClass._id );

        return expect( classWithoutCode.roleUpCodes.includes( code ) ).toBe( false );
    } );
    it( "should throw type error if code is not valid uuid4 code", async () => {
        return DataBase.removeRoleUpCode( MockClass.name, "not valid code" )
            .catch( err => expect( err ).toBeInstanceOf( TypeError ) )
    } );
    it( "should remove only one code", async () => {
        const code = await DataBase.generateNewRoleUpCode( MockClass.name );
        const initialLength = ( await DataBase.getClassBy_Id( MockClass._id ) ).roleUpCodes.length;

        await DataBase.removeRoleUpCode( MockClass.name, code );

        const newLength = ( await DataBase.getClassBy_Id( MockClass._id ) ).roleUpCodes.length;

        return expect( newLength ).toBe( initialLength - 1 );
    } )
} );

describe( "checkCodeValidity", () => {
    let MockStudent;
    let MockClass;
    beforeAll( async () => {
        const { Student: s, Class: c } = await createTestData();
        MockClass = c;
        MockStudent = s;
    } );
    afterEach( async () => {
        await Student.deleteMany( {} );
        await Class.deleteMany( {} );
        const { Student: s, Class: c } = await createTestData();
        MockClass = c;
        MockStudent = s;
    } );

    it( "should return false if code is not valid uuid4 code", async () => {
        const response = await DataBase.checkCodeValidity( MockClass, "not valid code" );

        return expect( response ).toBe( false );
    } );
    it( "should return true if code is in class` roleUp codes with passed className", async () => {
        const code = await DataBase.generateNewRoleUpCode( MockClass.name );
        const isValid = await DataBase.checkCodeValidity( MockClass.name, code );

        return expect( isValid ).toBe( true );
    } );
    it( "should return true if code is in class` roleUp codes with passed Document", async () => {
        const code = await DataBase.generateNewRoleUpCode( MockClass.name );
        const updatedClass = await DataBase.getClassBy_Id( MockClass._id );
        const isValid = await DataBase.checkCodeValidity( updatedClass, code );

        return expect( isValid ).toBe( true );
    } );
    it( "should throw error if passed Document but not a class", async () => {
        const code = await DataBase.generateNewRoleUpCode( MockClass.name );

        const f = async () => await DataBase.checkCodeValidity( MockStudent, code );

        return expect( f ).toThrowError( TypeError( "className must be a string or Document" ) );
    } );
    it( "should not change saved codes", async () => {
        const c = await DataBase.getClassBy_Id( MockClass._id );
        const code1 = uuid4();
        const code2 = uuid4();
        await c.updateOne( { roleUpCodes: [ code1, code2 ] } );

        await DataBase.checkCodeValidity( MockClass.name, code2 );

        const reUpdatedClass = await DataBase.getClassBy_Id( MockClass._id );

        expect( reUpdatedClass.roleUpCodes.includes( code2 ) ).toBe( true );
        expect( reUpdatedClass.roleUpCodes.includes( code1 ) ).toBe( true );
    } );
    it( "shouldn`t add codes to class", async () => {
        const code = await DataBase.generateNewRoleUpCode( MockClass.name );

        await DataBase.checkCodeValidity( MockClass.name, code );

        return expect( ( await DataBase.getClassBy_Id( MockClass._id ) ).roleUpCodes.length ).toBe( 1 );
    } );
    it( "should return false if code isn`t in class` roleUp codes", async () => {
        const code = uuid4();

        const response = await DataBase.checkCodeValidity( MockClass.name, code );

        expect( response ).toBe( false );
    } )
} );

describe( "activateRoleUpCode", () => {
    let MockStudent;
    let MockClass;
    beforeAll( async () => {
        const { Student: s, Class: c } = await createTestData();
        MockClass = c;
        MockStudent = s;
    } );
    afterAll( async () => {
        await Student.deleteMany( {} );
        await Class.deleteMany( {} );
    } );
    afterEach( async () => {
        Class.deleteMany( {} );
        Student.deleteMany( {} );
        const { Student: s, Class: c } = await createTestData();
        MockClass = c;
        MockStudent = s;
    } );

    it( "should throw error if code is invalid uuid4 code", async () => {
        return DataBase.activateCode( MockStudent.vkId, "not a code" )
            .catch( err => expect( err ).toBeInstanceOf( TypeError ) );
    } );
    it( "should throw error if student don`t have class property", async () => {
        const student = await DataBase.getStudentBy_Id( MockStudent._id );
        await student.updateOne( { class: undefined } );

        const code = await DataBase.generateNewRoleUpCode( MockClass.name );

        return DataBase.activateCode( MockStudent.vkId, code )
            .catch( err => expect( err ).toBeInstanceOf( TypeError ) );
    } );
    it( "should return false if can`t find student by VkId", async () => {
        const response = await DataBase.activateCode( -1, uuid4() );

        return expect( response ).toBe( false );
    } );
    it( "should return false if code is not pass validity test", async () => {
        const response = await DataBase.activateCode( MockStudent.vkId, uuid4() );

        return expect( response ).toBe( false );
    } );
    it( "should change student role to contributor", async () => {
        const code = await DataBase.generateNewRoleUpCode( MockClass.name );

        await DataBase.activateCode( MockStudent.vkId, code );

        const updatedStudent = await DataBase.getStudentBy_Id( MockStudent._id );

        return expect( updatedStudent.role ).toBe( Roles.contributor );
    } );
} );

describe( "backStudentToInitialRole", () => {
    let MockStudent;
    let MockClass;
    beforeAll( async () => {
        const { Student: s, Class: c } = await createTestData();
        await s.updateOne( { role: Roles.contributor } );
        MockClass = c;
        MockStudent = s;
    } );
    afterAll( async () => {
        await Student.deleteMany( {} );
        await Class.deleteMany( {} );
    } );
    afterEach( async () => {
        Class.deleteMany( {} );
        Student.deleteMany( {} );
        const { Student: s, Class: c } = await createTestData();
        await s.updateOne( { role: Roles.contributor } );
        MockClass = c;
        MockStudent = s;
    } );
    it( "should return true if all is ok", async () => {
        const result = await DataBase.backStudentToInitialRole( MockStudent.vkId );

        return expect( result ).toBe( true );
    } );
    it( "should change student`s role to STUDENT", async () => {
        await DataBase.backStudentToInitialRole( MockStudent.vkId );
        const updatedUser = await DataBase.getStudentByVkId( MockStudent.vkId );

        return expect( updatedUser.role ).toBe( Roles.student );
    } );
    it( "should throw error if vkId is not valid (number)", () => {
        return DataBase.backStudentToInitialRole( "not a number" )
            .catch( e => expect( e ).toBeInstanceOf( TypeError ) )
    } );
    it( "should return false if can`t find student with this vkId", async () => {
        const result = await DataBase.backStudentToInitialRole( -1 );

        return expect( result ).toBe( false );
    } )
} );

describe( "banUser", () => {
    let MockStudent;
    beforeAll( async () => {
        MockStudent = await DataBase.createStudent( getUniqueVkId() );
    } );
    afterAll( async () => {
        await Student.deleteMany( {} );
    } );

    it( "should set user banned to true", async () => {
        await DataBase.banUser( MockStudent.vkId );

        const updatedStudent = await DataBase.getStudentBy_Id( MockStudent._id );

        return expect( updatedStudent.banned ).toBe( true );
    } );
    it( "should set user banned to false if false is passed as second parameter", async () => {
        await DataBase.banUser( MockStudent.vkId );
        await DataBase.banUser( MockStudent.vkId, false );

        const updatedStudent = await DataBase.getStudentBy_Id( MockStudent._id );

        return expect( updatedStudent.banned ).toBe( false );
    } )
} );

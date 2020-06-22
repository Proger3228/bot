// @ts-nocheck
const
    mongoose = require( "mongoose" ),
    VkBot = require( 'node-vk-bot-api' ),
    Session = require( 'node-vk-bot-api/lib/session' ),
    Stage = require( 'node-vk-bot-api/lib/stage' ),
    Markup = require( 'node-vk-bot-api/lib/markup' ),
    config = require( 'config' ),
    { DataBase: DB } = require( "./DataBase/DataBase.js" ),
    bot = new VkBot( config.get( "ALT_TOKEN" ) ),
    VK_API = require( "./DataBase/VkAPI/VK_API" ),
    Scenes = require( "./Scenes.js" ),
    {
        renderLessons,
        formMessage,
        isAdmin,
        renderAdminKeyBoard,
        parseAttachments,
        createDefaultKeyboard
    } = require( "./utils/messagePayloading.js" ),
    botCommands = require( "./utils/botCommands.js" ),
    { Roles, Lessons } = require( "./DataBase/Models/utils" ),
    St = require( "./DataBase/Models/StudentModel" );

const DataBase = new DB( config.get( "MONGODB_URI" ) );

DataBase.connect( {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}, async () => {
    St.findOne( {}, ( err, sts ) => {
        if ( err ) throw err;
        console.log( "Mongoose connected" )
    } )
} );
const vk = new VK_API( config.get( "VK_API_KEY" ), config.get( "GROUP_ID" ), config.get( "ALBUM_ID" ) );

const session = new Session();
const stage = new Stage( ...Object.values( Scenes ) );

bot.use( session.middleware() );
bot.use( stage.middleware() );

bot.command( "start", async ( ctx ) => {
    try {
        const { message: { user_id } } = ctx;
        let student = await DataBase.getStudentByVkId( user_id );
        if ( student ) {
            if ( student.firstName || student.lastName ) {
                const { first_name, last_name } = await vk.getUser( user_id ).then( res => res[ 0 ] );
                student.firstName = first_name;
                student.lastName = last_name;
                await student.save();
            }

            ctx.session.userId = student.vkId;
            ctx.session.isAdmin = student.role === Roles.admin;
            ctx.session.secondName = student.secondName;
            ctx.session.firstName = student.firstName;

            if ( student.registered ) {
                ctx.scene.enter( "start" );
            } else {
                ctx.reply( "Привет " + student.firstName + " " + student.lastName )
                ctx.scene.enter( "register" );
            }
        } else {
            const { first_name: firstName, last_name: lastName } = await vk.getUser( user_id ).then( res => res[ 0 ] );
            student = await DataBase.createStudent( user_id, { firstName, lastName } );

            ctx.session.userId = student.vkId;
            ctx.session.isAdmin = student.role === Roles.admin;
            ctx.session.secondName = student.secondName;
            ctx.session.firstName = student.firstName;

            ctx.scene.enter( "register" );
        }
    } catch ( e ) {
        console.error( e );
    }
} );

bot.command( botCommands.adminPanel, ( ctx ) => ctx.scene.enter( 'adminPanel' ) );
bot.command( botCommands.back, ( ctx ) => ctx.scene.enter( "default" ) );
bot.command( botCommands.toStart, ( ctx ) => ctx.scene.enter( "default" ) );

bot.command( /расписание/i, ( ctx ) => {
    try {
        ctx.reply( formMessage( "Вводите номера уроков по порядку", renderLessons() ) );
    } catch ( e ) {
        console.error( e );
    }
} );
bot.command( /дз/i, ( ctx ) => {
    ctx.reply( "Дз не будет" )
} );

bot.startPolling();


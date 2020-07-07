// @ts-nocheck
const
    VkBot = require( 'node-vk-bot-api' ),
    Session = require( 'node-vk-bot-api/lib/session' ),
    Stage = require( 'node-vk-bot-api/lib/stage' ),
    config = require( 'config' ),
    { DataBase: DB } = require( "./DataBase/DataBase.js" ),
    { dayInMilliseconds, mapHomeworkByLesson } = require( "./DataBase/utils/functions" ),
    bot = new VkBot( config.get( "ALT_TOKEN" ) ),
    VK_API = require( "./DataBase/VkAPI/VK_API" ),
    Scenes = require( "./Scenes.js" ),
    botCommands = require( "./utils/botCommands.js" ),
    http = require( "http" );

const DataBase = new DB( config.get( "MONGODB_URI" ) );

DataBase.connect( {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}, async () => {
    console.log( "Mongoose connected" );
    notifyStudents();
} );
const vk = new VK_API( config.get( "VK_API_KEY" ), config.get( "GROUP_ID" ), config.get( "ALBUM_ID" ) );

const session = new Session();
const stage = new Stage( ...Object.values( Scenes ) );

bot.use( session.middleware() );
bot.use( stage.middleware() );

bot.command( /start|начать|меню|help|помощь/i, async ( ctx ) => {
    try {
        const { message: { user_id } } = ctx;
        let student = await DataBase.getStudentByVkId( user_id );

        if ( student ) {
            if ( student.firstName || student.secondName ) {
                const { first_name, last_name } = await vk.getUser( user_id ).then( res => res[ 0 ] );
                student.firstName = first_name;
                student.secondName = last_name;
                await student.save();
            }

            ctx.session.userId = student.vkId;
            ctx.session.role = student.role
            ctx.session.secondName = student.secondName;
            ctx.session.firstName = student.firstName;
            ctx.session.fullName = student.fullName;

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
            ctx.session.role = student.role
            ctx.session.secondName = student.secondName;
            ctx.session.firstName = student.firstName;

            ctx.scene.enter( "register" );
        }
    } catch ( e ) {
        console.log( e.message );
    }
} );

bot.command( botCommands.adminPanel, ( ctx ) => ctx.scene.enter( 'adminPanel' ) );
bot.command( botCommands.contributorPanel, ( ctx ) => ctx.scene.enter( 'contributorPanel' ) );
bot.command( botCommands.back, ( ctx ) => ctx.scene.enter( "default" ) );
bot.command( botCommands.toStart, ( ctx ) => ctx.scene.enter( "default" ) );

bot.command( botCommands.checkHomework, ( ctx ) => ctx.scene.enter( "checkHomework" ) );
bot.command( botCommands.checkChanges, ( ctx ) => ctx.scene.enter( "checkChanges" ) );
bot.command( botCommands.checkSchedule, ( ctx ) => ctx.scene.enter( "checkSchedule" ) )

bot.command( botCommands.settings, ( ctx ) => ctx.scene.enter( "settings" ) )

bot.command( /.+/, ctx => ctx.reply( botCommands.notUnderstood ) );

bot.startPolling();

const getTomorrowDate = () => new Date( new Date().setDate( new Date().getDate() + 1 ) );
const isToday = ( date ) => ( Math.abs( date.getTime() - new Date().getTime() ) <= dayInMilliseconds ) && date.getDate() === new Date().getDate();
async function notifyStudents () {
    try {
        console.log( "Notifying" );
        const Classes = await DataBase.getAllClasses();

        for ( const Class of Classes ) {
            const tomorrowHomework = await DataBase.getHomeworkByDate( Class, getTomorrowDate() );

            const ids = [];

            if ( tomorrowHomework.length > 0 ) {
                const { students } = await Class.populate( "students" ).execPopulate();

                for ( const student of students ) {
                    if ( student.settings.notificationsEnabled ) {
                        const [ hours, mins ] = student.settings.notificationTime.match( /([0-9]+):([0-9]+)/ ).slice( 1 ).map( Number );

                        const hoursNow = new Date().getHours();
                        const minsNow = new Date().getMinutes();

                        if ( ( hours <= hoursNow && mins <= minsNow ) && !isToday( student.lastHomeworkCheck ) ) {
                            ids.push( student.vkId );
                            student.lastHomeworkCheck = new Date();
                            student.save();
                        }
                    }
                }

                const parsedHomework = mapHomeworkByLesson( tomorrowHomework );
                let message = `Задание на завтра\n`;

                bot.sendMessage( ids, message );

                let c = 0;
                for ( const [ lesson, homework ] of parsedHomework ) {
                    let homeworkMsg = `${lesson}:\n`;
                    let attachments = [];
                    for ( let i = 0; i < homework.length; i++ ) {
                        const hw = homework[ i ];
                        homeworkMsg += hw.text ? `${i + 1}: ${hw.text}\n` : "";
                        attachments = attachments.concat( hw.attachments?.map( ( { value } ) => value ) );
                    }

                    await setTimeout( () => bot.sendMessage( ids, homeworkMsg, attachments ), ++c * 15 );
                }

                return parsedHomework;
            }
        }
    } catch ( e ) {
        console.error( e );
    }
}

notifyStudents();
setInterval( notifyStudents, 1000 * 60 );

http.createServer( ( req, res ) => {
    res.setHeader( "Content-Type", "application/json" );
    res.write( "Bot is working" );
    res.end();
} ).listen( 3000 );



const
    Scene = require( 'node-vk-bot-api/lib/scene' ),
    VkBot = require( 'node-vk-bot-api' ),
    Session = require( 'node-vk-bot-api/lib/session' ),
    config = require( 'config' ),
    {
        isAdmin,
        renderAdminMenu,
        renderAdminMenuKeyboard,
        renderAdminKeyboard,
        createDefaultKeyboard,
        createBackKeyboard,
        createDefaultMenu
    } = require( "./utils/messagePayloading.js" ),
    { DataBase: DB } = require( "./DataBase/DataBase.js" );
const botCommands = require( "./utils/botCommands.js" );
const { Roles } = require( "./DataBase/Models/utils.js" );

const DataBase = new DB( config.get( "MONGODB_URI" ) );

module.exports.errorScene = new Scene( "error",
    ( ctx ) => {
        ctx.reply( "Простите произошла ошибка", null, createDefaultKeyboard( true ) );
    }
)

module.exports.startScene = new Scene( "start",
    ( ctx ) => {
        ctx.reply( `Привет ${ctx.session.firstName} ${ctx.session.secondName}`, null, createDefaultKeyboard( ctx.session.isAdmin ) );
        ctx.scene.enter( "default" );
    }
)

module.exports.defaultScene = new Scene( "default",
    async ( ctx ) => {
        try {
            ctx.scene.next();
            if ( ctx.session.userId ) {
                ctx.reply( createDefaultMenu(), null, createDefaultKeyboard( ctx.session.isAdmin ) );
            } else {
                const student = await DataBase.getStudentByVkId( ctx.message.user_id );

                if ( student ) {
                    ctx.reply( createDefaultMenu(), null, createDefaultKeyboard( student.role === Roles.admin ) );
                } else {
                    ctx.scene.enter( "start" );
                }
            }
        } catch ( e ) {
            ctx.scene.enter( "error" );
            console.error( e );
        }
    },
    ( ctx ) => {
        switch ( ctx.message.body.trim() ) {
            case botCommands.adminPanel: {
                ctx.scene.enter( 'adminPanel' );
                break;
            }
            case botCommands.checkHomework: {
                ctx.scene.enter( 'default' );
                ctx.reply( "Дз не буит" )
            }
        }
    }
)

module.exports.registerScene = new Scene( "register",
    async ( ctx ) => {
        const { scene: { next, leave } } = ctx;
        const { userId } = ctx.session;

        let Student = await DataBase.getStudentByVkId( userId );

        if ( !Student ) {
            Student = await DataBase.createStudent( userId );
        }

        if ( Student.registered ) {
            leave();
            ctx.reply( "Вы уже зарегестрированны" )
        } else {
            next();
            ctx.reply( "Введите имя класса в котором вы учитесь" );
        }
    },
    async ( ctx ) => {
        const { message: { body }, scene: { leave, enter } } = ctx;
        const { userId } = ctx.session;

        const spacelessClassName = body.replace( /\s*/g, "" );
        if ( /\d+([a-z]|[а-я])/i.test( spacelessClassName ) ) {
            const Class = await DataBase.getClassByName( spacelessClassName );
            const Student = await DataBase.getStudentByVkId( userId );

            await Student.updateOne( { registered: true } );
            await Student.save();

            if ( Class ) {
                await DataBase.addStudentToClass( userId, spacelessClassName );
                leave();
                ctx.reply( "Вы успешно зарегестрированны" );
            } else {
                const Class = await DataBase.createClass( spacelessClassName );
                if ( Class ) {
                    await DataBase.addStudentToClass( userId, spacelessClassName );
                    leave();
                    ctx.reply( "Вы успешно зарегестрированны" );
                }
            }
        } else {
            enter( "register" );
            ctx.reply( "Неверное имя класса" );
        }
    }
)

module.exports.adminPanelScene = new Scene( 'adminPanel',
    ( ctx ) => {
        if ( isAdmin( ctx.message.user_id ) ) {
            ctx.scene.next();
            ctx.reply( renderAdminMenu(), null, renderAdminMenuKeyboard() );
        } else {
            ctx.scene.leave();
            ctx.reply( "Ты не админ чтоб такое делать" )
        }
    },
    async ( ctx ) => {
        try {
            if ( [ "0", botCommands.back ].includes( ctx.message.body.trim() ) ) {
                ctx.scene.enter( "default" );
            }

            switch ( ctx.message.body.trim() ) {
                case "1": { }
                case "2": { }
                case "3": { }
                case "4": {
                    ctx.scene.enter( "createClass" );
                    break;
                }
                case "5": {
                    const Classes = await DataBase.getAllClasses();

                    const classesStr = Classes.map( ( { name }, i ) => `${i + 1}. ${name}` ).join( "\n\t" );

                    const message = "Список всех классов\n\t" + classesStr;

                    ctx.reply( message, null, createDefaultKeyboard( true ) );
                }
                case "6": { }
                default: {
                    ctx.reply( "Такого варианта не было" );
                    break;
                }
            }
        } catch ( e ) {
            ctx.scene.leave();
            ctx.reply( "Простите произошла ошибка", null, createDefaultKeyboard( true ) );
            console.error( e );
        }
    },
);

module.exports.createClassScene = new Scene( 'createClass',
    ( ctx ) => {
        ctx.reply( "Введите имя класса (цифра буква)", null, createBackKeyboard() );
        ctx.scene.next();
    },
    ( ctx ) => {
        if ( ctx.message.body.trim() === botCommands.back ) {
            ctx.scene.enter( "default" );
        }
        const { message: { body }, scene: { leave, enter } } = ctx;
        const spacelessClassName = body.replace( /\s*/g, "" );
        if ( /\d+([a-z]|[а-я])/i.test( spacelessClassName ) ) {
            DataBase.createClass( spacelessClassName )
                .then( result => {
                    if ( result ) {
                        leave();
                        ctx.reply( "Класс успешно создан" );
                    } else {
                        ctx.reply( "Создание класса не удалось 😭" );
                    } //исправить (вынести в функцию\превратить старт в сцену\еще что то)
                } )
                .catch( err => {
                    console.log( err );
                    ctx.reply( "Что то пошло не так попробуйте позже" )
                } )
        } else {
            enter( "createClass" );
            ctx.reply( "Неправильный формат ввода (должна быть цифра и потом буква)" );
        }
    },
);


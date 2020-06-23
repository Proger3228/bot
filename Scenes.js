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
        createBackKeyboard,
        createDefaultMenu,
        createDefaultKeyboard
    } = require( "./utils/messagePayloading.js" ),
    { DataBase: DB } = require( "./DataBase/DataBase.js" );
const botCommands = require( "./utils/botCommands.js" );
const { Roles } = require( "./DataBase/Models/utils.js" );
const VK_API = require( "./DataBase/VkAPI/VK_API.js" );

const DataBase = new DB( config.get( "MONGODB_URI" ) );
const vk = new VK_API( config.get( "VK_API_KEY" ), config.get( "GROUP_ID" ), config.get( "ALBUM_ID" ) );

module.exports.errorScene = new Scene( "error",
    async ( ctx ) => {
        ctx.reply( "Простите произошла ошибка", null, await createDefaultKeyboard( true ) );
    }
)

module.exports.startScene = new Scene( "start",
    async ( ctx ) => {
        ctx.reply( `Привет ${ctx.session.firstName} ${ctx.session.secondName}`, null, await createDefaultKeyboard( ctx.session.isAdmin, ctx ) );
        ctx.scene.enter( "default" );
    }
)

module.exports.defaultScene = new Scene( "default",
    async ( ctx ) => {
        try {
            ctx.scene.next();
            if ( ctx.session.userId ) {
                ctx.reply( createDefaultMenu(), null, await createDefaultKeyboard( ctx.session.isAdmin, ctx ) );
            } else {
                const student = await DataBase.getStudentByVkId( ctx.message.user_id );

                if ( student ) {
                    ctx.reply( createDefaultMenu(), null, await createDefaultKeyboard( student.role === Roles.admin ) );
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
        if ( ctx.session.isAdmin ?? isAdmin( ctx.message.user_id ) ) {
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
                case "1": {
                    ctx.scene.enter( "addRedactor" );
                    break;
                }
                case "2": {
                    ctx.scene.enter( "removeRedactor" );
                    break;
                }
                case "3": {
                    const Contributors = await DataBase.getAllContributors();

                    if ( Contributors.length > 0 ) {

                        const classesStr = Contributors.map( ( { firstName, secondName, vkId }, i ) => `${i + 1}. ${firstName} ${secondName} (${vkId})` ).join( "\n\t" );

                        const message = "Список всех редакторов\n\t" + classesStr;

                        ctx.reply( message, null, await createDefaultKeyboard( true ) );
                    } else {
                        ctx.reply( "Не существует ни одного редактора", null, await createDefaultKeyboard( true ) );
                    }
                    ctx.scene.enter( "default" );
                    break;
                }
                case "4": {
                    ctx.scene.enter( "createClass" );
                    break;
                }
                case "5": {
                    const Classes = await DataBase.getAllClasses();

                    if ( Classes.length > 0 ) {

                        const classesStr = Classes.map( ( { name }, i ) => `${i + 1}. ${name}` ).join( "\n\t" );

                        const message = "Список всех классов\n\t" + classesStr;

                        ctx.reply( message, null, await createDefaultKeyboard( true ) );
                    } else {
                        ctx.reply( "Не существует ни одного класса", null, await createDefaultKeyboard( true ) );
                    }
                    ctx.scene.enter( "default" );
                    break;
                }
                case "6": {
                    break;
                }
                default: {
                    ctx.reply( "Такого варианта не было" );
                    break;
                }
            }
        } catch ( e ) {
            ctx.scene.leave();
            ctx.reply( "Простите произошла ошибка", null, await createDefaultKeyboard( true ) );
            console.error( e );
        }
    },
);

module.exports.addRedactor = new Scene( "addRedactor",
    ( ctx ) => {
        ctx.reply( "Введите id пользователя, которого хотите сделать редактором", null, createBackKeyboard() );
        ctx.scene.next();
    },
    async ( ctx ) => {
        try {
            if ( ctx.message.body.trim() === botCommands.back ) {
                ctx.scene.enter( "default" );
            }
            const { message: { body }, scene: { leave, enter } } = ctx;
            const id = Number( body.trim() );

            if ( !isNaN( id ) ) {
                let Student = await DataBase.getStudentByVkId( id );

                if ( Student && Student.role === Roles.admin ) {
                    ctx.reply( "Пользователь уже является администратором", null, await createDefaultKeyboard( ctx.session.isAdmin, ctx ) );
                    ctx.scene.enter( "default" );
                    return;
                } else if ( Student && Student.role === Roles.contributor ) {
                    ctx.reply( "Пользователь уже является редактором", null, await createDefaultKeyboard( ctx.session.isAdmin, ctx ) );
                    ctx.scene.enter( "default" );
                    return;
                }

                if ( !Student ) {
                    const response = await vk.api( "users.get", { user_ids: id } );
                    console.log( response );
                    if ( !response.error_code && response ) {
                        const { first_name, last_name } = response[ 0 ];
                        Student = await DataBase.createStudent( id, { firstName: first_name, lastName: last_name } );
                    } else {
                        throw new Error();
                    }
                }

                Student.role = Roles.contributor;
                await Student.save();

                ctx.reply( "Пользователь стал редактором", null, await createDefaultKeyboard( ctx.session.isAdmin, ctx ) );
                ctx.scene.enter( "default" );
            } else {
                ctx.reply( "Неверный id" );
                ctx.scene.enter( "addRedactor" );
            }
        } catch ( e ) {
            ctx.scene.leave();
            ctx.reply( "Простите произошла ошибка", null, await createDefaultKeyboard( true ) );
            console.error( e );
        }
    },
)

module.exports.removeRedactor = new Scene( "removeRedactor",
    ( ctx ) => {
        ctx.reply( "Введите id пользователя, которого хотите сделать редактором", null, createBackKeyboard() );
        ctx.scene.next();
    },
    async ( ctx ) => {
        try {
            if ( ctx.message.body.trim() === botCommands.back ) {
                ctx.scene.enter( "default" );
            }
            const { message: { body }, scene: { leave, enter } } = ctx;
            const id = Number( body.trim() );

            if ( !isNaN( id ) ) {
                let Student = await DataBase.getStudentByVkId( id );

                if ( Student && Student.role === Roles.admin ) {
                    ctx.reply( "Пользователя нельзя понизить в роли, так как он является администратором", null, await createDefaultKeyboard( ctx.session.isAdmin, ctx ) );
                    ctx.scene.enter( "default" );
                    return;
                } else if ( !Student || Student.role === Roles.student ) {
                    ctx.reply( "Пользователь уже не является редактором", null, await createDefaultKeyboard( ctx.session.isAdmin, ctx ) );
                    ctx.scene.enter( "default" );
                    return;
                }

                Student.role = Roles.student;
                await Student.save();

                ctx.reply( "Пользователь перестал быть редактором", null, await createDefaultKeyboard( ctx.session.isAdmin, ctx ) );
                ctx.scene.enter( "default" );
            } else {
                ctx.reply( "Неверный id" );
                ctx.scene.enter( "removeRedactor" );
            }
        } catch ( e ) {
            ctx.scene.leave();
            ctx.reply( "Простите произошла ошибка", null, await createDefaultKeyboard( true ) );
            console.error( e );
        }
    },
)

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



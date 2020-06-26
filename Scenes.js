const
    Scene = require( 'node-vk-bot-api/lib/scene' ),
    config = require( 'config' ),
    {
        isAdmin,
        renderAdminMenu,
        renderAdminMenuKeyboard,
        renderAdminKeyboard,
        createBackKeyboard,
        createDefaultMenu,
        createDefaultKeyboard,
        renderContributorMenu,
        renderContributorMenuKeyboard,
        mapListToMessage,
        lessonsList,
    } = require( "./utils/messagePayloading.js" ),
    { DataBase: DB } = require( "./DataBase/DataBase.js" );
const botCommands = require( "./utils/botCommands.js" );
const { Roles, DaysOfWeek, daysOfWeek, isValidClassName, Lessons } = require( "./DataBase/Models/utils.js" );
const VK_API = require( "./DataBase/VkAPI/VK_API.js" );
const Markup = require( "node-vk-bot-api/lib/markup" );
const DataBase = new DB( config.get( "MONGODB_URI" ) );
const vk = new VK_API( config.get( "VK_API_KEY" ), config.get( "GROUP_ID" ), config.get( "ALBUM_ID" ) );

module.exports.errorScene = new Scene( "error",
    async ( ctx ) => {
        ctx.reply( "Простите произошла ошибка", null, await createDefaultKeyboard( ctx.session.isAdmin, ctx.session.isContributor, ctx ) );
    }
)

module.exports.startScene = new Scene( "start",
    async ( ctx ) => {
        ctx.reply( `Привет ${ctx.session.firstName} ${ctx.session.secondName}`, null, await createDefaultKeyboard( ctx.session.isAdmin, ctx.session.isContributor, ctx ) );
        ctx.scene.enter( "default" );
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
                ctx.reply( "Вы успешно зарегестрированны", null, await createDefaultKeyboard( ctx.session.isAdmin, ctx.session.isContributor, ctx ) );
            } else {
                const Class = await DataBase.createClass( spacelessClassName );
                if ( Class ) {
                    await DataBase.addStudentToClass( userId, spacelessClassName );
                    leave();
                    ctx.reply( "Вы успешно зарегестрированны", null, null, await createDefaultKeyboard( ctx.session.isAdmin, ctx.session.isContributor, ctx ) );
                }
            }
        } else {
            enter( "register" );
            ctx.reply( "Неверное имя класса" );
        }
    }
)

module.exports.defaultScene = new Scene( "default",
    async ( ctx ) => {
        try {
            ctx.scene.next();
            if ( ctx.session.userId ) {
                ctx.reply( createDefaultMenu(), null, await createDefaultKeyboard( ctx.session.isAdmin, ctx.session.isContributor, ctx ) );
            } else {
                const student = await DataBase.getStudentByVkId( ctx.message.user_id );

                if ( student ) {
                    ctx.reply( createDefaultMenu(), null, await createDefaultKeyboard( student.role === Roles.admin, student.role === Roles.contributor ) );
                } else {
                    ctx.scene.enter( "start" );
                }
            }
        } catch ( e ) {
            ctx.scene.enter( "error" );
            console.error( e );
        }
    },
    async ( ctx ) => {
        try {
            switch ( ctx.message.body.trim() ) {
                case botCommands.adminPanel: {
                    ctx.scene.enter( 'adminPanel' );
                    break;
                }
                case botCommands.contributorPanel: {
                    ctx.scene.enter( 'contributorPanel' );
                    break;
                }
                case botCommands.checkHomework: {
                    ctx.scene.enter( 'default' );
                    ctx.reply( "Дз не буит" )
                }
                case botCommands.checkSchedule: {
                    ctx.scene.enter( 'checkSchedule' );
                }
            }
        } catch ( e ) {
            ctx.scene.enter( "error" );
            console.error( e );
        }
    }
)
module.exports.checkSchedule = new Scene( "checkSchedule",
    async ( ctx ) => {
        try {
            if ( ctx.session.isAdmin ?? ctx.session.isContributor ?? await DataBase.getRole( ctx.message.user_id ) !== Roles.student ) {
                const Classes = await DataBase.getAllClasses();
                if ( Classes.length > 0 ) {
                    ctx.session.classes = Classes;

                    const classesStr = mapListToMessage( Classes.map( ( { name } ) => name ) );

                    const message = "Для какого класса вы хотите посмотреть расписание?\n \t" + classesStr;

                    ctx.scene.next();
                    const columns = Classes.length % 4 === 0
                        ? 4
                        : Classes.length % 3 === 0
                            ? 3
                            : Classes.length % 2 === 0
                                ? 2
                                : 4
                    ctx.reply( message, null, createBackKeyboard( Classes.map( ( { name }, i ) => Markup.button( i + 1, "default", { button: name } ) ), columns ) );
                } else {
                    ctx.scene.enter( "default" );
                    ctx.reply( "Не существует ни одного класса" )
                };
            } else {
                const Student = await DataBase.getStudentByVkId( ctx.session.userId || ctx.message.user_id );

                if ( Student ) {
                    if ( Student.registered ) {
                        const Class = await DataBase.getClassBy_Id( Student.class );

                        const message = await getScheduleString( Class, ctx );

                        if ( message.trim() === "" ) {
                            ctx.scene.enter( "default" );
                            ctx.reply( "Для данного класса пока что не существует расписания", null, await createDefaultKeyboard( ctx.session.isAdmin, ctx.session.isContributor, ctx ) );
                        }
                        else {
                            ctx.scene.enter( 'default' );
                            ctx.reply( message, null, await createDefaultKeyboard( ctx.session.isAdmin, ctx.session.isContributor, ctx ) );
                        }
                    } else {
                        ctx.scene.enter( 'register' );
                        ctx.reply( "Сначала вам необходимо зарегестрироваться, введите имя класса в котором вы учитесь" );
                    }
                } else {
                    console.log( "user are not existing", ctx.session.userId );
                    throw new Error();
                }
            }
        } catch ( e ) {
            console.error( e );
            ctx.scene.enter( "error" );
        }
    },
    async ( ctx ) => {
        if ( ctx.message.body === botCommands.back ) {
            ctx.scene.enter( "default" );
            return;
        }

        const { message: { body: classIndex } } = ctx;

        let { classes } = ctx.session;

        if ( !classes ) {
            classes = await DataBase.getAllClasses();
        }

        let Class;

        if ( isValidClassName( classIndex ) ) {
            Class = classes.find( ( { name } ) => name === classIndex );
        } else if ( !isNaN( classIndex ) ) {
            Class = classes[ classIndex - 1 ];
        }

        if ( Class ) {
            const message = await getScheduleString( Class, ctx );

            if ( message.trim() === "" ) {
                ctx.scene.enter( "default" );
                ctx.reply( "Для данного класса пока что не существует расписания", null, await createDefaultKeyboard( ctx.session.isAdmin, ctx.session.isContributor, ctx ) );
            }
            else {
                ctx.scene.enter( 'default' );
                ctx.reply( message, null, await createDefaultKeyboard( ctx.session.isAdmin, ctx.session.isContributor, ctx ) );
            }
        } else {
            ctx.reply( "Неверное имя класса" );
        }

        ctx.session.classses = undefined;
    }
)
//TODO
module.exports.checkHomework = new Scene( "checkHomework",

)

module.exports.adminPanelScene = new Scene( 'adminPanel',
    async ( ctx ) => {
        if ( ctx.session.isAdmin ?? ( await DataBase.getRole( ctx.message.user_id ) === Roles.admin ) ) {
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
                return;
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

                        const classesStr = mapListToMessage( Contributors.map( ( { firstName, secondName, vkId } ) => `${firstName} ${secondName} (${vkId})` ) );

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

                        const classesStr = mapListToMessage( Classes.map( ( { name } ) => name ) );

                        const message = "Список всех классов\n\t" + classesStr;

                        ctx.reply( message, null, await createDefaultKeyboard( true, false ) );
                    } else {
                        ctx.reply( "Не существует ни одного класса", null, await createDefaultKeyboard( true, false ) );
                    }
                    ctx.scene.enter( "default" );
                    break;
                }
                default: {
                    ctx.reply( "Такого варианта не было" );
                    break;
                }
            }
        } catch ( e ) {
            ctx.scene.leave();
            ctx.reply( "Простите произошла ошибка", null, await createDefaultKeyboard( true, false ) );
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
                    ctx.reply( "Пользователь уже является администратором", null, await createDefaultKeyboard( true, false ) );
                    ctx.scene.enter( "default" );
                    return;
                } else if ( Student && Student.role === Roles.contributor ) {
                    ctx.reply( "Пользователь уже является редактором", null, await createDefaultKeyboard( true, false ) );
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

                ctx.reply( "Пользователь стал редактором", null, await createDefaultKeyboard( true, false ) );
                ctx.scene.enter( "default" );
            } else {
                ctx.reply( "Неверный id" );
                ctx.scene.enter( "addRedactor" );
            }
        } catch ( e ) {
            ctx.scene.leave();
            ctx.reply( "Простите произошла ошибка", null, await createDefaultKeyboard( true, false ) );
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
                    ctx.reply( "Пользователя нельзя понизить в роли, так как он является администратором", null, await createDefaultKeyboard( true, false ) );
                    ctx.scene.enter( "default" );
                    return;
                } else if ( !Student || Student.role === Roles.student ) {
                    ctx.reply( "Пользователь уже не является редактором", null, await createDefaultKeyboard( true, false ) );
                    ctx.scene.enter( "default" );
                    return;
                }

                Student.role = Roles.student;
                await Student.save();

                ctx.reply( "Пользователь перестал быть редактором", null, await createDefaultKeyboard( true, false ) );
                ctx.scene.enter( "default" );
            } else {
                ctx.reply( "Неверный id" );
                ctx.scene.enter( "removeRedactor" );
            }
        } catch ( e ) {
            ctx.scene.leave();
            ctx.reply( "Простите произошла ошибка", null, await createDefaultKeyboard( true, false ) );
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
                        ctx.reply( "Создание класса не удалось" );
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

module.exports.contributorPanelScene = new Scene( 'contributorPanel',
    async ( ctx ) => {
        if ( ( ctx.session.isContributor || ctx.session.isAdmin ) ?? ( await DataBase.getRole( ctx.message.user_id ) !== Roles.student ) ) {
            ctx.scene.next();
            ctx.reply( renderContributorMenu(), null, renderContributorMenuKeyboard() );
        } else {
            ctx.scene.leave();
            ctx.reply( "Ты не редактор чтоб такое делать" )
        }
    },
    async ( ctx ) => {
        try {
            if ( [ "0", botCommands.back ].includes( ctx.message.body.trim() ) ) {
                ctx.scene.enter( "default" );
                return;
            }

            switch ( ctx.message.body.trim() ) {
                case "1": {
                    ctx.scene.enter( "addHomework" );
                    break;
                }
                case "2": {
                    ctx.scene.enter( "addChange" );
                    break;
                }
                case "3": {
                    ctx.scene.enter( "changeSchedule" );
                    break;
                }
                default: {
                    ctx.reply( "Такого варианта не было" );
                    break;
                }
            }
        } catch ( e ) {
            ctx.scene.leave();
            ctx.reply( "Простите произошла ошибка", null, await createDefaultKeyboard( true, false ) );
            console.error( e );
        }
    },
);
//TODO
module.exports.addHomework = new Scene( "addHomework",

)
//TODO
module.exports.addChange = new Scene( "addChange",

)
module.exports.changeSchedule = new Scene( "changeSchedule",
    async ( ctx ) => {
        try {
            if ( ctx.session.isAdmin ?? ctx.session.isContributor ?? await DataBase.getRole( ctx.message.user_id ) !== Roles.student ) {
                const Classes = await DataBase.getAllClasses();
                if ( Classes.length > 0 ) {
                    ctx.session.classes = Classes;

                    const classesStr = mapListToMessage( Classes.map( ( { name } ) => name ) );

                    const message = "Для какого класса вы хотите посмотреть расписание?\n \t" + classesStr;

                    ctx.scene.next();
                    const columns = Classes.length % 4 === 0
                        ? 4
                        : Classes.length % 3 === 0
                            ? 3
                            : Classes.length % 2 === 0
                                ? 2
                                : 4
                    ctx.reply( message, null, createBackKeyboard( Classes.map( ( { name }, i ) => Markup.button( i + 1, "default", { button: name } ) ), columns ) );
                } else {
                    ctx.scene.enter( "default" );
                    ctx.reply( "Не существует ни одного класса" )
                };
            } else {
                const Student = await DataBase.getStudentByVkId( ctx.session.userId || ctx.message.user_id );

                if ( Student ) {
                    if ( Student.registered ) {
                        const Class = await DataBase.getClassBy_Id( Student.class );
                        //TODO add function

                    } else {
                        ctx.scene.enter( 'register' );
                        ctx.reply( "Сначала вам необходимо зарегестрироваться, введите имя класса в котором вы учитесь" );
                    }
                } else {
                    console.log( "user are not existing", ctx.session.userId );
                    throw new Error();
                }
            }
        } catch ( e ) {
            console.error( e );
            ctx.scene.enter( "error" );
        }
    },
    async ( ctx ) => {
        try {
            if ( ctx.message.body === botCommands.back ) {
                ctx.scene.enter( "default" );
                return;
            }

            const { message: { body: classIndex } } = ctx;

            let { classes } = ctx.session;

            if ( !classes ) {
                classes = await DataBase.getAllClasses();
            }

            let Class;

            if ( isValidClassName( classIndex ) ) {
                Class = classes.find( ( { name } ) => name === classIndex );
            } else if ( !isNaN( classIndex ) ) {
                Class = classes[ classIndex - 1 ];
            }

            if ( Class ) {
                ctx.session.Class = Class;
                ctx.session.schedule = Class.schedule;

                const days = Object.values( daysOfWeek );
                const buttons = days.map( ( day, index ) => Markup.button( index + 1, "default", { button: day } ) );

                buttons.push( Markup.button( "0", "primary" ) );

                const message = "Выберите день у которого хотите изменить расписание\n" + mapListToMessage( days ) + "\n0. Заполнить всё";

                ctx.scene.next();
                ctx.reply( message, null, createBackKeyboard( buttons ) );
            } else {
                ctx.reply( "Неверное имя класса" );
            }

            ctx.session.classses = undefined;
        } catch ( e ) {
            console.error( e );
            ctx.scene.enter( "error" );
        }
    },
    async ( ctx ) => {
        try {
            const { message: { body } } = ctx;

            if ( body === "Заполнить всё" || body === "0" ) {
            } else if ( ( !isNaN( +body ) && +body >= 1 && +body <= 7 ) || Object.values( daysOfWeek ).includes( body ) ) {
                ctx.session.changingDay = +body;

                const message = `Введите новое расписание цифрами через запятую или пробел, выбирая из этих предметов\n ${lessonsList}`;

                ctx.scene.next();
                ctx.reply( message, null, createBackKeyboard() );
            } else {
                ctx.reply( "Неверно введен день" );
            }
        } catch ( e ) {
            console.error( e );
            ctx.scene.enter( "error" );
        }
    },
    ( ctx ) => {
        try {
            let { message: { body } } = ctx;
            body = body.replace( /,/g, " " );

            let indexes = body.split( " " ).filter( Boolean );
            if ( indexes.every( index => !isNaN( +index ) ) ) {
                indexes = indexes.map( i => +i + 1 );
                if ( indexes.every( index => index > 0 && index < Lessons.length - 1 ) ) {
                    const newLessons = indexes.map( i => Lessons[ i ] );
                    ctx.session.schedule[ ctx.session.changingDay - 1 ] = newLessons;

                    ctx.scene.next();
                    ctx.reply(
                        "Вы уверенны что хотите изменить расписание на это:\n" + mapListToMessage( newLessons ),
                        null,
                        Markup.keyboard( [ Markup.button( "Нет", "negative" ), Markup.button( "Да", "positive" ) ] )
                    );
                } else {
                    ctx.reply( "Проверьте правильность введенного расписания" );
                }
            } else {
                ctx.reply( "Вы должны вводить только цифры" )
            }
        } catch ( e ) {
            console.log( e );
            ctx.scene.enter( "error" );
        }
    },
    async ( ctx ) => {
        try {
            const { message: { body } } = ctx;
            const { schedule, Class } = ctx.session;

            if ( body.toLowerCase() === "да" ) {
                if ( schedule && Class ) {
                    await Class.updateOne( { schedule } );
                    ctx.scene.enter( "default" );
                    ctx.reply( "Расписание успешно обновлено" );
                } else {
                    console.log( "Schedule is ", schedule, "Class is ", Class );
                    throw new Error();
                }
            } else {
                ctx.scene.selectStep( 4 );
            }
        } catch ( e ) {
            console.error( e );
            ctx.scene.enter( "error" );
        }
    }
)
async function getScheduleString ( Class ) {
    const { schedule } = Class;

    const message = schedule.map( ( lessons, i ) => {
        const dayName = daysOfWeek[ i ];

        const dayMessage = lessons.length > 0 ? `${dayName}: \n ${mapListToMessage( lessons )}` : "";

        return dayMessage;
    } ).join( "\n\n" );


    return message
}


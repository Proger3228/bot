const { Lessons, Roles } = require( "../DataBase/Models/utils" );
const config = require( "config" );
const Markup = require( "node-vk-bot-api/lib/markup" );
const botCommands = require( "./botCommands" );
const { DataBase: DB } = require( "../DataBase/DataBase" );

const DataBase = new DB( config.get( "MONGODB_URI" ) );

const contentPropertyNames = {
    to: "Дата",
    text: "Текст",
    lesson: "Урок",
    createdBy: "Создал"
}
//Родительный падеж
const monthsRP = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря"
];

const userOptions = [
    { label: botCommands.checkHomework, payload: "checkHomework", color: "primary" },
    { label: botCommands.checkSchedule, payload: "checkSchedule", color: "primary" },
    { label: botCommands.studentPanel, payload: "studentPanel", color: "primary" },
]
const contributorOptions = [
    { label: "Добавить дз", payload: "addHomework", color: "default" },
    { label: "Добавить изменения в расписании", payload: "addChange", color: "default" },
    { label: "Изменить расписание", payload: "changeSchedule", color: "default" },
]
const adminOptions = [
    { label: "Добавить редактора", payload: "addRedactor", color: "default" },
    { label: "Удалить редактора", payload: "removeRedactor", color: "default" },
    { label: "Список редакторов", payload: "redactorsList", color: "default" },
    { label: "Добавить класс", payload: "addClass", color: "default" },
    { label: "Список классов", payload: "classList", color: "default" },
];

const mapListToMessage = ( list, startIndex = 1 ) => {
    return list.map( ( e, i ) => `${i + startIndex}. ${e}` ).join( "\n" );
};
const formMessage = ( ...messageSections ) => {
    return messageSections.join( "\n" );
};

const renderAdminMenu = () => {
    return formMessage(
        "Админское меню\n",
        ...adminOptions.map( ( { label }, i ) => `${i + 1}. ${label}` ),
        "0: Назад"
    );
};
const renderAdminMenuKeyboard = () => {
    const buttons = adminOptions.map( ( opt, i ) => Markup.button( i + 1, "default", { button: opt.payload } ) )

    buttons.push( Markup.button( "Назад", "negative", { button: "back" } ) );

    return Markup.keyboard( buttons, { columns: 3 } );
}

const renderContributorMenu = () => {
    return formMessage(
        "Меню редактора\n",
        ...contributorOptions.map( ( { label }, i ) => `${i + 1}. ${label}` ),
        "0: Назад"
    );
};
const renderContributorMenuKeyboard = () => {
    const buttons = contributorOptions.map( ( opt, i ) => Markup.button( i + 1, "default", { button: opt.payload } ) )

    buttons.push( Markup.button( "Назад", "negative", { button: "back" } ) );

    return Markup.keyboard( buttons, { columns: 3 } );
}

const isAdmin = ( userId ) => {
    return config.get( "admins" ).includes( userId );
};

const parseAttachments = ( attachments ) => {
    if ( Array.isArray( attachments ) && attachments.every( att => att.type && att[ att.type ] ) ) {
        return attachments.map( att => `${att.type}${att[ att.type ].owner_id}_${att[ att.type ].id}${att[ att.type ].access_key ? "_" + att[ att.type ].access_key : ""}` )
    } else if ( attachments.type && attachments[ attachments.type ] ) {
        return `${attachments.type}${attachments[ attachments.type ].owner_id}_${attachments[ attachments.type ].id}${attachments[ attachments.type ].access_key ? "_" + attachments[ attachments.type ].access_key : ""}`
    } else {
        throw new TypeError( "Wrong attachments type" );
    }
};

const createDefaultMenu = () => {
    return formMessage(
        "Меню:",
        ...userOptions.map( ( { label }, i ) => `${i + 1}. ${label}` )
    )
}
const createDefaultKeyboard = async ( isAdmin, isContributor, ctx ) => {
    try {
        let buttons = userOptions.map( ( { label, payload, color } ) => Markup.button( label, color, { button: payload } ) );

        let role;
        //TODO change is*Role* flags by role in session
        if ( isContributor === undefined && !isAdmin ) {
            role = await DataBase.getRole( ctx.message.user_id ) === Roles.contributor;
            ctx.session.isContributor = role;
            isContributor = role;
        }
        if ( isAdmin === undefined ) {
            role = role || await DataBase.getRole( ctx.message.user_id ) === Roles.admin;
            ctx.session.isAdmin = role;
            isAdmin = role;
        }

        if ( isContributor || isAdmin ) {
            buttons.push( Markup.button( botCommands.contributorPanel, "primary", { button: "contributorPanel" } ) );
        }
        if ( isAdmin ) {
            buttons.push( Markup.button( botCommands.adminPanel, "positive", { button: "adminMenu" } ) );
        }

        return Markup.keyboard( buttons, { columns: buttons.length > 2 ? 2 : 1 } );
    } catch ( e ) {
        console.error( e );
    }
}

const createBackKeyboard = ( existingButtons = [], columns = 4 ) => {
    existingButtons.push( Markup.button( botCommands.back, "negative", { button: "back" } ) );

    return Markup.keyboard( existingButtons, { columns } );
}
const createConfirmKeyboard = ( existingButtons = [], columns = 4 ) => {
    existingButtons.push( Markup.button( botCommands.no, "negative" ), Markup.button( botCommands.yes, "positive" ) );

    return Markup.keyboard( existingButtons, { columns } );
}

const parseDateToStr = Date => `${Date.getDate()} ${monthsRP[ Date.getMonth() ]}`;
const createContentDiscription = ( { to, lesson, text } ) => {
    return `${lesson ? `${contentPropertyNames.lesson}: ${lesson}\n` : ""}
        ${contentPropertyNames.text}: ${text}\n
        ${to ? `${contentPropertyNames.to}: ${parseDateToStr( to )}\n` : ""}`
}

const lessonsList = mapListToMessage( Lessons, 0 );

module.exports = {
    formMessage,
    isAdmin,
    renderAdminMenu,
    parseAttachments,
    createDefaultKeyboard,
    renderAdminMenuKeyboard,
    createBackKeyboard,
    createDefaultMenu,
    renderContributorMenuKeyboard,
    renderContributorMenu,
    mapListToMessage,
    lessonsList,
    createContentDiscription,
    parseDateToStr,
    createConfirmKeyboard
};
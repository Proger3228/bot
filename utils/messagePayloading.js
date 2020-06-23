const { Lessons, Roles } = require( "../DataBase/Models/utils" );
const config = require( "config" );
const Markup = require( "node-vk-bot-api/lib/markup" );
const botCommands = require( "./botCommands" );
const { checkHomework, adminPanel } = require( "./botCommands" );
const { DataBase: DB } = require( "../DataBase/DataBase" );

const DataBase = new DB( config.get( "MONGODB_URI" ) );

const userOptions = [
    { label: botCommands.checkHomework, payload: checkHomework },
    { label: botCommands.adminPanel, payload: adminPanel }
]
const adminOptions = [
    { label: "Добавить редактора", payload: "addRedactor" },
    { label: "Удалить редактора", payload: "removeRedactor" },
    { label: "Список редакторов", payload: "redactorsList" },
    { label: "Добавить класс", payload: "addClass" },
    { label: "Список классов", payload: "classList" },
    { label: "Настройки расписания", payload: "scheduleSettings" },
];

const renderLessons = () => {
    return Lessons.map( ( e, i ) => `${i}: ${e}` ).join( "\n" );
};

const formMessage = ( ...messageSections ) => {
    return messageSections.join( "\n" );
};

const renderAdminMenu = () => {
    return formMessage(
        "Админское меню\n",
        ...adminOptions.map( ( { label }, i ) => `${i + 1}: ${label}` ),
        "0: Назад"
    );
};
const renderAdminMenuKeyboard = () => {
    const buttons = adminOptions.map( ( opt, i ) => Markup.button( i + 1, "default", { button: opt.payload } ) )

    buttons.push( Markup.button( "Назад", "negative", { button: "back" } ) );

    return Markup.keyboard( buttons, { columns: 3 } );
}

const isAdmin = ( userId ) => {
    return config.get( "admins" ).includes( userId );
};

const parseAttachments = ( attachments ) => {
    if ( Array.isArray( attachments ) && attachments.every( att => att.type && att[ att.type ] ) ) {
        return attachments.map( att => `${att.type}${att[ att.type ].owner_id}_${att[ att.type ].id}${att[ att.type ].access_key ? "_" + att[ att.type ].access_key : ""}` )
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
const createDefaultKeyboard = async ( isAdmin, ctx ) => {
    let buttons = [
        Markup.button( botCommands.checkHomework, "primary" )
    ];

    if ( isAdmin === undefined ) {
        ctx.session.isAdmin = await DataBase.getRole( ctx.message.user_id ) === Roles.admin;
        isAdmin = ctx.session.isAdmin;
    }

    if ( isAdmin ) {
        buttons.push( Markup.button( botCommands.adminPanel, "positive", { button: "adminMenu" } ) );
    }

    return Markup.keyboard( buttons, { columns: 1 } );
}

const createBackKeyboard = ( existingButtons = [] ) => {
    existingButtons.push( Markup.button( botCommands.back, "negative", { button: "back" } ) );

    return Markup.keyboard( existingButtons );
}

module.exports = {
    renderLessons,
    formMessage,
    isAdmin,
    renderAdminMenu,
    parseAttachments,
    createDefaultKeyboard,
    renderAdminMenuKeyboard,
    createBackKeyboard,
    createDefaultMenu
};
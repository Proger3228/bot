const
    mongoose = require("mongoose"),
    VkBot = require('node-vk-bot-api'),
    Scene = require('node-vk-bot-api/lib/scene'),
    Session = require('node-vk-bot-api/lib/session'),
    Stage = require('node-vk-bot-api/lib/stage'),
    Markup = require('node-vk-bot-api/lib/markup'),
    config = require('config'),
    bot = new VkBot(config.get("TOKEN")),
    {
        renderLessons,
        formMessage,
        isAdmin,
        renderAdminKeyBoard,
        renderAdminMenu
    } = require("./utils/messagePayloading.js"),
    botCommands = require("./utils/botCommands.js"),
    {DataBase} = require("./DataBase/DataBase.js");

mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/prod?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}, () => console.log("Mongoose connected"));

const adminPanelScene = new Scene('adminPanel',
    (ctx) => {
        if (isAdmin(ctx.message.user_id)) {
            ctx.scene.next();
            ctx.reply(renderAdminMenu());
        } else {
            ctx.scene.leave();
            ctx.reply("Ты не админ чтоб такое делать")
        }
    },
    (ctx) => {
        switch (ctx.message.body) {
            case "4": {
                ctx.reply("Вы выбрали создание класса");
                ctx.scene.enter("createClass");
                break;
            }
            default: {
                ctx.reply("Такого варианта не было");
                break;
            }
        }
    },
);

const createClassScene = new Scene('createClass',
    (ctx) => {
        ctx.scene.next();
        ctx.reply("Введите имя класса, с английской , буквой (A - A, Б - B, В - V ...)");
    },
    (ctx) => {
        const {message: {body}, scene: {leave, enter}} = ctx;
        const spacelessClassName = body.replace(/\s*/g, "");
        if (/\d+[a-z]/i.test(spacelessClassName)) {
            DataBase.createClass(spacelessClassName)
                .then(result => {
                    if (result) {
                        leave();
                        ctx.reply("Класс успешно создан");
                    } else {
                        ctx.reply("Создание класса не удалось 😭");
                    } //исправить (вынести в функцию\превратить старт в сцену\еще что то)
                })
                .catch(err => {
                    console.log(err);
                    ctx.reply("Что то пошло не так попробуйте позже")
                })
        } else {
            enter("createClass");
            ctx.reply("Неправильный формат ввода (должна быть цифра и потом буква)");
        }
    },
);

const session = new Session();
const stage = new Stage(adminPanelScene,createClassScene);

bot.use(session.middleware());
bot.use(stage.middleware());

bot.command("start", (ctx) => {
    const {message: {user_id}} = ctx;
    let buttons = [
        [
            Markup.button("Посмотреть дз", "primary")
        ]
    ];
    if (isAdmin(user_id)) {
        buttons = renderAdminKeyBoard(buttons)
    }

    ctx.reply("Sup", null, Markup
        .keyboard(buttons)
    )
});

bot.command(botCommands.adminPanel, (ctx) => ctx.scene.enter('adminPanel'));

bot.command(/расписание/i, (ctx) => {
    try {
        ctx.reply(formMessage("Вводите номера уроков по порядку", renderLessons()));
    } catch (e) {
        console.error(e);
    }
});
bot.command(/дз/i, (ctx) => {
    ctx.reply("Дз не будет (бот принял ислам)")
});

bot.startPolling();


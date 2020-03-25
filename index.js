const
    mongoose = require("mongoose"),
    VkBot = require('node-vk-bot-api'),
    Session = require('node-vk-bot-api/lib/session'),
    Stage = require('node-vk-bot-api/lib/stage'),
    Markup = require('node-vk-bot-api/lib/markup'),
    config = require('config'),
    bot = new VkBot(config.get("TOKEN")),
    Scenes = require("./Scenes.js"),
    {
        renderLessons,
        formMessage,
        isAdmin,
        renderAdminKeyBoard,
        parseAttachments
    } = require("./utils/messagePayloading.js"),
    botCommands = require("./utils/botCommands.js"),
    {DataBase} = require("./DataBase/DataBase.js");

mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/prod?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}, () => console.log("Mongoose connected"));

const session = new Session();
const stage = new Stage(...Object.values(Scenes));

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
    ctx.reply("Дз не будет")
});

bot.startPolling();


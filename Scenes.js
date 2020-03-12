const
    Scene = require('node-vk-bot-api/lib/scene'),
    VkBot = require('node-vk-bot-api'),
    Session = require('node-vk-bot-api/lib/session'),
    config = require('config'),
    {
        isAdmin,
        renderAdminMenu
    } = require("./utils/messagePayloading.js"),
    {DataBase} = require("./DataBase/DataBase.js");

module.exports.adminPanelScene = new Scene('adminPanel',
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
        switch (ctx.message.body.trim()) {
            case "4": {
                ctx.reply("Вы выбрали создание класса");
                ctx.scene.enter("createClass");
                break;
            }
            case "0": {
                ctx.scene.leave();
                ctx.reply("Как скажешь босс");
                break;
            }
            default: {
                ctx.reply("Такого варианта не было");
                break;
            }
        }
    },
);

module.exports.createClassScene = new Scene('createClass',
    (ctx) => {
        ctx.reply("Введите имя класса, с английской , буквой (A - A, Б - B, В - V ...)");
        ctx.scene.next();
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


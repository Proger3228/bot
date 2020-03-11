const {Lessons} = require("../Models/utils");
const config = require("config");
const Markup = require("node-vk-bot-api/lib/markup");

const renderLessons = () => {
    return Lessons.map((e, i) => `${i}: ${e}`).join("\n");
};

const formMessage = (...messageSections) => {
    return messageSections.join("\n\n");
};

const renderAdminKeyBoard = (defaultKeyBoard) => {
    const adminButton = Markup.button("Админ меню", "positive");
    return [...defaultKeyBoard, [adminButton]]
};

const renderAdminMenu = () => {
    const adminOptions = [
        "Добавить редактора",
        "Удалить редактора",
        "Список редакторов",
        "Добавить класс",
        "Список классов",
        "Настройки расписания",
    ];
    return formMessage(
        "Админское меню",
        adminOptions.map((e, i) => `${i + 1}: ${e}`).join("\n")
    );
};

const isAdmin = (userId) => {
    return config.get("admins").includes(userId);
};

module.exports = {
    renderLessons,
    formMessage,
    isAdmin,
    renderAdminKeyBoard,
    renderAdminMenu
};
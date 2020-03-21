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
        adminOptions.map((e, i) => `${i + 1}: ${e}`).join("\n").concat(`\n0: Назад`)
    );
};

const isAdmin = (userId) => {
    return config.get("admins").includes(userId);
};

const parseAttachments = (attachments) => {
    if (Array.isArray(attachments) && attachments.every(att => att.type && att[att.type])) {
        return attachments.map(att => `${att.type}${att[att.type].owner_id}_${att[att.type].id}_${att[att.type].access_key}`)
    } else {
        throw new TypeError("Wrong attachments type");
    }
};

module.exports = {
    renderLessons,
    formMessage,
    isAdmin,
    renderAdminKeyBoard,
    renderAdminMenu,
    parseAttachments
};
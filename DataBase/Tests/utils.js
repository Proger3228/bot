const {DataBase} = require("../DataBase");

const toObject = Document => JSON.parse(JSON.stringify(Document));

const isObjectId = id => {
    if (typeof id === "object" && !Array.isArray(id) && id !== null){
        return id.toString() !== "[object Object]";
    } else {
        return false
    }
};

const createTestData = async () => {
    const Student = await DataBase.createStudent(Math.ceil(Math.random() * 100));
    const Class = await DataBase.createClass(Math.ceil(Math.random() * 10) + "A");
    return {
        Student,
        Class
    }
};


module.exports = {
    toObject,
    isObjectId,
    createTestData
};




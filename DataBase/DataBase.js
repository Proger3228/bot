const {Roles} = require("../Models/StudentModel");
const {NullClass} = require("../Models/ClassModel");

const _Student = require("../Models/StudentModel");
const _Class = require("../Models/ClassModel");
const uuid4 = require("uuid4");

//TODO Replace returns of false and null to errors or error codes
module.exports = class DataBase {
    static async generateNewRoleUpCode(className) {
        const newCode = uuid4();
        try {
            const Class = await DataBase.getClassByName(className);
            if (Class) {
                Class.roleUpCodes.push(newCode);
                await Class.save();
                return newCode;
            } else {
                return null;
            }
        } catch (e) {
            console.error(e);
            return null
        }
    }
    static async removeRoleUpCode(className, codeToBeRemoved) {
        try {
            const Class = await DataBase.getClassByName(className);
            if (Class) {
                Class.roleUpCodes = Class.roleUpCodes.filter(code => code !== codeToBeRemoved);
                await Class.save();
                return true;
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }
    static async activateCode(vkId, code) {
        try {
            const Student = await this.getStudentByVkId(vkId);
            const populatedStudent = await Populated.populateStudent(Student);
            if (populatedStudent && populatedStudent.class) {
                if (this.checkCodeValidity(populatedStudent.class, code)) {
                    populatedStudent.role = Roles.contributor;
                    const removed = await this.removeRoleUpCode(populatedStudent.class.name, code);
                    if (removed) {
                        await populatedStudent.save();
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    static async checkCodeValidity(Class, codeToBeChecked) {
        if (Class) {
            return Class.roleUpCodes.includes(codeToBeChecked);
        } else {
            return false;
        }
    }
    static async addStudentToClass(Student, className) {
        try {
            const Class = await this.getClassByName(className);
            if (Class) {
                Class.students.push(Student._id);
                Student.class = Class._id;
                await Class.save();
                await Student.save();
                return true;
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }
    static async removeStudentFromClass(Student) {
        try {
            const populatedStudent = await Populated.populateStudent(Student);
            const Class = populatedStudent.class;
            if (!Class) return true;
            if (populatedStudent) {
                Class.students.filter(({_id}) => _id !== populatedStudent._id);
                populatedStudent.class = undefined;
                await Class.save();
                await populatedStudent.save();
                return true;
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }
    static async changeClass(Student, newClassName) {
        try {
            const newClass = await this.getClassByName(newClassName);
            const populatedStudent = await Populated.populateStudent(Student);
            if (newClass && populatedStudent) {
                const removed = await this.removeStudentFromClass(Student);
                if (removed) {
                    populatedStudent.class = newClass._id;
                    newClass.students.push(populatedStudent._id);
                    await newClass.save();
                    await populatedStudent.save();
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }

    static async getStudentByVkId(vkId) {
        try {
            if (vkId !== undefined && typeof vkId === "number") {
                const Student = await _Student.findOne({vkId});
                if (Student) {
                    return Student;
                } else {
                    return null;
                }
            } else {
                throw new TypeError("VkId must be number");
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            return null;
        }
    }
    static async getStudentBy_Id(_id) {
        try {
            if (_id && typeof _id === "string") {
                const Student = await _Student.findById(_id);
                if (Student) {
                    return Student;
                } else {
                    return null;
                }
            } else {
                throw new TypeError("_id must be string");
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            return null;
        }
    }
    static async getClassByName(name) {
        try {
            if (name && typeof name === "string") {
                const Class = await _Class.findOne({name});
                if (Class) {
                    return Class;
                } else {
                    return null;
                }
            } else {
                throw new TypeError("name must be string");
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            return null;
        }
    }
    static async getClassBy_Id(_id) {
        try {
            if (_id && typeof _id === "string") {
                const Class = await _Class.findById(_id);
                if (Class) {
                    return Class;
                } else {
                    return null;
                }
            } else {
                throw new TypeError("_id must be string");
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            return null;
        }
    }
};


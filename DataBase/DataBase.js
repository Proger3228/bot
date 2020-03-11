const {Roles} = require("../Models/utils");

const _Student = require("../Models/StudentModel");
const _Class = require("../Models/ClassModel");
const uuid4 = require("uuid4");
const mongoose = require("mongoose");
const {isObjectId} = require("./Tests/utils");

//TODO Replace returns of false and null to errors or error codes
class DataBase {
    //Roles stuff
    static async generateNewRoleUpCode(className) {
        try {
            const newCode = uuid4();
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
    };

    static async removeRoleUpCode(className, codeToBeRemoved) {
        try {
            if (uuid4.valid(codeToBeRemoved)) {
                const Class = await DataBase.getClassByName(className);
                if (Class && Class.roleUpCodes) {
                    Class.roleUpCodes = Class.roleUpCodes.filter(code => code !== codeToBeRemoved);
                    await Class.save();
                    return true;
                } else {
                    return false;
                }
            } else {
                throw new TypeError("Code to be removed must be valid uuid4 code");
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            return false;
        }
    };

    static async activateCode(vkId, code) {
        try {
            if (uuid4.valid(code)) {
                let Student = await this.getStudentByVkId(vkId);
                if (Student) {
                    if (Student.class) {
                        const isValid = Student.class.roleUpCodes.includes(code);
                        if (isValid) {
                            const removed = await this.removeRoleUpCode(Student.class.name, code);
                            if (removed) {
                                Student.role = Roles.contributor;
                                return true;
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    } else {
                        throw new TypeError("Student must have class property to activate code");
                    }
                } else {
                    return false;
                }
            } else {
                throw new TypeError("Code should be valid uuid4 code");
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            return false;
        }
    };

    static async checkCodeValidity(className, codeToBeChecked) {
        if (uuid4.valid(codeToBeChecked)) {
            const Class = await this.getClassByName(className);
            if (Class && Class.roleUpCodes) {
                return Class.roleUpCodes.includes(codeToBeChecked);
            } else {
                return false;
            }
        } else {
            return false
        }
    };

    static async backStudentToInitialRole(vkId) {
        try {
            if (vkId && typeof vkId === "number") {
                const Student = await this.getStudentByVkId(vkId);
                if (Student) {
                    Student.role = Roles.student;
                    return true;
                } else {
                    return false;
                }
            } else {
                throw new TypeError("VkId must be a number")
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            console.error(e);
            return false;
        }
    };

    //Interactions
    static async addStudentToClass(StudentVkId, className) {
        try {
            const Class = await this.getClassByName(className);
            const Student = await this.getStudentByVkId(StudentVkId);
            if (Class && Student) {
                Class.students.push(Student._id);
                Student.class = Class._id;
                await Class.save();
                await Student.save();
                return true;
            } else {
                return false;
            }
        } catch (e) {
            console.log(e);
            return false;
        }
    };

    static async removeStudentFromClass(StudentVkId) {
        try {
            const Student = await DataBase.getStudentByVkId(StudentVkId);
            if (Student) {
                const Class = Student.class;
                if (!Class) return true;
                Class.students = Class.students.filter(({_id}) => _id.toString() !== Student._id.toString());
                Student.class = null;
                await Class.save();
                await Student.save();
                return true;
            } else {
                return false;
            }
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    static async changeClass(StudentVkId, newClassName) {
        try {
            const Student = await this.getStudentByVkId(StudentVkId);
            if (Student.class.name !== newClassName) {
                const newClass = await this.getClassByName(newClassName);
                if (newClass && Student) {
                    const removed = await this.removeStudentFromClass(StudentVkId);
                    if (removed) {
                        await Student.updateOne({class: newClass._id});
                        newClass.students.push(Student._id);
                        await newClass.save();
                        await Student.save();
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
            return false;
        }
    };

    //Getters
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
    };

    static async getStudentBy_Id(_id) {
        try {
            if (typeof _id === "object" && isObjectId(_id)) _id = _id.toString();
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
    };

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
    };

    static async getClassBy_Id(_id) {
        try {
            if (typeof _id === "object" && isObjectId(_id)) _id = _id.toString();
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
    };

    static async getAllContributors() {
      try {
          const contributors = await _Student.find({role: Roles.contributor});

          if (contributors) {
              return contributors;
          } else {
              return null;
          }
      } catch (e) {
          return null;
      }
    };

    //Creators
    static async createStudent(vkId, class_id) {
        try {
            if (vkId) {
                if (typeof vkId === "number") {
                    const newStudent = class_id ? new _Student({vkId, class: class_id}) : new _Student({vkId});
                    await newStudent.save();
                    return await DataBase.getStudentBy_Id(newStudent._id);
                } else {
                    throw new TypeError("VkId must be number");
                }
            } else {
                throw new TypeError("Vkid parameter is required")
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            console.error(e);
            return null;
        }
    };

    static async createClass(name) {
        try {
            if (name) {
                if (typeof name === "string") {
                    mongoose.set("debug", true);
                    const newClass = new _Class({
                        name
                    });
                    await newClass.save();
                    return await DataBase.getClassBy_Id(newClass._id);
                } else {
                    throw new TypeError("name must be string");
                }
            } else {
                throw new TypeError("name parameter is required")
            }
        } catch (e) {
            console.log(e);
            if (e instanceof TypeError) throw e;
            console.error(e);
            return null;
        }
    }
}

module.exports.DataBase = DataBase;


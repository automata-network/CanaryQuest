import { Model, DataTypes } from "sequelize";
import sequelize from "../db";

export interface ITask extends Model {
    id: number;
    userAccount: string;
    questId: string;
    remarks: string;
    createdAt: Date;
    updatedAt: Date;
}

const Task = sequelize.define<ITask>("task", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userAccount: {
        type: DataTypes.STRING,
        allowNull: false
    },
    questId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    remarks: {
        type: DataTypes.STRING
    }
}, {
    freezeTableName: true
});

(async () => {
    await Task.sync({force: false});
})();

export default Task;

import { Model, DataTypes } from "sequelize";
import sequelize from "../db";
import config from "config";

export interface IUser extends Model {
    id: number;
    account: string;
    password: string;
    nickname: string;
    character: number;
    level: number;
    xp: number;
    nextXp: number;
    totalXp: number;
    mp: number;
    strength: number;
    intellect: number;
    dexterity: number;
    dailyQuestClear: boolean;
    dailyShare: boolean;
    remark: string;
    createdAt: Date;
    updatedAt: Date;
}

const User = sequelize.define<IUser>("user", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    account: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nickname: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    character: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    level: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    xp: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    nextXp: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    totalXp: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    mp: {
        type: DataTypes.INTEGER,
        defaultValue: parseInt(config.get("MP_LIMIT_DAILY"))
    },
    strength: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    intellect: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    dexterity: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    dailyQuestClear: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    dailyShare: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    remark: {
        type: DataTypes.TEXT,
        defaultValue: ""
    }
}, {
    freezeTableName: true
});

(async () => {
    await User.sync({force: false});
})();

export default User;

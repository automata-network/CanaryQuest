import { Model, DataTypes } from "sequelize";
import sequelize from "../db";

export interface IExp extends Model {
    id: number;
    account: string;
    nickname: string;
    xp: number;
    double: boolean;
    show: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const Exp = sequelize.define<IExp>("exp", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    account: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nickname: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    xp: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    double: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    show: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    freezeTableName: true
});

(async () => {
    await Exp.sync({force: false});
})();

export default Exp;

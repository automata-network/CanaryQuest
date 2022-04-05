import { Model, DataTypes } from "sequelize";
import sequelize from "../db";

export interface IBoss extends Model {
    id: number;
    hp: number;
    totalHp: number;
    createdAt: Date;
    updatedAt: Date;
}

const Boss = sequelize.define<IBoss>("boss", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    hp: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    totalHp: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    freezeTableName: true
});

(async () => {
    await Boss.sync({force: false});
})();

export default Boss;

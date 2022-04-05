import { Sequelize } from "sequelize";
import config from "config";

const sqlitePath = process.env.SQLITE_PATH || config.get("SQLITE_PATH");

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: sqlitePath,
    pool: {
        min: 0,
        max: 5,
        acquire: 3000,
        idle: 10000
    }
});

export default sequelize;

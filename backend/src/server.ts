import config from "config";
import express from "express";
import bodyParser from "body-parser";
import expressJwt from "express-jwt";
import schedule from "node-schedule";

import sequelize from "./db";
import user from "./api/user";
import { getMainNode } from "./utils/mainNode";
import register, { currentQuest } from "./activities/register";
import { logger } from "./logger";

const app = express();
const path = require("path");

// Connect to MongoDB
const connectDB = async () => {
    await sequelize.authenticate();
    logger.info("Connection has been established successfully.");
};

connectDB().catch(err => {
    logger.error("Unable to connect to the database:", err);
    process.exit(1);
});

// Connect to main chain
const connectMainChain = async () => {
    await getMainNode();
};

connectMainChain().then(async () => {
    await register();
});

app.set("port", process.env.PORT || config.get("PORT"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.all("*", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("Content-Type", "application/json;charset=utf-8");
    if (req.method === "OPTIONS") res.send(200); else next();
});

// JWT
app.use(expressJwt({
    secret: config.get("TOKEN_SIGN_KEY"),
    algorithms: ["HS256"]
}).unless({
    path: [
        "/user/login",
        {url: /^\/static\/.*/, methods: ["GET"]}
    ]
}));

app.use((err: any, req: any, res: any, next: any) => {
    if (err.name === "UnauthorizedError") {
        res.status(401).send("invalid token");
    }
});

app.use("/user", user);
// app.use("/client", client);

app.use("/static", express.static(path.join(__dirname, "../public")));

const port = app.get("port");
const server = app.listen(port, () => logger.info(`Server started on port ${port}`));

process.on("unhandledRejection", (err) => {
    logger.error("Unhandled Rejection: " + err);
});

process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception thrown: " + err);
});

// Clean up when exit
process.on("SIGINT", async () => {
    await sequelize.close();
    await (schedule as any).gracefulShutdown();
    process.exit(0);
});

export default server;

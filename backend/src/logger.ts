import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const errorTransport: DailyRotateFile = new DailyRotateFile({
    level: "error",
    filename: "/data/logs/error/%DATE%.log",
    datePattern: "YYYY-MM-DD",
    utc: true
});

const allTransport: DailyRotateFile = new DailyRotateFile({
    filename: "/data/logs/all/%DATE%.log",
    datePattern: "YYYY-MM-DD",
    utc: true
});

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        errorTransport,
        allTransport
    ],
});

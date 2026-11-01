"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appDataSource = void 0;
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
const typeorm_1 = require("typeorm");
const entities_1 = require("../entities");
/*
|--------------------------------------------------------------------------
| Load Environment Variables
|--------------------------------------------------------------------------
*/
dotenv_1.default.config();
/*
|--------------------------------------------------------------------------
| Database Environment Variables
|--------------------------------------------------------------------------
*/
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;
/*
|--------------------------------------------------------------------------
| Validate Database Configuration
|--------------------------------------------------------------------------
*/
if (!DB_HOST || !DB_PORT || !DB_USERNAME || !DB_DATABASE) {
    throw new Error("Database environment variables are missing.");
}
/*
|--------------------------------------------------------------------------
| MySQL Port
|--------------------------------------------------------------------------
*/
const databasePort = Number(DB_PORT);
if (Number.isNaN(databasePort)) {
    throw new Error("DB_PORT must be a valid number.");
}
/*
|--------------------------------------------------------------------------
| TypeORM Data Source
|--------------------------------------------------------------------------
*/
exports.appDataSource = new typeorm_1.DataSource({
    type: "mysql",
    host: DB_HOST,
    port: databasePort,
    username: DB_USERNAME,
    password: DB_PASSWORD ?? "",
    database: DB_DATABASE,
    entities: [
        entities_1.User,
        entities_1.Address,
        entities_1.Vendor,
        entities_1.Product,
        entities_1.Order,
        entities_1.Cart,
        entities_1.Wishlist,
        entities_1.Review,
        entities_1.Coupon,
        entities_1.SupportMessage,
        entities_1.Subscriber,
        entities_1.PlatformSetting,
        entities_1.RewardLog,
        entities_1.PasswordReset,
    ],
    /*
     * Keep synchronize false to prevent accidental alterations
     * to existing database tables.
     */
    synchronize: false,
    logging: false,
});

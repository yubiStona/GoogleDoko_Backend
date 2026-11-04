import "reflect-metadata";
import dotenv from "dotenv";

dotenv.config();

import app from "./app";
import { appDataSource } from "./config/database";
import { initAppSchema } from "./config/schemaInit";
import lifestyleService from "./services/lifestyle.service";

const PORT = Number(process.env.PORT) || 4000;

const startServer = async (): Promise<void> => {
  try {
    await appDataSource.initialize();

    console.log("Database connected successfully.");

    await initAppSchema(appDataSource);
    await lifestyleService.initLifestyleTables(appDataSource);

    app.listen(PORT, () => {
      console.log(`GoogleDoko API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the application.");
    console.error(error);
    process.exit(1);
  }
};

startServer();

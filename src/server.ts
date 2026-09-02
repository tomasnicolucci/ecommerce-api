import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectMongoDB } from "./shared/infrastructure/database/mongodb.js";
import { checkPostgresConnection } from "./shared/infrastructure/database/postgres.js";

const startServer = async (): Promise<void> => {
  try {
    await checkPostgresConnection();
    await connectMongoDB();

    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

void startServer();
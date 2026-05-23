import app from "./app";
import { initDB } from "./config/db";
import config from "./config/dotenv";



const startServer = async () => {
  await initDB()
 app.listen(config.port, () => {
    console.log(`Example app listening on port ${config.port}`);
  });
}

startServer();

import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

//Setup PG Connection
const sequelize = new Sequelize({
  database: process.env.PG_NAME,
  username: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  dialect: process.env.PG_DIALECT, // Explicitly specify 'postgres'
  logging: false, // Disable logging for production, enable for debugging if needed
  pool: {
    max: 10, // Maximum number of connections
    min: 0, // Minimum number of connections
    acquire: 30000, // Maximum time (ms) to wait for a connection
    idle: 10000, // Time (ms) before a connection is released
  },
});

// Test the connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to the PostgreSQL");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

export default sequelize;

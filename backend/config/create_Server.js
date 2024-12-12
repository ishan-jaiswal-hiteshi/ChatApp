import express from "express";
import cors from "cors";
import { createServer } from "http";

const createAppServer = () => {
  const app = express();
  app.use(express.json());
  app.use(
    cors({
      origin: ["*", "http://192.168.100.249:5173"],
      methods: ["GET", "POST", "*"],
    })
  );
  //binding http server with express
  const server = createServer(app);
  return server;
};

export default createAppServer;

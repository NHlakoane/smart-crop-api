import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import client from "./config/db.js";
import mainRouter from "./routes/main.router.js";
import cookieParser from "cookie-parser";

// configure dotenv
dotenv.config();

// Create the application using express
const app = express();

// Router Level  Middlewares
app.use(cors({
  origin: ["http://localhost:8081", "http://localhost:8082", "http://localhost:8083", "http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT;

const connectToDatabase = async () => {
  try {
    const pool = await client.connect();
    pool.release();
  } catch (error) {
    console.error("Error while connecting to Database", error);
    process.exit(1);
  }
};

const StartApp = async () => {
  try {
    await connectToDatabase();
    console.log("Database connection established");
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.log("Failed to start server", error);
  }
};

StartApp();

// Router Level Middleware
app.use("/api", mainRouter);

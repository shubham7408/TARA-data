#!/usr/bin/env node

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const http = require("http");
const { Client } = require("pg");
const axios = require("axios");
require("dotenv").config();

// Initialize Express app
const app = express();

// CORS Configuration
const allowedOrigins = [
  "http://13.202.236.112:5176",
  "http://13.202.236.112:3003",
  "http://localhost:5176",
  "http://13.202.236.112",
  "http://localhost:5173",
  "http://localhost:3003",
  "http://localhost:3000",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  next();
});

// Middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Database Connection
const client = new Client({
  host: process.env.HOST,
  port: process.env.PG_PORT,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});

client
  .connect()
  .then(() => console.log("Connected to PostgreSQL database"))
  .catch((err) => console.error("Connection error", err.stack));

// Routes
// ================================================
// Import your existing indexRouter
const indexRouter = require("./routes/index");
app.use("/api", indexRouter);

// Database routes
app.get("/getTables", (req, res) => {
  client
    .query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    )
    .then((result) => {
      res.json(result.rows);
    })
    .catch((err) => {
      console.error("Query error", err.stack);
      res.status(500).send("Error retrieving data");
    });
});

app.get("/getData", (req, res) => {
  client
    .query("SELECT * FROM data LIMIT 1") // Replace with your table name
    .then((result) => {
      console.log(result.rows);
      res.json(result.rows);
    })
    .catch((err) => {
      console.error("Query error", err.stack);
      res.status(500).send("Error retrieving data");
    });
});
// ================================================

// Interaction Endpoint
async function sendInteraction() {
  try {
    console.log("Sending POST request to set interaction");
    const response = await axios.post(
      `${process.env.SERVER_URL}/api/interaction`,
      {
        duration: "SECOND",
        sdate: "2023-06-01T00:00:00Z",
        edate: "2023-06-02T23:59:59Z",
      }
    );
    console.log("Response received:", response.data);
  } catch (e) {
    console.error(e);
  }
}

sendInteraction();

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Server Setup
const port = normalizePort(process.env.PORT || "3003");
app.set("port", port);

const server = http.createServer(app);

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});

server.on("error", onError);
server.on("listening", onListening);

// Helper Functions
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  console.log("Listening on " + bind);
}

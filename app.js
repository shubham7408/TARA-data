let express = require("express");
let path = require("path");
let cookieParser = require("cookie-parser");
let logger = require("morgan");
let cors = require("cors");
let indexRouter = require("./routes/index");
let config = require("./config/connection");
let axios = require("axios");
let app = express();

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

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api", indexRouter);

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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

module.exports = app;

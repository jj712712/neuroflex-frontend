const express = require("express");
const cors = require("cors");
const { functions } = require("./firebase");

const authRoutes = require("./auth");
const userRoutes = require("./users");
const sessionRoutes = require("./sessions");
const gameRoutes = require("./games");
const reportRoutes = require("./reports");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/sessions", sessionRoutes);
app.use("/games", gameRoutes);
app.use("/reports", reportRoutes);

// Export API
exports.api = functions.https.onRequest(app);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const LoginRoutes = require("./routes/LoginRoutes");
const DeveloperRoutes = require("./routes/DeveloperRoutes");
const ProjectRoutes = require("./routes/ProjectRoutes");
const TowerRoutes = require("./routes/TowerRoutes");
const SeriesRoutes = require("./routes/SeriesRoutes");

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use("/api/auth", LoginRoutes);
app.use("/api/developers", DeveloperRoutes);
app.use("/api/projects", ProjectRoutes);
app.use("/api/towers", TowerRoutes);
app.use("/api/series", SeriesRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

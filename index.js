if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const package = require("./package.json");
const debug = require("debug")(`${package.name}:index`);
const express = require("express");
const path = require("path");
const app = express();
const barcode = require("./routes/barcode");
const bot = require('./modules/Bot');

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

let requestLogger = function(req, res, next) {
  debug("RECEIVED REQUEST:", req.method, req.url);
  next(); // Passing the request to the next handler in the stack.
};

app.use(requestLogger);

// these routes do *not* have s3o
app.use("/static", express.static("static"));

// these route *do* use s3o
app.set("json spaces", 2);

//Core Routes
app.use("/barcode", barcode);

// ---

app.use("/", (req, res) => {
  res.render("index");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT;
if (!PORT) {
	throw new Error('ERROR: PORT not specified in env');
}

const server = app.listen(PORT, function() {
  console.log("Server is listening on port", PORT);
  bot.init();
});

module.exports = server;

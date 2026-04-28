const mongoose = require("mongoose");

if (!global.autoIncrement) {
    global.autoIncrement = require("mongoose-sequence")(mongoose);
}

module.exports = global.autoIncrement;
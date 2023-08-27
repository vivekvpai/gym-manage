const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const itemSchema = new Schema({
 id: Object
});

module.exports = Item = mongoose.model("delete", itemSchema );

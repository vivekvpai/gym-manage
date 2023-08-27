const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
  },
  phone: {
    type: String,
  },
  subscription: {
    type: String,
  },
  doj: {
    type: String,
  },
  eos: {
    type: String,
  },
  doj_e: {
    type: Number,
  },
  eos_e: {
    type: Number,
  },
});

module.exports = User = mongoose.model("users", UserSchema);

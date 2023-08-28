const path = require("path");
const express = require("express");
const hbs = require("hbs");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");

require("dotenv").config();

const app = express();
var port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, "../public");
console.log(publicDirectoryPath);
const viewsPath = path.join(__dirname, "./views");
console.log(viewsPath);

app.set("view engine", "ejs");
app.set("views", viewsPath);

app.use(express.static(publicDirectoryPath));
app.use(bodyParser.urlencoded({ extended: true }));

const requireLogin = (req, res, next) => {
  if (!req.session.admin_id) {
    return res.redirect("/");
  }
  next();
};

//database connection
//  const db = process.env.MONGO_URL || "mongodb+srv://DBIT_Alumni:DBITALUMNI@dbitalumni.yrw3w.mongodb.net/TELEGRAM?retryWrites=true&w=majority"

const db =
  process.env.MONGO_URL ||
  "mongodb+srv://paivivek002:Kevivpai5@cluster0.ljtrdwi.mongodb.net/GYM?retryWrites=true&w=majority";
// const db = "mongodb://localhost:27017/Alumini";
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log("MongoDb connected"))
  .catch((err) => console.log(err));

const secret = process.env.SECRET || "squirrel";

const store = MongoStore.create({
  mongoUrl: db,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret,
  },
});

store.on("error", function (e) {
  console.log("Session Store Error", e);
});

const sessionConfig = {
  store,
  name: "session",
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure:true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));

const User = require("../models/Users");
const Admin = require("../models/Admin");

app.get("", (req, res) => {
  res.render("index");
});

app.get("/add", (req, res) => {
  res.render("add");
});

app.post("/add", (req, res) => {
  var selectedDate = new Date(req.body.doj);

  var epochMilliseconds = selectedDate.getTime();
  let doj_e = epochMilliseconds;

  var eos = new Date(req.body.doj);
  eos.setMonth(eos.getMonth() + parseInt(req.body.subscription));
  eos = eos.toISOString().slice(0, 10);
  eos_e = new Date(eos);

  const payload = {
    ...req.body,
    eos: eos,
    eos_e: eos_e.getTime(),
    doj_e: doj_e,
  };


  mongodb: User.create(payload, function (err, newCreated) {
    if (err) {
      console.log(err);
    } else {
      res.render("add");
    }
  });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { password, adminname } = req.body;
  const admin = new Admin({ adminname, password });
  await admin.save();
  req.session.admin_id = admin._id;
  res.redirect("/show");
});

// app.get("/login", (req, res) => {
//   res.render("login");
// });

app.post("/login", async (req, res) => {
  // res.send(req.body);
  const { adminname, password } = req.body;
  const foundUser = await Admin.findAndValidate(adminname, password);
  if (foundUser) {
    req.session.admin_id = foundUser._id;
    res.redirect("/show");
  } else {
    res.redirect("/");
  }
});

app.post("/logout", requireLogin, (req, res) => {
  // req.session.user_id = null;
  req.session.destroy();
  res.redirect("/");
});

app.get("/show", requireLogin, async (req, res) => {

  const currentDate = new Date();
  const epochMilliseconds = currentDate.getTime();

  if (req.query.search) {
    count = 1;
    const regex = new RegExp(escapeRegex(req.query.search), "gi");
    var users = await User.find({
      $or: [{ name: regex }, { subscription: regex }, { doj: regex }, { eos: regex }],
    });
    const use = await User.find({}).countDocuments({});
    // var users = await User.find({ branch: regex });
    users.forEach((element) => {
      if (epochMilliseconds >= element.eos_e) {
        element["status"] = "END";
      } else {
        element["status"] = "ACTIVE";
      }
    });
    res.render("show", { users, use });
  } else {
    count = 1;
    const users = await User.find({});
    const use = await User.find({}).countDocuments();



    users.forEach((element) => {

      if (epochMilliseconds >= element.eos_e) {
        element["status"] = "END";
        console.log('end')

      } else {
        element["status"] = "ACTIVE";
      }
    });

    res.render("show", { users, use });
  }
});

app.post("/delete/:id", requireLogin, async (req, res) => {
  const id = req.params.id;


  try {
    await User.findByIdAndRemove(id);
    res.redirect("/show");
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/update/:userId", requireLogin, async (req, res) => {
  const userId = req.params.userId;

  try {
    const item = await User.findById(userId);
    if (!item) {
      return res.status(404).send("Item not found");
    }
    res.render("update", { item });
  } catch (error) {
    res.status(500).send("Error fetching item");
  }

  // res.render('update', { userId });
});

app.post("/update/:userId", requireLogin, async (req, res) => {
  const userId = req.params.userId;

  var selectedDate = new Date(req.body.doj);
  var epochMilliseconds = selectedDate.getTime();
  let doj_e = epochMilliseconds;

  var eos = new Date(req.body.doj);
  eos.setMonth(eos.getMonth() + parseInt(req.body.subscription));
  eos = eos.toISOString().slice(0, 10);

  eos_e = new Date(eos);
  // const payload = {
  //   ...req.body,
  //   eos: eos,
  //   eos_e: eos_e.getTime(),
  //   doj_e: doj_e,
  // };

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    user.name = req.body.name;
    user.phone = req.body.phone;
    user.subscription = req.body.subscription;
    user.doj = req.body.doj;
    user.eos = eos;
    user.eos_e = eos_e.getTime();
    user.doj_e = doj_e;

    await user.save();
    res.redirect("/show"); // Redirect to a page showing all users
  } catch (error) {
    res.status(500).send("Error updating user");
  }
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// app.listen(3000, () => {
//   console.log("Server is up on port 3000");
// });

app.listen(port, () => {
  console.log("Server is up on port " + port);
});

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const User = require('./models/user.model');
const { auth } = require('./middleware/auth');
const db = require('./config/config').get(process.env.NODE_ENV);

const app = express();
// app use
app.use(express.json());
app.use(cookieParser());

//connect to mongodb
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.connect(
  db.DATABASE,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (err) {
    if (err) console.log(err);
    console.log('database is connected');
  }
);

// adding new user (sign-up route)
app.post('/api/register', function (req, res) {
  // taking a user
  const newUser = new User(req.body);
  console.log(newUser);

  if (newUser.password != newUser.password2)
    return res.status(400).json({ message: 'password not match' });

  User.findOne({ email: newUser.email }, function (err, user) {
    if (user)
      return res.status(400).json({ auth: false, message: 'email exits' });

    newUser.save((err, doc) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ success: false });
      }
      res.status(200).json({
        success: true,
        user: doc,
      });
    });
  });
});

// login user
app.post('/api/login', function (req, res) {
  let token = req.cookies.auth;
  User.findByToken(token, (err, user) => {
    if (err) return res(err);
    if (user)
      return res.status(400).json({
        error: true,
        message: 'You are already logged in',
      });
    else {
      User.findOne({ email: req.body.email }, function (err, user) {
        if (!user)
          return res.json({
            isAuth: false,
            message: ' Auth failed ,email not found',
          });

        user.comparepassword(req.body.password, (err, isMatch) => {
          if (!isMatch)
            return res.json({
              isAuth: false,
              message: "password doesn't match",
            });

          user.generateToken((err, user) => {
            if (err) return res.status(400).send(err);
            res.cookie('auth', user.token).json({
              isAuth: true,
              id: user._id,
              email: user.email,
            });
          });
        });
      });
    }
  });
});

//logout user
app.get('/api/logout', auth, function (req, res) {
  req.user.deleteToken(req.token, (err, user) => {
    if (err) return res.status(400).send(err);
    res.sendStatus(200);
  });
});

// get logged in user
app.get('/api/profile', auth, function (req, res) {
  res.json({
    isAuth: true,
    id: req.user._id,
    email: req.user.email,
    name: req.user.firstname + req.user.lastname,
  });
});

app.get('/', function (req, res) {
  res.status(200).send(`Welcome to login , sign-up api`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));

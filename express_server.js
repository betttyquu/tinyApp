var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
var cookieParser = require('cookie-parser')

// app.use(cookieParser());
var cookieSession = require('cookie-session')

app.set("view engine", "ejs");
const bcrypt = require('bcrypt');
app.use(cookieSession({
  name: 'session',
  keys: ['abcefg'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

// const password = "purple-monkey-dinosaur"; // found in the req.params object
// const hashedPassword = bcrypt.hashSync(password, 10);


// var urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  i3Bodr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
}
// 
function checkEmail (email) {
  for (user of Object.values(users)) {
    if (user.email === email) {
      return true
    };
  } 
  return false;
}

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  if(req.session){
    if((req.session["userID"])){
      let templateVars = { 
        user: users[req.session["userID"]],
        urls: urlDatabase 
      };
      res.render("urls_new", templateVars);
    }else{
      res.redirect('/login');
    }
  }
  else {
    res.redirect('/login');
  }
});

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.get("/urls", (req, res) => {
  // console.log(req.session);
  let templateVars = { 
    user: users[req.session["userID"]],
    urls: urlsForUser(req.session["userID"]) 
  };
  // console.log(templateVars);
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {

  if (!req.session["userID"]) {
    //user is not logged in
    res.send("Please log in");
  } else {
    // user is logged in
    if (urlDatabase[req.params.shortURL]) {
      //user is logged in, and url exist
      if (req.session["userID"] === urlDatabase[req.params.shortURL].userID) {
        // user is logged in with correct id
        let templateVars = {
          user: users[req.session["userID"]],
          shortURL: req.params.shortURL,
          longURL: urlDatabase[req.params.shortURL].longURL
        };
        res.render("urls_show", templateVars);
      } else {
        // user is logged in with diff id
        res.send("Not authorized user")
      }
    } else {
      //user is logged in, but url is not exist
      res.redirect("/urls");
    }

  }

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.post("/urls", (req, res) => {
  //only allow adding new obj if user is logged in
  let user = req.session["userID"];
  const shortURL = generateRandomString(6);
  const newURL = {
    longURL: req.body.longURL,
    userID: req.session["userID"]
  };
  urlDatabase[shortURL] = newURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL" , (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {   //deleting a submission
  const shortURL = req.params.shortURL;
  if(urlDatabase[shortURL]  && urlDatabase[shortURL].userID === req.session["userID"]) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else
  // console.log("delete failed");
  res.redirect("/login");
});

app.post("/login", (req, res) =>{
  const email = req.body.email;
  const password = req.body.password;

  if (email === "" || password === "") { 
    res.status(403);
    res.send("Email or password cannot be blank");
    }
  let user = {};
  for (key in users) {
    if (email === users[key].email) {
      user = users[key];
      }
    }
    if (!bcrypt.compareSync(password, user.password)) {
      res.status(403);
      res.send("Email and password cannot be located")
    } 
    else {
      res.cookie("userID", user.id)
      res.redirect("/urls");
    }
});
app.get("/register", (req, res) => { //registeration page information from client
    res.render("urls_register");
});
 
app.post("/register", (req, res) => {  //register for a new user and stored in users
  if (req.body.email === "" || req.body.password === "" || checkEmail(req.body.email)) { 
    res.status(400);
    res.send("Cannot register: Email already existed");
  } 
  else {
    let user_id = generateRandomString(8);
    users[user_id] = {};
    users[user_id]["id"] = user_id;
    users[user_id]["email"] = req.body.email;
    users[user_id]["password"] = bcrypt.hashSync(req.body.password, 10)
    res.cookie("userID", user_id);   
    // console.log(users);
    res.redirect("/urls")
    }
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});



app.post("/logout", (req, res) => {
  res.clearCookie("userID");
  res.redirect("/urls")
});


app.post("/urls/:shortURL", (req, res) => {    //editing an existing submission
  if(req.session){
    if((req.session["userID"]) && req.session["userID"] === urlDatabase[req.params.shortURL].userID){
      let templateVars = { 
        user: users[req.session["userID"]],
        longURL: req.body.longURL,
        shortURL: req.params.shortURL
      };
      urlDatabase[req.params.shortURL].longURL = req.body.longURL
      res.render("urls_show", templateVars);
    }else{
      res.redirect('/login');
    }
  }
  else {
    res.redirect('/login');
  }
});
// only login user can edit post


function generateRandomString(length) {
  let result           = '';
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
  return result;
}

function urlsForUser(id) {
  const obj = {};
  for(key in urlDatabase) {
    if(id === urlDatabase[key].userID){
      obj[key] = urlDatabase[key]
    }

  }

  return obj;
}
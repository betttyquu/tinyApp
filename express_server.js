var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
var cookieParser = require('cookie-parser')

app.use(cookieParser());
app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

function checkEmail (email) {
  for (user of Object.values(users)) {

    if (user.email === email) {
      // console.log("Found user")
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
  if(req.cookies){
    if((req.cookies["userID"])){
      let templateVars = { 
        user: users[req.cookies["userID"]],
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
  console.log(req.cookies);
  let templateVars = { 
    user: users[req.cookies["userID"]],
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { 
    user: users[req.cookies["userID"]],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL" , (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {   //deleting a submission
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL]
  res.redirect("/urls")
})

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
    if (password !== user.password) {
      res.status(403);
      res.send("Email and password cannot be located")
    } 
    else {
      res.cookie("userID", user.id)
      res.redirect("/urls");
    }
});
app.get("/register", (req, res) => { //registeration page information from client
  let templateVars = { 
    Email: req.params.email,
    Password: req.params.password };
  res.render("urls_register", templateVars);
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
    users[user_id]["password"] = req.body.password;
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
  if(req.cookies){
    if((req.cookies["userID"])){
      let templateVars = { 
        user: users[req.cookies["userID"]],
        longURL: req.body.longURL,
        shortURL: req.params.shortURL
      };
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


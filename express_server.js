var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
var cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session')
const bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  keys: ['abcefg'],
}));

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
// function checks if email already existed
function checkEmail (email) {
  for (user of Object.values(users)) {
    if (user.email === email) {
      return true
    };
  } 
  return false;
}
// function used for creating random shortURL and user ID
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

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


app.get("/urls", (req, res) => {
  let templateVars = { 
    user: users[req.session["userID"]],
    urls: urlsForUser(req.session["userID"]) 
  };
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


app.get("/u/:shortURL" , (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL
  res.redirect(longURL);
});

//registeration page information from client
app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.session["userID"]],
    email: users[req.body.email],
    password: users[req.body.password]
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session["userID"]],
  };
  res.render("urls_login", templateVars);
});

  //only allow adding new obj if user is logged in
app.post("/urls", (req, res) => {
  let user = req.session["userID"];
  const shortURL = generateRandomString(6);
  const newURL = {
    longURL: req.body.longURL,
    userID: req.session["userID"]
  };
  urlDatabase[shortURL] = newURL;
  res.redirect(`/urls/${shortURL}`);
});


app.post("/urls/:shortURL/delete", (req, res) => {   //deleting a submission
  const shortURL = req.params.shortURL;
  if(urlDatabase[shortURL]  && urlDatabase[shortURL].userID === req.session["userID"]) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else
  res.redirect("/login");
});

app.post("/login", function(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  if (email === "" || password === "") {
    res.status(403).
    res.send("Email or Password cannot be blank");
    return;
  }
  for (var key in users) {
    if (users[key].email === email && !bcrypt.compareSync(password, users[key].password)) {
        res.status(403);
        res.send('Password and email cannot be located')
        return;
    } else if (users[key].email === email && bcrypt.compareSync(password, users[key].password)) {
        req.session['userID'] = key;
        res.redirect('/urls');
        return;
    }
  }
});


 //register for a new user and stored in users
app.post("/register", (req, res) => {  
  if (req.body.email === "" || req.body.password === "" || checkEmail(req.body.email)) {
    res.status(400);
    res.send("Cannot register: Email already existed");
  }
  else {
    const password = bcrypt.hashSync(req.body.password, 10);
    let user_id = generateRandomString(8);
    users[user_id] = {
      id: user_id,
      email: req.body.email,
      password: password
    };
    req.session["userID"] = user_id;
  }
  res.redirect("/urls");
});


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
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


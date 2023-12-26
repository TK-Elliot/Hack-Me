const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const mysql = require('mysql2');
const app = express();

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'users'
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set("view engine", "ejs");
app.set('views', __dirname + '/views');

app.listen(3000, () => {
});

connection.connect((err) => {
  if (err) {
    console.log('error connecting: ' + err.stack);
    return;
  }
  console.log('success');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get('/xss-level1', (req, res) => {
  res.render("xss-level1.ejs");
});

app.get('/xss-level2', (req, res) => {
  res.render("xss-level2.ejs");
});

app.get('/os-command-injection-level1', (req, res) => {
  res.render("os-command-injection-level1.ejs");
});

app.get('/os-command-injection-level2', (req, res) => {
  res.render("os-command-injection-level2.ejs");
});

app.get('/directory-traversal-level1', (req, res) => {
  res.render("directory-traversal-level1.ejs");
});

app.get('/directory-traversal-level2', (req, res) => {
  res.render("directory-traversal-level2.ejs");
});

app.get('/bruteforce-login', (req, res) => {
  res.render("bruteforce-login.ejs");
});

app.get('/bruteforce-directory', (req, res) => {
  res.render("bruteforce-directory.ejs");
});

app.get('/idor', (req, res) => {
  res.render("idor.ejs");
});

app.get('/sql-injection', (req, res) => {
  res.render("sql-injection.ejs");
});

app.get('/xss-get-1', (req, res) => {
  var number = req.query.number;
  var square = number * number;
  res.render("xss-level1.ejs", { number: number , square: square });
});

app.get('/xss-get-2', (req, res) => {
  var number = req.query.number;
  number = number.replace("<", "").replace(">", "");
  var square = number * number;
  res.render("xss-level2.ejs", { number: number , square: square });
});

app.get('/admin', (req, res) => {
  var message = "You found me.";
  res.render("admin.ejs", { message: message });
});

app.post('/os-command-injection-post-1', (req, res) => {
  var address = req.body.address;
  exec(`ping -c 4 ${address}`, (err, stdout, stderr) => {
    if (err) {
       return res.render("os-command-injection-level1.ejs", { output: stderr });
    }
    res.render("os-command-injection-level1.ejs", { output: stdout });
  }
  );
});

app.post('/os-command-injection-post-2', (req, res) => {
  var address = req.body.address;
  exec(`ping ${address} -c 4`, (err, stdout, stderr) => {
    if (err) {
      return res.render("os-command-injection-level2.ejs", { output: stderr });
    }
    res.render("os-command-injection-level2.ejs", { output: stdout });
  }
  );
});

app.post('/directory-traversal-post-1', (req, res) => {
  var userInput = req.body.filename;
  var rootdir = "./kotowaza/";
  var filename = path.join(rootdir, userInput);
  try {
    var content = fs.readFileSync(filename);
  } catch (err) {
    var content = "Can't read this file.";
  };
  res.render("directory-traversal-level1.ejs", { content: content });
});

app.post('/directory-traversal-post-2', (req, res) => {
  var userInput = req.body.filename;
  userInput = userInput.replace(/\.\.\//g, "");
  var rootdir = "./kotowaza/";
  var filename = path.join(rootdir, userInput);
  console.log(filename);
  try {
    var content = fs.readFileSync(filename);
  } catch (err) {
    var content = "Can't read this file.";
  };
  res.render("directory-traversal-level2.ejs", { content: content });
});

app.post('/bruteforce-post-1', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  if (username === "admin" && password == "secret") {
    var output = "Login successful";
    return res.render("bruteforce-login.ejs", { output: output });
  }
  var output = "username or password is incorrect.";
  res.render("bruteforce-login.ejs", { output: output });
});

app.post('/idor-post', (req, res) => {
  var filename = req.body.fileid;
  if (filename === "197.txt" || filename === "198.txt") {
    return res.download("idor/" + filename);
  }
  res.send("エラーが発生しました。");
});

app.post('/sql-injection-post', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  var query = `SELECT * FROM user WHERE username = "${username}" AND password = "${password}"`;
  const queryDatabase = new Promise((resolve, reject) => {
    connection.query(query, function (error, results, fields) {
      if (error) {
        reject(error);
        return;
      }
  
      if (results.length == 0) {
        resolve("Login failed");
      } else {
        resolve(`Login successful as ${results[0].username}`);
      }
    });
  });
  
  queryDatabase
    .then(message => {
      res.render("sql-injection.ejs", { message: message });
    })
    .catch(error => {
      res.render("sql-injection.ejs", { message: error });
    });  
});

/* 

create database users;

use users;

create table user(
id INT NOT NULL AUTO_INCREMENT,
username VARCHAR(255) NOT NULL,
password CHAR(30) NOT NULL,
PRIMARY KEY (id)
);

insert into user (username, password) values ('admin', 'ThisShouldBeHashed');
insert into user (username, password) values ('john', 'PleaseFindMe');
*/


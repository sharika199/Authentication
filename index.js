const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get  Register
app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const selectUserQuery = `
  SELECT 
    * 
  FROM 
    user 
  WHERE 
    username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);

  //new/existing user
  if (dbUser === undefined) {
    //create user
    const createUserQuery = `
  INSERT INTO
    user (username, name, password, gender, location)
  VALUES
    (
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'  
    );`;

    await db.run(createUserQuery);
    response.send("user create successfully");
  } else {
    response.status(400);
    response.send("user already exits");
  }
});

//login
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const selectUserQuery = `
  SELECT 
    * 
  FROM 
    user 
  WHERE 
    username = '${username}';`;

  const dbUser = await db.get(selectUserQuery);

  //new/existing user
  if (dbUser === undefined) {
    response.send("Invalid user");
  } else {
    const isPassword = await bcrypt.compare(password, dbUser.password);

    if (isPassword === true) {
      response.send("Login success");
    } else {
      response.send(400);
      response.send("Invalid Password");
    }
  }
});

module.exports = app;

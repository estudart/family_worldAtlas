import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Es@16589231",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function getUserInfo() {
  if (currentUserId === 1) {
    const user_countries = await db.query(
      "SELECT country_code FROM visited_countries"
    );
    const countries = user_countries.rows;
    const countries_list = [];
    countries.forEach((country) => countries_list.push(country.country_code));
    console.log(countries_list);
    return countries_list;
  } else {
    const user_countries = await db.query(
      "SELECT country_code FROM visited_countries WHERE user_id = $1",
      [currentUserId]
    );
    const countries = user_countries.rows;
    const countries_list = [];
    countries.forEach((country) => countries_list.push(country.country_code));
    console.log(countries_list);
    return countries_list;
  }
}

app.get("/", async (req, res) => {
  const countries = await getUserInfo();
  console.log(countries);
  const users_query = await db.query("SELECT name, id, color FROM users");
  const users = users_query.rows;
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: "teal",
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  console.log(currentUserId + "heeeeree");
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/user", async (req, res) => {
  const user = req.body.user;
  currentUserId = user;
  if (!user) {
    res.render("new.ejs");
  }
  try {
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  try {
    db.query("INSERT INTO users (name, color) VALUES ($1, $2)", [
      req.body.name,
      req.body.color,
    ]);
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

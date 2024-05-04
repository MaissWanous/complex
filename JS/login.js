const mysql = require("mysql2");
module.exports = {
  login: function (app, dic) {
    app.get("/login", function (req, res) {
      res.sendFile(dic + "/HTML/login.html");
    });
    const pool = mysql
      .createPool({
        host: "localhost",
        user: "root",
        password: "1234",
        database: "project",
      })
      .promise();

    var email;
    var password;
    var job;
    var check;
    app.post("/login", async function (req, res) {
      email = req.body.email;
      password = req.body.password;
      job = req.body.job;
      check = "";
      if (job == "Dr") {
        await pool
          .query("SELECT * FROM doctor WHERE email = ?", [email])
          .then(async ([rows]) => {
            if (rows.length > 0) {
              await pool
                .query("SELECT * FROM doctor WHERE password = ?", [password])
                .then(([rows]) => {
                  if (rows.length > 0) {
                    console.log("yees pass");
                  } else {
                    check = "password is incorrect";
                    console.log("nooo pass");
                  }
                })
                .catch((error) => {
                  console.error(error);
                });

              console.log("yees");
            } else {
              check =
                "The entered email id wrong or you do not have the authority to log in to this account";
              console.log("nooo");
            }
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        await pool
          .query("SELECT * FROM employee WHERE email = ?", [email])
          .then(async ([rows]) => {
            if (rows.length > 0) {
              console.log("yees");
              await pool
                .query("SELECT * FROM employee WHERE password = ?", [password])
                .then(([rows]) => {
                  if (rows.length > 0) {
                    console.log("yees pass");
                  } else {
                    check = "password is incorrect";
                    console.log("nooo pass");
                  }
                })
                .catch((error) => {
                  console.error(error);
                });
            } else {
              check =
                "The entered email id wrong or you do not have the authority to log in to this account";
              console.log("nooo");
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }

      console.log(check);
      res.send("");
    });
    app.get("/login", function (req, res) {
      let obj = {
        check: check,
      };
      res.JSON(obj);
    });
  },
};

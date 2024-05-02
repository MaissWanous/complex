const mysql = require('mysql2');
module.exports = {
  login: function (app, dic) {
    app.get("/login", function (req, res) {
      res.sendFile(dic + "/HTML/login.html");
    });

    var email;
    var password;

    app.post("/login", function (req, res) {
      email = req.body.email;
      password = req.body.password;
      const pool = mysql
        .createPool({
          host: "localhost",
          user: "root",
          password: "1234",
          database: "project",
        })
        .promise();
               
      pool
        .query("SELECT * FROM employee WHERE email = ?", [email])
        .then(([rows]) => {
          if (rows.length > 0) {
            console.log("yees");
          } else {
            console.log("nooo");
          }
        })
        .catch((error) => {
          console.error(error);
        });
        res.send("");
    });
  },
};

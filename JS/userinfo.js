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

    let email;
    let password;
    let job;
    let check;
    let code;
    let snaps;
    let checkCod;
    let userId;
    let userInfo;
    let userPayment;
    let error;
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
                .query("SELECT * FROM doctor WHERE password = ? and email = ?", [password, email])
                .then(([rows]) => {
                  if (rows.length > 0) {
                    console.log(rows);
                  } else {
                    check = "password is incorrect";
                  }
                })
                .catch((error) => {
                  console.error(error);
                });

            } else {
              check =
                "The entered email is wrong or you do not have the authority to log in to this account";
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
              console.log(rows);
              await pool
                .query("SELECT * FROM employee WHERE password = ? and email = ? ", [password, email])
                .then(([rows]) => {
                  if (rows.length > 0) {
                    console.log(rows);
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
                "The entered email is wrong or you do not have the authority to log in to this account";
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }

      console.log(check);
      res.send("");
    });
    app.post("/forget", async (req, res) => {
      email = req.body.email;
      check = "";
      snaps = false;
      if (job == "Dr") {
        userId = await pool
          .query("SELECT id FROM doctor WHERE email = ?", [email])
          .then(async ([rows]) => {
            if (rows.length == 0) {
              check =
                "The entered email is wrong or you do not have the authority to log in to this account";
            }
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        userId = await pool
          .query("SELECT id FROM employee WHERE email = ?", [email])
          .then(async ([rows]) => {
            if (rows.length == 0) {
              check =
                "The entered email is wrong or you do not have the authority to log in to this account";
              console.log("nooo");
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }

      console.log(check);
      if (check == "")
        try {
          code = Math.floor(Math.random() * 10000);
          console.log(code);
          const nodemailer = require("nodemailer"); // Require the Nodemailer package
          async function main() {
            // SMTP config
            const transporter = nodemailer.createTransport({
              host: "smtp.elasticemail.com", //
              port: 2525,
              auth: {
                user: "hananalrstom87@gmail.com", // Your Ethereal Email address
                pass: "1980E59A59ABF2E83538525EF3B1FD9C1824", // Your Ethereal Email password
              },
            }); // Send the email
            let info = await transporter.sendMail({
              from: "hananalrstom87@gmail.com",
              to: email, // Test email address
              subject: "Reset your password ",
              text: "To reset your password, please use the following One Time code :",
              html: "To reset, please use the following One Time code <strong>" + code + "</strong> :",
            });
            console.log("Message sent: %s", info.messageId); // Output message ID
            console.log("View email: %s", nodemailer.getTestMessageUrl(info)); // URL to preview email
          }
          // Catch any errors and output them to the console
          main().catch(console.error);

        } catch (err) {
          if (err) {
            snaps = true;
          }
        }

      res.send("")
    })
    app.post("/check", (req, res) => {
      checkCod = req.body.code;
      if (checkCod != code)
        check = "incorrect code "
      console.log(check)
      res.send();
    })
    app.post("/resetPass", (req, res) => {
      password = req.body.password;
      var table;
      if (job == "Dr")
        table = "doctor";
      else table = "employee";
      pool.query("UPDATE ? SET password = ? WHERE email = ? ", [table, password, email])
      res.send();
    })
    app.get("/forget", (req, res) => {
      obj = {
        code: code,
        check: check,
        snaps: snaps
      }
      res.json(obj);
    })
    app.get("/login", function (req, res) {
      let obj = {
        check: check,
      };
      res.JSON(obj);
    });
    ////////////////////////////////////
    //query for user information
    app.get("/userInfo", async (req, res) => {
      try {
        if (job == "Dr") {
          userInfo = await pool
            .query("SELECT * FROM doctor WHERE email = ?", [email])
          userPayment = await pool
            .query("SELECT * FROM salaries WHERE user_id = ? and is_doctor = 1", [userId])
        } else {
          userInfo = await pool
            .query("SELECT * FROM employee WHERE email = ?", [email])
          userPayment = await pool
            .query("SELECT * FROM salaries WHERE user_id = ? and is_doctor = 0", [userId])
        }
        if (userInfo.length === 0) {
          return res.status(404).json({ error: "No employee found with this ID." });
        }


        res.json({
          userInfo: userInfo,
          userPayment: userPayment,
          error: error
        })
      }
      catch (error) {
        console.error("Error executing the query:", error);
        return res.status(500).json({
          error: "An error occurred while fetching the employee information.",
        });
      }
    })
  },
};

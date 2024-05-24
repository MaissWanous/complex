const mysql = require("mysql2");
module.exports = {
  userInfo: function (app, dic) {
    // Endpoint to serve the login HTML file
    app.get("/login", function (req, res) {
      res.sendFile(dic + "/HTML/login.html");
    });

    const pool = mysql.createPool({
      host: "localhost",
      user: "root",
      password: "1234",
      database: "project",
    }).promise();

    let email;
    let password;
    let job;
    let check;
    let code;
    let snaps;
    let checkCod;
    let userId;
    let error;

    // Handle login endpoint
    app.post("/login", async function (req, res) {
      email = req.body.email;
      password = req.body.password;
      job = req.body.job;
      check = "";

      if (job == "Dr") {
        // Check if the user is a doctor
        await pool.query("SELECT * FROM doctor WHERE email = ?", [email])
          .then(async ([rows]) => {
            if (rows.length > 0) {
              await pool.query("SELECT * FROM doctor WHERE password = ? and email = ?", [password, email])
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
              check = "The entered email is wrong or you do not have the authority to log in to this account";
            }
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        // Check if the user is an employee
        await pool.query("SELECT * FROM employee WHERE email = ?", [email])
          .then(async ([rows]) => {
            if (rows.length > 0) {
              console.log(rows);
              await pool.query("SELECT * FROM employee WHERE password = ? and email = ?", [password, email])
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
              check = "The entered email is wrong or you do not have the authority to log in to this account";
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }

      console.log(check);
      res.send("");
    });

    // Handle forget endpoint
    app.post("/forget", async (req, res) => {
      email = req.body.email;
      check = "";
      snaps = false;

      if (job == "Dr") {
        // Check if the user is a doctor for password reset
        userId = await pool.query("SELECT id FROM doctor WHERE email = ?", [email])
          .then(async ([rows]) => {
            if (rows.length == 0) {
              check = "The entered email is wrong or you do not have the authority to log in to this account";
            }
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        // Check if the user is an employee for password reset
        userId = await pool.query("SELECT id FROM employee WHERE email = ?", [email])
          .then(async ([rows]) => {
            if (rows.length == 0) {
              check = "The entered email is wrong or you do not have the authority to log in to this account";
              console.log("nooo");
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }
    });


    console.log(check);
    if (check == "") {
      try {
        code = Math.floor(Math.random() * 10000);
        console.log(code);

        const nodemailer = require("nodemailer"); // Require the Nodemailer package

        async function sendMail() {
          // SMTP config
          const transporter = nodemailer.createTransport({
            host: "smtp.elasticemail.com",
            port: 2525,
            auth: {
              user: "hananalrstom87@gmail.com",
              pass: "1980E59A59ABF2E83538525EF3B1FD9C1824",
            },
          });

          // Send the email
          let info = await transporter.sendMail({
            from: "hananalrstom87@gmail.com",
            to: email,
            subject: "Reset your password",
            text: "To reset your password, please use the following One Time code:",
            html: "To reset, please use the following One Time code <strong>" + code + "</strong> :",
          });

          console.log("Message sent: %s", info.messageId); // Output message ID
          console.log("View email: %s", nodemailer.getTestMessageUrl(info)); // URL to preview email
        }

        // Catch any errors and set 'snaps' to true
        sendMail().catch((error) => {
          console.error(error);
          snaps = true;
        });
      } catch (err) {
        console.error(err);
      }
    }

    // Handle check code endpoint
    app.post("/check", (req, res) => {
      checkCod = req.body.code;
      if (checkCod != code)
        check = "incorrect code";
      console.log(check);
      res.send();
    });

    // Handle reset password endpoint
    app.post("/resetPass", (req, res) => {
      password = req.body.password;
      var table = (job == "Dr") ? "doctor" : "employee";
      pool.query("UPDATE ?? SET password = ? WHERE email = ?", [table, password, email]);
      res.send();
    });

    // Handle forget endpoint
    app.get("/forget", (req, res) => {
      let obj = {
        code: code,
        check: check,
        snaps: snaps
      };
      res.json(obj);
    });

    // Handle login endpoint
    app.get("/login", function (req, res) {
      let obj = {
        check: check,
      };
      res.json(obj);
    });

    // Handle user information query endpoint
    app.get("/userInfo", async (req, res) => {
      try {
        let userInfo, userPayment;

        if (job == "Dr") {
          userInfo = await pool.query("SELECT * FROM doctor WHERE email = ?", [email]);
          userPayment = await pool.query("SELECT * FROM salaries WHERE user_id = ? and is_doctor = 1", [userId]);
        } else {
          userInfo = await pool.query("SELECT * FROM employee WHERE email = ?", [email]);
          userPayment = await pool.query("SELECT * FROM salaries WHERE user_id = ? and is_doctor = 0", [userId]);
        }

        if (userInfo.length === 0) {
          return res.status(404).json({ error: "No employee found with this email." });
        }

        res.json({
          userInfo: userInfo,
          userPayment: userPayment,
          error: error
        });
      } catch (error) {
        console.error("Error executing the query:", error);
        return res.status(500).json({
          error: "An error occurred while fetching the employee information.",
        });
      }
    });
  }
}
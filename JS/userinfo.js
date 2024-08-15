const mysql = require("mysql2");
module.exports = {
  userInfo: function (app, dic) {
    require("dotenv").config();
    const jwt = require("jsonwebtoken");
    const pool = mysql
      .createPool({
        host: "localhost",
        user: "root",
        password: "1234",
        database: "complex",
      })
      .promise();


    let Jobb;
    app.post("/login", async (req, res) => {
      try {
        const { email, password, job } = req.body;
        Jobb = job;
        if (!email || !password || !job) {
          return res.status(400).send({
            message: "Missing required fields: email, password, and job",
          });
        }

        let user; // Declare a variable to hold the retrieved user data
        let Job = job === "Dr" ? "doctor" : "employee";
        user = await pool.query("SELECT * FROM ?? WHERE email = ?", [
          Job,
          email,
        ]);
      
        if (!user[0].length) {
          return res.status(401).send({ message: "Invalid email " });
        }

        const isPasswordCorrect = await pool.query(
          "SELECT * FROM ?? WHERE password = ? AND email = ?",
          [Job, password, email]
        );
        if (!isPasswordCorrect[0].length) {
          return res.status(401).send({ message: "Incorrect password" });
        }
      

        res.send({ message: "Login successful"});
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    let resetCode;
    app.post("/forget", async (req, res) => {
      try {
        const { email } = req.body; // Destructuring for cleaner variable access

        if (!email) {
          return res
            .status(400)
            .send({ message: "Missing required field: email" });
        }

        const [doctorResult, employeeResult] = await Promise.all([
          pool.query("SELECT ID FROM doctor WHERE email = ?", [email]),
          pool.query("SELECT ID FROM employee WHERE email = ?", [email]),
        ]);

        if (!doctorResult[0].length && !employeeResult[0].length) {
          return res.status(404).send({ message: "Email not found" });
        }

        resetCode = Math.random().toString(36).substring(2, 15); // Generate random code

        // Send email
        await sendPasswordResetEmail(email, resetCode);

        res.send({ message: "Password reset instructions sent to your email" });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    async function sendPasswordResetEmail(email, resetCode) {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.elasticemail.com",
          port: 2525,
          auth: {
            user: "hananalrstom87@gmail.com",
            pass: "1980E59A59ABF2E83538525EF3B1FD9C1824",
          },
        });

        const info = await transporter.sendMail({
          from: "hananalrstom87@gmail.com",
          to: email,
          subject: "Reset your password",
          text: "To reset your password, please use the following One Time code:",
          html: `To reset, please use the following One Time code <strong>${resetCode}</strong>`,
        });

        console.log("Message sent:", info.messageId);
      } catch (error) {
        console.error("Error sending email:", error);
      }
    }

    app.post("/check", (req, res) => {
      try {
        const { code } = req.body; // Destructuring for cleaner variable access

        if (!code) {
          return res
            .status(400)
            .send({ message: "Missing required field: code" });
        }

        if (code !== resetCode) {
          return res.status(401).send({ message: "Incorrect reset code" }); // Use 401 for unauthorized
        }

        // Reset code matches
        res.send({
          message: "Reset code verified. Please proceed to set a new password",
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    app.post("/resetPass", async (req, res) => {
      try {
        const { password } = req.body;

        if (!password) {
          return res
            .status(400)
            .send({ message: "Missing required field: password" });
        }

        // const hashedPassword = await bcrypt.hash(password, 10); // Hash the password using bcrypt

        const table = Jobb === "Dr" ? "doctor" : "employee";

        await pool.query("UPDATE ?? SET password = ? WHERE email = ?", [
          table,
          password,
          email,
        ]);

        res.send({ message: "Password reset successful" });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
      }
    });
    let ID, Role;
    app.post('/userProfile', (req, res) => {
      try {
        ID = req.body.ID;
        Role = req.body.job;
        if (!ID || !Role)
          return res.status(400).send({
            message: "Missing required fields: Role, ID",
          });
          res.send("success")
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
      }
    })

    app.get("/userProfile", async (req, res) => {
      try {
        let table = Role === "doctor" ? "doctor" : (Role === "patient" ? "patient" : "employee");
        let isDoctor = table === "doctor" ? 1 : 0
        const [userInfo, userPayment] = await Promise.all([
          pool.query("SELECT * FROM ?? WHERE id = ?", [table, ID]),
          pool.query(
            "SELECT * FROM salaries WHERE user_id = ? AND is_doctor = ?",
            [ID, isDoctor]
          ),
        ]);

        if (!userInfo[0]) {
          return res.status(404).json({ error: "No user found with this ID" });
        }

        res.json({ userInfo: userInfo[0], userPayment: userPayment[0] });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // info about  drs and employee
    app.get("/api/combined-data", async (req, res) => {
      try {
        const drs_emp_data = await pool.query(
          "SELECT fname ,id ,email, phone, address FROM employee UNION ALL SELECT fname, id,email, phone ,address FROM doctor"
        );

        res.json({ drs_emp_data: drs_emp_data[0] });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
      }
    });
    // add new employee or doctor
    app.post("/addEmployee", async (req, res) => {
      try {
        const {
          fname,
          lname,
          sex,
          email,
          phone,
          birthDate,
          address,
          password,
          jobTitle,
        } = req.body;
        let confirmEmail = true;

        let employeeInfo,
          employeeData,
          salaryPercentage = 0;
        employeeData = [
          fname,
          lname,
          sex,
          email,
          phone,
          birthDate,
          address,
          password,
          salaryPercentage,
          jobTitle,
        ];
        // check if email is valid
        let Email = email.toLowerCase();
        if (!Email.includes("@gmail.com")) {
          return res
            .status(400)
            .send({
              message:
                "Please check the email address entered and try again. it must be as follows: *******@gmail.com ",
            });

        }

        // Check if the email already exists in the 'doctor' or 'employee' tables
        const [emailResults] = await pool.query(`
      SELECT * 
     FROM (
    SELECT * FROM doctor WHERE email = ?
   UNION
   SELECT * FROM employee WHERE email = ?
    ) AS combined
`, [email, email]);

        if (emailResults.length > 0) {
          return res.status(400).send({ message: 'Email already exists' });
        }

        switch (jobTitle) {
          case "Dr":
            employeeInfo =
              "INSERT INTO doctor (fname, lname, sex, email, phone, birthdate, address, password, percentage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            salaryPercentage = parseFloat(req.body.salaryPercentage) || 0.0;
            employeeData.slice(0, -1);
            break;
          case "admin":
          case "reception":
            employeeInfo =
              "INSERT INTO employee (fname, lname, sex, email, phone, birthdate, address, password, salary, job_title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            salaryPercentage = parseInt(req.body.salaryPercentage) || 0;
            break;
          case "other":
            const job = req.body.job;
            employeeInfo =
              "INSERT INTO employee (fname, lname, sex, email, phone, birthdate, address, password, salary, job_title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            salaryPercentage = parseInt(req.body.salaryPercentage) || 0;
            jobTitle = job;
            break;
          default:
            return res.status(400).send({ message: "Invalid job title" });
        }

        const [results] = await pool.query(employeeInfo, employeeData);

        if (results.affectedRows) {
          res.send({ message: "Employee added successfully" });
        } else {
          res.status(500).send({ message: "Failed to add employee" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
      }
    });
  },
};

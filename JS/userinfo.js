const mysql = require("mysql2");
module.exports = {
  userInfo: function (app, dic) {

    const jwt = require('jsonwebtoken');

    const pool = mysql.createPool({
      host: "localhost",
      user: "root",
      password: "1234",
      database: "complex",
    }).promise();

    app.post('/login', async (req, res) => {
      try {
        const { email, password, job } = req.body;

        if (!email || !password || !job) {
          return res.status(400).send({ message: 'Missing required fields: email, password, and job' });
        }

        let user; // Declare a variable to hold the retrieved user data
        let Job = job === 'Dr' ? "doctor" : "employee";
        user = await pool.query('SELECT * FROM ?? WHERE email = ?', [Job, email]);
        if (!user[0].length) {
          return res.status(401).send({ message: 'Invalid email ' });
        }

        const isPasswordCorrect = await pool.query('SELECT * FROM ?? WHERE password = ? AND email = ?', [Job, password, email]);
        if (!isPasswordCorrect[0].length) {
          return res.status(401).send({ message: 'Incorrect password' });
        }
        // Successful login: Generate JWT 
        const secretKey = "~u3!2t&zT^7z2X4yH^z9z2n^5n8s7z5z8z2z9n8z2n7z9z8z8"; // Access secret key from environment variable
        const payload = { userId: user[0].ID, Job }; // Include relevant user data in the payload
        const token = jwt.sign(payload, secretKey);

        res.send({ message: 'Login successful', token });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    app.post('/logout', async (req, res) => {
      try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from authorization header

        if (!token) {
          return res.status(401).send({ message: 'Missing authorization token' });
        }

        // Verify the token using your secret key
        jwt.verify(token, "~u3!2t&zT^7z2X4yH^z9z2n^5n8s7z5z8z2z9n8z2n7z9z8z8");


        res.send({ message: 'Logout successful' });
      } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });


    let resetCode;
    app.post('/forget', async (req, res) => {
      try {
        const { email } = req.body; // Destructuring for cleaner variable access

        if (!email) {
          return res.status(400).send({ message: 'Missing required field: email' });
        }

        const [doctorResult, employeeResult] = await Promise.all([
          pool.query('SELECT ID FROM doctor WHERE email = ?', [email]),
          pool.query('SELECT ID FROM employee WHERE email = ?', [email]),
        ]);

        if (!doctorResult[0].length && !employeeResult[0].length) {
          return res.status(404).send({ message: 'Email not found' });
        }


        resetCode = Math.random().toString(36).substring(2, 15); // Generate random code

        // Send email 
        await sendPasswordResetEmail(email, resetCode);

        res.send({ message: 'Password reset instructions sent to your email' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal server error' });
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

    app.post('/check', (req, res) => {
      try {
        const { code } = req.body; // Destructuring for cleaner variable access

        if (!code) {
          return res.status(400).send({ message: 'Missing required field: code' });
        }

        if (code !== resetCode) {
          return res.status(401).send({ message: 'Incorrect reset code' }); // Use 401 for unauthorized
        }

        // Reset code matches
        res.send({ message: 'Reset code verified. Please proceed to set a new password' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });


    app.post('/resetPass', async (req, res) => {
      try {
        const { password } = req.body; // Destructuring for cleaner variable access

        if (!password) {
          return res.status(400).send({ message: 'Missing required field: password' });
        }

        // const hashedPassword = await bcrypt.hash(password, 10); // Hash the password using bcrypt

        const table = job === 'Dr' ? 'doctor' : 'employee';

        await pool.query('UPDATE ?? SET password = ? WHERE email = ?', [table, password, email]);

        res.send({ message: 'Password reset successful' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    const verifyJWT = (req, res, next) => {
      const token = req.headers['authorization']?.split(' ')[1]; // Extract token from authorization header

      if (!token) {
        return res.status(401).json({ message: 'Missing authorization token' });
      }

      try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decodedToken.userId; // Store user ID for later use
        req.job = decodedToken.Job;
        next();
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' }); // Unauthorized if token is invalid
      }
    };

    app.get('/userProfile', verifyJWT, async (req, res) => {
      try {
        const userId = req.userId; // Use userId and job from verified token
        const job = req.job;
        const table = job;
        const isDoctor = job === "doctor" ? 1 : 0;

        const [userInfo, userPayment] = await Promise.all([
          pool.query('SELECT * FROM ?? WHERE id = ?', [table, userId]),
          pool.query('SELECT * FROM salaries WHERE user_id = ? AND is_doctor = ?', [userId, isDoctor]),
        ]);

        if (!userInfo[0]) {
          return res.status(404).json({ error: 'No user found with this ID' });
        }

        res.json({ userInfo: userInfo[0], userPayment });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

  }
}
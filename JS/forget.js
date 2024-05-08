const mysql = require("mysql2");
module.exports = {
    forget: function (app, dic) {
        var code;
        var email;
        var check;
        var snaps;
        var checkCod;
        var job;
        var password;
        const pool = mysql
            .createPool({
                host: "localhost",
                user: "root",
                password: "1234",
                database: "project",
            })
            .promise();
        app.post("/forget", async (req, res) => {
            email = req.body.email;
            check = "";
            snaps = false;
            if (job == "Dr") {
                await pool
                    .query("SELECT * FROM doctor WHERE email = ?", [email])
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
                await pool
                    .query("SELECT * FROM employee WHERE email = ?", [email])
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
            pool.query("UPDATE employee SET password = ? WHERE email = ? ", [password, email])
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
    }
}
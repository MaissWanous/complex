const mysql = require("mysql2");
module.exports = {
    finance: function (app, dic) {
        // Create a dedicated connection pool for the application
        const pool = mysql
            .createPool({
                host: "localhost",
                user: "root",
                password: "1234",
                database: "complex",
            })
            .promise();
        app.post("/addTreatment", async function (req, res) {
            try {
                const { treatment_name, status, cost, profit } = req.body;
                console.log(treatment_name + status + cost + profit)
                // Insert laboratory details
                await pool.query(
                    "INSERT INTO treatment (treatment_name,status,cost, profit) VALUES (?,?,?, ?)",
                    [treatment_name, status, parseInt(cost), parseInt(profit)]
                );


                res.send("successfully added treatment cost");
            } catch (error) {
                console.error(error);
                res.status(500).send("Error adding treatment cost");
            }
        })
        app.get("/treatmentCost", async function (req, res) {
            try {

                const treatment = await pool.query(
                    "SELECT * from treatment"
                );

                res.json({ treatment: treatment[0] })
            } catch (error) {
                console.error(error);
                res.status(500).send("Error adding treatment cost");
            }
        })
        app.post("/addExpenses", async function (req, res) {
            try {
                let { object, type, amount, For, check, date, cost, note } = req.body;
                check = '0' ? "y" : "m";
                let medicine;
                await pool.query(
                    "INSERT INTO expenses (object,type,amount,Forr,yearlyMonthly,date,cost,note) VALUES (?,?,?,?, ?,?,?,?)",
                    [object, type, parseInt(amount), parseInt(For), check, date, parseInt(cost), note]
                );
                if (type == "medicine") {
                    // Update item amounts
                    medicine = await pool.query("UPDATE items SET amount = amount - ? WHERE item= ?", [
                        parseInt(amount),
                        object
                    ]);


                }
                if (medicine[0].affectedRows == 0) {
                    throw new Error("Item not found"); // Handle non-existent item
                }
                res.send("add Expenses successfully")
            }
            catch (error) {
                console.error(error);
                res.status(500).send("Error adding expenses");
            }
        })
        app.post("/profit", async (req, res) => {
            try {
                // Extract date components from the request body
                const { day, month, year } = req.body;

                // Build the base SQL queries
                let salaries = 'SELECT SUM(amount) AS total_salary FROM salaries where ';
                let percentage =
                    'select ID,avg(percentage) , sum(cost),sum( profit) from treatment_info inner join doctor on ID = doctor_id INNER JOIN treatment ON treatment.treatment_id = treatment_info.treatment_id  where '
                let whereClause = [];
                // Add WHERE clauses for year, month, and day if they are provided
                if (year) {
                    whereClause.push(`YEAR(date) = ${year}`);
                }
                if (month) {
                    whereClause.push(`MONTH(date) = ${month}`);
                }
                if (day) {
                    whereClause.push(`DAY(date) = ${day}`);
                }

                // Combine the WHERE clauses and append them to the SQL query
                salaries += whereClause.join(' AND ');
                percentage += whereClause.join(' AND ');
                percentage += " group by(ID)"

                // Execute the SQL query and get the results
                // const [expensesRows] = await pool.query(expenses);
                const [salariesRows] = await pool.query(salaries);
                const [percentageRows] = await pool.query(percentage);
                console.log(percentageRows)

                res.send(";;")

            } catch (error) {
                console.error("Error calculating total profit:", error);
                res.status(500).send("Internal server error");
            }
        });


        app.get("/expenses", async function (req, res) {
            try {

                const expenses = await pool.query(
                    "SELECT * from expenses"
                );

                res.json({ expenses: expenses[0] })
            } catch (error) {
                console.error(error);
                res.status(500).send("Error adding expenses ");
            }
        })
        app.post("/DetectionDrs", async (req, res) => {
            try {
                // Extract date components from the request body
                const { day, month, year } = req.body;

                // Build the SQL query dynamically based on the provided date components
                let sql = 'SELECT COUNT(*) AS total_patients FROM treatment_info WHERE ';
                let whereClause = [];

                // Add WHERE clauses for year, month, and day if they are provided
                if (year) {
                    whereClause.push(`YEAR(date) = ${year}`);
                }
                if (month) {
                    whereClause.push(`MONTH(date) = ${month}`);
                }
                if (day) {
                    whereClause.push(`DAY(date) = ${day}`);
                }

                // Combine the WHERE clauses and append them to the SQL query
                sql += whereClause.join(' AND ');

                // Execute the SQL query and get the results
                const [rows] = await pool.query(sql);

                // Send the total number of patients as a JSON response
                res.json({ total_patients: rows[0].total_patients });

            } catch (error) {
                // Log the error and send a generic error message
                console.error(error);
                res.status(500).send("Error fetching patient count");
            }
        });
        app.post("/paySalary", async (req, res) => {
            try {
                // Extract and validate data from request body
                const { id, amount, month, date, note, isDoctor } = req.body;

                // Validate input data types (consider using a library like Joi for more robust validation)
                if (
                    !Number.isInteger(id) ||
                    !Number.isInteger(amount) ||
                    !Number.isInteger(month) ||
                    !Number.isInteger(isDoctor) ||
                    typeof date !== "string" ||
                    typeof note !== "string"
                ) {
                    return res.status(400).send("Invalid data types in request body");
                }

                // Construct a prepared SQL statement to prevent SQL injection vulnerabilities
                const sql = `
                INSERT INTO salaries (user_id, amount, month, date, note, is_doctor)
                VALUES (?, ?, ?, ?, ?, ?)
              `;

                // Execute the prepared statement with sanitized values
                const [result] = await pool.query(sql, [id, amount, month, date, note, isDoctor]);

                // Handle successful insertion
                if (result.affectedRows === 1) {
                    res.json({ message: "Salary payment recorded successfully" });
                } else {
                    console.error("Unexpected result from database insertion:", result);
                    res.status(500).send("Error recording salary payment");
                }

            } catch (error) {
                console.error("Error processing salary payment:", error);
                res.status(500).send("Internal server error"); // Generic error message for security
            }
        });



    }
}
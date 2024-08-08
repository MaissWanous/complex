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

    }
}
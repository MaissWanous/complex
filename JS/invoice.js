const mysql = require("mysql2");
module.exports = {
  admin: function (app, dic) {
    // Endpoint to serve the login HTML file
    app.get("/admin", function (req, res) {
      res.sendFile(dic + "/HTML/login.html");
    });
    // Create a dedicated connection pool for the application
    const pool = mysql.createPool({
      host: "localhost",
      user: "root",
      password: "1234",
      database: "complex",
    });
    // Add supplier
    app.post("/AddSuppliers", async function (req, res) {
      try {
        const { name, address, number1, number2, number3 } = req.body;

        // Insert laboratory details
        const labInsertResult = await pool.query(
          "INSERT INTO suppliers (lab_name, address) VALUES (?, ?)",
          [name, address]
        );
        const labId = labInsertResult[0].insertId;

        // Insert phone numbers (if provided)
        const phoneNumbers = [number1, number2, number3].filter(Boolean); // Remove empty values
        if (phoneNumbers.length > 0) {
          const sql = `
            INSERT INTO suppliers_phone (lab_id, phone)
            VALUES ${phoneNumbers.map(() => "(?, ?)").join(", ")}
          `;
          await pool.query(sql, phoneNumbers.flatMap((number) => [labId, number]));
        }

        res.send();
      } catch (error) {
        console.error(error);
        res.status(500).send("Error adding supplier");
      }
    });

    //start add new invoice
    let lab_id;
    let date;
    app.post("/startInvoice", (req, res) => {
      lab_id = req.body.labId;
      date = req.body.date;
      res.send()
    })
    //add invoice
    app.post("/addInvoice", (req, res) => {
      let invoice = req.body;

      invoice.forEach(async item => {
        let i = typeof (item.item);
        let itemId;
        if (i == "number")
          itemId = parseInt(item.item);
        else {
          await pool.query("insert into items (item) values (?) ", [item.item]);
          const itemResult = await pool.query("SELECT LAST_INSERT_ID() as itemId");
          itemId = await parseInt(itemResult[0][0].itemId);
        }
        const query = "INSERT INTO invoice (lab_id, date , item_id , amount , piece_cost, note) VALUES (?,?, ?, ?, ?, ?)";
        pool.query(query, [lab_id, date, itemId, parseInt(item.amount), parseInt(item.price), item.note], (error, results, fields) => {
          if (error) throw error;
          else console.log('Data inserted successfully');
        });
        pool.query("update items set amount = amount + ? where item_id = ?", [parseInt(item.amount), itemId])
      });

      res.send();
    })


    // delete invoice
    app.delete("/invoice/:id/:date", async (req, res) => {
      const labId = req.params.id;
      const date = req.params.date;
      console.log(`Deleting invoice: labId=${labId}, date=${date}`); // Improved logging

      try {
        // Use a transaction to ensure data consistency
        await pool.query("BEGIN");

        // Fetch invoice details to validate existence and get item amounts
        const invoice = await pool.query(
          "SELECT item_id, amount FROM invoice WHERE lab_id = ? AND date = ?",
          [parseInt(labId), date]
        );

        if (invoice[0].length === 0) {
          throw new Error("Invoice not found"); // Handle non-existent invoice
        }

        // Delete the invoice
        await pool.query("DELETE FROM invoice WHERE lab_id = ? AND date = ?", [parseInt(labId), date]);

        // Update item amounts
        const updatePromises = invoice[0].map(async (item) => {
          return pool.query("UPDATE items SET amount = amount - ? WHERE item_id = ?", [
            parseInt(item.amount),
            parseInt(item.item_id),
          ]);
        });

        await Promise.all(updatePromises); // Execute item updates in parallel

        await pool.query("COMMIT"); // Commit the transaction
        res.send("Invoice deleted successfully");
      } catch (err) {
        console.error(err);
        await pool.query("ROLLBACK"); // Roll back on errors
        res.status(500).send("Error deleting invoice");
      }
    });


    //Get info about invoice and items
    app.get("/invoiceInfo", async (req, res) => {
      try {

        let query = `
      	SELECT item, lab_name, address, date, i.amount, i.piece_cost, note, sp.phone
        FROM invoice AS i
        JOIN items ON i.item_id = items.item_id
        JOIN suppliers AS s ON i.lab_id = s.lab_id
        LEFT JOIN suppliers_phone AS sp ON s.lab_id = sp.lab_id;
    `;
        const items = await pool.query("select * from items");
        const labInfo = await pool.query("select * from suppliers as s , suppliers_phone as sph where s.lab_id = sph.lab_id");
        const inovice = await pool.query(query)
        const obj = {
          items,
          labInfo,
          inovice
        };
        res.json(obj);
      } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving invoice data"); // Handle errors gracefully
      }
    });


  }
}
const mysql = require("mysql2");
module.exports = {
  admin: function (app, dic) {
    // Endpoint to serve the login HTML file
    app.get("/admin", function (req, res) {
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

    app.post("/AddSuppliers", function (req, res) {
      let labId = req.body.id;
      let labName = req.body.name;
      let labAddress = req.body.address;
      let number1 = req.body.number1;
      let number2 = req.body.number2;
      let number3 = req.body.number3;
      //add new laboratory
      const labInfo =
        "INSERT INTO suppliers (lab_id,lab_name,address) VALUES (?,?,?)";
      pool.query(
        labInfo,
        [labId, labName, labAddress],
        (error, results, fields) => {
          if (error) {
            console.error(error);
            return;
          }
          console.log(`Inserted ${results.affectedRows} row(s)`);
        }
      );

      //add laboratory's phone
      if (number1 !== "" && number2 !== "" && number3 !== "") {
        const sql = `
          INSERT INTO suppliers_phone (lab_id, phone)
          VALUES (?, ?), (?, ?), (?, ?)
        `;

        pool.query(
          sql,
          [labId, number1, labId, number2, labId, number3],
          (error, results, fields) => {
            if (error) {
              console.error(error);
              return;
            }
            console.log(`Inserted ${results.affectedRows} row(s)`);
          }
        );
      }

      let nonEmptyNumbers = [];
      if (number1 !== "") {
        nonEmptyNumbers.push(number1);
      }
      if (number2 !== "") {
        nonEmptyNumbers.push(number2);
      }
      if (number3 !== "") {
        nonEmptyNumbers.push(number3);
      }

      if (nonEmptyNumbers.length === 2) {
        const sql = `
    INSERT INTO suppliers_phone (lab_id, phone)
    VALUES ${nonEmptyNumbers.map(() => "(?, ?)").join(", ")}
  `;

        const values = nonEmptyNumbers.reduce(
          (acc, curr) => [...acc, labId, curr],
          []
        );

        pool.query(sql, values, (error, results, fields) => {
          if (error) {
            console.error(error);
            return;
          }
          console.log(`Inserted ${results.affectedRows} row(s)`);
        });
      }
      let nonEmptyNumbers2 = [];
      if (number1 !== "") {
        nonEmptyNumbers2.push(number1);
      }
      if (number2 !== "") {
        nonEmptyNumbers2.push(number2);
      }
      if (number3 !== "") {
        nonEmptyNumbers2.push(number3);
      }

      if (nonEmptyNumbers2.length === 1) {
        const sql = `
    INSERT INTO suppliers_phone (lab_id, phone)
    VALUES (?, ?)`;
        pool.query(
          sql,
          [labId, nonEmptyNumbers2[0]],
          (error, results, fields) => {
            if (error) {
              console.error(error);
              return;
            }
            console.log(`Inserted ${results.affectedRows} row(s)`);
          }
        );
      }

      res.send();
    });
    //to delete laboratory
    app.delete("/labs/:id", async (req, res) => {
      const labId = req.params.id;
      async function deleteLabById(labId) {
        try {
          // Use the MySQL pool to execute the delete query
          await pool.query("DELETE FROM labs WHERE id = ?", [labId]);
          return true; // Return success
        } catch (err) {
          console.error(err);
          return false; // Return failure
        }
      }
      try {
        const result = await deleteLabById(labId);
        if (result) {
          res.send("Lab deleted successfully");
        } else {
          res.status(500).send("Error deleting lab");
        }
      } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting lab");
      }
    });
  },
};

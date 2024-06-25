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
        database: "complex",
      })
      .promise();

    app.post("/AddSuppliers", async function (req, res) {
      let labName = req.body.name;
      let labAddress = req.body.address;
      let number1 = req.body.number1;
      let number2 = req.body.number2;
      let number3 = req.body.number3;

      //add new laboratory
      const labInfo = "INSERT INTO suppliers (lab_name,address) VALUES (?,?)";
      const labInsertResult = await pool.query(labInfo, [labName, labAddress]);
      // get the auto-generated value
      const labResult = await pool.query("SELECT LAST_INSERT_ID() as lab_id");
      let labId = await labResult[0][0].lab_id;

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
    // add inovice 
    let lab_id;
    let date;
    app.post("/startInvoice", (req, res) => {
      lab_id = req.body.labId;
      date = req.body.date;
      res.send()
    })
    app.post("/addInvoice", (req, res) => {
      let inovice = req.body["arr"];
      console.log(inovice);
      // inovice.forEach(item => {
      //   const query = "INSERT INTO invoice (lab_id,date, amount, piece_cost, note) VALUES (?,?,?,?,?)"
      //   pool.query(query, [lab_id, date, '${item.amount}', '${item.price}', '${item.note}']
      //     , (error, results, fields) => {
      //       if (error) throw error;
      //       console.log('Data inserted successfully');
      //     });
      // });
      res.send();
    })
  }
}
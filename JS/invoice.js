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
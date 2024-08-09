const { add } = require("lodash");
const mysql = require("mysql2");
module.exports = {
  patient: function (app, dic) {
    // Create a connection pool for MySQL database
    const pool = mysql.createPool({
      host: "localhost",
      user: "root",
      password: "1234",
      database: "complex",
    }).promise();

    let patientId;
    let doctorId;
    let appointmentDate;

    // Handle POST request for patient endpoint
    app.post("/patient", (req, res) => {
      try {
        patientId = req.body.Pid;
        if (!patientId) {
          return res.status(400).json({ message: "Missing required field: patientId" });
        }
        res.status(204).send()
      }
      catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Handle POST request for appointment endpoint
    app.post("/appointment", (req, res) => {
      try {
        doctorId = req.body.doctor_id;
        appointmentDate = req.body.date;
        if (!doctorId || appointmentDate) {
          return res.status(400).json({ message: "Missing required field: doctorId.appointmentDate" });
        }
        res.status(204).send();
      }
      catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    let patientsData;
    let patientInfo;
    let appointmentInfo;

    // Handle GET request for patient endpoint
    app.get("/patient", async (req, res) => {
      try {
        // Retrieve patient, doctor, and appointment data from the database for patient info
        patientsData = await pool.query(
          "SELECT patient.fname, patient.lname, doctor.fname, doctor.lname, patient.id, date, start_hour FROM patient, appointment, doctor WHERE patient.id = ?",
          [patientId]
        );
        patientInfo = await pool.query("SELECT * FROM patient WHERE id = ?", [
          patientId,
        ]);
        appointmentInfo = await pool.query(
          "SELECT patient_id, date, start_hour, fname, lname FROM appointment, doctor WHERE doctor_id = id AND patient_id = ?",
          [patientId]
        );

        res.json({
          patientsData: patientsData,
          patientInfo: patientInfo,
          appointmentInfo: appointmentInfo,
        });
      }
      catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // obtaining the appointments available to the chosen doctor
    app.get("/appointment", async (req, res) => {
      try {
        let busyHours = await pool.query(
          "SELECT start_hour, end_hour FROM appointment WHERE doctor_id = ? AND date = ?",
          [doctorId, appointmentDate]
        );

        let allHours = [];
        for (let hour = 8; hour <= 21; hour++) {
          allHours.push(hour + ":00");
          allHours.push(hour + ":30");
        }

        let availableHours = allHours.filter(
          (hour) =>
            !busyHours.some(
              (busyHour) =>
                busyHour.start_hour <= hour && busyHour.end_hour > hour
            )
        );

        res.json({ availableHours: availableHours });
      }
      catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    function deleteAppointment(patientId, doctorId, appointmentDate, time) {
      const sql =
        "DELETE FROM appointment WHERE patient_id =? AND doctor_id =? AND date =? AND start_hour=?";
      return pool.query(sql, [patientId, doctorId, appointmentDate, time]);
    }

    app.delete('/appointments/:patientId/:doctorId/:date/:time', async (req, res) => {
      try {
        const { patientId, doctorId, date, time } = req.params;

        await deleteAppointment(patientId, doctorId, date, time);
        res.status(204).send(); // No content response on successful deletion
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' }); // Informative error message
      }
    });
    app.post("/addAppointment", function (req, res) {
      try {
        const { startHour, doctor_id, patient_id, date } = req.body;
        // booking half an hour
        async function calculateEndTime(startHour) {
          const [startHourPart, startMinutePart] = startHour.split(":");
          const startHourNumber = parseInt(startHourPart);
          const startMinuteNumber = parseInt(startMinutePart);

          const endTimeMinutes = startMinuteNumber + 30;
          const endTimeHour = startHourNumber + Math.floor(endTimeMinutes / 60);
          const endTimeMinute = endTimeMinutes % 60;
          const endTimeString = `${endTimeHour
            .toString()
            .padStart(2, "0")}:${endTimeMinute.toString().padStart(2, "0")}`;

          return endTimeString;
        }

        async function createAppointment() {
          try {
            const endTime = await calculateEndTime(startHour);
            console.log(`end time : ${endTime}`);

            const sql =
              "INSERT INTO appointment (patient_id, doctor_id, date, start_hour, end_hour) VALUES (?, ?, ?, ?, ?)";
            pool.query(
              sql,
              [patient_id, doctor_id, date, startHour, endTime],
              (error, results, fields) => {
                if (error) {
                  console.error(error);
                  return;
                }
                console.log(`Inserted ${results.affectedRows} row(s)`);
              }
            );
          } catch (error) {
            console.error(error);
          }
        }

        createAppointment();

        res.status(204).send();
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' }); // Informative error message
      }
    });

    // add new patient 
    app.post('/addPatient', async (req, res) => {
      try {
        const { fname, lname, email, phone, sex, birthdate, address } = req.body;
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
            SELECT * FROM patient WHERE email = ?
          `, [email]);

        if (emailResults.length > 0) {
          return res.status(400).send({ message: 'Email already exists' });
        }
        //Basic validation (optional, add more as needed)
        if (!fname || !lname || !phone) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        const sql = `INSERT INTO patient (fname, lname,Email, phone, sex, birthdate, address) VALUES ( ?, ?, ?, ?, ?, ?,?)`;
        await pool.query(sql, [fname, lname, email, phone, sex, birthdate, address]);

        res.status(201).json({ message: 'Patient added successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' }); // Informative error message
      }
    });
    //add treatment for patient
    app.post("/addTreatmentPaitent", async function (req, res) {
      try {
        const { doctor_id, patient_id, treatment_id, tooth, date, note } = req.body;
        await pool.query(
          "INSERT INTO treatment_info (doctor_id, patient_id, treatment_id , tooth , date, note) VALUES (?,?, ?, ?, ?, ?)",
          [parseInt(doctor_id), parseInt(patient_id), parseInt(treatment_id), tooth, date, note]
        );
        res.send("successfully added treatment for patient")
      }
      catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' }); // Informative error message
      }
    })
    // paid cost treatment for patient
    app.post("/payPatint", async function (req, res) {
      try {
        const { doctor_id, patient_id, treatment_id } = req.body;
        await pool.query("update treatment_info set ispaid = 1 where patint_id=? and doctor_id=? and treatment_id=?",
           ([patient_id, doctor_id, treatment_id])
        )
        res.send("paid")
      }
      catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' }); // Informative error message
      }
    })
    //get treatment info for patient
    app.get("/treatmentInfo", function (req, res) {
      try {
        let treatmentInfo = pool.query(
          "select * from treatment_info,treatment where treatment.treatment_id=treatment_info.treatment_id AND patient_id = ?",
          [patient_id]
        );
        res.json({ treatmentInfo: treatmentInfo });
      }
      catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

  },
};

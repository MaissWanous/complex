const { add } = require("lodash");
const mysql = require("mysql2");
module.exports = {
  patient: function (app, dic) {
    // Create a connection pool for MySQL database
    const pool = mysql.createPool({
      host: "localhost",
      user: "root",
      password: "1234",
      database: "project",
    }).promise();

    let patientId;
    let doctorId;
    let appointmentDate;

    // Handle POST request for patient endpoint
    app.post("/patient", (req, res) => {
      patientId = req.body.Pid;
      res.send();
    });

    // Handle POST request for appointment endpoint
    app.post("/appointment", (req, res) => {
      doctorId = req.body.doctor_id;
      appointmentDate = req.body.date;
      res.send();
    });

    let patientsData;
    let patientInfo;
    let appointmentInfo;

    // Handle GET request for patient endpoint
    app.get("/patient", async (req, res) => {
      // Retrieve patient, doctor, and appointment data from the database
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
    });

    // Handle GET request for appointment endpoint
    app.get("/appointment", async (req, res) => {
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
    });

    function deleteAppointment(patientId, doctorId, appointmentDate, time) {
      const sql =
        "DELETE FROM appointment WHERE patient_id =? AND doctor_id =? AND date =? AND start_hour=?";
      return pool.query(sql, [patientId, doctorId, appointmentDate, time]);
    }

    app.delete(
      "/appointments/:patientId/:doctorId/:date/:time",
      function (req, res) {
        const patientId = req.body.patientId;
        const doctorId = req.body.doctorId;
        const appointmentDate = req.body.date;
        const time = req.body.time;

        deleteAppointment(
          patientId,
          doctorId,
          appointmentDate,
          time,
          (err, result) => {
            if (err) {
              console.error(err);
              res.status(500).send("error");
            } else {
              res.send("error");
            }
          }
        );
      }
    );
    app.post("/addAppointment", function (req, res) {
      const startHour = req.body.startHour;
      const doctor_id = req.body.doctor_id;
      const date = req.body.date;

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

      res.send();
    });
    app.post("/addPatient", function (req, res) {
      let patient_id = req.body.patient_id;
      let fname = req.body.fname;
      let lname = req.body.lname;
      let phone = req.body.phone;
      let sex = req.body.sex;
      let birthdate = req.body.birthdate;
      let address = req.body.address;
      const patient_info =
        "INSERT INTO patient (id,fname,lname,phone,sex,birthdate,address) VALUES (?,?,?,?,?,?,?)";
      pool.query(
        patient_info,
        [patient_id, fname, lname, phone, sex, birthdate, address],
        (error, results, fields) => {
          if (error) {
            console.error(error);
            return;
          }
          console.log(`Inserted ${results.affectedRows} row(s)`);
        }
      );
      res.send();
    });
    app.get("/treatmentInfo", function (req, res) {
      let treatmentInfo = pool.query(
        "select * from treatment_info,treatment where treatment.treatment_id=treatment_info.treatment_id AND patient_id = ?",
        [patient_id]
      );
      res.json({ treatmentInfo: treatmentInfo });
    });
  },
};

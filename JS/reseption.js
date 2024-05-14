const mysql = require("mysql2");
module.exports = {
  reseption: function (app, dic) {
    const pool = mysql
      .createPool({
        host: "localhost",
        user: "root",
        password: "1234",
        database: "project",
      })
      .promise();
    var data;
    var patient;
    app.get("/patientAppointment", (req, res) => {
        data = pool.query("SELECT patient.fname, patient.lname, doctor.fname, doctor.lname, patient.id, date, start_hour FROM patient, appointment, doctor WHERE patient.id = patient_id");
      patient = pool.query("select * from patient");
      console.log(data);
      console.log(patient);

      res.send({ data: data, patient: patient });
    });
    
    function deleteAppointmentByPatientDoctorDate(patientId, doctorId, appointmentDate) {
        const sql = 'DELETE FROM appointment WHERE patient_id =? AND doctor_id =? AND date =?';
        return pool.query(sql, [patientId, doctorId, appointmentDate]);
    }
      
      app.delete("/appointments/:patientId/:doctorId/:date", function(req, res) {
        const patientId = req.params.patientId;
        const doctorId = req.params.doctorId;
        const appointmentDate = req.params.date;
      
        deleteAppointmentByPatientDoctorDate(patientId, doctorId, appointmentDate, (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).send("error");
          } else {
            res.send("error");
          }
        });
      });
      
      
      
  },
};

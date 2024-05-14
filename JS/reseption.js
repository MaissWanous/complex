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
        var patient_id;
        app.post("/patient", (req, res) => {
            patient_id = req.body.Pid;
            res.send();
        })
        var data;
        var partient;
        var appointment;
        app.get("/patient", (req, res) => {
            data = pool.query("SELECT patient.fname, patient.lname, doctor.fname, doctor.lname, patient.id, date, start_hour FROM patient, appointment, doctor WHERE patient.id = patient_id");
            partient = pool.query("select * from patient where patient_id = ?", [patient_id])
            appointment = pool.query("select patient_id , date , start_hour fname,lname from appointment, doctor where doctor_id=id and patient_id =?", [patient_id])
            console.log(data);
            console.log(patient);

            res.send({ data: data, patient: patient, appointment: appointment });
        });

        function deleteAppointment(patientId, doctorId, appointmentDate, time) {
            const sql = 'DELETE FROM appointment WHERE patient_id =? AND doctor_id =? AND date =? AND start_hour=?';
            return pool.query(sql, [patientId, doctorId, appointmentDate, time]);
        }

        app.delete("/appointments/:patientId/:doctorId/:date/:time", function (req, res) {
            const patientId = req.body.patientId;
            const doctorId = req.body.doctorId;
            const appointmentDate = req.body.date;
            const time = req.body.time;

            deleteAppointment(patientId, doctorId, appointmentDate, time, (err, result) => {
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

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
        var doctor_id;
        var date;
        app.post("/patient", (req, res) => {
            patient_id = req.body.Pid;
            res.send();
        })
        app.post("/appointment", (req, res) => {
            doctor_id = req.body.doctor_id;
            date = req.body.date;
        })
        var patients_data;
        var partient;
        var appointment;
        app.get("/patient", (req, res) => {
            patients_data = pool.query("SELECT patient.fname, patient.lname, doctor.fname, doctor.lname, patient.id, date, start_hour FROM patient, appointment, doctor WHERE patient.id = patient_id");
            partient = pool.query("select * from patient where patient_id = ?", [patient_id])
            appointment = pool.query("select patient_id , date , start_hour fname,lname from appointment, doctor where doctor_id=id and patient_id =?", [patient_id])


            res.send({ patients_data: patients_data, patient: patient, appointment: appointment });
        });
        app.get("/appointment", (req, res) => {
            var busy_hours = pool.query("select start_houre, end_houre from appointment where dotor_id=? date=?", [doctor_id, date]);
            var all_hours = [];
            for (var hour = 8; hour <= 21; hour++) {
                all_hours.push(hour + ':00');
                all_hours.push(hour + ':30');
            }
            var available_hours = all_hours.filter(hour => !busy_hours.some(busy_hour => busy_hour.start_hour <= hour && busy_hour.end_hour > hour));
            res.json({ available_hours: available_hours })
        })

        function deleteAppointment(patientId, doctorId, appointmentDate, time) {
            const sql = 'DELETE FROM appointment WHERE patient_id =? AND doctor_id =? AND date =? AND start_hour=?';
            return pool.query(sql, [patientId, doctorId, appointmentDate, time]);
        }

        app.delete("/appointments/:patientId/:doctorId/:date/:time", function (req, res) {
            const patientId = req.parms.patientId;
            const doctorId = req.parms.doctorId;
            const appointmentDate = req.parms.date;
            const time = req.parms.time;

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

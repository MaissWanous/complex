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
        app.get("/patientAppointment", (req, res) => {
            data = pool.query("select patient.fname patient.lname doctor.fname doctor.lname patient.id date start_hour  from patient appointment doctor where patient.id=patient_id ")
            res.json({ data: data })
        })

    }
}
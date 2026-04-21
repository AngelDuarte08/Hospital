const express = require('express');
const router = express.Router();

const patientController = require('../controllers/patient.controller')

router.post('/register_appointment', patientController.registerAppointment);
router.get('/get_Specialties', patientController.getSpecialties);

module.exports = router;
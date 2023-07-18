const express = require('express');

const { addJob, getAllJobs, getAllUserJobs, getJobDetail, updateJob, deleteJob } = require('../controllers/jobController');

const Middleware = require('../middleware/auth');

const router = express.Router();

router.post('/addJob', Middleware.authenticate, addJob);

router.get('/allJobs', getAllJobs);
router.get('/allUserJobs', Middleware.authenticate, getAllUserJobs);
router.get('/job/:id', Middleware.authenticate, getJobDetail);

router.put('/updateJob/:id', Middleware.authenticate, updateJob);

router.delete('/deleteJob/:id', Middleware.authenticate, deleteJob);

module.exports = { routes: router };
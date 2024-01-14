const express = require('express');

const { addJob, postJob, displayAllUsersJobs, displayUserJobs, displayJobDetail, updateUserJob, deleteUserJob,
    getAllJobs, getAllUserJobs, getJobDetail, updateJob, deleteJob } = require('../controllers/jobController');

const Middleware = require('../middleware/auth');

const router = express.Router();

router.post('/addJob', Middleware.authenticate, addJob);
router.post('/postJob', Middleware.authenticate, postJob);

router.get('/displayAllUsersJobs', Middleware.authenticate, displayAllUsersJobs);
router.get('/displayUserJobs', Middleware.authenticate, displayUserJobs);
router.get('/displayJobDetail/:id', Middleware.authenticate, displayJobDetail);
router.get('/allJobs', getAllJobs);
router.get('/allUserJobs', Middleware.authenticate, getAllUserJobs);
router.get('/job/:id', Middleware.authenticate, getJobDetail);

router.put('/updateUserJob/:id', Middleware.authenticate, updateUserJob);
router.put('/updateJob/:id', Middleware.authenticate, updateJob);

router.delete('/deleteUserJob/:id', Middleware.authenticate, deleteUserJob);
router.delete('/deleteJob/:id', Middleware.authenticate, deleteJob);

module.exports = { routes: router };
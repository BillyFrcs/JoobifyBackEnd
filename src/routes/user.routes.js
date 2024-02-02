const express = require('express');

const { getAllUsersAccountProfile, getUserAccountProfile, getUserAccountProfileByID, updateUserAccountProfile, updateUserAccountProfileByID,
    editUserProfile, editUserInformation, contactForm } = require('../controllers/userController');

const Middleware = require('../middleware/auth');

const router = express.Router();

router.get('/allUsersProfile', getAllUsersAccountProfile);
router.get('/userProfile', Middleware.authenticate, getUserAccountProfile);
router.get('/userProfile/:id', Middleware.authenticate, getUserAccountProfileByID);

router.put('/updateUserAccountProfile', Middleware.authenticate, updateUserAccountProfile);
router.put('/updateUserAccountProfile/:id', Middleware.authenticate, updateUserAccountProfileByID);
router.put('/editUserProfile', Middleware.authenticate, editUserProfile);
router.put('/editUserInformation', Middleware.authenticate, editUserInformation);

router.post('/contact', contactForm);

module.exports = { routes: router };
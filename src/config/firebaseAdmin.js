const firebaseAdmin = require('firebase-admin');

const serviceAccount = require('../../serviceAccountKey.json');

require('dotenv').config();

// Initialize Firebase
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

firebaseAdmin.firestore().settings({ ignoreUndefinedProperties: true });

module.exports = firebaseAdmin;
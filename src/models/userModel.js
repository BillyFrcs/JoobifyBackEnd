const firebaseApp = require('../config/firebaseApp');

const getAllUsersAccountProfile = async (req, res, collection) => {
    const response = [];

    const snapshot = await collection.count().get();

    await collection.get().then((data) => {
        const { docs } = data;

        docs.map((doc) => {
            const selectedData = {
                id: doc.data().id,
                name: doc.data().name,
                email: doc.data().email,
                headline: doc.data().headline,
                location: doc.data().location,
                userProfileImage: doc.data().userProfileImage,
                about: doc.data().about,
                createdAt: doc.data().createdAt,
                updatedAt: doc.data().updatedAt
            };

            response.push(selectedData);
        });

        // Check if the response is empty or not
        if (response.length === 0) {
            return res.status(404).send({
                message: 'No Users Profile Found',
                status: 404
            });
        } else {
            return res.status(200).send({
                message: 'Display All Users Profile',
                status: 200,
                total: snapshot.data().count,
                data: response
            });
        }
    });
};

// Get the current user's account profile by login with email and password
const displayUserAccountProfile = async (req, res, collection) => {
    // const user = firebase.auth().currentUser;
    
    const user = req.user.uid;

    // console.log(req.user.uid);

    if (user) {
        await collection.doc(user).get()
            .then((result) => {
                if (!result.exists) {
                    res.status(404).send({
                        message: 'User Profile is Empty',
                        status: 404
                    });
                } else {
                    res.status(200).send({
                        message: 'Display User Profile',
                        status: 200,
                        data: result.data()
                    });
                }
            });
    } else {
        res.status(403).send({
            message: 'User is Not Sign In',
            status: 403
        });
    }
};

// Get the user's account profile by id
const getUserAccountProfileByID = async (req, res, collection) => {
    const user = req.user.uid;
    const userID = req.params.id;

    // const user = firebaseApp.auth().currentUser;

    const profile = await collection.doc(userID).get();

    if (user && userID) {
        if (!profile.exists) {
            res.status(404).send({
                message: 'User is Not Found',
                status: 404
            });
        } else {
            res.status(200).send({
                message: 'Display User Profile',
                status: 200,
                data: profile.data()
            });
        }
    } else {
        res.status(403).send({
            message: 'User is Not Sign In',
            status: 403
        });
    }
};

module.exports = { getAllUsersAccountProfile, displayUserAccountProfile, getUserAccountProfileByID };
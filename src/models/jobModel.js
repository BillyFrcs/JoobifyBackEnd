const firebaseApp = require('../config/firebaseApp');

const getAllJobs = async (req, res, collection) => {
    const snapshot = await collection.count().get();

    // console.log(snapshot.data().count);

    await collection.get().then((value) => {
        const jobs = value.docs.map((document) => document.data());

        // Check if the jobs is empty
        if (jobs.length !== 0) {
            res.status(200).send({
                message: 'All Jobs Listing',
                status: 200,
                total: snapshot.data().count,
                data: jobs
            });
        } else {
            res.status(404).send({
                message: 'No Jobs Found',
                status: 404
            });
        }
    });
};

const getAllUserJobs = async (req, res, collection) => {
    const user = firebaseApp.auth().currentUser;
    const snapshot = await collection.count().get();

    if (user && req.user.uid) {
        await collection.get().then((value) => {
            const jobs = value.docs.map((document) => document.data());

            // Check if the jobs is empty
            if (jobs.length !== 0) {
                res.status(200).send({
                    message: 'All User Jobs',
                    status: 200,
                    total: snapshot.data().count,
                    data: jobs
                });
            } else {
                res.status(404).send({
                    message: 'No Jobs Found',
                    status: 404
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

const getJobDetail = async (req, res, collection) => {
    const user = firebaseApp.auth().currentUser;

    if (user && req.user.uid) {
        const jobID = req.params.id;
        const job = await collection.doc(jobID).get();

        if (!job.exists) {
            res.status(404).send({
                message: 'Cannot Found Job Detail',
                status: 404
            });
        } else {
            res.status(200).send({
                message: 'Job Detail',
                status: 200,
                data: job.data()
            });
        }

        /* Using list
        await collection.where('id', '==', req.params.id).get().then((value) => {
            const job = value.docs.map((document) => document.data());
    
            res.status(200).send({
                message: 'Display Job Detail',
                data: job
            });
        });
        */
    } else {
        res.status(403).send({
            message: 'User is Not Sign In',
            status: 403
        });
    }
};

module.exports = { getAllJobs, getAllUserJobs, getJobDetail };
const firebaseApp = require('../config/firebaseApp');

const getAllJobs = async (req, res, collection) => {
    try {
        const page = parseInt(req.query.page, 10) || 1; // Current page number
        const limit = parseInt(req.query.limit, 10) || 10; // Number of items per page
        const offset = (page - 1) * limit;

        const snapshot = await collection.count().get();

        // Query Firestore
        const querySnapshot = await collection
            .orderBy('createdAt') // Order by a field, adjust as per your requirement
            .offset(offset) // Start from the specified offset
            .limit(limit) // Limit the number of documents returned
            .get();

        const items = [];

        querySnapshot.forEach((doc) => {
            items.push(doc.data());
        });

        // Construct response object
        const response = {
            page,
            limit,
            totalItems: items.length, // You may need to get the total count in a separate query
            data: items
        };

        // res.json(response);

        res.status(200).send({
            message: 'All Jobs Listing',
            status: 200,
            page: response.page,
            limit: response.limit,
            totalItem: items.length,
            total: snapshot.data().count,
            data: response.data
        });
    } catch (error) {
        res.status(500).send({
            message: 'Internal Server Error',
            status: 500
        });
    }

    /*
    try {
        const page = parseInt(req.query.page, 10) || 1; // Current page number
        const offset = (page - 1);

        // Query Firestore
        const querySnapshot = await collection
            .orderBy('createdAt') // Order by a field, adjust as per your requirement
            .offset(offset) // Start from the specified offset
            .get();

        const items = [];

        querySnapshot.forEach((doc) => {
            items.push(doc.data());
        });

        // Construct response object
        const response = {
            page,
            totalItems: items.length, // You may need to get the total count in a separate query
            data: items
        };

        // res.json(response);

        res.status(200).send({
            message: 'All Jobs Listing',
            status: 200,
            page: response.page,
            limit: response.limit,
            totalItem: response.totalItems,
            total: snapshot.data().count,
            data: response.data
        });
    } catch (error) {
        res.status(500).send({
            message: 'Internal Server Error',
            status: 500
        });
    }
    */

    /* Default implementation
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
    */
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
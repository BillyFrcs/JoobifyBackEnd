const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');

const formidable = require('formidable-serverless');

const firebaseApp = require('../config/firebaseApp');
const firebaseAdmin = require('../config/firebaseAdmin');
const JobModel = require('../models/jobModel');

require('dotenv').config();

const JobsCollection = firebaseAdmin.firestore().collection(process.env.JOBS_COLLECTION);
const UsersCollection = firebaseAdmin.firestore().collection(process.env.USERS_COLLECTION);

const CloudStorage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: process.env.SERVICE_ACCOUNT_KEY_FILENAME
});

const postJob = async (req, res) => {
    try {
        const user = firebaseApp.auth().currentUser;

        if (user && req.user.uid) {
            const form = new formidable.IncomingForm({ multiples: true });

            // Default implementation
            form.parse(req, async (error, fields, files) => {
                // Create validation of the fields and files
                if (!fields.title || !fields.companyName || !fields.location || !fields.email || !fields.jobType || !fields.requiredSkills || !fields.jobDescription || !files.companyProfileImage) {
                    return res.status(400).json({
                        message: 'Please Fill All Required Input Fields',
                        status: 400
                    });
                }

                const id = uuidv4();

                const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME;

                const storagePublicURL = `https://storage.googleapis.com/${bucketName}.appspot.com/`;

                // const storagePublicURL = `https://firebasestorage.googleapis.com/v0/b/${bucketName}.appspot.com/o/`;

                // The variable should be match with the name of the key field
                const companyProfileImage = files.companyProfileImage;

                // URL of the uploaded image
                let imageURL;

                const userID = user.uid || req.user.uid;

                const jobID = JobsCollection.doc().id;

                if (error) {
                    return res.status(400).json({
                        message: 'There Was an Error Parsing The Files',
                        status: 400,
                        error: error.message
                    });
                }

                const bucket = CloudStorage.bucket(`gs://${bucketName}.appspot.com`);

                if (companyProfileImage.size === 0) {
                    res.status(404).send({
                        message: 'Image is Not Found',
                        status: 404
                    });
                } else {
                    const imageResponse = await bucket.upload(companyProfileImage.path, {
                        destination: `${process.env.JOBS_COLLECTION}/${userID}/${jobID}/${companyProfileImage.name}`,
                        resumable: true,
                        metadata: {
                            metadata: {
                                firebaseStorageDownloadTokens: id
                            }
                        }
                    });

                    // Profile image url
                    // imageURL = `${storagePublicURL + encodeURIComponent(imageResponse[0].name)}?alt=media&token=${id}`;

                    imageURL = storagePublicURL + imageResponse[0].name;
                }

                const date = new Date();

                const getDateAndTime = date.toLocaleDateString() + ' | ' + date.toLocaleTimeString();

                const currentDate = `${date.getDate()} ${date.toLocaleString('id', { month: 'long' })} ${date.getFullYear()}`;

                // Object to send to the database
                const jobData = {
                    id: jobID,
                    title: fields.title,
                    companyName: fields.companyName,
                    location: fields.location,
                    email: fields.email,
                    jobType: fields.jobType,
                    requiredSkills: fields.requiredSkills,
                    jobDescription: fields.jobDescription,
                    companyProfileImage: companyProfileImage.size === 0 ? '' : imageURL,
                    createdAt: getDateAndTime,
                    postedOn: currentDate
                };

                // Added to the firestore collection
                await UsersCollection.doc(userID).collection(process.env.JOBS_COLLECTION).doc(jobID).set(jobData, { merge: true });

                // Add with another random id to the firestore collection
                // await JobsCollection.doc(jobID).collection(JobsCollection.doc().id).add(jobData, { merge: true });

                // Send to the firestore collection
                await JobsCollection.doc(jobID).set(jobData, { merge: true });

                res.status(201).send({
                    message: 'Successfully Posted Job',
                    status: 201,
                    data: jobData
                });
            });
        } else {
            res.status(403).send({
                message: 'User is Not Sign In',
                status: 403
            });
        }
    } catch (error) {
        res.status(400).send({
            message: 'Something Went Wrong to Posted Job',
            status: 400,
            error: error.message
        });
    }
};

const displayAllUsersJobs = async (req, res) => {
    try {
        const user = firebaseApp.auth().currentUser;

        const snapshot = await JobsCollection.count().get();

        if (user && req.user.uid) {
            await JobsCollection.get().then((value) => {
                const jobs = value.docs.map((document) => document.data());

                // Check if the jobs is empty
                if (jobs.length !== 0) {
                    res.status(200).send({
                        message: 'All Users Jobs',
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
    } catch (error) {
        res.status(400).send({
            message: 'Something Went Wrong to Display All Users Jobs',
            status: 400,
            error: error.message
        });
    }
};

const displayUserJobs = async (req, res) => {
    try {
        const user = firebaseApp.auth().currentUser;
        const userID = user.uid || req.user.uid;

        const snapshot = await UsersCollection.doc(userID).collection(process.env.JOBS_COLLECTION).count().get();

        if (user && req.user.uid) {
            await UsersCollection.doc(userID).collection(process.env.JOBS_COLLECTION).get().then((value) => {
                const jobs = value.docs.map((document) => document.data());

                // Check if the jobs is empty
                if (jobs.length !== 0) {
                    res.status(200).send({
                        message: 'All User Jobs ',
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
    } catch (error) {
        res.status(400).send({
            message: 'Something Went Wrong to Display User Jobs',
            status: 400,
            error: error.message
        });
    }
};

const displayJobDetail = async (req, res) => {
    try {
        const user = firebaseApp.auth().currentUser;
        const userID = user.uid || req.user.uid;

        if (user && req.user.uid) {
            const jobID = req.params.id;
            const job = await UsersCollection.doc(userID).collection(process.env.JOBS_COLLECTION).doc(jobID).get();

            // const job = await UsersCollection.doc(jobID).get();

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
    } catch (error) {
        res.status(400).send({
            message: 'Something Went Wrong to Display Job Detail',
            status: 400,
            error: error.message
        });
    }
};

const updateUserJob = async (req, res) => {
    try {
        const user = firebaseApp.auth().currentUser;

        if (user && req.user.uid) {
            const userID = user.uid || req.user.uid;

            const jobID = req.params.id;
            const job = await UsersCollection.doc(userID).collection(process.env.JOBS_COLLECTION).doc(jobID).get();

            // const job = await JobsCollection.doc(jobID).get();

            const form = new formidable.IncomingForm({ multiples: true });

            if (!job.exists) {
                res.status(404).send({
                    message: 'Job is Not Found',
                    status: 404
                });
            } else {
                // Default implementation
                form.parse(req, async (error, fields, files) => {
                    // Create validation of the fields and files
                    if (!fields.title || !fields.companyName || !fields.location || !fields.email || !fields.jobType || !fields.requiredSkills || !fields.jobDescription || !files.companyProfileImage) {
                        return res.status(400).json({
                            message: 'Please fill all the required input fields',
                            status: 400
                        });
                    }

                    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME;

                    const storagePublicURL = `https://storage.googleapis.com/${bucketName}.appspot.com/`;

                    // const storagePublicURL = `https://firebasestorage.googleapis.com/v0/b/${bucketName}.appspot.com/o/`;

                    const companyProfileImage = files.companyProfileImage;

                    // URL of the uploaded image
                    let imageURL;

                    if (error) {
                        return res.status(400).json({
                            message: 'There was an error parsing the files',
                            status: 400,
                            error: error.message
                        });
                    }

                    const bucket = CloudStorage.bucket(`gs://${bucketName}.appspot.com`);

                    if (companyProfileImage.size === 0) {
                        res.status(404).send({
                            message: 'No Image Found',
                            status: 404
                        });
                    } else {
                        const imageResponse = await bucket.upload(companyProfileImage.path, {
                            destination: `${process.env.JOBS_COLLECTION}/${userID}/${jobID}/${companyProfileImage.name}`,
                            resumable: true,
                            metadata: {
                                metadata: {
                                    firebaseStorageDownloadTokens: jobID
                                }
                            }
                        });

                        // Profile image url
                        // imageURL = `${storagePublicURL + encodeURIComponent(imageResponse[0].name)}?alt=media&token=${uuid}`;

                        imageURL = storagePublicURL + imageResponse[0].name;
                    }

                    const date = new Date();

                    const getDateAndTime = date.toLocaleDateString() + ' | ' + date.toLocaleTimeString();

                    const currentDate = `${date.getDate()} ${date.toLocaleString('id', { month: 'long' })} ${date.getFullYear()}`;

                    // Object to send to the database
                    const jobData = {
                        id: jobID,
                        title: fields.title,
                        companyName: fields.companyName,
                        location: fields.location,
                        email: fields.email,
                        jobType: fields.jobType,
                        requiredSkills: fields.requiredSkills,
                        jobDescription: fields.jobDescription,
                        companyProfileImage: companyProfileImage.size === 0 ? '' : imageURL,
                        updatedAt: getDateAndTime,
                        updatedOn: currentDate
                    };

                    // Update to the firestore collection
                    await UsersCollection.doc(userID).collection(process.env.JOBS_COLLECTION).doc(jobID).update(jobData, { merge: true });

                    // Update to the firestore collection
                    await JobsCollection.doc(jobID).set(jobData, { merge: true });

                    res.status(202).send({
                        message: 'Update Job Successfully',
                        status: 202,
                        data: jobData
                    });

                    /*
                    await JobsCollection.doc(jobID).update(jobData, { merge: true }).then(() => {
                        res.status(202).send({
                            message: 'Update Job Successfully',
                            status: 202,
                            data: jobData
                        });
                    });
                    */
                });
            }
        } else {
            res.status(403).send({
                message: 'User is Not Sign In',
                status: 403
            });
        }
    } catch (error) {
        res.status(400).send({
            message: 'Something went wrong to Update Job',
            status: 400,
            error: error.message
        });
    }
};

const deleteJobImageStorage = async (userID, jobID) => {
    try {
        const bucket = CloudStorage.bucket(`${process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME}.appspot.com`);

        // Delete the folder itself
        bucket.deleteFiles({
            prefix: `${process.env.JOBS_COLLECTION}/${userID}/${jobID}`
        });

        /*
        // Delete files in the folder
        bucket.deleteFiles({
          prefix: filePath
        });
        */

        // console.log('Folder deleted successfully.');
    } catch (error) {
        throw new Error('Error Deleting Folder: ', error);
    }
};

const deleteUserJob = async (req, res) => {
    try {
        const user = firebaseApp.auth().currentUser;
        const userID = user.uid || req.user.uid;

        if (user || req.user.uid) {
            const jobID = req.params.id;
            const job = await UsersCollection.doc(userID).collection(process.env.JOBS_COLLECTION).doc(jobID).get();

            if (!job.exists) {
                res.status(404).send({
                    message: 'Job is Not Found',
                    status: 404
                });
            } else {
                // Delete the job data from user sub collection
                await UsersCollection.doc(userID).collection(process.env.JOBS_COLLECTION).doc(jobID).delete();

                // Delete the job data from the root collection
                await JobsCollection.doc(req.params.id).delete();

                deleteJobImageStorage(userID, jobID);

                res.status(202).send({
                    message: 'Delete Job Successfully',
                    status: 202
                });
            }
        } else {
            res.status(403).send({
                message: 'User is Not Sign In',
                status: 403
            });
        }
    } catch (error) {
        res.status(400).send({
            message: 'Something Went Wrong to Delete Job',
            status: 400,
            error: error.message
        });
    }
};

const searchJob = async (req, res) => {
    try {
        const search = req.query.job;

        const snapshot = await JobsCollection.where('title', '==', search).get();

        const results = [];

        snapshot.forEach((doc) => {
            results.push(doc.data());
        });

        if (results.length !== 0) {
            res.status(200).send({
                message: 'Successfully found job',
                status: 200,
                total: snapshot.size,
                data: results
            });
        } else {
            res.status(404).send({
                message: 'No Job Found',
                status: 404
            });
        }
    } catch (error) {
        res.status(400).send({
            message: 'Something Went Wrong to Search Job',
            status: 400,
            error: error.message
        });
    }
};

const addJob = async (req, res) => {
    try {
        const user = firebaseApp.auth().currentUser;

        if (user && req.user.uid) {
            const form = new formidable.IncomingForm({ multiples: true });

            // Default implementation
            form.parse(req, async (error, fields, files) => {
                // Create validation of the fields and files
                if (!fields.title || !fields.companyName || !fields.location || !fields.email || !fields.jobType || !fields.requiredSkills || !fields.jobDescription || !files.companyProfileImage) {
                    return res.status(400).json({
                        message: 'Please Fill All Required Input Fields',
                        status: 400
                    });
                }

                const id = uuidv4();

                const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME;

                const storagePublicURL = `https://storage.googleapis.com/${bucketName}.appspot.com/`;

                // const storagePublicURL = `https://firebasestorage.googleapis.com/v0/b/${bucketName}.appspot.com/o/`;

                // The variable should be match with the name of the key field
                const companyProfileImage = files.companyProfileImage;

                // URL of the uploaded image
                let imageURL;

                const jobID = JobsCollection.doc().id;

                if (error) {
                    return res.status(400).json({
                        message: 'There Was an Error Parsing The Files',
                        status: 400,
                        error: error.message
                    });
                }

                const bucket = CloudStorage.bucket(`gs://${bucketName}.appspot.com`);

                if (companyProfileImage.size === 0) {
                    res.status(404).send({
                        message: 'No Image Found',
                        status: 404
                    });
                } else {
                    const imageResponse = await bucket.upload(companyProfileImage.path, {
                        destination: `${process.env.JOBS_COLLECTION}/${user.uid || req.user.uid}/${jobID}/${companyProfileImage.name}`,
                        resumable: true,
                        metadata: {
                            metadata: {
                                firebaseStorageDownloadTokens: id
                            }
                        }
                    });

                    // Profile image url
                    // imageURL = `${storagePublicURL + encodeURIComponent(imageResponse[0].name)}?alt=media&token=${id}`;

                    imageURL = storagePublicURL + imageResponse[0].name;
                }

                const date = new Date();

                const getDateAndTime = date.toLocaleDateString() + ' | ' + date.toLocaleTimeString();

                // Object to send to the database
                const jobData = {
                    id: jobID,
                    title: fields.title,
                    companyName: fields.companyName,
                    location: fields.location,
                    email: fields.email,
                    jobType: fields.jobType,
                    requiredSkills: fields.requiredSkills,
                    jobDescription: fields.jobDescription,
                    companyProfileImage: companyProfileImage.size === 0 ? '' : imageURL,
                    createdAt: getDateAndTime
                };

                // Added to the firestore collection
                await JobsCollection.doc(jobID).set(jobData, { merge: true }).then(() => {
                    res.status(201).send({
                        message: 'Successfully Added Job',
                        status: 201,
                        data: jobData
                    });
                });
            });
        } else {
            res.status(403).send({
                message: 'User is Not Sign In',
                status: 403
            });
        }
    } catch (error) {
        res.status(400).send({
            message: 'Something Went Wrong to Added Job',
            status: 400,
            error: error.message
        });
    }
};

const getAllJobs = async (req, res) => {
    try {
        JobModel.getAllJobs(req, res, JobsCollection);
    } catch (error) {
        res.status(400).send({
            message: 'Something Went Wrong to Display All Jobs Listing',
            status: 400,
            error: error.message
        });
    }
};

const getAllUserJobs = async (req, res) => {
    try {
        JobModel.getAllUserJobs(req, res, JobsCollection);
    } catch (error) {
        res.status(400).send({
            message: 'Something Went Wrong to Display All User Jobs',
            status: 400,
            error: error.message
        });
    }
};

const getJobDetail = async (req, res) => {
    try {
        JobModel.getJobDetail(req, res, JobsCollection);
    } catch (error) {
        res.status(400).send({
            message: 'Something Went Wrong to Display Job Detail',
            status: 400,
            error: error.message
        });
    }
};

const updateJob = async (req, res) => {
    try {
        const user = firebaseApp.auth().currentUser;

        if (user && req.user.uid) {
            const jobID = req.params.id;
            const job = await JobsCollection.doc(jobID).get();

            const form = new formidable.IncomingForm({ multiples: true });

            if (!job.exists) {
                res.status(404).send({
                    message: 'Job is Not Found',
                    status: 404
                });
            } else {
                // Default implementation
                form.parse(req, async (error, fields, files) => {
                    // Create validation of the fields and files
                    if (!fields.title || !fields.companyName || !fields.location || !fields.email || !fields.jobType || !fields.requiredSkills || !fields.jobDescription || !files.companyProfileImage) {
                        return res.status(400).json({
                            message: 'Please Fill All Required Input Fields',
                            status: 400
                        });
                    }

                    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME;

                    const storagePublicURL = `https://storage.googleapis.com/${bucketName}.appspot.com/`;

                    // const storagePublicURL = `https://firebasestorage.googleapis.com/v0/b/${bucketName}.appspot.com/o/`;

                    const companyProfileImage = files.companyProfileImage;

                    // URL of the uploaded image
                    let imageURL;

                    if (error) {
                        return res.status(400).json({
                            message: 'There Was an Error Parsing The Files',
                            status: 400,
                            error: error.message
                        });
                    }

                    const bucket = CloudStorage.bucket(`gs://${bucketName}.appspot.com`);

                    if (companyProfileImage.size === 0) {
                        res.status(404).send({
                            message: 'No Image Found',
                            status: 404
                        });
                    } else {
                        const imageResponse = await bucket.upload(companyProfileImage.path, {
                            destination: `${process.env.JOBS_COLLECTION}/${jobID}/${companyProfileImage.name}`,
                            resumable: true,
                            metadata: {
                                metadata: {
                                    firebaseStorageDownloadTokens: jobID
                                }
                            }
                        });

                        // Profile image url
                        // imageURL = `${storagePublicURL + encodeURIComponent(imageResponse[0].name)}?alt=media&token=${uuid}`;

                        imageURL = storagePublicURL + imageResponse[0].name;
                    }

                    const date = new Date();

                    const getDateAndTime = date.toLocaleDateString() + ' | ' + date.toLocaleTimeString();

                    // Object to send to the database
                    const jobData = {
                        title: fields.title,
                        companyName: fields.companyName,
                        location: fields.location,
                        email: fields.email,
                        jobType: fields.jobType,
                        requiredSkills: fields.requiredSkills,
                        jobDescription: fields.jobDescription,
                        companyProfileImage: companyProfileImage.size === 0 ? '' : imageURL,
                        updatedAt: getDateAndTime
                    };

                    // Update to the firestore collection
                    await JobsCollection.doc(jobID).update(jobData, { merge: true }).then(() => {
                        res.status(202).send({
                            message: 'Update Job Successfully',
                            status: 202,
                            data: jobData
                        });
                    });
                });
            }
        } else {
            res.status(403).send({
                message: 'User is Not Sign In',
                status: 403
            });
        }
    } catch (error) {
        res.status(400).send({
            message: 'Something went wrong to Update Job',
            status: 400,
            error: error.message
        });
    }
};

const deleteJobProfileStorage = async (uid) => {
    try {
        const bucket = CloudStorage.bucket(`${process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME}.appspot.com`);

        // Delete the folder itself
        bucket.deleteFiles({
            prefix: `${process.env.JOBS_COLLECTION}/${uid}`
        });

        /*
        // Delete files in the folder
        bucket.deleteFiles({
          prefix: filePath
        });
        */

        // console.log('Folder deleted successfully.');
    } catch (error) {
        throw new Error('Error Deleting Folder: ', error);
    }
};

// Delete job profile by id
const deleteJob = async (req, res) => {
    try {
        const user = firebaseApp.auth().currentUser;

        if (user || req.user.uid) {
            const jobID = req.params.id;
            const job = await JobsCollection.doc(jobID).get();

            if (!job.exists) {
                res.status(404).send({
                    message: 'Job is Not Found',
                    status: 404
                });
            } else {
                await JobsCollection.doc(req.params.id).delete();

                deleteJobProfileStorage(jobID);

                res.status(202).send({
                    message: 'Delete Job Successfully',
                    status: 202
                });
            }
        } else {
            res.status(403).send({
                message: 'User is Not Sign In',
                status: 403
            });
        }
    } catch (error) {
        res.status(400).send({
            message: 'Something Went Wrong to Delete Job',
            status: 400,
            error: error.message
        });
    }
};

module.exports = {
    addJob, postJob, displayAllUsersJobs, displayUserJobs, displayJobDetail, updateUserJob,
    deleteUserJob, searchJob, getAllJobs, getAllUserJobs, getJobDetail, updateJob, deleteJob
};
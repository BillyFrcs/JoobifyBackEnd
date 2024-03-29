const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const Job = require('./src/routes/job.routes');
const User = require('./src/routes/user.routes');
const Auth = require('./src/routes/auth.routes');
const HttpError = require('./src/helpers/httpError');

require('dotenv').config();

const app = express();

const port = process.env.PORT || 8080;
const hostname = process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0';

const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200
};

app.use(express.json());
app.use(express.static('./public/'));
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(helmet());

app.use('/jobs', Job.routes);
app.use('/auth', Auth.routes);
app.use('/users', User.routes);

app.use(HttpError.httpErrorRequest);
app.use(HttpError.httpErrorResponse);

app.listen(port, hostname, async (error) => {
  if (error) {
    console.log(`Error: ${error.message}`);

    return;
  }

  console.log(`Listening on ${hostname}:${port}`);
});
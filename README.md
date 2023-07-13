<h1 align="center">Joobify BackEnd<h1>

<h2>Setup & Installation</h2>

<h3>Node.js & NPM</h3>

- Install all of the dependencies: `npm install`
- Run in the Development server: `npm run dev`
- Start the project: `npm run start`
- Testing: `npm run test`

<h3>Docker</h3>

- Docker build: `docker build -t joobify-backend .`
- Docker run container: `docker run -it -p 8080:8080 --name=joobifybackend joobify-backend`
- Docker start: `docker start joobifybackend`
- Docker Stop: `docker stop joobifybackend`
- Docker remove: `docker rm joobifybackend`

<h3>Google Cloud Platform (GCP) Services</h3>

- Cloud Run update service: `gcloud run services update joobifybackend --port 8080`

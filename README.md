<h1 align="center">Joobify Back-End<h1>

<h2>Setup & Installation</h2>

<h3>Node.js & NPM</h3>

- Install all of the dependencies: `npm install`
- Run in the Development server: `npm run dev`
- Start the project: `npm run start`
- Testing: `npm run test`

<h3>Docker</h3>

- Docker build: `docker build -t joobify-api .`
- Docker run container: `docker run -it -p 8080:8080 --name=joobifyapi joobify-api`
- Docker start: `docker start joobifyapi`
- Docker Stop: `docker stop joobifyapi`
- Docker remove: `docker rm joobifyapi`

<h3>Google Cloud Platform (GCP) Services</h3>

- Cloud Run update service: `gcloud run services update joobifyapi --port 8080`

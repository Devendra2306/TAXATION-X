# Prepare for AWS Deployment

We need to get the repository "AWS-ready". This means containerizing the frontend, configuring the backend for production, and creating a unified orchestration method that can be easily deployed to an AWS service like EC2, ECS, or Elastic Beanstalk.

## Open Questions
> [!IMPORTANT]
> **Which AWS Service are you planning to use?**
> 1. **AWS EC2 (Simplest for MVP):** We just spin up an Ubuntu server, pull the repo, and run `docker-compose up -d`.
> 2. **AWS Elastic Beanstalk:** A managed service that takes our Docker containers and handles load balancing automatically.
> 3. **AWS Amplify (Frontend) + App Runner (Backend):** Best for serverless scale.
> 
> *I recommend EC2 for the MVP since it's the fastest and cheapest to get running.*

## Proposed Changes

### Infrastructure / DevOps
#### [MODIFY] [docker-compose.yml](file:///c:/jeee%20main/OFS%20TAXATION/docker-compose.yml)
- Remove the old Postgres/Redis configuration (since we moved to SQLite for MVP).
- Add the `backend` service (FastAPI on port 8000).
- Add the `frontend` service (Next.js on port 3000).
- Configure a Docker network so the frontend can communicate with the backend.

#### [NEW] [frontend/Dockerfile](file:///c:/jeee%20main/OFS%20TAXATION/frontend/Dockerfile)
- Create a multi-stage Dockerfile for Next.js to ensure the production image is as small and secure as possible.

#### [MODIFY] [frontend/next.config.ts](file:///c:/jeee%20main/OFS%20TAXATION/frontend/next.config.ts)
- Set `output: 'standalone'` so Next.js builds a standalone server that is optimized for Docker deployments.

### Environment Configuration
#### [NEW] [.env.production.example](file:///c:/jeee%20main/OFS%20TAXATION/.env.production.example)
- Create a template file for the production environment variables needed on AWS (Gemini API keys, Firebase config, Backend URLs).

## Verification Plan

### Local Docker Testing
- Run `docker-compose up --build` locally.
- Verify the frontend loads on `localhost:3000` via the Docker container.
- Verify the frontend successfully communicates with the backend container on `localhost:8000`.
- Push the Docker-ready code to the `stagging` branch.

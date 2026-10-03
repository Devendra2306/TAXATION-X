# ITR Filing Platform — Technical Architecture & Build Plan

## 1. Design Goals

- **Scalability**: handle a heavy seasonal traffic spike (most usage crams into a few weeks around the filing deadline)
- **Reliability**: this handles financial documents (Form 16, PAN, salary data) — parsing failures or data loss are unacceptable
- **Start simple, evolve deliberately**: don't over-engineer microservices for an MVP with a handful of users; build a modular monolith that can be split later without a rewrite

## 2. Recommended Stack

| Layer | Choice | Why |
|---|---|---|
| Backend framework | **FastAPI** (Python) | Async-native, fast to build, strong typing via Pydantic — good fit for a solo/small team shipping quickly, and Python has the best ecosystem for PDF parsing/OCR |
| Database | **PostgreSQL** (Managed via Render) | ACID guarantees matter for financial data. Render offers an excellent free/cheap tier for managed Postgres. |
| Async job queue | **Redis + Celery** (Managed via Render/Upstash) | Form 16 parsing shouldn't block the request-response cycle; queue it, process in background workers, notify user on completion. |
| Object storage | **AWS S3**, server-side encryption enabled | Documents at rest must be encrypted; S3 versioning also gives you accidental-deletion protection for free. Extremely cheap for MVP volumes. |
| Frontend | **React (Next.js)** on **Vercel** | Vercel provides zero-config deployments for Next.js, an edge CDN, and generous free tiers for MVPs. |
| Hosting | **Render (PaaS)** | The FastAPI backend, Celery workers, and databases are hosted on Render. This avoids the devops overhead of managing EC2 instances while remaining container-native. |
| Parsing | Rule-based/regex extraction for standard Form 16 formats, falling back to an OCR/AI-based extraction step (e.g. Textract or an LLM API) for non-standard layouts | Keeps cost low for the common case, only pays the more expensive per-document AI cost when needed |

This matches and refines the direction already scoped: modular monolith first, split into auth / parsing / tax_engine modules internally, moving to actual separate microservices only if real load numbers justify the added operational complexity.

## 3. Architecture Overview

```
[Next.js frontend]
        |
        v
[FastAPI app — modular monolith]
   ├── auth module (JWT, session mgmt)
   ├── documents module (upload → S3, metadata → Postgres)
   ├── parsing module (enqueues job → Celery worker)
   ├── tax_engine module (old vs new regime computation)
   └── export module (ITR-1 JSON generation)
        |
        v
[Redis queue] → [Celery workers] → parse Form 16 → write results to Postgres
        |
        v
[PostgreSQL] (users, documents metadata, computation results)
[S3] (encrypted document blobs)
```

Keep the modules as separate Python packages within one deployable app, with clear internal interfaces (no module reaching directly into another's database tables). This is what makes a future split into real microservices low-risk — you'd extract one module at a time behind an API boundary that already exists internally.

## 4. Scalability Plan

- **Stateless app servers**: no local session state, no local file storage — anything that needs to persist goes to Postgres or S3. This lets ECS Fargate scale the number of running tasks up/down freely under load with zero coordination needed.
- **Autoscale on the predictable spike**: filing-season traffic is seasonal and roughly predictable (deadline crunch in July–September). Set ECS autoscaling on CPU/request-count metrics, and consider pre-scaling manually a few days before known deadlines rather than relying purely on reactive autoscaling.
- **Separate the queue from the request path early**: Form 16 parsing is exactly the kind of variable-latency task that should never block an HTTP request. This is already in the plan — keep it that way even under time pressure to ship faster.
- **Database connection pooling** (e.g. PgBouncer) once you have more than a handful of concurrent app instances, since Postgres has a hard connection limit and Fargate tasks scaling up can exhaust it fast.
- **Read replicas** only become necessary once you have dashboards/reporting features reading heavily from the same DB as the write path — not needed for MVP.

## 5. Reliability Plan

- **Idempotent job processing**: Celery tasks should be safe to retry (e.g. if a worker crashes mid-parse). Use a job status field in Postgres (`pending` → `processing` → `done`/`failed`) rather than relying on the queue alone as the source of truth.
- **Retries with backoff** on parsing jobs (e.g. 3 attempts, exponential backoff) before surfacing a "needs manual review" state to the user — don't silently fail.
- **Document encryption at rest** (S3 SSE) and **in transit** (TLS everywhere) — non-negotiable given the data sensitivity.
- **Automated backups**: RDS automated daily snapshots with at least 7–14 day retention; S3 versioning enabled on the document bucket. Budget for this in running costs — it's not optional for financial data.
- **Structured logging + monitoring** (CloudWatch or equivalent) with alerts on: parsing failure rate, job queue depth, and error rate on the tax computation endpoint specifically — that's the module where a silent bug has real consequences for a user's filing.
- **Separate staging environment** for testing tax-computation changes before they hit production, especially important around Budget season when tax rules change and you're patching the computation logic under time pressure.

## 6. Build Sequence (maps to the milestone plan)

1. Auth + document upload + S3 storage wiring
2. Parsing engine (rule-based first) + Celery job pipeline + job status tracking
3. Tax computation engine (old vs new regime) with test cases covering standard salaried scenarios
4. Review/edit UI + ITR-1 JSON export
5. Monitoring, backup configuration, load testing against a simulated deadline-week spike, then handover

## 7. Cost-Optimization Notes for Scaling Later

- Fargate Spot can cut compute costs significantly for background worker tasks (Celery workers) that can tolerate occasional interruption — not for the main API tasks.
- Cache the tax slab/rule tables in Redis rather than hitting Postgres on every computation request — these change once a year, not per request.
- Compress and lifecycle old documents in S3 (e.g. move to S3 Infrequent Access after 90 days) since users rarely re-access last year's Form 16 after filing.

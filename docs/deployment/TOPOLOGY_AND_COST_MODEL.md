# PRODUCTION TOPOLOGY & MONTHLY CLOUD COST MODEL
**Platform:** Resumio Production Recruitment System  
**Document Version:** 1.0.0  
**Date:** October 16, 2026  

---

## 1. Concrete Architecture Topology

```
[Users / Clients]
       |
       v (HTTPS / Anycast CDN)
+-------------------------------------------------------------------------------+
|                       Edge Layer: Cloudflare Pages / CDN                      |
|                       Hosts Static React 19 Frontend Bundle                   |
+-------------------------------------------------------------------------------+
       |
       | (API Traffic: /api/*)
       v
+-------------------------------------------------------------------------------+
|                   Application Load Balancer (ALB) / Ingress                   |
|                        TLS Termination, DDoS Shielding                        |
+-------------------------------------------------------------------------------+
       |                                               |
       v (Internal VPC)                                v (Internal VPC)
+-------------------------------+             +---------------------------------+
| Resumio API Service           |             | Resumio ML Service              |
| 2x Container Instances        |             | 1x Dedicated Heavy Node         |
| 1 vCPU / 2 GB RAM each        |             | 2 vCPU / 4 GB RAM (min)         |
| Express / TypeScript          |             | Python / PyTorch / FastEmbed    |
+---------------+---------------+             +----------------+----------------+
                |                                              |
                +----------------------+-----------------------+
                                       |
+--------------------------------------v----------------------------------------+
|                               Managed Data Tier                               |
|  - PostgreSQL 16 + pgvector (AWS RDS Aurora Serverless v2 / Supabase)         |
|  - Redis 7 (AWS ElastiCache Serverless / Upstash) for Token Bucket Limiter    |
|  - S3 / Cloudflare R2 Object Storage with Server-Side Encryption (SSE-S3)     |
+-------------------------------------------------------------------------------+
```

---

## 2. Infrastructure Sizing & Monthly Cost Drivers

> [!IMPORTANT]
> **Cost Approval Rule:** Resumio does NOT automatically provision paid cloud resources. The lead engineer must present the cost breakdown and obtain explicit user confirmation before deploying paid instances.

| Component | Recommended Cloud Instance | Specifications | Estimated Monthly Cost | Primary Cost Drivers |
|---|---|---|---|---|
| **Frontend Web App** | Cloudflare Pages / Vercel | Global Anycast CDN, unlimited requests | **$0.00 – $5.00** | Bandwidth over 100GB |
| **API Backend** | AWS ECS Fargate / Render | 2 tasks $\times$ (1 vCPU, 2GB RAM) | **$32.00 – $44.00** | vCPU hours, memory hours |
| **ML Inference Service** | AWS ECS Fargate / Render Pro | 1 node $\times$ (2 vCPU, 4GB RAM) | **$48.00 – $65.00** | PyTorch RAM requirements ($>3\text{GB}$) |
| **Managed PostgreSQL** | AWS RDS Aurora / Supabase Pro | db.t4g.medium (2 vCPU, 4GB RAM) | **$38.00 – $55.00** | Storage IOPS, pgvector HNSW index RAM |
| **Redis Cache** | AWS ElastiCache / Upstash | Serverless or cache.t4g.micro | **$12.00 – $22.00** | Network transfer, active keys |
| **S3 Resume Storage** | AWS S3 / Cloudflare R2 | Standard + Intelligent Tiering | **$5.00 – $15.00** | Gigabytes stored, egress |
| **Total Estimated Run-Rate** | | | **~$135.00 – $206.00 / month** | |

---

## 3. Cost-Optimization Safeguards
1. **Local Development Stays $0.00:** Local dev operates 100% on SQLite, local filesystem storage, and in-memory rate limiting with zero cloud bills.
2. **Gemini Cost Protection:** Organization-level token budgets and prompt caching prevent runaway LLM costs.
3. **Deterministic Fallback:** If cloud budgets are constrained, disabling external AI runs 100% on the internal ML node at fixed compute cost.

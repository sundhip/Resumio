# ZERO-DOWNTIME MIGRATION & BLUE/GREEN DEPLOYMENT PROCEDURE
**System:** Resumio Production Recruitment Platform  
**Document Version:** 1.0.0  
**Date:** October 16, 2026  

---

## 1. Overview
This procedure guarantees zero downtime (0% service disruption) during production schema migrations and service upgrades. It employs a **Blue/Green deployment pattern** combined with **backward-compatible expand/contract database migrations**.

```
                           +------------------------+
                           |  Cloudflare / Load Balancer
                           +-----------+------------+
                                       |
                   +-------------------+-------------------+
                   | (Active Traffic: 100%)                | (Idle: 0%)
         +---------v----------+                  +---------v----------+
         |     BLUE PODS      |                  |     GREEN PODS     |
         |    Current v1.0    |                  |     Target v1.1    |
         +---------+----------+                  +---------+----------+
                   |                                       |
                   +-------------------+-------------------+
                                       |
                           +-----------v------------+
                           |   PostgreSQL + pgvector |
                           |  (Dual-Compatible DB)  |
                           +------------------------+
```

---

## 2. Four-Phase Expand/Contract Migration Methodology

### Phase 1: Expand (Backward-Compatible Schema Change)
1. Run pre-deployment migration script adding new columns or tables as nullable or with defaults.
   - Example: Adding `phone_encrypted` while retaining `phone`.
2. Old application code (Blue) continues running without errors because old columns remain intact.

### Phase 2: Parallel Write & Background Backfill
1. Deploy Green application pods in staging mode.
2. Code writes simultaneously to both legacy columns and new columns.
3. Run asynchronous background backfill workers for historical data:
   ```bash
   npx tsx server/scripts/migrate-sqlite-to-postgres.ts --live
   ```
4. Verify checksum parity using `dbAdapter.computeTableChecksum()`.

### Phase 3: Traffic Switch (Blue -> Green Cutover)
1. Health checks on Green pods verify readiness (`GET /api/health`, `GET /api/ready`).
2. Perform weighted traffic shift on the reverse proxy:
   - $10\%$ traffic to Green $\to$ monitor error rates for 5 minutes.
   - $50\%$ traffic to Green $\to$ monitor p95 latency for 5 minutes.
   - $100\%$ traffic to Green.
3. Blue pods remain on standby for 30 minutes in case one-click rollback is required.

### Phase 4: Contract (Deprecation & Cleanup)
1. After 48 hours of stable production operation:
2. Run final migration to drop deprecated columns or tables cleanly.

---

## 3. Instant Rollback Procedure
If error rates exceed $0.5\%$ or p95 latency spikes $> 300\text{ms}$ during cutover:
1. Reverse Load Balancer router back to Blue pods (instantaneous $< 2\text{s}$ DNS/proxy change).
2. Execute rollback SQL script:
   ```bash
   psql -f docs/operations/MIGRATION_ROLLBACK_PLAN.sql
   ```
3. Post-mortem investigation initiated per `docs/observability/MODEL_MONITORING_RUNBOOK.md`.

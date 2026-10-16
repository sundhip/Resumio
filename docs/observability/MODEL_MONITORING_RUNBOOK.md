# RESUMIO MODEL MONITORING & INCIDENT RUNBOOK
**Service:** AI Scoring Engine & Model Operations (ModelOps)  
**Document Version:** 1.0.0  
**Date:** October 16, 2026  

---

## 1. Monitoring Metrics & Service Level Objectives (SLOs)

| Metric | Target / SLO | Warning Threshold | Critical Threshold | Runbook Section |
|---|---|---|---|---|
| **Inference Latency (p95)** | $\le 250\text{ms}$ | $> 300\text{ms}$ | $> 500\text{ms}$ | Section 2: Latency Spikes |
| **Degraded-Mode Fallback Rate** | $\le 2.0\%$ | $> 5.0\%$ | $> 10.0\%$ | Section 3: Fallback Investigation |
| **Score Distribution Drift (PSI)** | $\le 0.10$ | $0.15 \le \text{PSI} < 0.25$ | $\ge 0.25$ | Section 4: Distribution Drift |
| **Resume Parse Success Rate** | $\ge 98.5\%$ | $< 97.0\%$ | $< 95.0\%$ | Section 5: Parser Failures |

---

## 2. Runbook: Latency Spikes ($p95 > 300\text{ms}$)

### Symptoms
* Alert: `ResumioModelInferenceLatencyHigh` fires in Grafana / PagerDuty.
* Recruiter leaderboard or candidate match preview takes $> 500\text{ms}$ to load.

### Diagnostics
1. Check CPU and memory utilization on the API and ML containers:
   ```bash
   docker stats resumio-api resumio-ml
   ```
2. Verify Redis and PostgreSQL connection pool health:
   - Ensure `dbAdapter.getPoolConfig()` has available connections.
   - Inspect PostgreSQL active queries:
     ```sql
     SELECT pid, age(clock_timestamp(), query_start), query FROM pg_stat_activity WHERE state != 'idle' ORDER BY 2 DESC;
     ```
3. Check if external Gemini API is timing out before circuit breaker trips.

### Remediation
* If Gemini is slow or rate-limited: Trip circuit breaker manually or set `resilienceService.tripCircuitBreaker('gemini')` to force deterministic fallback ($38\text{ms}$ latency).
* Scale API container replicas from 2 to 4.

---

## 3. Runbook: Degraded-Mode Fallback Spike ($> 5.0\%$)

### Symptoms
* Alert: `ResumioDegradedModeRateElevated` fires.
* Matching engine running predominantly in offline deterministic mode.

### Diagnostics
1. Check Gemini API status page (https://status.cloud.google.com).
2. Inspect server error logs for rate limit (`429`) or quota exhaustion errors.
3. Verify organization AI permissions: check if an enterprise tenant toggled `allow_external_ai = false`.

### Remediation
* If external API quota exceeded: Increase Gemini quota or wait for daily reset.
* No downtime occurs because deterministic offline fallback is structurally guaranteed.

---

## 4. Runbook: Model Distribution Drift ($\text{PSI} \ge 0.15$)

### Symptoms
* Alert: `ResumioScoreDistributionDriftDetected` (PSI $\ge 0.15$).
* Mean candidate match fit scores shift abnormally up or down by $> 2$ standard deviations.

### Diagnostics
1. Inspect the Active Learning Queue (`active_learning_queue` table) for clusters of low-confidence predictions.
2. Review recent job postings: check if new emerging technologies (e.g. quantum frameworks, new AI toolchains) were introduced that lack canonical taxonomy synonyms.
3. Run the evaluation suite against the latest benchmark dataset:
   ```bash
   npx tsx server/test-phase10-platform.ts
   ```

### Remediation
* Triage low-confidence skill matches in the Admin Active Learning screen.
* Retrain or update canonical taxonomy synonym weights in `skillNormalizer.ts`.
* In Shadow Mode, evaluate the candidate model version against production. If metric gates ($F_1 \ge 0.85$, $\text{NDCG@10} \ge 0.90$) pass, execute one-click promotion via `promoteShadowModel()`.

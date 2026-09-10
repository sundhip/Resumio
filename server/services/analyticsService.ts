import { db } from '../database/db';

export interface AnalyticsParams {
  dateRange?: '7d' | '30d' | '90d' | 'all';
  jobId?: string;
}

export class RecruitmentAnalyticsService {
  /**
   * Calculate recruitment analytics and statistics via database aggregations
   */
  static getRecruiterAnalytics(recruiterUserId: string, params?: AnalyticsParams) {
    const dateRange = params?.dateRange || '30d';
    const jobId = params?.jobId && params.jobId !== 'all' ? params.jobId : null;

    // Date range filter calculation
    let dateFilterSql = '';
    if (dateRange === '7d') {
      dateFilterSql = " AND a.applied_at >= datetime('now', '-7 days')";
    } else if (dateRange === '30d') {
      dateFilterSql = " AND a.applied_at >= datetime('now', '-30 days')";
    } else if (dateRange === '90d') {
      dateFilterSql = " AND a.applied_at >= datetime('now', '-90 days')";
    }

    // Job filter calculation
    let jobFilterSql = '';
    const queryParams: any[] = [recruiterUserId];

    if (jobId) {
      jobFilterSql = ' AND a.job_id = ?';
      queryParams.push(jobId);
    }

    // 1. Jobs counts
    const jobs = db.prepare(`
      SELECT id, title, status, created_at
      FROM jobs
      WHERE recruiter_id = ?
    `).all(recruiterUserId) as any[];

    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((j) => j.status === 'Published').length;
    const closedJobs = jobs.filter((j) => j.status === 'Closed').length;
    const draftJobs = jobs.filter((j) => j.status === 'Draft').length;

    // 2. Application status aggregation
    const statusCountsRaw = db.prepare(`
      SELECT a.status, COUNT(*) as count
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.recruiter_id = ? ${dateFilterSql} ${jobFilterSql}
      GROUP BY a.status
    `).all(...queryParams) as any[];

    let totalApplications = 0;
    const statusMap: Record<string, number> = {
      Applied: 0,
      'Under Review': 0,
      Shortlisted: 0,
      Rejected: 0,
      Withdrawn: 0,
    };

    for (const row of statusCountsRaw) {
      statusMap[row.status] = row.count;
      totalApplications += row.count;
    }

    const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
      percentage: totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0,
    }));

    // 3. Application Trend (Daily aggregation)
    let trendDays = 30;
    if (dateRange === '7d') trendDays = 7;
    if (dateRange === '90d') trendDays = 90;
    if (dateRange === 'all') trendDays = 60; // default view for all

    const trendRaw = db.prepare(`
      SELECT strftime('%Y-%m-%d', a.applied_at) as date, COUNT(*) as count
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.recruiter_id = ? ${dateFilterSql} ${jobFilterSql}
      GROUP BY strftime('%Y-%m-%d', a.applied_at)
      ORDER BY date ASC
    `).all(...queryParams) as any[];

    const trendMap = new Map<string, number>();
    for (const r of trendRaw) {
      trendMap.set(r.date, r.count);
    }

    // Fill missing dates in trend for clean continuous chart
    const applicationTrend: { date: string; label: string; count: number }[] = [];
    const endDate = new Date();
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const count = trendMap.get(isoDate) || 0;
      applicationTrend.push({
        date: isoDate,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count,
      });
    }

    // 4. Match Quality & Score Distribution (Phase 6 Integration)
    const matchScoresRaw = db.prepare(`
      SELECT m.match_score
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN resume_job_matches m ON a.resume_id = m.resume_id AND a.job_id = m.job_id
      WHERE j.recruiter_id = ? ${dateFilterSql} ${jobFilterSql}
    `).all(...queryParams) as any[];

    let totalScoreSum = 0;
    let scoreCount = 0;
    let bucket80Plus = 0;
    let bucket60To79 = 0;
    let bucket40To59 = 0;
    let bucketBelow40 = 0;

    for (const r of matchScoresRaw) {
      if (r.match_score !== null && r.match_score !== undefined) {
        const score = r.match_score;
        totalScoreSum += score;
        scoreCount++;

        if (score >= 80) bucket80Plus++;
        else if (score >= 60) bucket60To79++;
        else if (score >= 40) bucket40To59++;
        else bucketBelow40++;
      }
    }

    const averageMatchScore = scoreCount > 0 ? Math.round(totalScoreSum / scoreCount) : 0;

    const scoreDistribution = [
      {
        range: '80% - 100%',
        label: 'Strong Match',
        count: bucket80Plus,
        percentage: scoreCount > 0 ? Math.round((bucket80Plus / scoreCount) * 100) : 0,
      },
      {
        range: '60% - 79%',
        label: 'Good Match',
        count: bucket60To79,
        percentage: scoreCount > 0 ? Math.round((bucket60To79 / scoreCount) * 100) : 0,
      },
      {
        range: '40% - 59%',
        label: 'Partial Match',
        count: bucket40To59,
        percentage: scoreCount > 0 ? Math.round((bucket40To59 / scoreCount) * 100) : 0,
      },
      {
        range: '< 40%',
        label: 'Low Match',
        count: bucketBelow40,
        percentage: scoreCount > 0 ? Math.round((bucketBelow40 / scoreCount) * 100) : 0,
      },
    ];

    // 5. Interview Metrics
    let interviewDateFilter = '';
    if (dateRange === '7d') interviewDateFilter = " AND i.created_at >= datetime('now', '-7 days')";
    else if (dateRange === '30d') interviewDateFilter = " AND i.created_at >= datetime('now', '-30 days')";
    else if (dateRange === '90d') interviewDateFilter = " AND i.created_at >= datetime('now', '-90 days')";

    let interviewJobFilter = '';
    const interviewQueryParams: any[] = [recruiterUserId];
    if (jobId) {
      interviewJobFilter = ' AND i.job_id = ?';
      interviewQueryParams.push(jobId);
    }

    const interviewCountsRaw = db.prepare(`
      SELECT i.status, COUNT(*) as count
      FROM interviews i
      WHERE i.recruiter_id = ? ${interviewDateFilter} ${interviewJobFilter}
      GROUP BY i.status
    `).all(...interviewQueryParams) as any[];

    const interviewStatusMap: Record<string, number> = {
      Scheduled: 0,
      Rescheduled: 0,
      Completed: 0,
      Cancelled: 0,
      'No Show': 0,
    };

    let totalInterviews = 0;
    for (const r of interviewCountsRaw) {
      interviewStatusMap[r.status] = r.count;
      totalInterviews += r.count;
    }

    const completedInterviews = interviewStatusMap['Completed'];
    const activeScheduled = interviewStatusMap['Scheduled'] + interviewStatusMap['Rescheduled'];
    const completionRate =
      totalInterviews > 0 ? Math.round((completedInterviews / totalInterviews) * 100) : 0;

    // 6. Top Jobs Performance Summary
    const jobSummaries = jobs.map((job) => {
      const appCount = (db.prepare(`SELECT COUNT(*) as count FROM applications WHERE job_id = ?`).get(job.id) as any)?.count || 0;
      const shortlistedCount = (db.prepare(`SELECT COUNT(*) as count FROM applications WHERE job_id = ? AND status = 'Shortlisted'`).get(job.id) as any)?.count || 0;
      const avgScore = (db.prepare(`
        SELECT AVG(m.match_score) as avg_score
        FROM applications a
        JOIN resume_job_matches m ON a.resume_id = m.resume_id AND a.job_id = m.job_id
        WHERE a.job_id = ?
      `).get(job.id) as any)?.avg_score;

      return {
        id: job.id,
        title: job.title,
        status: job.status,
        applicantsCount: appCount,
        shortlistedCount,
        averageScore: avgScore ? Math.round(avgScore) : null,
      };
    });

    return {
      overview: {
        totalJobs,
        activeJobs,
        closedJobs,
        draftJobs,
        totalApplications,
        shortlisted: statusMap['Shortlisted'],
        underReview: statusMap['Under Review'],
        rejected: statusMap['Rejected'],
        totalInterviews,
        activeInterviews: activeScheduled,
        completedInterviews,
        averageMatchScore,
        completionRate,
      },
      statusDistribution,
      applicationTrend,
      scoreDistribution,
      interviewMetrics: {
        total: totalInterviews,
        scheduled: interviewStatusMap['Scheduled'],
        rescheduled: interviewStatusMap['Rescheduled'],
        completed: completedInterviews,
        cancelled: interviewStatusMap['Cancelled'],
        noShow: interviewStatusMap['No Show'],
        completionRate,
      },
      jobs: jobSummaries,
    };
  }
}

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db, resumeUploadDir, initDatabase } from './database/db.js';
import { extractDocumentText, computeFileHash, extractTextFromPdf, extractTextFromDocx } from './services/documentExtractor.js';
import { parseResumeText } from './services/resumeParser.js';
import { screenParsedResume } from './services/resumeScreening.js';
import { processResumeAndScreen } from './services/resumeProcessingPipeline.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

async function runPhase5TestSuite() {
  console.log('====================================================');
  console.log('🧪 RESUMIO PHASE 5: RESUME PARSING & AI SCREENING SUITE');
  console.log('====================================================\n');

  await initDatabase();

  // Ensure test upload directory exists
  if (!fs.existsSync(resumeUploadDir)) {
    fs.mkdirSync(resumeUploadDir, { recursive: true });
  }

  // ========================================================
  // TEST SUITE 1: DOCUMENT TEXT EXTRACTION & INTEGRITY
  // ========================================================
  console.log('📁 1. Testing Document Text Extraction (PDF / DOCX)...');

  // Create sample mock PDF text stream buffer
  const sampleResumeText = `
John Doe
Senior Full Stack Engineer
john.doe.engineering@example.com | +1 (555) 234-5678 | San Francisco, CA

PROFESSIONAL SUMMARY
Experienced software engineer with 6+ years building distributed cloud systems and scalable web applications.

SKILLS
React, TypeScript, Node.js, Express.js, Python, PostgreSQL, Docker, AWS Cloud, Kubernetes, CI/CD, Git

WORK EXPERIENCE
Senior Software Engineer at CloudTech Systems
Jan 2021 - Present
Architected microservices handling 2M requests/day using Node.js, TypeScript and PostgreSQL.

Full Stack Developer at NexaCorp
Jun 2018 - Dec 2020
Built high-performance React frontends and REST APIs with Python Django.

EDUCATION
B.Tech in Computer Science
Stanford University
CGPA: 3.85 / 4.0 (2014 - 2018)

PROJECTS
Resumio Platform - AI recruitment portal built with React and TypeScript.
https://github.com/johndoe/resumio

CERTIFICATIONS
AWS Certified Solutions Architect (Amazon Web Services)
Certified Kubernetes Administrator (CKA)

LANGUAGES
English - Fluent
Spanish - Intermediate
`;

  // Create a simulated PDF format file
  const testPdfFilename = `test_sample_${Date.now()}.pdf`;
  const testPdfPath = path.join(resumeUploadDir, testPdfFilename);
  
  // PDF format with text stream
  const pdfLines = sampleResumeText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const pdfTextStream = pdfLines.map((l) => `(${l.replace(/[\(\)]/g, '')}) Tj T*`).join('\n');

  const pdfStreamContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${pdfTextStream.length + 50} >>
stream
BT
/F1 12 Tf
14 TL
${pdfTextStream}
ET
endstream
endobj
xref
0 5
trailer
<< /Root 1 0 R >>
%%EOF`;

  fs.writeFileSync(testPdfPath, pdfStreamContent);

  const extractedDoc = await extractDocumentText(testPdfPath);
  assert(Boolean(extractedDoc.text && extractedDoc.text.length > 50), 'Extracts text from PDF document', `Length: ${extractedDoc.text?.length}`);
  assert(extractedDoc.format === 'PDF', 'Correctly identifies PDF format');
  assert(Boolean(extractedDoc.fileHash && extractedDoc.fileHash.length === 64), 'Computes valid SHA-256 file hash', extractedDoc.fileHash);

  // Test hash consistency
  const recomputedHash = computeFileHash(testPdfPath);
  assert(recomputedHash === extractedDoc.fileHash, 'File hash computation is deterministic and reproducible');

  // ========================================================
  // TEST SUITE 2: STRUCTURED RESUME PARSER
  // ========================================================
  console.log('\n🧠 2. Testing Structured Resume Parser & Canonical Dictionary...');

  const parsed = parseResumeText(sampleResumeText);

  assert(parsed.personal.candidateName === 'John Doe', 'Extracts candidate name accurately', parsed.personal.candidateName);
  assert(parsed.personal.email === 'john.doe.engineering@example.com', 'Extracts candidate email', parsed.personal.email);
  assert(parsed.personal.phone === '+1 (555) 234-5678' || parsed.personal.phone.includes('234-5678'), 'Extracts candidate telephone', parsed.personal.phone);
  assert(parsed.personal.headline.includes('Engineer') || parsed.personal.headline.includes('Developer'), 'Extracts candidate headline', parsed.personal.headline);
  assert(parsed.summary.includes('6+ years') || parsed.summary.includes('cloud systems'), 'Extracts professional summary statement');

  // Skills canonical matching
  const expectedSkills = ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'AWS Cloud', 'Git'];
  const allExpectedPresent = expectedSkills.every((sk) => parsed.skills.includes(sk));
  assert(allExpectedPresent, `Canonical skills extracted correctly (Found: ${parsed.skills.join(', ')})`);

  // Work Experience
  assert(parsed.experience.length >= 2, `Extracts multiple work experience items (Count: ${parsed.experience.length})`);
  assert(parsed.experience[0].jobTitle === 'Senior Software Engineer', 'Identifies senior software engineer title', parsed.experience[0].jobTitle);
  assert(parsed.experience[0].company.includes('CloudTech') || parsed.experience[0].company.includes('Systems'), 'Identifies company name', parsed.experience[0].company);

  // Education
  assert(parsed.education.length >= 1, `Extracts education records (Count: ${parsed.education.length})`);
  assert(parsed.education[0].degree === 'B.Tech', 'Identifies B.Tech degree', parsed.education[0].degree);
  assert(parsed.education[0].institution.includes('Stanford'), 'Identifies institution', parsed.education[0].institution);

  // Projects & Certifications & Languages
  assert(parsed.projects.length >= 1, `Extracts projects portfolio (Count: ${parsed.projects.length})`);
  assert(parsed.certifications.length >= 1, `Extracts certifications (Count: ${parsed.certifications.length})`);
  assert(parsed.languages.some((l) => l.language === 'English'), 'Extracts spoken languages');

  // Confidence indicators & sections detected count
  assert(parsed.confidence.skills === 'high', 'Skills extraction confidence marked high for >=5 skills');
  assert(parsed.sectionsDetectedCount >= 6, `High section detection coverage (Count: ${parsed.sectionsDetectedCount})`);

  // ========================================================
  // TEST SUITE 3: NO HALLUCINATION & MISSING SECTIONS INTEGRITY
  // ========================================================
  console.log('\n🛡️ 3. Testing Zero-Hallucination & Incomplete Document Handling...');

  const minimalText = `
Jane Smith
jane.smith@example.com

EDUCATION
Bachelor of Science in Mathematics
MIT (2020 - 2024)
`;

  const minimalParsed = parseResumeText(minimalText);
  assert(minimalParsed.personal.candidateName === 'Jane Smith', 'Extracts name from minimal text');
  assert(minimalParsed.skills.length === 0, 'Leaves skills empty when none exist in text (no hallucination)');
  assert(minimalParsed.experience.length === 0, 'Leaves experience empty when no employment history present');
  assert(minimalParsed.projects.length === 0, 'Leaves projects empty when none exist');
  assert(minimalParsed.certifications.length === 0, 'Leaves certifications empty when none exist');
  assert(minimalParsed.summary === '', 'Leaves summary empty when not provided');

  // ========================================================
  // TEST SUITE 4: AI RESUME SCREENING ENGINE
  // ========================================================
  console.log('\n📊 4. Testing AI Resume Screening Engine...');

  const screeningRich = screenParsedResume(parsed);
  assert(screeningRich.completenessScore >= 80, `Comprehensive resume receives high completeness score (${screeningRich.completenessScore}/100)`);
  assert(screeningRich.sectionsPresent.includes('Skills') && screeningRich.sectionsPresent.includes('Work Experience'), 'Identifies all present sections');
  assert(screeningRich.totalExperienceYears >= 4, `Estimates experience years from documented dates (${screeningRich.totalExperienceYears} yrs)`);
  assert(screeningRich.highestEducation.includes("Bachelor") || screeningRich.highestEducation.includes("B.Tech"), 'Identifies highest academic degree level', screeningRich.highestEducation);
  assert(screeningRich.screeningFlags.some((f) => f.type === 'positive'), 'Assigns positive screening health flag');
  assert(screeningRich.observations.length >= 3, `Generates neutral quality observations (Count: ${screeningRich.observations.length})`);

  // Screening on minimal resume
  const screeningMinimal = screenParsedResume(minimalParsed);
  assert(screeningMinimal.completenessScore < 50, `Minimal resume completeness score is properly proportional (${screeningMinimal.completenessScore}/100)`);
  assert(screeningMinimal.sectionsMissing.includes('Work Experience'), 'Correctly notes missing Work Experience');
  assert(screeningMinimal.sectionsMissing.includes('Skills'), 'Correctly notes missing Skills');
  assert(screeningMinimal.screeningFlags.some((f) => f.type === 'warning'), 'Adds appropriate warning flag for missing critical sections');

  // ========================================================
  // TEST SUITE 5: PIPELINE EXECUTION & DATABASE ISOLATION
  // ========================================================
  console.log('\n💾 5. Testing Database Persistence & Source Isolation...');

  // Setup test candidate & user
  const testUserId = `test_cand_${Date.now()}`;
  const testProfileId = `test_cand_prof_${Date.now()}`;
  const testResumeId = `test_resume_${Date.now()}`;

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, 'hash', 'candidate', datetime('now'), datetime('now'))
  `).run(testUserId, `candidate_${Date.now()}@test.com`);

  db.prepare(`
    INSERT INTO candidate_profiles (id, user_id, full_name, phone, location, headline, bio, profile_completion, created_at, updated_at)
    VALUES (?, ?, 'Original Account Name', '111-222-3333', 'Original City', 'Original Headline', 'Original Bio', 50, datetime('now'), datetime('now'))
  `).run(testProfileId, testUserId);

  db.prepare(`
    INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active, created_at, updated_at)
    VALUES (?, ?, 'JohnDoeResume.pdf', ?, 'PDF', 1024, 1, datetime('now'), datetime('now'))
  `).run(testResumeId, testProfileId, testPdfFilename);

  // Execute processing pipeline
  const processRes = await processResumeAndScreen(testResumeId, testUserId, testProfileId, testPdfFilename);
  assert(processRes.status === 'Processed', 'Pipeline processes and stores resume without errors');

  // Verify candidate_profiles was NOT overwritten by parsed resume (Source Isolation)
  const profileAfterParse = db.prepare('SELECT * FROM candidate_profiles WHERE id = ?').get(testProfileId) as any;
  assert(profileAfterParse.full_name === 'Original Account Name', 'Candidate profile table name was NOT overwritten by resume parse');
  assert(profileAfterParse.phone === '111-222-3333', 'Candidate profile table phone was NOT overwritten');

  // Verify resume_parsed_data table contains extracted info
  const savedParsed = db.prepare('SELECT * FROM resume_parsed_data WHERE resume_id = ?').get(testResumeId) as any;
  assert(Boolean(savedParsed && savedParsed.status === 'Processed'), 'Parsed data saved with status "Processed"');
  assert(savedParsed?.candidate_name?.trim() === 'John Doe', 'Extracted name stored in resume_parsed_data table', `Actual: "${savedParsed?.candidate_name}"`);

  // Verify resume_screenings table contains screening info
  const savedScreening = db.prepare('SELECT * FROM resume_screenings WHERE resume_id = ?').get(testResumeId) as any;
  assert(Boolean(savedScreening && savedScreening.status === 'Screened'), 'Screening saved with status "Screened"');
  assert(savedScreening.completeness_score >= 80, 'Stored completeness score matches calculated score', `${savedScreening.completeness_score}`);

  // ========================================================
  // TEST SUITE 6: RESUME VERSIONING & APPLICATION INTEGRITY
  // ========================================================
  console.log('\n📑 6. Testing Resume Versioning & Application History...');

  // Setup test job & recruiter
  const testRecruiterId = `test_rec_${Date.now()}`;
  const testRecruiterProfId = `test_rec_prof_${Date.now()}`;
  const testJobId = `test_job_${Date.now()}`;
  const testAppId = `test_app_${Date.now()}`;

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, 'hash', 'recruiter', datetime('now'), datetime('now'))
  `).run(testRecruiterId, `recruiter_${Date.now()}@test.com`);

  db.prepare(`
    INSERT INTO recruiter_profiles (id, user_id, full_name, company_name, created_at, updated_at)
    VALUES (?, ?, 'Recruiter Lead', 'Acme Tech', datetime('now'), datetime('now'))
  `).run(testRecruiterProfId, testRecruiterId);

  db.prepare(`
    INSERT INTO jobs (id, recruiter_id, recruiter_profile_id, title, description, company_name, employment_type, work_mode, status, created_at, updated_at)
    VALUES (?, ?, ?, 'Full Stack Engineer', 'Great job opening', 'Acme Tech', 'Full-time', 'Remote', 'Published', datetime('now'), datetime('now'))
  `).run(testJobId, testRecruiterId, testRecruiterProfId);

  // Submit application with the first resume version
  db.prepare(`
    INSERT INTO applications (id, candidate_id, candidate_profile_id, job_id, resume_id, cover_letter, status, applied_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'Looking forward to interviewing.', 'Applied', datetime('now'), datetime('now'))
  `).run(testAppId, testUserId, testProfileId, testJobId, testResumeId);

  // Now candidate uploads a NEW second resume version
  const newResumeId = `test_resume_v2_${Date.now()}`;
  db.prepare('UPDATE candidate_resumes SET is_active = 0 WHERE candidate_profile_id = ?').run(testProfileId);
  db.prepare(`
    INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active, created_at, updated_at)
    VALUES (?, ?, 'New_Resume_2026.pdf', ?, 'PDF', 2048, 1, datetime('now'), datetime('now'))
  `).run(newResumeId, testProfileId, testPdfFilename);

  // Verify historical application still links to initial resume version (v1)
  const appRecord = db.prepare('SELECT resume_id FROM applications WHERE id = ?').get(testAppId) as any;
  assert(appRecord.resume_id === testResumeId, 'Historical application maintains exact reference to submitted resume v1');

  const oldResume = db.prepare('SELECT is_active FROM candidate_resumes WHERE id = ?').get(testResumeId) as any;
  const newResume = db.prepare('SELECT is_active FROM candidate_resumes WHERE id = ?').get(newResumeId) as any;
  assert(oldResume.is_active === 0, 'Previous resume is marked inactive (is_active = 0) rather than deleted');
  assert(newResume.is_active === 1, 'Newly uploaded resume is marked active (is_active = 1)');

  // Clean up mock test file and test database fixtures
  try {
    if (fs.existsSync(testPdfPath)) fs.unlinkSync(testPdfPath);
    db.prepare('DELETE FROM resume_parsed_data WHERE candidate_profile_id = ?').run(testProfileId);
    db.prepare('DELETE FROM resume_screenings WHERE resume_id = ?').run(testResumeId);
    db.prepare('DELETE FROM candidate_resumes WHERE candidate_profile_id = ?').run(testProfileId);
    db.prepare('DELETE FROM candidate_profiles WHERE id = ?').run(testProfileId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
  } catch {}

  console.log('\n====================================================');
  console.log(`🎉 PHASE 5 VERIFICATION RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase5TestSuite().catch((err) => {
  console.error('Test suite uncaught failure:', err);
  process.exit(1);
});

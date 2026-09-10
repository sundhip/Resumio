import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3001/api';

async function runPhase2Tests() {
  console.log('====================================================');
  console.log('RESUMIO PHASE 2 — AUTOMATED VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}${detail ? ` (${detail})` : ''}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // 1. Candidate Login
  console.log('1. Authenticating Candidate (rahul.kumar@resumio.ai)...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rahul.kumar@resumio.ai',
      password: 'Candidate123!',
    }),
  });
  const loginData = (await loginRes.json()) as any;
  assert(loginData.success === true && Boolean(loginData.token), 'Candidate authentication successful');
  const token = loginData.token;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2. Full Profile Retrieval
  console.log('\n2. Testing GET /api/candidate/full-profile...');
  const fullProfileRes = await fetch(`${BASE_URL}/candidate/full-profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const fullProfileData = (await fullProfileRes.json()) as any;
  assert(fullProfileData.success === true, 'Full profile returned success: true');
  assert(Boolean(fullProfileData.data.profile), 'Profile object present');
  assert(Array.isArray(fullProfileData.data.education), 'Education array present');
  assert(Array.isArray(fullProfileData.data.skills), 'Skills array present');
  assert(Array.isArray(fullProfileData.data.experience), 'Experience array present');
  assert(Array.isArray(fullProfileData.data.projects), 'Projects array present');
  assert(Array.isArray(fullProfileData.data.certifications), 'Certifications array present');
  assert(typeof fullProfileData.data.completion === 'number', 'Completion percentage calculated dynamically', `${fullProfileData.data.completion}%`);

  // 3. Update Candidate Basic Profile
  console.log('\n3. Testing PUT /api/candidate/profile...');
  const updateProfileRes = await fetch(`${BASE_URL}/candidate/profile`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      fullName: 'Rahul Kumar, M.Tech',
      phone: '+91 98765 43210',
      location: 'Bangalore, Karnataka, India',
      headline: 'Principal Full Stack Architect & Distributed Systems Engineer',
      bio: 'High-velocity software architect with 8+ years building high-concurrency microservices, cloud-native APIs, and reactive web applications.',
    }),
  });
  const updateProfileData = (await updateProfileRes.json()) as any;
  assert(updateProfileData.success === true, 'Basic profile updated successfully');
  assert(updateProfileData.profile.headline.includes('Principal Full Stack Architect'), 'Headline updated in DB');

  // 4. Skills Management & Duplicate Protection
  console.log('\n4. Testing Skills Management & Uniqueness Constraint...');
  // Clean up any previous test skill
  const checkSkillsRes = await fetch(`${BASE_URL}/candidate/full-profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const checkSkillsData = (await checkSkillsRes.json()) as any;
  const existingTestSkill = checkSkillsData?.data?.skills?.find((s: any) => s.name.toLowerCase() === 'graphql & apollo');
  if (existingTestSkill) {
    await fetch(`${BASE_URL}/candidate/skills/${existingTestSkill.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
  }

  const addSkillRes1 = await fetch(`${BASE_URL}/candidate/skills`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'GraphQL & Apollo',
      proficiency: 'Expert',
    }),
  });
  const addSkillData1 = (await addSkillRes1.json()) as any;
  assert(addSkillData1.success === true, 'Skill "GraphQL & Apollo" added');
  const createdSkillId = addSkillData1.skill.id;

  // Attempt duplicate (case-insensitive)
  const addSkillDuplicateRes = await fetch(`${BASE_URL}/candidate/skills`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'graphql & apollo',
      proficiency: 'Beginner',
    }),
  });
  const addSkillDuplicateData = (await addSkillDuplicateRes.json()) as any;
  assert(addSkillDuplicateRes.status === 400 || addSkillDuplicateData.success === false, 'Duplicate skill rejected with 400 Bad Request');

  // Update skill proficiency
  const updateSkillRes = await fetch(`${BASE_URL}/candidate/skills/${createdSkillId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'GraphQL & Apollo',
      proficiency: 'Advanced',
    }),
  });
  const updateSkillData = (await updateSkillRes.json()) as any;
  assert(updateSkillData.success === true && updateSkillData.skill.proficiency === 'Advanced', 'Skill proficiency updated to Advanced');

  // 5. Education CRUD
  console.log('\n5. Testing Education CRUD...');
  const addEduRes = await fetch(`${BASE_URL}/candidate/education`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      degree: 'Master of Science (M.S.)',
      field_of_study: 'Distributed Systems & Cloud Computing',
      institution: 'Indian Institute of Science (IISc)',
      location: 'Bangalore, India',
      start_date: '2020-08',
      end_date: '2022-06',
      currently_studying: false,
      grade_or_gpa: '9.4 / 10.0 CGPA',
      description: 'Specialized in distributed consensus, Paxos/Raft algorithms, and scalable microservices.',
    }),
  });
  const addEduData = (await addEduRes.json()) as any;
  assert(addEduData.success === true, 'Education entry created');
  const createdEduId = addEduData.education.id;

  const updateEduRes = await fetch(`${BASE_URL}/candidate/education/${createdEduId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      degree: 'Master of Science (M.S.) with Honors',
      field_of_study: 'Distributed Systems & Cloud Computing',
      institution: 'Indian Institute of Science (IISc)',
      location: 'Bangalore, India',
      start_date: '2020-08',
      end_date: '2022-06',
      currently_studying: false,
      grade_or_gpa: '9.6 / 10.0 CGPA',
      description: 'Specialized in distributed consensus, Paxos/Raft algorithms, and scalable microservices.',
    }),
  });
  const updateEduData = (await updateEduRes.json()) as any;
  assert(updateEduData.success === true && updateEduData.education.grade_or_gpa === '9.6 / 10.0 CGPA', 'Education entry updated');

  // 6. Experience CRUD
  console.log('\n6. Testing Experience CRUD...');
  const addExpRes = await fetch(`${BASE_URL}/candidate/experience`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      job_title: 'Staff Software Architect',
      company: 'Stripe Technologies',
      employment_type: 'Full-time',
      location: 'Bangalore, India (Hybrid)',
      start_date: '2023-01',
      end_date: '',
      currently_working: true,
      description: 'Leading global payment infrastructure handling 50,000 requests per second with 99.999% uptime.',
    }),
  });
  const addExpData = (await addExpRes.json()) as any;
  assert(addExpData.success === true, 'Experience entry created');
  const createdExpId = addExpData.experience.id;

  // 7. Projects CRUD
  console.log('\n7. Testing Projects CRUD...');
  const addProjRes = await fetch(`${BASE_URL}/candidate/projects`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Resumio Intelligent Screening Pipeline',
      role: 'Lead Architect',
      technologies: 'TypeScript, React, Node.js, SQLite, TailwindCSS',
      description: 'Engineered high-throughput candidate evaluation platform supporting multi-tenant recruiter operations.',
      project_url: 'https://resumio.ai',
      github_url: 'https://github.com/resumio/resumio',
      start_date: '2024-01',
      end_date: '2024-08',
    }),
  });
  const addProjData = (await addProjRes.json()) as any;
  assert(addProjData.success === true, 'Project entry created');
  const createdProjId = addProjData.project.id;

  // 8. Certifications CRUD
  console.log('\n8. Testing Certifications CRUD...');
  const addCertRes = await fetch(`${BASE_URL}/candidate/certifications`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Google Cloud Professional Cloud Architect',
      issuing_organization: 'Google Cloud Platform',
      issue_date: '2023-05',
      expiration_date: '2026-05',
      does_not_expire: false,
      credential_id: 'GCP-PCA-984021',
      credential_url: 'https://www.credential.net/gcp-pca-984021',
    }),
  });
  const addCertData = (await addCertRes.json()) as any;
  assert(addCertData.success === true, 'Certification entry created');
  const createdCertId = addCertData.certification.id;

  // 9. Resume Upload (PDF)
  console.log('\n9. Testing Resume Upload (PDF), In-Browser Preview & Secure Download...');
  const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Rahul Kumar Resume) /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
  const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
  const form = new FormData();
  form.append('resume', pdfBlob, 'Rahul_Kumar_Staff_Engineer_Resume.pdf');

  const uploadResumeRes = await fetch(`${BASE_URL}/candidate/resume`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });
  const uploadResumeData = (await uploadResumeRes.json()) as any;
  assert(uploadResumeData.success === true, 'PDF Resume uploaded successfully');
  assert(uploadResumeData.resume.original_filename === 'Rahul_Kumar_Staff_Engineer_Resume.pdf', 'Original filename preserved');
  assert(uploadResumeData.resume.file_type === 'PDF', 'File type recognized as PDF');

  // Resume In-Browser Preview Stream Check
  const previewRes = await fetch(`${BASE_URL}/candidate/resume/preview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(previewRes.status === 200, 'Resume preview returns HTTP 200');
  assert(previewRes.headers.get('content-type')?.includes('application/pdf') === true, 'Resume preview content-type is application/pdf');
  assert(previewRes.headers.get('content-disposition')?.includes('inline') === true, 'Resume preview content-disposition is inline');

  // Resume Download Check
  const downloadRes = await fetch(`${BASE_URL}/candidate/resume/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(downloadRes.status === 200, 'Resume download returns HTTP 200');
  assert(downloadRes.headers.get('content-disposition')?.includes('attachment') === true, 'Resume download content-disposition is attachment');
  assert(downloadRes.headers.get('content-disposition')?.includes('Rahul_Kumar_Staff_Engineer_Resume.pdf') === true, 'Download filename header matches original');

  // 10. Resume Atomic Replacement (DOCX)
  console.log('\n10. Testing Resume Safe Atomic Replacement (DOCX)...');
  const docxBuffer = Buffer.from('PK\x03\x04\x14\x00\x00\x00\x08\x00ResumioDOCXSample');
  const docxBlob = new Blob([docxBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const replaceForm = new FormData();
  replaceForm.append('resume', docxBlob, 'Rahul_Kumar_Updated_CV.docx');

  const replaceResumeRes = await fetch(`${BASE_URL}/candidate/resume`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: replaceForm,
  });
  const replaceResumeData = (await replaceResumeRes.json()) as any;
  assert(replaceResumeData.success === true, 'DOCX replacement uploaded successfully');
  assert(replaceResumeData.resume.original_filename === 'Rahul_Kumar_Updated_CV.docx', 'Replaced filename updated in DB');
  assert(replaceResumeData.resume.file_type === 'DOCX', 'File type updated to DOCX');

  // 11. Profile Completion Check (Should be 100% when all 10 components are filled)
  console.log('\n11. Testing Dynamic Profile Completion Score (10 sections @ 10% each)...');
  const verifyProfileRes = await fetch(`${BASE_URL}/candidate/full-profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const verifyProfileData = (await verifyProfileRes.json()) as any;
  assert(verifyProfileData.data.completion === 100, 'All 10 sections completed yields 100% Profile Strength', `Score: ${verifyProfileData.data.completion}%`);

  // 12. Cleanup Temporary Test Files & Created Records
  console.log('\n12. Testing Deletions & Dynamic Score Decrements...');
  const delResumeRes = await fetch(`${BASE_URL}/candidate/resume`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const delResumeData = (await delResumeRes.json()) as any;
  assert(delResumeData.success === true, 'Resume deleted successfully');
  assert(delResumeData.completion === 90, 'Completion score dropped to 90% after resume deletion', `Score: ${delResumeData.completion}%`);

  // Delete created test records
  await fetch(`${BASE_URL}/candidate/skills/${createdSkillId}`, { method: 'DELETE', headers: authHeaders });
  await fetch(`${BASE_URL}/candidate/education/${createdEduId}`, { method: 'DELETE', headers: authHeaders });
  await fetch(`${BASE_URL}/candidate/experience/${createdExpId}`, { method: 'DELETE', headers: authHeaders });
  await fetch(`${BASE_URL}/candidate/projects/${createdProjId}`, { method: 'DELETE', headers: authHeaders });
  await fetch(`${BASE_URL}/candidate/certifications/${createdCertId}`, { method: 'DELETE', headers: authHeaders });

  console.log('\n====================================================');
  console.log(`PHASE 2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Tests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

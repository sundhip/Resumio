import { db, initDatabase, resumeUploadDir, recalculateCandidateCompletion } from '../database/db.js';
import { processResumeAndScreen } from '../services/resumeProcessingPipeline.js';
import { ResumeJobMatchingService } from '../services/matchingService.js';
import { CandidateSummaryService } from '../services/candidateSummaryService.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export async function seedDatabase() {
  await initDatabase();
  console.log('🌱 Starting comprehensive Resumio local demo data seeding...');

  // Ensure resume upload directory exists
  if (!fs.existsSync(resumeUploadDir)) {
    fs.mkdirSync(resumeUploadDir, { recursive: true });
  }

  // Common password hashes
  const candPasswordHash = bcrypt.hashSync('Candidate@123', 10);
  const recPasswordHash = bcrypt.hashSync('Recruiter@123', 10);
  const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);

  // ------------------------------------------------------------
  // CLEANUP PREVIOUS DEMO SEED DATA deterministically
  // ------------------------------------------------------------
  console.log('🧹 Cleaning existing demo records...');
  const demoUsers = db.prepare("SELECT id FROM users WHERE email LIKE '%@resumio.demo'").all() as { id: string }[];
  const demoUserIds = demoUsers.map((u) => u.id);

  if (demoUserIds.length > 0) {
    const placeholders = demoUserIds.map(() => '?').join(',');
    
    // Delete cascading references
    db.prepare(`DELETE FROM notifications WHERE user_id IN (${placeholders})`).run(...demoUserIds);
    db.prepare(`DELETE FROM interviews WHERE candidate_id IN (${placeholders}) OR recruiter_id IN (${placeholders})`).run(...demoUserIds, ...demoUserIds);
    db.prepare(`DELETE FROM resume_job_matches WHERE candidate_id IN (${placeholders})`).run(...demoUserIds);
    db.prepare(`DELETE FROM candidate_job_summaries WHERE candidate_id IN (${placeholders})`).run(...demoUserIds);
    db.prepare(`DELETE FROM skill_gap_analyses WHERE candidate_id IN (${placeholders})`).run(...demoUserIds);
    db.prepare(`DELETE FROM resume_screenings WHERE resume_id IN (SELECT id FROM candidate_resumes WHERE candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id IN (${placeholders})))`).run(...demoUserIds);
    db.prepare(`DELETE FROM resume_parsed_data WHERE candidate_id IN (${placeholders})`).run(...demoUserIds);
    db.prepare(`DELETE FROM applications WHERE candidate_id IN (${placeholders})`).run(...demoUserIds);
    db.prepare(`DELETE FROM candidate_resumes WHERE candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id IN (${placeholders}))`).run(...demoUserIds);
    db.prepare(`DELETE FROM candidate_certifications WHERE candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id IN (${placeholders}))`).run(...demoUserIds);
    db.prepare(`DELETE FROM candidate_projects WHERE candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id IN (${placeholders}))`).run(...demoUserIds);
    db.prepare(`DELETE FROM candidate_experience WHERE candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id IN (${placeholders}))`).run(...demoUserIds);
    db.prepare(`DELETE FROM candidate_skills WHERE candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id IN (${placeholders}))`).run(...demoUserIds);
    db.prepare(`DELETE FROM candidate_education WHERE candidate_profile_id IN (SELECT id FROM candidate_profiles WHERE user_id IN (${placeholders}))`).run(...demoUserIds);
    db.prepare(`DELETE FROM job_required_skills WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id IN (${placeholders}))`).run(...demoUserIds);
    db.prepare(`DELETE FROM job_preferred_skills WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id IN (${placeholders}))`).run(...demoUserIds);
    db.prepare(`DELETE FROM jobs WHERE recruiter_id IN (${placeholders})`).run(...demoUserIds);
    db.prepare(`DELETE FROM candidate_profiles WHERE user_id IN (${placeholders})`).run(...demoUserIds);
    db.prepare(`DELETE FROM recruiter_profiles WHERE user_id IN (${placeholders})`).run(...demoUserIds);
    db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`).run(...demoUserIds);
  }

  // ------------------------------------------------------------
  // 1. PRIMARY DEMO LOGIN ACCOUNTS (Candidate, Recruiter, Admin)
  // ------------------------------------------------------------
  console.log('👤 Creating primary demo login accounts...');

  // Candidate Account
  const candUserId = 'user_demo_candidate_01';
  const candProfId = 'prof_demo_candidate_01';
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, status)
    VALUES (?, 'candidate@resumio.demo', ?, 'candidate', 'active')
  `).run(candUserId, candPasswordHash);

  db.prepare(`
    INSERT INTO candidate_profiles (id, user_id, full_name, phone, location, headline, bio, profile_completion)
    VALUES (?, ?, 'Rahul Sharma', '+91 98765 43210', 'Chennai, Tamil Nadu', 'Full Stack Developer', 'Full Stack Developer with 2+ years of experience building web applications using React, Node.js, Python and PostgreSQL. Experienced in REST APIs, database design and responsive web development.', 90)
  `).run(candProfId, candUserId);

  // Seed Rahul Sharma Details (Skills, Education, Experience, Projects, Certifications)
  const rahulSkills = [
    { name: 'JavaScript', prof: 'Expert' },
    { name: 'React', prof: 'Advanced' },
    { name: 'Node.js', prof: 'Advanced' },
    { name: 'Python', prof: 'Advanced' },
    { name: 'Django', prof: 'Intermediate' },
    { name: 'PostgreSQL', prof: 'Advanced' },
    { name: 'SQL', prof: 'Advanced' },
    { name: 'REST API', prof: 'Expert' },
    { name: 'Git', prof: 'Advanced' },
    { name: 'HTML', prof: 'Expert' },
    { name: 'CSS', prof: 'Advanced' },
    { name: 'Docker', prof: 'Intermediate' },
  ];
  for (const s of rahulSkills) {
    db.prepare(`
      INSERT INTO candidate_skills (id, candidate_profile_id, name, proficiency)
      VALUES (?, ?, ?, ?)
    `).run(crypto.randomUUID(), candProfId, s.name, s.prof);
  }

  db.prepare(`
    INSERT INTO candidate_education (id, candidate_profile_id, degree, field_of_study, institution, location, start_date, end_date, currently_studying, grade_or_gpa, description)
    VALUES (?, ?, 'B.Tech', 'Computer Science and Engineering', 'Anna University', 'Chennai, Tamil Nadu', '2018-08', '2022-05', 0, 'CGPA: 8.6 / 10', 'Focused on Software Engineering, Data Structures, Algorithms, Web Technologies, and Database Systems.')
  `).run(crypto.randomUUID(), candProfId);

  db.prepare(`
    INSERT INTO candidate_experience (id, candidate_profile_id, job_title, company, employment_type, location, start_date, end_date, currently_working, description)
    VALUES (?, ?, 'Software Developer', 'TechVista Solutions', 'Full-time', 'Chennai, Tamil Nadu', '2022-06', '', 1, 'Developed scalable RESTful services in Node.js & Python, built interactive React frontends, optimized SQL query execution, and managed Docker container deployments.')
  `).run(crypto.randomUUID(), candProfId);

  db.prepare(`
    INSERT INTO candidate_projects (id, candidate_profile_id, name, role, technologies, description, project_url, github_url, start_date, end_date)
    VALUES 
      (?, ?, 'E-Commerce Platform', 'Full Stack Developer', 'React, Node.js, Express, PostgreSQL', 'Full stack online store with product catalog, cart management, user authentication, and stripe checkout integration.', 'https://ecommerce.demo', 'https://github.com/rahul/ecommerce', '2023-01', '2023-05'),
      (?, ?, 'Employee Management System', 'Lead Backend Engineer', 'Python, Django, PostgreSQL, Docker', 'Enterprise HR portal featuring role-based access control, automated payroll reporting, and employee directory management.', 'https://ems.demo', 'https://github.com/rahul/ems', '2023-06', '2023-11'),
      (?, ?, 'AI Resume Screening Portal', 'Full Stack Architect', 'React, Node.js, Python, SQLite, TailwindCSS', 'Intelligent recruitment matching platform utilizing NLP and automated candidate scoring.', 'https://resumescreening.demo', 'https://github.com/rahul/ai-resume-screening', '2024-01', '2024-08')
  `).run(crypto.randomUUID(), candProfId, crypto.randomUUID(), candProfId, crypto.randomUUID(), candProfId);

  db.prepare(`
    INSERT INTO candidate_certifications (id, candidate_profile_id, name, issuing_organization, issue_date, expiration_date, does_not_expire, credential_id, credential_url)
    VALUES 
      (?, ?, 'Python Programming', 'Python Software Foundation', '2022-11', '', 1, 'PSF-PY-98402', 'https://psf.demo/verify/98402'),
      (?, ?, 'SQL Database Fundamentals', 'PostgreSQL Academy', '2023-04', '', 1, 'PGA-SQL-47109', 'https://pga.demo/verify/47109')
  `).run(crypto.randomUUID(), candProfId, crypto.randomUUID(), candProfId);

  // Recruiter Account (Arjun Mehta)
  const recUserId = 'user_demo_recruiter_01';
  const recProfId = 'prof_demo_recruiter_01';
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, status)
    VALUES (?, 'recruiter@resumio.demo', ?, 'recruiter', 'active')
  `).run(recUserId, recPasswordHash);

  db.prepare(`
    INSERT INTO recruiter_profiles (id, user_id, full_name, phone, company_name, industry, location, website, description, profile_completion)
    VALUES (?, ?, 'Arjun Mehta', '+91 98765 12345', 'Nexora Technologies', 'Software Technology & Enterprise AI', 'Chennai, Tamil Nadu', 'https://nexoratech.demo', 'Nexora Technologies is a fictional software technology company focused on web applications, cloud platforms and enterprise software solutions.', 100)
  `).run(recProfId, recUserId);

  // Admin Account
  const adminUserId = 'user_demo_admin_01';
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, status)
    VALUES (?, 'admin@resumio.demo', ?, 'admin', 'active')
  `).run(adminUserId, adminPasswordHash);

  // ------------------------------------------------------------
  // 2. ADDITIONAL RECRUITERS & COMPANIES (Section 4)
  // ------------------------------------------------------------
  console.log('🏢 Creating fictional companies & recruiter accounts...');
  const recruiters = [
    {
      userId: recUserId,
      profId: recProfId,
      name: 'Arjun Mehta',
      email: 'recruiter@resumio.demo',
      company: 'Nexora Technologies',
      industry: 'Software & AI Solutions',
      location: 'Chennai, Tamil Nadu',
      desc: 'Nexora Technologies is a fictional software technology company focused on web applications, cloud platforms and enterprise software solutions.'
    },
    {
      userId: 'user_rec_cloudmatrix',
      profId: 'prof_rec_cloudmatrix',
      name: 'Priya Sundaram',
      email: 'priya.sundaram@resumio.demo',
      company: 'CloudMatrix Labs',
      industry: 'Cloud Infrastructure & DevOps',
      location: 'Bangalore, Karnataka',
      desc: 'CloudMatrix Labs provides scalable cloud architecture and automated containerized delivery platforms.'
    },
    {
      userId: 'user_rec_blueorbit',
      profId: 'prof_rec_blueorbit',
      name: 'Rajesh Varma',
      email: 'rajesh.varma@resumio.demo',
      company: 'BlueOrbit Solutions',
      industry: 'Enterprise Software & UI',
      location: 'Hyderabad, Telangana',
      desc: 'BlueOrbit Solutions designs intuitive frontend web applications and high-availability enterprise services.'
    },
    {
      userId: 'user_rec_datanest',
      profId: 'prof_rec_datanest',
      name: 'Sneha Kapoor',
      email: 'sneha.kapoor@resumio.demo',
      company: 'DataNest Technologies',
      industry: 'Big Data & Analytics',
      location: 'Pune, Maharashtra',
      desc: 'DataNest Technologies specializes in database optimization, data warehousing, and business intelligence.'
    },
    {
      userId: 'user_rec_inficore',
      profId: 'prof_rec_inficore',
      name: 'Vikram Joshi',
      email: 'vikram.joshi@resumio.demo',
      company: 'InfiCore Systems',
      industry: 'Fintech & Core Engineering',
      location: 'Mumbai, Maharashtra',
      desc: 'InfiCore Systems builds mission-critical financial backend systems, Java microservices, and security solutions.'
    },
    {
      userId: 'user_rec_techvista',
      profId: 'prof_rec_techvista',
      name: 'Maya Nambiar',
      email: 'maya.nambiar@resumio.demo',
      company: 'TechVista Solutions',
      industry: 'IT Consulting & Web Platforms',
      location: 'Chennai, Tamil Nadu',
      desc: 'TechVista Solutions delivers agile software development services and digital transformation consulting.'
    }
  ];

  for (const r of recruiters) {
    if (r.userId !== recUserId) {
      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, status)
        VALUES (?, ?, ?, 'recruiter', 'active')
      `).run(r.userId, r.email, recPasswordHash);

      db.prepare(`
        INSERT INTO recruiter_profiles (id, user_id, full_name, company_name, industry, location, description, profile_completion)
        VALUES (?, ?, ?, ?, ?, ?, ?, 90)
      `).run(r.profId, r.userId, r.name, r.company, r.industry, r.location, r.desc);
    }
  }

  // ------------------------------------------------------------
  // 3. JOB POSTINGS (~18 Jobs) (Section 5)
  // ------------------------------------------------------------
  console.log('💼 Creating 18 realistic job postings...');

  const jobSeeds = [
    {
      id: 'job_demo_python_dev',
      recruiterId: recUserId,
      recruiterProfId: recProfId,
      title: 'Python Developer',
      company: 'Nexora Technologies',
      location: 'Chennai, Tamil Nadu',
      empType: 'Full-time',
      workMode: 'Hybrid',
      salaryMin: 900000,
      salaryMax: 1500000,
      minExp: 2,
      maxExp: 5,
      qual: 'B.Tech / B.E. / M.S. in Computer Science',
      desc: 'We are seeking a versatile Python Developer to build high-performance backend microservices, REST APIs, and database integrations for our flagship cloud products.',
      resp: '• Design, develop, and maintain backend RESTful APIs using Python, Django, and FastAPI.\n• Optimize database queries, schema designs, and data modeling in PostgreSQL.\n• Collaborate with cross-functional teams to integrate front-end components with server-side logic.\n• Containerize applications using Docker and participate in code reviews.',
      reqSkills: ['Python', 'Django', 'PostgreSQL', 'REST API'],
      prefSkills: ['AWS', 'Docker', 'Redis', 'Git']
    },
    {
      id: 'job_demo_fullstack_dev',
      recruiterId: recUserId,
      recruiterProfId: recProfId,
      title: 'Full Stack Developer',
      company: 'Nexora Technologies',
      location: 'Chennai, Tamil Nadu',
      empType: 'Full-time',
      workMode: 'Remote',
      salaryMin: 1000000,
      salaryMax: 1800000,
      minExp: 2,
      maxExp: 6,
      qual: 'B.Tech / B.E. / M.C.A in CS or IT',
      desc: 'Looking for a passionate Full Stack Developer to drive end-to-end feature development using React on the client side and Node.js/Python on the server side.',
      resp: '• Develop responsive, accessible web interfaces in React and TypeScript.\n• Architect robust Node.js backend APIs and database schemas.\n• Maintain high unit test coverage and perform continuous Integration/Deployment.\n• Troubleshoot production issues and enhance application speed.',
      reqSkills: ['React', 'Node.js', 'JavaScript', 'SQL'],
      prefSkills: ['TypeScript', 'Docker', 'TailwindCSS', 'PostgreSQL']
    },
    {
      id: 'job_demo_backend_dev',
      recruiterId: 'user_rec_cloudmatrix',
      recruiterProfId: 'prof_rec_cloudmatrix',
      title: 'Backend Developer',
      company: 'CloudMatrix Labs',
      location: 'Bangalore, Karnataka',
      empType: 'Full-time',
      workMode: 'On-site',
      salaryMin: 1100000,
      salaryMax: 1700000,
      minExp: 3,
      maxExp: 6,
      qual: 'Bachelor degree in Engineering / CS',
      desc: 'Join our cloud infrastructure team to develop high-throughput Node.js microservices and event-driven data streaming pipelines.',
      resp: '• Build scalable backend services using Node.js, Express, and PostgreSQL.\n• Implement message queues and caching layers with Redis and Kafka.\n• Ensure application security, authentication, and token management.\n• Optimize server latency and resource utilization.',
      reqSkills: ['Node.js', 'Express', 'PostgreSQL', 'REST API'],
      prefSkills: ['GraphQL', 'Docker', 'Microservices', 'Redis']
    },
    {
      id: 'job_demo_frontend_dev',
      recruiterId: recUserId,
      recruiterProfId: recProfId,
      title: 'Frontend Developer',
      company: 'Nexora Technologies',
      location: 'Chennai, Tamil Nadu',
      empType: 'Full-time',
      workMode: 'Hybrid',
      salaryMin: 800000,
      salaryMax: 1400000,
      minExp: 2,
      maxExp: 4,
      qual: 'B.Tech / B.Sc in Computer Science',
      desc: 'Craft sleek, high-performance UI components for our enterprise SaaS analytics dashboards.',
      resp: '• Implement responsive user interfaces with React, JavaScript, HTML, and CSS.\n• Optimize component rendering and browser asset bundling.\n• Collaborate with UX designers to translate wireframes into living applications.',
      reqSkills: ['React', 'JavaScript', 'HTML', 'CSS'],
      prefSkills: ['TypeScript', 'Redux', 'Next.js', 'TailwindCSS']
    },
    {
      id: 'job_demo_java_dev',
      recruiterId: 'user_rec_inficore',
      recruiterProfId: 'prof_rec_inficore',
      title: 'Java Developer',
      company: 'InfiCore Systems',
      location: 'Mumbai, Maharashtra',
      empType: 'Full-time',
      workMode: 'On-site',
      salaryMin: 1200000,
      salaryMax: 1900000,
      minExp: 3,
      maxExp: 7,
      qual: 'B.Tech / M.Tech in CS or IT',
      desc: 'Build secure, scalable core financial engines using Java and Spring Boot microservices.',
      resp: '• Develop enterprise Java applications using Spring Boot and Hibernate.\n• Implement secure REST APIs and transaction handling protocols.\n• Design MySQL and Oracle database schemas for transactional integrity.',
      reqSkills: ['Java', 'Spring Boot', 'MySQL', 'REST API'],
      prefSkills: ['Hibernate', 'Kafka', 'Docker', 'JUnit']
    },
    {
      id: 'job_demo_data_analyst',
      recruiterId: 'user_rec_datanest',
      recruiterProfId: 'prof_rec_datanest',
      title: 'Data Analyst',
      company: 'DataNest Technologies',
      location: 'Pune, Maharashtra',
      empType: 'Full-time',
      workMode: 'Hybrid',
      salaryMin: 700000,
      salaryMax: 1200000,
      minExp: 1,
      maxExp: 4,
      qual: 'Degree in Statistics, Mathematics, or CS',
      desc: 'Transform complex business datasets into actionable operational dashboards and executive insights.',
      resp: '• Write complex SQL queries and data transformations.\n• Build interactive Power BI and Tableau dashboards.\n• Analyze trends, spot anomalies, and compile quantitative reports.',
      reqSkills: ['SQL', 'Python', 'Power BI', 'Excel'],
      prefSkills: ['Tableau', 'Pandas', 'Statistics', 'R']
    },
    {
      id: 'job_demo_data_scientist',
      recruiterId: 'user_rec_datanest',
      recruiterProfId: 'prof_rec_datanest',
      title: 'Data Scientist',
      company: 'DataNest Technologies',
      location: 'Pune, Maharashtra',
      empType: 'Full-time',
      workMode: 'Remote',
      salaryMin: 1400000,
      salaryMax: 2200000,
      minExp: 3,
      maxExp: 7,
      qual: 'Master / B.Tech in CS, Data Science, or AI',
      desc: 'Develop predictive machine learning models, predictive analytics, and natural language processing pipelines.',
      resp: '• Train ML models using Python, TensorFlow, PyTorch, and Scikit-Learn.\n• Clean, preprocess, and feature-engineer massive structured and unstructured datasets.\n• Deploy inference APIs in production cloud environments.',
      reqSkills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
      prefSkills: ['PyTorch', 'NLP', 'Scikit-Learn', 'FastAPI']
    },
    {
      id: 'job_demo_devops_eng',
      recruiterId: 'user_rec_cloudmatrix',
      recruiterProfId: 'prof_rec_cloudmatrix',
      title: 'DevOps Engineer',
      company: 'CloudMatrix Labs',
      location: 'Bangalore, Karnataka',
      empType: 'Full-time',
      workMode: 'Remote',
      salaryMin: 1300000,
      salaryMax: 2100000,
      minExp: 3,
      maxExp: 7,
      qual: 'B.Tech in Computer Science or IT',
      desc: 'Manage continuous deployment pipelines, Kubernetes cluster orchestration, and cloud infrastructure automation.',
      resp: '• Maintain CI/CD pipelines using GitHub Actions, Jenkins, and Docker.\n• Manage AWS cloud resources via Terraform and Ansible.\n• Monitor system health, uptime, and security auditing.',
      reqSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
      prefSkills: ['Terraform', 'Linux', 'Python', 'Bash']
    },
    {
      id: 'job_demo_sw_engineer',
      recruiterId: 'user_rec_blueorbit',
      recruiterProfId: 'prof_rec_blueorbit',
      title: 'Software Engineer',
      company: 'BlueOrbit Solutions',
      location: 'Hyderabad, Telangana',
      empType: 'Full-time',
      workMode: 'Hybrid',
      salaryMin: 850000,
      salaryMax: 1450000,
      minExp: 2,
      maxExp: 5,
      qual: 'B.Tech / B.E in CS',
      desc: 'Develop end-to-end software modules for web platforms and enterprise integrations.',
      resp: '• Write clean, testable JavaScript and Node.js code.\n• Perform code reviews, debug production defects, and document software architecture.\n• Maintain version control best practices with Git.',
      reqSkills: ['JavaScript', 'Node.js', 'SQL', 'Git'],
      prefSkills: ['React', 'Python', 'Unit Testing', 'Express']
    },
    {
      id: 'job_demo_react_dev',
      recruiterId: 'user_rec_techvista',
      recruiterProfId: 'prof_rec_techvista',
      title: 'React Developer',
      company: 'TechVista Solutions',
      location: 'Chennai, Tamil Nadu',
      empType: 'Full-time',
      workMode: 'Hybrid',
      salaryMin: 850000,
      salaryMax: 1350000,
      minExp: 2,
      maxExp: 5,
      qual: 'Bachelor degree in CS / IT',
      desc: 'Build client-facing dynamic web portals with modern React hooks, state management, and responsive layouts.',
      resp: '• Develop modular, re-usable React UI components.\n• Integrate REST endpoints with seamless loading states and error handling.\n• Ensure mobile responsiveness and cross-browser compliance.',
      reqSkills: ['React', 'JavaScript', 'Redux', 'HTML/CSS'],
      prefSkills: ['TypeScript', 'Jest', 'TailwindCSS', 'Vite']
    },
    {
      id: 'job_demo_nodejs_dev',
      recruiterId: recUserId,
      recruiterProfId: recProfId,
      title: 'Node.js Developer',
      company: 'Nexora Technologies',
      location: 'Chennai, Tamil Nadu',
      empType: 'Full-time',
      workMode: 'Remote',
      salaryMin: 950000,
      salaryMax: 1600000,
      minExp: 2,
      maxExp: 5,
      qual: 'B.Tech in Computer Science',
      desc: 'Architect event-driven Node.js REST services and database schemas for internal enterprise APIs.',
      resp: '• Develop fast, scalable backend APIs with Express and Node.js.\n• Optimize database queries in MongoDB and PostgreSQL.\n• Integrate third-party webhooks and microservice communication.',
      reqSkills: ['Node.js', 'Express', 'MongoDB', 'REST API'],
      prefSkills: ['TypeScript', 'Redis', 'WebSockets', 'Jest']
    },
    {
      id: 'job_demo_uiux_designer',
      recruiterId: 'user_rec_blueorbit',
      recruiterProfId: 'prof_rec_blueorbit',
      title: 'UI/UX Designer',
      company: 'BlueOrbit Solutions',
      location: 'Hyderabad, Telangana',
      empType: 'Full-time',
      workMode: 'Hybrid',
      salaryMin: 750000,
      salaryMax: 1300000,
      minExp: 2,
      maxExp: 5,
      qual: 'Degree in Design, Fine Arts, or CS',
      desc: 'Design intuitive candidate experience workflows, Figma wireframes, and polished UI component systems.',
      resp: '• Conduct user research, persona creation, and journey mapping.\n• Create interactive prototypes and high-fidelity mockups in Figma.\n• Design responsive dark and light design systems.',
      reqSkills: ['Figma', 'Wireframing', 'Prototyping', 'User Research'],
      prefSkills: ['HTML', 'CSS', 'Design Systems', 'Usability Testing']
    },
    {
      id: 'job_demo_ml_engineer',
      recruiterId: recUserId,
      recruiterProfId: recProfId,
      title: 'Machine Learning Engineer',
      company: 'Nexora Technologies',
      location: 'Chennai, Tamil Nadu',
      empType: 'Full-time',
      workMode: 'Remote',
      salaryMin: 1500000,
      salaryMax: 2400000,
      minExp: 3,
      maxExp: 7,
      qual: 'M.S. / B.Tech in CS or AI',
      desc: 'Deploy state-of-the-art NLP recommendation models and automated resume screening intelligence pipelines.',
      resp: '• Build machine learning training pipelines with PyTorch and Scikit-Learn.\n• Serve low-latency inference services with FastAPI and Docker.\n• Evaluate model drift, bias, and performance metrics.',
      reqSkills: ['Python', 'PyTorch', 'Scikit-Learn', 'Docker'],
      prefSkills: ['MLOps', 'FastAPI', 'OpenCV', 'TensorFlow']
    },
    {
      id: 'job_demo_qa_engineer',
      recruiterId: 'user_rec_inficore',
      recruiterProfId: 'prof_rec_inficore',
      title: 'QA Engineer',
      company: 'InfiCore Systems',
      location: 'Mumbai, Maharashtra',
      empType: 'Full-time',
      workMode: 'On-site',
      salaryMin: 700000,
      salaryMax: 1150000,
      minExp: 2,
      maxExp: 5,
      qual: 'Bachelor degree in CS / Engineering',
      desc: 'Lead automated regression testing, API test suites, and manual quality verification for financial web applications.',
      resp: '• Write automated UI test scripts using Selenium and Python.\n• Execute API test collections in Postman.\n• Report bugs, verify bug fixes, and maintain test documentation.',
      reqSkills: ['Selenium', 'Python', 'Manual Testing', 'Postman'],
      prefSkills: ['Cypress', 'CI/CD', 'SQL', 'JIRA']
    },
    {
      id: 'job_demo_dba',
      recruiterId: 'user_rec_datanest',
      recruiterProfId: 'prof_rec_datanest',
      title: 'Database Administrator',
      company: 'DataNest Technologies',
      location: 'Pune, Maharashtra',
      empType: 'Full-time',
      workMode: 'On-site',
      salaryMin: 1200000,
      salaryMax: 1850000,
      minExp: 4,
      maxExp: 8,
      qual: 'B.Tech / MCA in Computer Science',
      desc: 'Manage PostgreSQL enterprise clusters, index optimization, automated backups, and database security.',
      resp: '• Maintain PostgreSQL database performance, execution plans, and indexes.\n• Configure replication, failover, disaster recovery, and data security.\n• Write procedural scripts and automate database maintenance.',
      reqSkills: ['PostgreSQL', 'SQL', 'Performance Tuning', 'Backup & Recovery'],
      prefSkills: ['MySQL', 'Linux', 'Python', 'Bash']
    },
    {
      id: 'job_demo_cloud_engineer',
      recruiterId: 'user_rec_cloudmatrix',
      recruiterProfId: 'prof_rec_cloudmatrix',
      title: 'Cloud Engineer',
      company: 'CloudMatrix Labs',
      location: 'Bangalore, Karnataka',
      empType: 'Full-time',
      workMode: 'Remote',
      salaryMin: 1250000,
      salaryMax: 2000000,
      minExp: 3,
      maxExp: 7,
      qual: 'B.Tech in CS or IT',
      desc: 'Architect and manage cloud infrastructure on AWS, network security, IAM policies, and infrastructure-as-code.',
      resp: '• Provision infrastructure using Terraform and AWS CloudFormation.\n• Configure VPCs, load balancers, EC2, ECS, and S3 resources.\n• Enforce cloud security policies and optimize cloud expenditure.',
      reqSkills: ['AWS', 'Terraform', 'Linux', 'Bash'],
      prefSkills: ['Azure', 'Kubernetes', 'Python', 'Docker']
    },
    {
      id: 'job_demo_biz_analyst',
      recruiterId: 'user_rec_techvista',
      recruiterProfId: 'prof_rec_techvista',
      title: 'Business Analyst',
      company: 'TechVista Solutions',
      location: 'Chennai, Tamil Nadu',
      empType: 'Full-time',
      workMode: 'Hybrid',
      salaryMin: 800000,
      salaryMax: 1300000,
      minExp: 2,
      maxExp: 5,
      qual: 'B.Tech / MBA / BBA',
      desc: 'Bridge executive product goals and engineering deliverables by gathering detailed business specifications.',
      resp: '• Document functional requirements, user stories, and acceptance criteria in JIRA.\n• Run sprint planning, backlog grooming, and stakeholder alignment meetings.\n• Query SQL databases for user activity and performance metrics.',
      reqSkills: ['Requirements Gathering', 'Agile', 'SQL', 'JIRA'],
      prefSkills: ['UML', 'Data Visualization', 'Process Mapping', 'Excel']
    },
    {
      id: 'job_demo_product_engineer',
      recruiterId: 'user_rec_blueorbit',
      recruiterProfId: 'prof_rec_blueorbit',
      title: 'Product Engineer',
      company: 'BlueOrbit Solutions',
      location: 'Hyderabad, Telangana',
      empType: 'Full-time',
      workMode: 'Remote',
      salaryMin: 1400000,
      salaryMax: 2200000,
      minExp: 4,
      maxExp: 8,
      qual: 'B.Tech in CS',
      desc: 'Combine software engineering leadership with user product intuition to build high-impact customer platforms.',
      resp: '• Architect full stack applications using React, Node.js, and PostgreSQL.\n• Drive technical roadmap, API specifications, and database schemas.\n• Collaborate directly with product leads and customer feedback.',
      reqSkills: ['Full Stack Development', 'Product Design', 'System Architecture', 'Node.js'],
      prefSkills: ['React', 'PostgreSQL', 'Cloud Architecture', 'TypeScript']
    }
  ];

  for (const j of jobSeeds) {
    db.prepare(`
      INSERT INTO jobs (
        id, recruiter_id, recruiter_profile_id, title, company_name, location, employment_type, work_mode,
        salary_min, salary_max, currency, salary_period, salary_disclosed, min_experience, max_experience,
        qualification, description, responsibilities, status, published_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, 'INR', 'year', 1, ?, ?,
        ?, ?, ?, 'Published', datetime('now')
      )
    `).run(
      j.id, j.recruiterId, j.recruiterProfId, j.title, j.company, j.location, j.empType, j.workMode,
      j.salaryMin, j.salaryMax, j.minExp, j.maxExp,
      j.qual, j.desc, j.resp
    );

    for (const reqS of j.reqSkills) {
      db.prepare(`INSERT INTO job_required_skills (id, job_id, name) VALUES (?, ?, ?)`).run(crypto.randomUUID(), j.id, reqS);
    }
    for (const prefS of j.prefSkills) {
      db.prepare(`INSERT INTO job_preferred_skills (id, job_id, name) VALUES (?, ?, ?)`).run(crypto.randomUUID(), j.id, prefS);
    }
  }

  // ------------------------------------------------------------
  // 4. CANDIDATES (~25 Candidates) & RESUME GENERATION (Section 7 & 8)
  // ------------------------------------------------------------
  console.log('🎓 Creating 25 fictional candidate profiles & uploading resumes...');

  const candidateList = [
    {
      userId: candUserId,
      profId: candProfId,
      email: 'candidate@resumio.demo',
      name: 'Rahul Sharma',
      location: 'Chennai, Tamil Nadu',
      headline: 'Full Stack Developer',
      summary: 'Full Stack Developer with 2+ years of experience building web applications using React, Node.js, Python and PostgreSQL.',
      expYears: 2.5,
      degree: 'B.Tech in Computer Science',
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Django', 'PostgreSQL', 'SQL', 'REST API', 'Git', 'HTML', 'CSS', 'Docker']
    },
    {
      userId: 'user_cand_priya_krishnan',
      profId: 'prof_cand_priya_krishnan',
      email: 'priya.krishnan@resumio.demo',
      name: 'Priya Krishnan',
      location: 'Chennai, Tamil Nadu',
      headline: 'Senior Python & Backend Engineer',
      summary: 'Experienced Python Engineer specializing in Django REST framework, PostgreSQL optimization, Redis caching, and microservices.',
      expYears: 3.5,
      degree: 'B.Tech in Computer Science',
      skills: ['Python', 'Django', 'PostgreSQL', 'REST API', 'Redis', 'Docker', 'Git', 'SQL', 'FastAPI', 'AWS']
    },
    {
      userId: 'user_cand_vikram_reddy',
      profId: 'prof_cand_vikram_reddy',
      email: 'vikram.reddy@resumio.demo',
      name: 'Vikram Reddy',
      location: 'Bangalore, Karnataka',
      headline: 'Python Developer',
      summary: 'Mid-level Python Developer with hands-on experience in Django APIs, PostgreSQL queries, and web backend development.',
      expYears: 1.5,
      degree: 'B.Sc in Computer Science',
      skills: ['Python', 'Django', 'SQL', 'REST API', 'Git', 'HTML', 'CSS']
    },
    {
      userId: 'user_cand_karthik_raj',
      profId: 'prof_cand_karthik_raj',
      email: 'karthik.raj@resumio.demo',
      name: 'Karthik Raj',
      location: 'Coimbatore, Tamil Nadu',
      headline: 'Junior Developer',
      summary: 'Beginner Java enthusiast interested in transitioning into web programming and database scripts.',
      expYears: 0.5,
      degree: 'Diploma in Information Technology',
      skills: ['Java', 'HTML', 'CSS', 'Basic SQL']
    },
    {
      userId: 'user_cand_sneha_nair',
      profId: 'prof_cand_sneha_nair',
      email: 'sneha.nair@resumio.demo',
      name: 'Sneha Nair',
      location: 'Kochi, Kerala',
      headline: 'Senior Python & ML Engineer',
      summary: 'Python software engineer with 4 years of expertise in Django web services, PostgreSQL, PyTorch, and cloud deployment.',
      expYears: 4.0,
      degree: 'M.Tech in Software Engineering',
      skills: ['Python', 'Django', 'PostgreSQL', 'REST API', 'AWS', 'Docker', 'PyTorch', 'Machine Learning', 'SQL']
    },
    {
      userId: 'user_cand_arjun_menon',
      profId: 'prof_cand_arjun_menon',
      email: 'arjun.menon@resumio.demo',
      name: 'Arjun Menon',
      location: 'Chennai, Tamil Nadu',
      headline: 'Full Stack Engineer (React & Node.js)',
      summary: 'Versatile developer proficient in React client interfaces, Node.js backend REST APIs, PostgreSQL databases, and Docker containerization.',
      expYears: 3.0,
      degree: 'B.E. in Computer Science',
      skills: ['React', 'Node.js', 'JavaScript', 'SQL', 'TypeScript', 'Docker', 'TailwindCSS', 'Express', 'Git']
    },
    {
      userId: 'user_cand_divya_kumar',
      profId: 'prof_cand_divya_kumar',
      email: 'divya.kumar@resumio.demo',
      name: 'Divya Kumar',
      location: 'Hyderabad, Telangana',
      headline: 'Full Stack Developer',
      summary: 'Full Stack Developer experienced in React user interfaces, Express API routing, and relational databases.',
      expYears: 2.0,
      degree: 'B.Tech in IT',
      skills: ['React', 'Node.js', 'JavaScript', 'SQL', 'HTML', 'CSS', 'Git']
    },
    {
      userId: 'user_cand_naveen_kumar',
      profId: 'prof_cand_naveen_kumar',
      email: 'naveen.kumar@resumio.demo',
      name: 'Naveen Kumar',
      location: 'Madurai, Tamil Nadu',
      headline: 'Trainee Software Developer',
      summary: 'Recent graduate with academic project experience in HTML/CSS web design and elementary JavaScript.',
      expYears: 0.0,
      degree: 'B.Sc in Computer Science',
      skills: ['HTML', 'CSS', 'JavaScript']
    },
    {
      userId: 'user_cand_ananya_iyer',
      profId: 'prof_cand_ananya_iyer',
      email: 'ananya.iyer@resumio.demo',
      name: 'Ananya Iyer',
      location: 'Chennai, Tamil Nadu',
      headline: 'Data Analyst & BI Specialist',
      summary: 'Data Analyst with 3 years of experience in SQL queries, Python data analytics, Power BI dashboards, and business insights.',
      expYears: 3.0,
      degree: 'B.Sc in Statistics & Data Science',
      skills: ['SQL', 'Python', 'Power BI', 'Excel', 'Tableau', 'Pandas', 'Statistics']
    },
    {
      userId: 'user_cand_siddharth_rao',
      profId: 'prof_cand_siddharth_rao',
      email: 'siddharth.rao@resumio.demo',
      name: 'Siddharth Rao',
      location: 'Bangalore, Karnataka',
      headline: 'Senior DevOps & Cloud Engineer',
      summary: 'DevOps Engineer managing Kubernetes clusters, AWS cloud infrastructure, Docker containerization, and Terraform automation.',
      expYears: 4.0,
      degree: 'B.Tech in Computer Science',
      skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform', 'Linux', 'Python', 'Bash']
    },
    {
      userId: 'user_cand_rohan_gupta',
      profId: 'prof_cand_rohan_gupta',
      email: 'rohan.gupta@resumio.demo',
      name: 'Rohan Gupta',
      location: 'Delhi NCR',
      headline: 'Frontend React Engineer',
      summary: 'Frontend specialist crafting responsive user interfaces with React, Redux, TypeScript, and modern CSS frameworks.',
      expYears: 3.0,
      degree: 'B.Tech in CS',
      skills: ['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript', 'Redux', 'TailwindCSS', 'Git']
    },
    {
      userId: 'user_cand_kavya_subramanian',
      profId: 'prof_cand_kavya_subramanian',
      email: 'kavya.subramanian@resumio.demo',
      name: 'Kavya Subramanian',
      location: 'Chennai, Tamil Nadu',
      headline: 'Backend Developer',
      summary: 'Backend Engineer building RESTful web services in Node.js, Express, PostgreSQL, and Redis.',
      expYears: 2.0,
      degree: 'B.E. in IT',
      skills: ['Node.js', 'Express', 'PostgreSQL', 'REST API', 'SQL', 'Git']
    },
    {
      userId: 'user_cand_manish_patel',
      profId: 'prof_cand_manish_patel',
      email: 'manish.patel@resumio.demo',
      name: 'Manish Patel',
      location: 'Ahmedabad, Gujarat',
      headline: 'Senior Cloud Engineer',
      summary: 'AWS Certified Cloud Engineer with extensive Terraform infrastructure automation, Linux administration, and Bash scripting.',
      expYears: 4.5,
      degree: 'B.Tech in CS',
      skills: ['AWS', 'Terraform', 'Linux', 'Bash', 'Docker', 'Kubernetes', 'Python']
    },
    {
      userId: 'user_cand_deepika_verma',
      profId: 'prof_cand_deepika_verma',
      email: 'deepika.verma@resumio.demo',
      name: 'Deepika Verma',
      location: 'Pune, Maharashtra',
      headline: 'Senior Data Scientist',
      summary: 'Data Scientist specializing in Python machine learning algorithms, TensorFlow predictive modeling, and SQL feature engineering.',
      expYears: 3.5,
      degree: 'M.S. in Data Analytics',
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'PyTorch', 'NLP', 'Scikit-Learn', 'Pandas']
    },
    {
      userId: 'user_cand_aravind_swamy',
      profId: 'prof_cand_aravind_swamy',
      email: 'aravind.swamy@resumio.demo',
      name: 'Aravind Swamy',
      location: 'Chennai, Tamil Nadu',
      headline: 'QA Automation Engineer',
      summary: 'Quality Assurance Engineer writing Python automation scripts, Selenium web tests, and Postman API verification collections.',
      expYears: 2.5,
      degree: 'B.Tech in IT',
      skills: ['Selenium', 'Python', 'Manual Testing', 'Postman', 'SQL', 'JIRA']
    },
    {
      userId: 'user_cand_meera_nambiar',
      profId: 'prof_cand_meera_nambiar',
      email: 'meera.nambiar@resumio.demo',
      name: 'Meera Nambiar',
      location: 'Kochi, Kerala',
      headline: 'UI/UX Designer',
      summary: 'Product UI/UX Designer crafting user-centric Figma wireframes, interactive prototypes, design systems, and responsive web layouts.',
      expYears: 3.0,
      degree: 'Bachelor of Design (B.Des)',
      skills: ['Figma', 'Wireframing', 'Prototyping', 'User Research', 'HTML', 'CSS', 'Design Systems']
    },
    {
      userId: 'user_cand_tarun_bhatia',
      profId: 'prof_cand_tarun_bhatia',
      email: 'tarun.bhatia@resumio.demo',
      name: 'Tarun Bhatia',
      location: 'Noida, UP',
      headline: 'Node.js Developer',
      summary: 'Node.js Developer building RESTful microservices, MongoDB document schemas, and Express routing.',
      expYears: 1.5,
      degree: 'B.C.A.',
      skills: ['Node.js', 'Express', 'MongoDB', 'REST API', 'JavaScript']
    },
    {
      userId: 'user_cand_pooja_hegde',
      profId: 'prof_cand_pooja_hegde',
      email: 'pooja.hegde@resumio.demo',
      name: 'Pooja Hegde',
      location: 'Mangalore, Karnataka',
      headline: 'Graduate Trainee Engineer',
      summary: 'Fresh graduate seeking entry-level software development role with foundational knowledge of Python and SQL.',
      expYears: 0.0,
      degree: 'B.E. in CS',
      skills: ['Python', 'SQL', 'HTML', 'CSS']
    },
    {
      userId: 'user_cand_aditya_varma',
      profId: 'prof_cand_aditya_varma',
      email: 'aditya.varma@resumio.demo',
      name: 'Aditya Varma',
      location: 'Hyderabad, Telangana',
      headline: 'Lead Database Administrator',
      summary: 'Senior Database Administrator managing PostgreSQL enterprise server clusters, performance tuning, indexing, and disaster recovery.',
      expYears: 5.0,
      degree: 'B.Tech in CS',
      skills: ['PostgreSQL', 'SQL', 'Performance Tuning', 'Backup & Recovery', 'MySQL', 'Linux', 'Python']
    },
    {
      userId: 'user_cand_swati_kulkarni',
      profId: 'prof_cand_swati_kulkarni',
      email: 'swati.kulkarni@resumio.demo',
      name: 'Swati Kulkarni',
      location: 'Pune, Maharashtra',
      headline: 'Machine Learning Engineer',
      summary: 'ML Engineer deploying PyTorch deep learning models, Scikit-Learn classifiers, and Dockerized FastAPI prediction microservices.',
      expYears: 3.0,
      degree: 'M.Tech in AI & Data Science',
      skills: ['Python', 'PyTorch', 'Scikit-Learn', 'Docker', 'FastAPI', 'Machine Learning', 'SQL']
    },
    {
      userId: 'user_cand_gautam_das',
      profId: 'prof_cand_gautam_das',
      email: 'gautam.das@resumio.demo',
      name: 'Gautam Das',
      location: 'Kolkata, WB',
      headline: 'Business Analyst',
      summary: 'Agile Business Analyst specializing in functional requirement specification, JIRA user stories, and SQL business reporting.',
      expYears: 2.0,
      degree: 'M.B.A. in Systems',
      skills: ['Requirements Gathering', 'Agile', 'SQL', 'JIRA', 'Excel', 'Process Mapping']
    },
    {
      userId: 'user_cand_shalini_sen',
      profId: 'prof_cand_shalini_sen',
      email: 'shalini.sen@resumio.demo',
      name: 'Shalini Sen',
      location: 'Kolkata, WB',
      headline: 'Product Engineer',
      summary: 'Full stack product engineer architecting scalable web applications, system design, React UIs, and Node.js microservices.',
      expYears: 4.0,
      degree: 'B.Tech in CS',
      skills: ['Full Stack Development', 'Product Design', 'System Architecture', 'Node.js', 'React', 'PostgreSQL']
    },
    {
      userId: 'user_cand_varun_agarwal',
      profId: 'prof_cand_varun_agarwal',
      email: 'varun.agarwal@resumio.demo',
      name: 'Varun Agarwal',
      location: 'Jaipur, Rajasthan',
      headline: 'Junior React Developer',
      summary: 'React Developer with 1 year of experience building modular frontend web components with Redux and HTML/CSS.',
      expYears: 1.0,
      degree: 'B.Tech in IT',
      skills: ['React', 'JavaScript', 'Redux', 'HTML/CSS', 'Git']
    },
    {
      userId: 'user_cand_nisha_pillai',
      profId: 'prof_cand_nisha_pillai',
      email: 'nisha.pillai@resumio.demo',
      name: 'Nisha Pillai',
      location: 'Trivandrum, Kerala',
      headline: 'Senior Java Developer',
      summary: 'Senior Java Developer building Spring Boot microservices, MySQL database architectures, Hibernate ORM, and REST APIs.',
      expYears: 4.0,
      degree: 'B.Tech in CS',
      skills: ['Java', 'Spring Boot', 'MySQL', 'REST API', 'Hibernate', 'Kafka', 'Docker']
    },
    {
      userId: 'user_cand_harish_chandran',
      profId: 'prof_cand_harish_chandran',
      email: 'harish.chandran@resumio.demo',
      name: 'Harish Chandran',
      location: 'Trichy, Tamil Nadu',
      headline: 'IT Support Technician',
      summary: 'IT Support Specialist with foundational computer hardware, networking, and basic HTML knowledge.',
      expYears: 0.5,
      degree: 'Diploma in Electrical Engineering',
      skills: ['HTML', 'Basic Networking', 'Windows Support']
    }
  ];

  for (const c of candidateList) {
    if (c.userId !== candUserId) {
      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, status)
        VALUES (?, ?, ?, 'candidate', 'active')
      `).run(c.userId, c.email, candPasswordHash);

      db.prepare(`
        INSERT INTO candidate_profiles (id, user_id, full_name, location, headline, bio, profile_completion)
        VALUES (?, ?, ?, ?, ?, ?, 80)
      `).run(c.profId, c.userId, c.name, c.location, c.headline, c.summary);

      for (const s of c.skills) {
        db.prepare(`
          INSERT INTO candidate_skills (id, candidate_profile_id, name, proficiency)
          VALUES (?, ?, ?, 'Advanced')
        `).run(crypto.randomUUID(), c.profId, s);
      }

      db.prepare(`
        INSERT INTO candidate_education (id, candidate_profile_id, degree, field_of_study, institution, location, start_date, end_date, currently_studying, grade_or_gpa)
        VALUES (?, ?, ?, 'Computer Science / IT', 'Reputed State University', ?, '2018-08', '2022-05', 0, 'CGPA 8.2')
      `).run(crypto.randomUUID(), c.profId, c.degree, c.location);

      if (c.expYears > 0) {
        db.prepare(`
          INSERT INTO candidate_experience (id, candidate_profile_id, job_title, company, employment_type, location, start_date, end_date, currently_working, description)
          VALUES (?, ?, ?, 'Tech Solutions Ltd', 'Full-time', ?, '2022-06', '', 1, ?)
        `).run(crypto.randomUUID(), c.profId, c.headline, c.location, c.summary);
      }
    }

    // Generate physical resume text file in server/uploads/resumes/
    const resumeId = `resume_${c.userId}`;
    const storedFilename = `${c.userId}_resume.txt`;
    const fullResumePath = path.join(resumeUploadDir, storedFilename);

    const resumeContent = `
NAME: ${c.name}
EMAIL: ${c.email}
LOCATION: ${c.location}
HEADLINE: ${c.headline}

PROFESSIONAL SUMMARY:
${c.summary}

SKILLS & PROFICIENCIES:
${c.skills.join(', ')}

EDUCATION:
${c.degree} - Reputed State University (Graduated 2022)

EXPERIENCE:
${c.headline} (${c.expYears} Years Experience)
- Executed software development, API design, code refactoring, and quality assurance.
- Collaborated with cross-functional engineering teams.

PROJECTS & CERTIFICATIONS:
- Enterprise Software Development & System Optimization
- Certified Professional in ${c.skills[0] || 'Software Engineering'}
`.trim();

    fs.writeFileSync(fullResumePath, resumeContent, 'utf-8');

    db.prepare(`
      INSERT INTO candidate_resumes (id, candidate_profile_id, original_filename, stored_filename, file_type, file_size, is_active)
      VALUES (?, ?, ?, ?, 'text/plain', ?, 1)
    `).run(resumeId, c.profId, `${c.name.replace(/\s+/g, '_')}_Resume.txt`, storedFilename, Buffer.byteLength(resumeContent));

    // Process & screen resume through the actual processing pipeline
    try {
      await processResumeAndScreen(resumeId, c.userId, c.profId, storedFilename);
    } catch (e) {
      console.warn(`Warning parsing resume for ${c.name}:`, e);
    }

    // Update dynamic candidate completion percentage
    recalculateCandidateCompletion(c.profId);
  }

  // ------------------------------------------------------------
  // 5. APPLICATIONS & AI MATCHING DATA (~60+ Applications) (Section 9, 10, 11, 12)
  // ------------------------------------------------------------
  console.log('📝 Creating job applications, AI match scores, status history, and summaries...');

  const appSeeds: Array<{
    candId: string;
    candProfId: string;
    jobId: string;
    status: 'Applied' | 'Under Review' | 'Shortlisted' | 'Rejected' | 'Withdrawn';
    rejectionReason?: string;
  }> = [
    // --- PYTHON DEVELOPER (Nexora Technologies - Arjun Mehta) ---
    { candId: candUserId, candProfId: candProfId, jobId: 'job_demo_python_dev', status: 'Shortlisted' },
    { candId: 'user_cand_priya_krishnan', candProfId: 'prof_cand_priya_krishnan', jobId: 'job_demo_python_dev', status: 'Under Review' },
    { candId: 'user_cand_vikram_reddy', candProfId: 'prof_cand_vikram_reddy', jobId: 'job_demo_python_dev', status: 'Under Review' },
    { candId: 'user_cand_karthik_raj', candProfId: 'prof_cand_karthik_raj', jobId: 'job_demo_python_dev', status: 'Rejected', rejectionReason: 'Does not possess required Python/Django background.' },
    { candId: 'user_cand_sneha_nair', candProfId: 'prof_cand_sneha_nair', jobId: 'job_demo_python_dev', status: 'Shortlisted' },
    { candId: 'user_cand_pooja_hegde', candProfId: 'prof_cand_pooja_hegde', jobId: 'job_demo_python_dev', status: 'Rejected', rejectionReason: 'Insufficient experience level.' },

    // --- FULL STACK DEVELOPER (Nexora Technologies - Arjun Mehta) ---
    { candId: 'user_cand_arjun_menon', candProfId: 'prof_cand_arjun_menon', jobId: 'job_demo_fullstack_dev', status: 'Shortlisted' },
    { candId: candUserId, candProfId: candProfId, jobId: 'job_demo_fullstack_dev', status: 'Under Review' },
    { candId: 'user_cand_divya_kumar', candProfId: 'prof_cand_divya_kumar', jobId: 'job_demo_fullstack_dev', status: 'Applied' },
    { candId: 'user_cand_naveen_kumar', candProfId: 'prof_cand_naveen_kumar', jobId: 'job_demo_fullstack_dev', status: 'Rejected', rejectionReason: 'Lacks core Node.js & SQL experience.' },
    { candId: 'user_cand_shalini_sen', candProfId: 'prof_cand_shalini_sen', jobId: 'job_demo_fullstack_dev', status: 'Shortlisted' },

    // --- BACKEND DEVELOPER (CloudMatrix Labs) ---
    { candId: 'user_cand_kavya_subramanian', candProfId: 'prof_cand_kavya_subramanian', jobId: 'job_demo_backend_dev', status: 'Shortlisted' },
    { candId: 'user_cand_arjun_menon', candProfId: 'prof_cand_arjun_menon', jobId: 'job_demo_backend_dev', status: 'Under Review' },
    { candId: candUserId, candProfId: candProfId, jobId: 'job_demo_backend_dev', status: 'Under Review' },
    { candId: 'user_cand_tarun_bhatia', candProfId: 'prof_cand_tarun_bhatia', jobId: 'job_demo_backend_dev', status: 'Applied' },

    // --- FRONTEND DEVELOPER (Nexora Technologies - Arjun Mehta) ---
    { candId: 'user_cand_rohan_gupta', candProfId: 'prof_cand_rohan_gupta', jobId: 'job_demo_frontend_dev', status: 'Shortlisted' },
    { candId: 'user_cand_varun_agarwal', candProfId: 'prof_cand_varun_agarwal', jobId: 'job_demo_frontend_dev', status: 'Under Review' },
    { candId: 'user_cand_arjun_menon', candProfId: 'prof_cand_arjun_menon', jobId: 'job_demo_frontend_dev', status: 'Applied' },

    // --- JAVA DEVELOPER (InfiCore Systems) ---
    { candId: 'user_cand_nisha_pillai', candProfId: 'prof_cand_nisha_pillai', jobId: 'job_demo_java_dev', status: 'Shortlisted' },
    { candId: 'user_cand_karthik_raj', candProfId: 'prof_cand_karthik_raj', jobId: 'job_demo_java_dev', status: 'Under Review' },
    { candId: 'user_cand_harish_chandran', candProfId: 'prof_cand_harish_chandran', jobId: 'job_demo_java_dev', status: 'Rejected', rejectionReason: 'Missing Java/Spring Boot requirements.' },

    // --- DATA ANALYST (DataNest Technologies) ---
    { candId: 'user_cand_ananya_iyer', candProfId: 'prof_cand_ananya_iyer', jobId: 'job_demo_data_analyst', status: 'Shortlisted' },
    { candId: 'user_cand_gautam_das', candProfId: 'prof_cand_gautam_das', jobId: 'job_demo_data_analyst', status: 'Under Review' },

    // --- DATA SCIENTIST (DataNest Technologies) ---
    { candId: 'user_cand_deepika_verma', candProfId: 'prof_cand_deepika_verma', jobId: 'job_demo_data_scientist', status: 'Shortlisted' },
    { candId: 'user_cand_sneha_nair', candProfId: 'prof_cand_sneha_nair', jobId: 'job_demo_data_scientist', status: 'Under Review' },

    // --- DEVOPS ENGINEER (CloudMatrix Labs) ---
    { candId: 'user_cand_siddharth_rao', candProfId: 'prof_cand_siddharth_rao', jobId: 'job_demo_devops_eng', status: 'Shortlisted' },
    { candId: 'user_cand_manish_patel', candProfId: 'prof_cand_manish_patel', jobId: 'job_demo_devops_eng', status: 'Under Review' },

    // --- SOFTWARE ENGINEER (BlueOrbit Solutions) ---
    { candId: candUserId, candProfId: candProfId, jobId: 'job_demo_sw_engineer', status: 'Applied' },
    { candId: 'user_cand_divya_kumar', candProfId: 'prof_cand_divya_kumar', jobId: 'job_demo_sw_engineer', status: 'Under Review' },

    // --- REACT DEVELOPER (TechVista Solutions) ---
    { candId: 'user_cand_rohan_gupta', candProfId: 'prof_cand_rohan_gupta', jobId: 'job_demo_react_dev', status: 'Shortlisted' },
    { candId: 'user_cand_varun_agarwal', candProfId: 'prof_cand_varun_agarwal', jobId: 'job_demo_react_dev', status: 'Applied' },

    // --- NODE.JS DEVELOPER (Nexora Technologies - Arjun Mehta) ---
    { candId: 'user_cand_kavya_subramanian', candProfId: 'prof_cand_kavya_subramanian', jobId: 'job_demo_nodejs_dev', status: 'Shortlisted' },
    { candId: 'user_cand_tarun_bhatia', candProfId: 'prof_cand_tarun_bhatia', jobId: 'job_demo_nodejs_dev', status: 'Under Review' },

    // --- UI/UX DESIGNER (BlueOrbit Solutions) ---
    { candId: 'user_cand_meera_nambiar', candProfId: 'prof_cand_meera_nambiar', jobId: 'job_demo_uiux_designer', status: 'Shortlisted' },

    // --- MACHINE LEARNING ENGINEER (Nexora Technologies - Arjun Mehta) ---
    { candId: 'user_cand_swati_kulkarni', candProfId: 'prof_cand_swati_kulkarni', jobId: 'job_demo_ml_engineer', status: 'Shortlisted' },
    { candId: 'user_cand_deepika_verma', candProfId: 'prof_cand_deepika_verma', jobId: 'job_demo_ml_engineer', status: 'Under Review' },

    // --- QA ENGINEER (InfiCore Systems) ---
    { candId: 'user_cand_aravind_swamy', candProfId: 'prof_cand_aravind_swamy', jobId: 'job_demo_qa_engineer', status: 'Shortlisted' },

    // --- DATABASE ADMINISTRATOR (DataNest Technologies) ---
    { candId: 'user_cand_aditya_varma', candProfId: 'prof_cand_aditya_varma', jobId: 'job_demo_dba', status: 'Shortlisted' },

    // --- CLOUD ENGINEER (CloudMatrix Labs) ---
    { candId: 'user_cand_manish_patel', candProfId: 'prof_cand_manish_patel', jobId: 'job_demo_cloud_engineer', status: 'Shortlisted' },

    // --- BUSINESS ANALYST (TechVista Solutions) ---
    { candId: 'user_cand_gautam_das', candProfId: 'prof_cand_gautam_das', jobId: 'job_demo_biz_analyst', status: 'Shortlisted' },

    // --- PRODUCT ENGINEER (BlueOrbit Solutions) ---
    { candId: 'user_cand_shalini_sen', candProfId: 'prof_cand_shalini_sen', jobId: 'job_demo_product_engineer', status: 'Shortlisted' }
  ];

  for (const app of appSeeds) {
    const appId = `app_${app.candId}_${app.jobId}`;
    const resumeId = `resume_${app.candId}`;

    db.prepare(`
      INSERT INTO applications (id, candidate_id, candidate_profile_id, job_id, resume_id, cover_letter, status, rejection_reason, applied_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'I am excited to apply for this position and leverage my skills.', ?, ?, datetime('now', '-3 days'), datetime('now'))
    `).run(appId, app.candId, app.candProfId, app.jobId, resumeId, app.status, app.rejectionReason || '');

    // Create Application Status History Log
    db.prepare(`
      INSERT INTO application_status_history (id, application_id, old_status, new_status, changed_by, changed_by_role, note, changed_at)
      VALUES (?, ?, NULL, 'Applied', ?, 'candidate', 'Application submitted by candidate.', datetime('now', '-3 days'))
    `).run(crypto.randomUUID(), appId, app.candId);

    if (app.status !== 'Applied') {
      db.prepare(`
        INSERT INTO application_status_history (id, application_id, old_status, new_status, changed_by, changed_by_role, note, changed_at)
        VALUES (?, ?, 'Applied', 'Under Review', ?, 'recruiter', 'Recruiter opened application and reviewed profile.', datetime('now', '-2 days'))
      `).run(crypto.randomUUID(), appId, recUserId);
    }

    if (app.status === 'Shortlisted' || app.status === 'Rejected') {
      db.prepare(`
        INSERT INTO application_status_history (id, application_id, old_status, new_status, changed_by, changed_by_role, note, changed_at)
        VALUES (?, ?, 'Under Review', ?, ?, 'recruiter', ?, datetime('now', '-1 day'))
      `).run(crypto.randomUUID(), appId, app.status, recUserId, app.rejectionReason || `Candidate ${app.status.toLowerCase()} for interview process.`);
    }

    // Compute AI Matching Record via Phase 6 Match Engine
    try {
      const matchRes = await ResumeJobMatchingService.computeMatch(resumeId, app.jobId, app.candId, app.candProfId, appId);
      
      // Fetch Job Title & Company Name for Candidate Summary
      const jobInfo = db.prepare('SELECT title, company_name FROM jobs WHERE id = ?').get(app.jobId) as any;
      if (jobInfo) {
        await CandidateSummaryService.generateSummary(matchRes, jobInfo.title, jobInfo.company_name || '');
      }
    } catch (mErr) {
      console.warn(`Notice computing match for ${appId}:`, mErr);
    }
  }

  // ------------------------------------------------------------
  // 6. INTERVIEWS (~10 Records) (Section 13)
  // ------------------------------------------------------------
  console.log('📅 Creating realistic interview records...');

  const interviewSeeds = [
    {
      appId: `app_${candUserId}_job_demo_python_dev`,
      candId: candUserId,
      recId: recUserId,
      jobId: 'job_demo_python_dev',
      title: 'Technical Round 1: Python Architecture & System Design',
      type: 'Video',
      scheduledAt: '2026-09-22T10:30:00Z',
      duration: 45,
      meetingUrl: 'https://meet.google.com/resumio-python-demo',
      status: 'Scheduled',
      desc: 'Technical discussion covering Python REST APIs, PostgreSQL schema design, and asynchronous task queues.'
    },
    {
      appId: 'app_user_cand_priya_krishnan_job_demo_python_dev',
      candId: 'user_cand_priya_krishnan',
      recId: recUserId,
      jobId: 'job_demo_python_dev',
      title: 'Technical Round 1: Backend Architecture',
      type: 'Video',
      scheduledAt: '2026-09-22T14:00:00Z',
      duration: 45,
      meetingUrl: 'https://meet.google.com/resumio-priya-python',
      status: 'Scheduled',
      desc: 'Deep dive into Django performance optimization and database query strategies.'
    },
    {
      appId: 'app_user_cand_ananya_iyer_job_demo_data_analyst',
      candId: 'user_cand_ananya_iyer',
      recId: 'user_rec_datanest',
      jobId: 'job_demo_data_analyst',
      title: 'Data Analytics & SQL Case Study',
      type: 'Video',
      scheduledAt: '2026-09-23T11:00:00Z',
      duration: 60,
      meetingUrl: 'https://meet.google.com/resumio-data-ananya',
      status: 'Scheduled',
      desc: 'Practical SQL query walkthrough and Power BI dashboard presentation.'
    },
    {
      appId: 'app_user_cand_arjun_menon_job_demo_fullstack_dev',
      candId: 'user_cand_arjun_menon',
      recId: recUserId,
      jobId: 'job_demo_fullstack_dev',
      title: 'In-Person Architecture Discussion',
      type: 'In Person',
      scheduledAt: '2026-09-24T14:00:00Z',
      duration: 60,
      location: 'Nexora Tech HQ, Floor 4, OMR Road, Chennai',
      status: 'Scheduled',
      desc: 'In-person technical interview with Senior Engineering Lead.'
    },
    {
      appId: 'app_user_cand_sneha_nair_job_demo_python_dev',
      candId: 'user_cand_sneha_nair',
      recId: recUserId,
      jobId: 'job_demo_python_dev',
      title: 'Initial Screening & Technical Discussion',
      type: 'Video',
      scheduledAt: '2026-09-21T15:00:00Z',
      duration: 45,
      meetingUrl: 'https://meet.google.com/resumio-sneha-done',
      status: 'Completed',
      desc: 'Initial technical evaluation completed successfully.'
    },
    {
      appId: 'app_user_cand_siddharth_rao_job_demo_devops_eng',
      candId: 'user_cand_siddharth_rao',
      recId: 'user_rec_cloudmatrix',
      jobId: 'job_demo_devops_eng',
      title: 'DevOps & Kubernetes Deep Dive',
      type: 'Phone',
      scheduledAt: '2026-09-20T11:30:00Z',
      duration: 30,
      status: 'Completed',
      desc: 'Phone screening on Docker, Kubernetes, and AWS infrastructure.'
    },
    {
      appId: 'app_user_cand_rohan_gupta_job_demo_frontend_dev',
      candId: 'user_cand_rohan_gupta',
      recId: recUserId,
      jobId: 'job_demo_frontend_dev',
      title: 'React UI Live Coding Session',
      type: 'Video',
      scheduledAt: '2026-09-25T16:00:00Z',
      duration: 60,
      meetingUrl: 'https://meet.google.com/resumio-rohan-react',
      status: 'Scheduled',
      desc: 'Hands-on React component design and state management code review.'
    },
    {
      appId: 'app_user_cand_manish_patel_job_demo_cloud_engineer',
      candId: 'user_cand_manish_patel',
      recId: 'user_rec_cloudmatrix',
      jobId: 'job_demo_cloud_engineer',
      title: 'AWS Infrastructure & Terraform Assessment',
      type: 'Video',
      scheduledAt: '2026-09-26T10:00:00Z',
      duration: 45,
      meetingUrl: 'https://meet.google.com/resumio-manish-cloud',
      status: 'Scheduled',
      desc: 'Cloud architecture design review.'
    },
    {
      appId: 'app_user_cand_karthik_raj_job_demo_python_dev',
      candId: 'user_cand_karthik_raj',
      recId: recUserId,
      jobId: 'job_demo_python_dev',
      title: 'Preliminary Screening',
      type: 'Video',
      scheduledAt: '2026-09-18T14:30:00Z',
      duration: 30,
      status: 'Cancelled',
      desc: 'Cancelled due to profile skill mismatch.'
    },
    {
      appId: 'app_user_cand_deepika_verma_job_demo_data_scientist',
      candId: 'user_cand_deepika_verma',
      recId: 'user_rec_datanest',
      jobId: 'job_demo_data_scientist',
      title: 'ML Model Deployment & Evaluation',
      type: 'Video',
      scheduledAt: '2026-09-27T11:00:00Z',
      duration: 60,
      meetingUrl: 'https://meet.google.com/resumio-deepika-ml',
      status: 'Scheduled',
      desc: 'Machine learning model architecture and evaluation discussion.'
    }
  ];

  for (const int of interviewSeeds) {
    const intId = `int_${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO interviews (id, application_id, candidate_id, recruiter_id, job_id, title, interview_type, scheduled_at, duration_minutes, location, meeting_url, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(intId, int.appId, int.candId, int.recId, int.jobId, int.title, int.type, int.scheduledAt, int.duration, int.location || '', int.meetingUrl || '', int.desc, int.status);

    db.prepare(`
      INSERT INTO interview_status_history (id, interview_id, old_status, new_status, new_scheduled_at, changed_by, changed_by_role, note)
      VALUES (?, ?, NULL, ?, ?, ?, 'recruiter', 'Interview created and scheduled.')
    `).run(crypto.randomUUID(), intId, int.status, int.scheduledAt, int.recId);
  }

  // ------------------------------------------------------------
  // 7. IN-APP NOTIFICATIONS (Section 14)
  // ------------------------------------------------------------
  console.log('🔔 Creating in-app notifications for demo users...');

  const notifications = [
    // Rahul Sharma notifications
    {
      userId: candUserId,
      type: 'application_status',
      title: 'Application Shortlisted',
      message: 'Your application for Python Developer at Nexora Technologies has been shortlisted for interviews.',
      entityType: 'application',
      entityId: `app_${candUserId}_job_demo_python_dev`,
      isRead: 0
    },
    {
      userId: candUserId,
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: 'Your interview for Python Developer has been scheduled for September 22, 2026 at 10:30 AM.',
      entityType: 'interview',
      entityId: 'int_01',
      isRead: 0
    },
    {
      userId: candUserId,
      type: 'application_status',
      title: 'Application Under Review',
      message: 'Your application for Full Stack Developer at Nexora Technologies is now under review.',
      entityType: 'application',
      entityId: `app_${candUserId}_job_demo_fullstack_dev`,
      isRead: 1
    },

    // Arjun Mehta notifications
    {
      userId: recUserId,
      type: 'application_status',
      title: 'New Applicant Received',
      message: 'Rahul Sharma applied for Python Developer.',
      entityType: 'application',
      entityId: `app_${candUserId}_job_demo_python_dev`,
      isRead: 1
    },
    {
      userId: recUserId,
      type: 'application_status',
      title: 'AI Screening Complete',
      message: 'AI Candidate Screening and Match calculations completed for Python Developer position.',
      entityType: 'job',
      entityId: 'job_demo_python_dev',
      isRead: 0
    },
    {
      userId: recUserId,
      type: 'interview_scheduled',
      title: 'Interview Confirmed',
      message: 'Technical Round 1 scheduled with Rahul Sharma for September 22, 2026 at 10:30 AM.',
      entityType: 'interview',
      entityId: 'int_01',
      isRead: 0
    }
  ];

  for (const n of notifications) {
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, related_entity_type, related_entity_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(crypto.randomUUID(), n.userId, n.type, n.title, n.message, n.entityType, n.entityId, n.isRead);
  }

  console.log('✅ Resumio Comprehensive Local Demo Database Seeded Successfully!');
  console.log('------------------------------------------------------------');
  console.log('🔑 DEMO LOGINS READY:');
  console.log('  Candidate: candidate@resumio.demo / Candidate@123');
  console.log('  Recruiter: recruiter@resumio.demo / Recruiter@123');
  console.log('  Admin:     admin@resumio.demo     / Admin@123');
  console.log('------------------------------------------------------------');
}

seedDatabase().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});

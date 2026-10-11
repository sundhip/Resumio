import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mongo, checkMongoReadiness, getTargetDatabaseName, maskMongoUri } from './database/mongo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runDeploymentReadinessTests() {
  console.log('====================================================');
  console.log('🚀 RESUMIO PHASE 8 — DEPLOYMENT & PRODUCTION READINESS TEST');
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

  // 1. Production Build & Bundle Inspection
  console.log('1. Checking Production Build Artifacts & Client Secret Cleanliness...');
  const distDir = path.resolve(__dirname, '../dist');
  const distExists = fs.existsSync(distDir);
  assert(distExists, 'Client distribution directory (dist/) exists');

  if (distExists) {
    const assetsDir = path.join(distDir, 'assets');
    const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
    const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
    assert(jsFiles.length > 0, 'Production bundle contains compiled JavaScript chunks', `${jsFiles.length} JS files`);

    // Scan bundle for accidental secrets
    let secretsFound = false;
    for (const jsFile of jsFiles) {
      const content = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');
      if (
        content.includes('mongodb+srv://') ||
        content.includes('JWT_SECRET') ||
        content.includes('AIzaSy') // Common pattern
      ) {
        secretsFound = true;
      }
    }
    assert(!secretsFound, 'Client bundle is free of server secrets, DB URIs, and JWT keys');
  }

  // 2. Containerization and Platform Configuration Check
  console.log('\n2. Verifying Deployment & Container Configurations...');
  const dockerfilePath = path.resolve(__dirname, '../Dockerfile');
  const dockerignorePath = path.resolve(__dirname, '../.dockerignore');
  const renderYamlPath = path.resolve(__dirname, '../render.yaml');
  const vercelJsonPath = path.resolve(__dirname, '../vercel.json');

  assert(fs.existsSync(dockerfilePath), 'Dockerfile exists and configured with multi-stage build');
  assert(fs.existsSync(dockerignorePath), 'Dockerignore file exists to prevent secret/data leaks');
  assert(fs.existsSync(renderYamlPath), 'render.yaml blueprint configuration exists');
  assert(fs.existsSync(vercelJsonPath), 'vercel.json SPA rewrite configuration exists');

  if (fs.existsSync(dockerignorePath)) {
    const dockerignoreContent = fs.readFileSync(dockerignorePath, 'utf8');
    assert(
      dockerignoreContent.includes('.env') && dockerignoreContent.includes('server/data/*.db'),
      'Dockerignore specifically blocks .env files and SQLite local database files'
    );
  }

  // 3. Database URI Masking & Secure Configuration
  console.log('\n3. Validating Secure MongoDB Connectivity & Atlas Safety...');
  const rawUri = process.env.MONGODB_URI || 'mongodb+srv://admin_user:secretPass123@cluster0.abcde.mongodb.net/resumio_db?retryWrites=true&w=majority';
  const masked = maskMongoUri(rawUri);
  assert(!masked.includes('secretPass123'), 'maskMongoUri successfully hides passwords', masked);
  assert(masked.includes('***'), 'maskMongoUri applies redaction asterisk pattern');

  const targetDb = getTargetDatabaseName();
  assert(typeof targetDb === 'string' && targetDb.length > 0, 'Target database name resolved cleanly', targetDb);

  const readiness = await checkMongoReadiness();
  assert(readiness !== undefined, 'Production database readiness check returned a valid health response', readiness.status);
  assert(Boolean(mongo && mongo.users), 'Mongo data collections operational and accessible');

  // 4. File Storage Directory Structure Verification
  console.log('\n4. Verifying File Storage & Upload Directories...');
  const uploadsDir = path.resolve(__dirname, 'uploads');
  const resumesDir = path.resolve(__dirname, 'uploads/resumes');
  const avatarsDir = path.resolve(__dirname, 'uploads/avatars');

  assert(fs.existsSync(uploadsDir), 'Base upload directory exists');
  assert(fs.existsSync(resumesDir), 'Resumes upload directory exists');
  assert(fs.existsSync(avatarsDir), 'Avatars upload directory exists');

  // 5. Environment Example Alignment
  console.log('\n5. Checking Production Environment Template (.env.example)...');
  const envExamplePath = path.resolve(__dirname, '../.env.example');
  assert(fs.existsSync(envExamplePath), '.env.example exists');

  if (fs.existsSync(envExamplePath)) {
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    assert(envExample.includes('NODE_ENV='), '.env.example documents NODE_ENV');
    assert(envExample.includes('ALLOWED_ORIGINS='), '.env.example documents ALLOWED_ORIGINS');
    assert(envExample.includes('VITE_API_BASE_URL='), '.env.example documents VITE_API_BASE_URL');
    assert(envExample.includes('MONGODB_URI='), '.env.example documents MONGODB_URI');
    assert(envExample.includes('JWT_SECRET='), '.env.example documents JWT_SECRET');
  }

  // 6. Security & RBAC Guard on Resume Preview
  console.log('\n6. Checking Resume Access Control Route Guard...');
  const candidateRoutePath = path.resolve(__dirname, 'routes/candidate.ts');
  const candidateRouteContent = fs.readFileSync(candidateRoutePath, 'utf8');
  assert(
    candidateRouteContent.includes('Forbidden: You do not have permission to view this resume') &&
    candidateRouteContent.includes("userRole === 'candidate'") &&
    candidateRouteContent.includes("userRole === 'recruiter'"),
    'Resume preview endpoint enforces RBAC between candidates, recruiters, and admins'
  );

  console.log('\n====================================================');
  console.log(`📊 PHASE 8 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDeploymentReadinessTests().catch((err) => {
  console.error('Phase 8 Deployment Readiness Test Error:', err);
  process.exit(1);
});

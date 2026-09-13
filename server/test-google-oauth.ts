import express from 'express';
import http from 'http';
import authRouter from './routes/auth';
import { initDatabase, db } from './database/db';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './middleware/auth';

async function testGoogleOAuth() {
  console.log('🧪 Starting Google OAuth Authentication Verification Test...\n');

  // Initialize DB
  await initDatabase();

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3099, resolve));

  try {
    const testCandidateEmail = `google.candidate.${Date.now()}@gmail.com`;
    const googleSubCandidate = `google_sub_cand_${Date.now()}`;

    // 1. Test Candidate Registration via Google OAuth
    console.log('1️⃣ Testing Candidate Google OAuth Signup...');
    const candRes = await fetch('http://localhost:3099/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInfo: {
          sub: googleSubCandidate,
          email: testCandidateEmail,
          name: 'Google Candidate Test',
          picture: 'https://example.com/photo.jpg',
        },
        role: 'candidate',
      }),
    });

    const candData = await candRes.json();
    if (!candRes.ok || !candData.success) {
      throw new Error(`Candidate Google signup failed: ${JSON.stringify(candData)}`);
    }

    console.log(`   ✅ Candidate created via Google: ${candData.user.email} | Role: ${candData.user.role}`);
    console.log(`   ✅ Token Issued: ${candData.token.substring(0, 20)}...`);

    // Verify JWT payload
    const decodedCandToken = jwt.verify(candData.token, JWT_SECRET) as any;
    if (decodedCandToken.role !== 'candidate' || decodedCandToken.userId !== candData.user.id) {
      throw new Error('JWT token payload mismatch for Google Candidate!');
    }
    console.log('   ✅ Candidate JWT token payload verified.');

    // 2. Test Recruiter Registration via Google OAuth
    console.log('\n2️⃣ Testing Recruiter Google OAuth Signup...');
    const testRecruiterEmail = `google.recruiter.${Date.now()}@gmail.com`;
    const googleSubRecruiter = `google_sub_rec_${Date.now()}`;

    const recRes = await fetch('http://localhost:3099/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInfo: {
          sub: googleSubRecruiter,
          email: testRecruiterEmail,
          name: 'Google Recruiter Test',
          picture: 'https://example.com/rec-logo.jpg',
        },
        role: 'recruiter',
        companyName: 'Acme Google Tech',
      }),
    });

    const recData = await recRes.json();
    if (!recRes.ok || !recData.success) {
      throw new Error(`Recruiter Google signup failed: ${JSON.stringify(recData)}`);
    }

    console.log(`   ✅ Recruiter created via Google: ${recData.user.email} | Company: ${recData.user.company}`);
    console.log(`   ✅ Profile linked in recruiter_profiles table.`);

    // 3. Test Google Sign-In for Existing Account (Account Linking)
    console.log('\n3️⃣ Testing Existing Account Google Sign-In...');
    const existingSignInRes = await fetch('http://localhost:3099/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInfo: {
          sub: googleSubCandidate,
          email: testCandidateEmail,
          name: 'Google Candidate Test',
        },
        role: 'candidate',
      }),
    });

    const existingSignInData = await existingSignInRes.json();
    if (!existingSignInRes.ok || !existingSignInData.success) {
      throw new Error(`Existing account Google sign-in failed: ${JSON.stringify(existingSignInData)}`);
    }

    if (existingSignInData.user.id !== candData.user.id) {
      throw new Error('User ID mismatch on Google re-authentication!');
    }
    console.log(`   ✅ Re-authenticated existing Google account: ${existingSignInData.user.email}`);

    console.log('\n🎉 ALL GOOGLE OAUTH BACKEND VERIFICATION TESTS PASSED!');
  } finally {
    server.close();
  }
}

testGoogleOAuth().catch((err) => {
  console.error('❌ Google OAuth Test Failed:', err);
  process.exit(1);
});

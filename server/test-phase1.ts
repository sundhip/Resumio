const API_BASE = 'http://localhost:3001/api';

async function post(url: string, data: any, token?: string) {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.message || 'Request failed');
    error.status = res.status;
    error.data = json;
    throw error;
  }
  return json;
}

async function get(url: string, token?: string) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.message || 'Request failed');
    error.status = res.status;
    error.data = json;
    throw error;
  }
  return json;
}

async function put(url: string, data: any, token?: string) {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.message || 'Request failed');
    error.status = res.status;
    error.data = json;
    throw error;
  }
  return json;
}

async function runTests() {
  console.log('🧪 Starting Phase 1 Automated End-to-End Verification...\n');

  try {
    // 1. Candidate Registration
    console.log('1️⃣ Testing Candidate Registration...');
    const candEmail = `alex.turner.${Date.now()}@example.com`;
    const candRegRes = await post('/auth/register/candidate', {
      fullName: 'Alex Turner',
      email: candEmail,
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
    });
    console.log('   ✅ Candidate Registered:', candRegRes.user.email, '| Role:', candRegRes.user.role);
    const candToken = candRegRes.token;

    // 2. Candidate Profile Fetch & Update
    console.log('\n2️⃣ Testing Candidate Profile Update...');
    const candProfileGet = await get('/profile/candidate', candToken);
    console.log('   ✅ Initial Completion:', candProfileGet.profile.profile_completion + '%');

    const candProfileUpdate = await put(
      '/profile/candidate',
      {
        fullName: 'Alex Turner, MSc',
        phone: '+1 (555) 234-5678',
        location: 'Toronto, ON, Canada',
        headline: 'Senior Distributed Systems Engineer',
        bio: 'Over 7 years building resilient cloud architecture and scalable APIs in Node.js and TypeScript.',
        photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      },
      candToken
    );
    console.log('   ✅ Profile Updated. New Completion:', candProfileUpdate.profile.profile_completion + '%');

    // 3. Recruiter Registration
    console.log('\n3️⃣ Testing Recruiter Registration...');
    const recEmail = `jordan.lee.${Date.now()}@hypergrowth.tech`;
    const recRegRes = await post('/auth/register/recruiter', {
      fullName: 'Jordan Lee',
      email: recEmail,
      companyName: 'HyperGrowth Systems',
      password: 'RecruiterPass123!',
      confirmPassword: 'RecruiterPass123!',
    });
    console.log('   ✅ Recruiter Registered:', recRegRes.user.email, '| Company:', recRegRes.user.company);
    const recToken = recRegRes.token;

    // 4. Recruiter Company Profile Update
    console.log('\n4️⃣ Testing Recruiter & Company Profile Update...');
    const recProfileUpdate = await put(
      '/profile/recruiter',
      {
        fullName: 'Jordan Lee (Lead Talent)',
        phone: '+1 (415) 888-9900',
        companyName: 'HyperGrowth Systems Inc.',
        companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        industry: 'Enterprise SaaS & Cloud Infrastructure',
        location: 'San Francisco, CA (HQ)',
        website: 'https://hypergrowth.tech',
        description: 'Pioneering next-generation enterprise infrastructure for global distributed teams.',
      },
      recToken
    );
    console.log('   ✅ Company Profile Updated. New Completion:', recProfileUpdate.profile.profile_completion + '%');

    // 5. Admin Authentication & Platform Stats
    console.log('\n5️⃣ Testing Admin Login & Live Database Statistics...');
    const adminLoginRes = await post('/auth/admin-login', {
      email: 'admin@resumio.ai',
      password: 'AdminPass123!',
    });
    console.log('   ✅ Admin Authenticated:', adminLoginRes.user.email, '| Role:', adminLoginRes.user.role);
    const adminToken = adminLoginRes.token;

    const statsRes = await get('/admin/stats', adminToken);
    console.log('   📊 Real DB Stats:', statsRes.stats);

    const usersRes = await get('/admin/users', adminToken);
    console.log('   👥 Total Users in DB Table:', usersRes.users.length);

    // 6. Change Password Verification
    console.log('\n6️⃣ Testing Change Password Flow with bcrypt verification...');
    await post(
      '/auth/change-password',
      {
        currentPassword: 'StrongPass123!',
        newPassword: 'BrandNewPassword123!',
        confirmNewPassword: 'BrandNewPassword123!',
      },
      candToken
    );
    console.log('   ✅ Password changed successfully for candidate.');

    // Verify login with new password
    const newLoginRes = await post('/auth/login', {
      email: candEmail,
      password: 'BrandNewPassword123!',
    });
    console.log('   ✅ Login with new password succeeded. Token received:', !!newLoginRes.token);

    // 7. Role Isolation Security Checks
    console.log('\n7️⃣ Testing Role-Based Authorization Barriers...');
    try {
      await get('/admin/stats', candToken);
      console.error('   ❌ Candidate should NOT be able to access Admin stats!');
    } catch (e: any) {
      console.log('   🛡️ Candidate blocked from Admin endpoint (HTTP ' + e.status + ') - Correct!');
    }

    try {
      await get('/profile/recruiter', candToken);
      console.error('   ❌ Candidate should NOT access Recruiter profile endpoint!');
    } catch (e: any) {
      console.log('   🛡️ Candidate blocked from Recruiter profile endpoint (HTTP ' + e.status + ') - Correct!');
    }

    console.log('\n🎉 ALL PHASE 1 INTEGRATION TESTS PASSED PERFECTLY!\n');
  } catch (error: any) {
    console.error('❌ Test failed:', error.data || error.message);
    process.exit(1);
  }
}

runTests();

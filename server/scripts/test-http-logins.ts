async function testHttpLogins() {
  console.log('🌐 Testing HTTP Authentication Logins against local Express server...');

  const credentials = [
    { role: 'Candidate', email: 'candidate@resumio.demo', password: 'Candidate@123' },
    { role: 'Recruiter', email: 'recruiter@resumio.demo', password: 'Recruiter@123' },
    { role: 'Admin', email: 'admin@resumio.demo', password: 'Admin@123' },
  ];

  for (const cred of credentials) {
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cred.email, password: cred.password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        console.log(`✅ ${cred.role} Login SUCCESS! (${cred.email}) - User ID: ${data.user.id}, Role: ${data.user.role}`);
      } else {
        console.error(`❌ ${cred.role} Login FAILED! Status: ${res.status}, Message: ${data.message}`);
      }
    } catch (err: any) {
      console.error(`❌ HTTP Request Error for ${cred.role}:`, err.message);
    }
  }
}

testHttpLogins();

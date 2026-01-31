// Test the alerts API directly
const API_BASE = 'http://localhost:3001';

async function testAlertsAPI() {
  console.log('\n=== Testing Alerts API ===\n');

  // First, login to get a token
  console.log('1. Logging in...');
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@flowlogic.ai',
      password: 'admin123'
    })
  });

  if (!loginRes.ok) {
    console.log('Login failed, trying to create user...');
    // Try to register
    const registerRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@flowlogic.ai',
        password: 'admin123',
        name: 'Admin User'
      })
    });

    if (!registerRes.ok) {
      const error = await registerRes.text();
      console.log('Register response:', error);
      console.log('\nTrying alerts without auth...');
    } else {
      console.log('User registered');
    }
  }

  let token = null;
  if (loginRes.ok) {
    const loginData = await loginRes.json();
    token = loginData.token;
    console.log('Login successful, got token');
  }

  // Try to fetch alerts
  console.log('\n2. Fetching alerts...');
  const alertsRes = await fetch(`${API_BASE}/api/alerts?limit=10`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });

  console.log('Status:', alertsRes.status);

  if (alertsRes.ok) {
    const data = await alertsRes.json();
    console.log('\nAPI Response structure:');
    console.log('- Has data array:', Array.isArray(data.data));
    console.log('- Has pagination:', !!data.pagination);
    console.log('- Alert count:', data.data?.length || 0);

    if (data.data && data.data.length > 0) {
      console.log('\nFirst alert:');
      const first = data.data[0];
      console.log(JSON.stringify(first, null, 2));

      console.log('\nAll alerts summary:');
      data.data.forEach((a, i) => {
        console.log(`  ${i + 1}. [${a.severity}] ${a.title}`);
        console.log(`      Type: ${a.type}, isResolved: ${a.isResolved}`);
      });
    }
  } else {
    const error = await alertsRes.text();
    console.log('Error:', error);
  }

  // Also check the dashboard endpoint
  console.log('\n3. Checking dashboard endpoint...');
  const dashRes = await fetch(`${API_BASE}/api/dashboard`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });

  if (dashRes.ok) {
    const dashData = await dashRes.json();
    console.log('Dashboard data:');
    console.log(JSON.stringify(dashData, null, 2));
  } else {
    console.log('Dashboard error:', await dashRes.text());
  }
}

testAlertsAPI().catch(console.error);

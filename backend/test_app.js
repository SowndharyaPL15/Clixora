const BASE_URL = 'http://localhost:5000/api';
const REDIRECT_URL = 'http://localhost:5000/r';

async function runTests() {
  const email = `test-${Date.now()}@example.com`;
  const password = 'Password123!';
  const name = 'Test User';

  console.log('--- STARTING BACKEND INTEGRATION TESTS ---');

  // 1. Test Register
  console.log(`\n1. Testing User Register with email: ${email}`);
  let token = '';
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    console.log('Register Response:', data);
    if (!res.ok) throw new Error(JSON.stringify(data));
    token = data.token;
  } catch (err) {
    console.error('Register Failed:', err.message);
    process.exit(1);
  }

  // 2. Test Login
  console.log('\n2. Testing User Login');
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    console.log('Login Response:', data);
    if (!res.ok) throw new Error(JSON.stringify(data));
    token = data.token;
  } catch (err) {
    console.error('Login Failed:', err.message);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 3. Test URL Shortening
  console.log('\n3. Testing URL Shortening');
  let shortCode = '';
  try {
    const res = await fetch(`${BASE_URL}/urls`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        original_url: 'https://google.com',
        expiry_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // tomorrow
      }),
    });
    const data = await res.json();
    console.log('URL Shortening Response:', data);
    if (!res.ok) throw new Error(JSON.stringify(data));
    shortCode = data.data.short_code;
  } catch (err) {
    console.error('Shortening Failed:', err.message);
    process.exit(1);
  }

  // 4. Test Redirection Redirecting
  console.log(`\n4. Testing Redirection for code: ${shortCode}`);
  try {
    const res = await fetch(`${REDIRECT_URL}/${shortCode}`, {
      redirect: 'manual'
    });
    console.log('Redirection Response Status:', res.status);
    console.log('Redirection target:', res.headers.get('location'));
  } catch (err) {
    console.error('Redirection Failed:', err.message);
    process.exit(1);
  }

  // 5. Test Analytics
  console.log(`\n5. Testing Analytics for code: ${shortCode}`);
  try {
    const res = await fetch(`${BASE_URL}/analytics/${shortCode}`);
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    console.log('Analytics Response URL:', data.data.url);
    console.log('Analytics Response Trends:', data.data.trends);
    console.log('Analytics Response Devices:', data.data.devices);
    console.log('Analytics Response Browsers:', data.data.browsers);
    console.log('Analytics Response Recent Visits Count:', data.data.recentVisits.length);
  } catch (err) {
    console.error('Analytics Failed:', err.message);
    process.exit(1);
  }

  console.log('\n--- ALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests();

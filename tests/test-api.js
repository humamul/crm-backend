/**
 * Automated End-to-End Test Suite for CRM Backend
 * Tests all Acceptance Criteria:
 * 1. Employee Registration & Login (JWT authentication)
 * 2. Public enquiry form submission (No auth required)
 * 3. Fetching unclaimed enquiries (counselor view)
 * 4. Claiming an enquiry (state transition, ownership)
 * 5. Isolation: Claimed enquiry no longer in unclaimed list
 * 6. Conflict prevention: Multiple counselors attempting to claim same lead
 * 7. Fetching counselor's private claimed leads
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000/api/v1';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING CRM BACKEND END-TO-END ACCEPTANCE TESTS');
  console.log('======================================================\n');

  try {
    const randomSuffix = Math.floor(Math.random() * 100000);

    // -----------------------------------------------------------------
    // TEST 1: Health Check
    // -----------------------------------------------------------------
    console.log('--- Test 1: Health Check ---');
    const healthRes = await request('GET', '/health');
    assert(healthRes.status === 200, 'Health check returns 200 OK');
    assert(healthRes.body.status === 'UP', 'Service status is UP');

    // -----------------------------------------------------------------
    // TEST 2: Public Form API (Without Authentication)
    // -----------------------------------------------------------------
    console.log('\n--- Test 2: Public Enquiry Submission (No Auth) ---');
    const enquiry1Payload = {
      name: 'Rohan Sharma',
      email: `rohan.${randomSuffix}@example.com`,
      phone: '+919876543210',
      courseInterest: 'Full Stack Node.js Masterclass',
    };
    const lead1Res = await request('POST', '/public/enquiries', enquiry1Payload);
    assert(lead1Res.status === 201, 'Public enquiry 1 created with HTTP 201');
    assert(lead1Res.body.data.status === 'UNCLAIMED', 'New enquiry status is UNCLAIMED');
    assert(lead1Res.body.data.claimedBy === null, 'claimedBy is initially null');
    const lead1Id = lead1Res.body.data.id;

    const enquiry2Payload = {
      name: 'Priya Verma',
      email: `priya.${randomSuffix}@example.com`,
      phone: '+919876543211',
      courseInterest: 'Data Science & AI',
    };
    const lead2Res = await request('POST', '/public/enquiries', enquiry2Payload);
    assert(lead2Res.status === 201, 'Public enquiry 2 created with HTTP 201');
    const lead2Id = lead2Res.body.data.id;

    // -----------------------------------------------------------------
    // TEST 3: Employee Registration & JWT Issuance
    // -----------------------------------------------------------------
    console.log('\n--- Test 3: Counselor Registration ---');
    const counselorAData = {
      name: 'Amit Patel',
      email: `amit.${randomSuffix}@crmcompany.com`,
      password: 'Password@123',
    };
    const regResA = await request('POST', '/auth/register', counselorAData);
    assert(regResA.status === 201, 'Counselor A registered with HTTP 201');
    assert(regResA.body.data.token !== undefined, 'Counselor A received JWT token');
    assert(regResA.body.data.user.email === counselorAData.email, 'Counselor A email matches');
    const tokenA = regResA.body.data.token;
    const counselorAId = regResA.body.data.user.id;

    const counselorBData = {
      name: 'Neha Gupta',
      email: `neha.${randomSuffix}@crmcompany.com`,
      password: 'Password@123',
    };
    const regResB = await request('POST', '/auth/register', counselorBData);
    assert(regResB.status === 201, 'Counselor B registered with HTTP 201');
    const tokenB = regResB.body.data.token;
    const counselorBId = regResB.body.data.user.id;

    // -----------------------------------------------------------------
    // TEST 4: Employee Login
    // -----------------------------------------------------------------
    console.log('\n--- Test 4: Counselor Login ---');
    const loginRes = await request('POST', '/auth/login', {
      email: counselorAData.email,
      password: 'Password@123',
    });
    assert(loginRes.status === 200, 'Counselor A logged in with HTTP 200');
    assert(loginRes.body.data.token !== undefined, 'Login issued valid JWT');

    // -----------------------------------------------------------------
    // TEST 5: Fetch Unclaimed Leads (Protected Endpoint)
    // -----------------------------------------------------------------
    console.log('\n--- Test 5: Fetch Unclaimed Leads ---');
    // Without token should fail
    const unauthFetch = await request('GET', '/enquiries/unclaimed');
    assert(unauthFetch.status === 401, 'Fetching without token rejected with 401 Unauthorized');

    // With token should succeed
    const unclaimedRes = await request('GET', '/enquiries/unclaimed', null, tokenA);
    assert(unclaimedRes.status === 200, 'Unclaimed leads fetched successfully');
    const foundLead1 = unclaimedRes.body.data.find((l) => l.id === lead1Id);
    const foundLead2 = unclaimedRes.body.data.find((l) => l.id === lead2Id);
    assert(foundLead1 !== undefined, 'Enquiry 1 appears in unclaimed public pool');
    assert(foundLead2 !== undefined, 'Enquiry 2 appears in unclaimed public pool');

    // -----------------------------------------------------------------
    // TEST 6: Claim Enquiry by Counselor A
    // -----------------------------------------------------------------
    console.log('\n--- Test 6: Claiming Enquiry ---');
    const claimRes = await request('POST', `/enquiries/${lead1Id}/claim`, null, tokenA);
    assert(claimRes.status === 200, 'Counselor A successfully claimed Enquiry 1');
    assert(claimRes.body.data.status === 'CLAIMED', 'Enquiry status changed to CLAIMED');
    assert(claimRes.body.data.claimedBy.id === counselorAId, 'Enquiry assigned to Counselor A');
    assert(claimRes.body.data.claimedAt !== null, 'claimedAt timestamp is populated');

    // -----------------------------------------------------------------
    // TEST 7: Isolation Verification (Public pool no longer shows claimed lead)
    // -----------------------------------------------------------------
    console.log('\n--- Test 7: Public Pool Isolation ---');
    const unclaimedAfterClaimRes = await request('GET', '/enquiries/unclaimed', null, tokenB);
    assert(unclaimedAfterClaimRes.status === 200, 'Counselor B fetched unclaimed leads');
    const isLead1StillPublic = unclaimedAfterClaimRes.body.data.some((l) => l.id === lead1Id);
    const isLead2StillPublic = unclaimedAfterClaimRes.body.data.some((l) => l.id === lead2Id);
    assert(!isLead1StillPublic, 'Claimed Enquiry 1 is NO LONGER visible in public unclaimed enquiries');
    assert(isLead2StillPublic, 'Unclaimed Enquiry 2 is still visible in public pool');

    // -----------------------------------------------------------------
    // TEST 8: Conflict / Concurrency: Counselor B cannot claim already claimed lead
    // -----------------------------------------------------------------
    console.log('\n--- Test 8: Conflict Handling for Already Claimed Lead ---');
    const doubleClaimRes = await request('POST', `/enquiries/${lead1Id}/claim`, null, tokenB);
    assert(doubleClaimRes.status === 409, 'Attempt to claim already claimed lead rejected with 409 Conflict');

    // -----------------------------------------------------------------
    // TEST 9: Fetch Counselor's Private Claimed Leads
    // -----------------------------------------------------------------
    console.log('\n--- Test 9: Fetch Counselor Private Claimed Leads ---');
    // Counselor A's list
    const counselorAListRes = await request('GET', '/enquiries/my-claimed', null, tokenA);
    assert(counselorAListRes.status === 200, 'Counselor A fetched claimed leads');
    const lead1InCounselorA = counselorAListRes.body.data.some((l) => l.id === lead1Id);
    assert(lead1InCounselorA, 'Enquiry 1 is present in Counselor A private claimed list');

    // Counselor B's list should NOT contain Enquiry 1
    const counselorBListRes = await request('GET', '/enquiries/my-claimed', null, tokenB);
    assert(counselorBListRes.status === 200, 'Counselor B fetched claimed leads');
    const lead1InCounselorB = counselorBListRes.body.data.some((l) => l.id === lead1Id);
    assert(!lead1InCounselorB, 'Enquiry 1 is NOT present in Counselor B private claimed list');

    console.log('\n======================================================');
    console.log('🎉 ALL ACCEPTANCE CRITERIA PASSED SUCCESSFULLY (100%)');
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runTests();

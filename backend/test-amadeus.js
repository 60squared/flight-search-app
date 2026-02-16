// Test script to verify Amadeus API credentials
require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.AMADEUS_API_KEY;
const API_SECRET = process.env.AMADEUS_API_SECRET;
const BASE_URL = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';

console.log('🔍 Testing Amadeus API Credentials...\n');
console.log('Base URL:', BASE_URL);
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 8)}...` : '❌ NOT SET');
console.log('API Secret:', API_SECRET ? `${API_SECRET.substring(0, 8)}...` : '❌ NOT SET');
console.log('\n' + '='.repeat(50));

if (!API_KEY || !API_SECRET) {
  console.error('\n❌ ERROR: API credentials not found in .env file');
  console.log('\nPlease set the following in backend/.env:');
  console.log('  AMADEUS_API_KEY=your_key_here');
  console.log('  AMADEUS_API_SECRET=your_secret_here');
  process.exit(1);
}

async function testCredentials() {
  try {
    console.log('\n📡 Attempting to get access token...');

    const response = await axios.post(
      `${BASE_URL}/v1/security/oauth2/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: API_KEY,
        client_secret: API_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('\n✅ SUCCESS! Your Amadeus API credentials are valid!\n');
    console.log('Token Details:');
    console.log('  - Type:', response.data.token_type);
    console.log('  - Expires in:', response.data.expires_in, 'seconds');
    console.log('  - Application:', response.data.application_name);
    console.log('\n🎉 You can now search for flights!');

  } catch (error) {
    console.log('\n❌ AUTHENTICATION FAILED!\n');

    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 401) {
        console.log('\n💡 SOLUTION:');
        console.log('Your API credentials are incorrect. Please:');
        console.log('1. Go to https://developers.amadeus.com');
        console.log('2. Log in to your account');
        console.log('3. Check your app credentials');
        console.log('4. Copy the correct API Key and API Secret');
        console.log('5. Update backend/.env with the correct values');
      }
    } else {
      console.error('Error:', error.message);
    }

    process.exit(1);
  }
}

testCredentials();

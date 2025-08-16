const fetch = require('node-fetch')

async function testSubscriptionAPI() {
  try {
    console.log('Testing subscription check API...')

    const response = await fetch('http://localhost:3000/api/subscription/check', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Subscription API Response:', JSON.stringify(data, null, 2))
      
      // Test plan name mapping
      const planMapping = {
        'zuper15': 'Starter',
        'zuper30': 'Most Popular', 
        'zuper360': 'Professional'
      }
      
      console.log('\n🔍 Plan Name Mapping Test:')
      console.log('User subscription plan:', data.subscription?.plan)
      console.log('Should display as:', planMapping[data.subscription?.plan] || 'Free')
      console.log('Subscription status:', data.subscription?.status)
      console.log('Is active:', data.subscription?.status === 'active')
      
    } else {
      console.log('❌ Subscription API Error:', response.status, response.statusText)
      const errorData = await response.text()
      console.log('Error details:', errorData)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testSubscriptionAPI()

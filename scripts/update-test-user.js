const { MongoClient } = require('mongodb')

async function updateTestUser() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    const users = db.collection('users')
    const payments = db.collection('payments')

    // Update test@example.com user to have active subscription
    const testUser = await users.findOne({ email: 'test@example.com' })
    
    if (testUser) {
      console.log('Updating test user subscription...')
      
      // Update user subscription
      const subscriptionEndDate = new Date()
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 15) // 15 days for Zuper 15

      const userUpdateResult = await users.updateOne(
        { email: 'test@example.com' },
        {
          $set: {
            subscriptionStatus: 'active',
            subscriptionPlan: 'zuper15',
            subscriptionExpiry: subscriptionEndDate,
            updatedAt: new Date()
          }
        }
      )

      if (userUpdateResult.modifiedCount > 0) {
        console.log('✅ Test user subscription activated')
      }

      // Create a test payment for test user
      const testPayment = {
        userId: testUser._id.toString(),
        razorpayOrderId: 'order_test_user_' + Date.now(),
        razorpayPaymentId: 'pay_test_user_' + Date.now(),
        amount: 49900, // ₹499 in paise
        currency: 'INR',
        status: 'paid',
        planName: 'Zuper 15',
        planDuration: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const paymentResult = await payments.insertOne(testPayment)
      console.log('✅ Test payment created for test user:', testPayment.razorpayOrderId)

      // Verify the changes
      const updatedUser = await users.findOne({ email: 'test@example.com' })
      const userPayments = await payments.find({ userId: testUser._id.toString() }).toArray()

      console.log('\n📊 Test User Final Status:')
      console.log('User subscription:', {
        status: updatedUser.subscriptionStatus,
        plan: updatedUser.subscriptionPlan,
        expiry: updatedUser.subscriptionExpiry
      })
      console.log('Payments:', userPayments.length)
      console.log('Paid payments:', userPayments.filter(p => p.status === 'paid').length)
    }

    // Also update adii@gmail.com to have more realistic data
    const adiiUser = await users.findOne({ email: 'adii@gmail.com' })
    
    if (adiiUser) {
      console.log('\nUpdating adii user with more realistic data...')
      
      // Add some usage data
      const userUpdateResult = await users.updateOne(
        { email: 'adii@gmail.com' },
        {
          $set: {
            contentGenerated: 5,
            imagesGenerated: 3,
            updatedAt: new Date()
          }
        }
      )

      if (userUpdateResult.modifiedCount > 0) {
        console.log('✅ Adii user usage data updated')
      }
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

updateTestUser()

const { MongoClient } = require('mongodb')

async function createTestPayment() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    const users = db.collection('users')
    const payments = db.collection('payments')

    // Create or find user
    const userEmail = 'adii@gmail.com'
    let user = await users.findOne({ email: userEmail })

    if (!user) {
      console.log('Creating new user...')
      const newUser = {
        email: userEmail,
        name: 'Adii',
        subscriptionStatus: 'free',
        subscriptionPlan: 'free',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await users.insertOne(newUser)
      user = { ...newUser, _id: result.insertedId }
      console.log('✅ User created:', user.email)
    } else {
      console.log('✅ User found:', user.email)
    }

    // Create a test payment for Zuper 15
    const testPayment = {
      userId: user._id.toString(),
      razorpayOrderId: 'order_test_' + Date.now(),
      razorpayPaymentId: 'pay_test_' + Date.now(),
      amount: 49900, // ₹499 in paise
      currency: 'INR',
      status: 'paid',
      planName: 'Zuper 15',
      planDuration: 15,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const paymentResult = await payments.insertOne(testPayment)
    console.log('✅ Test payment created:', testPayment.razorpayOrderId)

    // Update user subscription
    const subscriptionEndDate = new Date()
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 15) // 15 days for Zuper 15

    const userUpdateResult = await users.updateOne(
      { _id: user._id },
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
      console.log('✅ User subscription activated:', {
        plan: 'zuper15',
        expiry: subscriptionEndDate
      })
    }

    // Verify the changes
    const updatedUser = await users.findOne({ email: userEmail })
    const userPayments = await payments.find({ userId: user._id.toString() }).toArray()

    console.log('\n📊 Final Status:')
    console.log('User subscription:', {
      status: updatedUser.subscriptionStatus,
      plan: updatedUser.subscriptionPlan,
      expiry: updatedUser.subscriptionExpiry
    })
    console.log('Payments:', userPayments.length)
    console.log('Paid payments:', userPayments.filter(p => p.status === 'paid').length)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

createTestPayment()

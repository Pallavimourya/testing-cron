const { MongoClient } = require('mongodb')

async function debugPayments() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    const users = db.collection('users')
    const payments = db.collection('payments')

    // Find user by email
    const userEmail = 'adii@gmail.com' // Updated to correct email
    const user = await users.findOne({ email: userEmail })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('👤 User Details:', {
      email: user.email,
      name: user.name,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiry: user.subscriptionExpiry,
      createdAt: user.createdAt
    })

    // Check all payments for this user
    const userPayments = await payments.find({ userId: user._id.toString() }).toArray()
    
    console.log(`💰 Found ${userPayments.length} payments for user`)
    
    userPayments.forEach((payment, index) => {
      console.log(`\n📦 Payment ${index + 1}:`, {
        orderId: payment.razorpayOrderId,
        paymentId: payment.razorpayPaymentId,
        amount: payment.amount,
        status: payment.status,
        planName: payment.planName,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      })
    })

    // Check if any payments are marked as paid
    const paidPayments = userPayments.filter(p => p.status === 'paid')
    console.log(`\n✅ Paid payments: ${paidPayments.length}`)

    if (paidPayments.length > 0) {
      console.log('Latest paid payment:', paidPayments[0])
    }

    // Check if user subscription should be updated
    if (paidPayments.length > 0 && user.subscriptionStatus !== 'active') {
      console.log('\n⚠️  User has paid payments but subscription is not active!')
      console.log('This means payment verification failed or subscription update failed.')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

debugPayments()

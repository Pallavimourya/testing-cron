const { MongoClient } = require('mongodb')

async function checkAllData() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    const users = db.collection('users')
    const payments = db.collection('payments')

    // Check all users
    const allUsers = await users.find({}).toArray()
    console.log(`\n👥 Found ${allUsers.length} users:`)
    
    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. User:`, {
        email: user.email,
        name: user.name,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        createdAt: user.createdAt
      })
    })

    // Check all payments
    const allPayments = await payments.find({}).toArray()
    console.log(`\n💰 Found ${allPayments.length} payments:`)
    
    allPayments.forEach((payment, index) => {
      console.log(`\n${index + 1}. Payment:`, {
        orderId: payment.razorpayOrderId,
        paymentId: payment.razorpayPaymentId,
        userId: payment.userId,
        amount: payment.amount,
        status: payment.status,
        planName: payment.planName,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      })
    })

    // Check if any payments are marked as paid
    const paidPayments = allPayments.filter(p => p.status === 'paid')
    console.log(`\n✅ Paid payments: ${paidPayments.length}`)

    if (paidPayments.length > 0) {
      console.log('Latest paid payment:', paidPayments[0])
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

checkAllData()

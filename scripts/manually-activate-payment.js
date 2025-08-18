const { MongoClient } = require('mongodb')

async function manuallyActivatePayment() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    const users = db.collection('users')
    const payments = db.collection('payments')

    // Find user by email
    const userEmail = 'pallavi@gmail.com' // Replace with actual email
    const user = await users.findOne({ email: userEmail })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('👤 User found:', user.email)

    // Find the latest payment for this user
    const userPayments = await payments.find({ userId: user._id.toString() }).sort({ createdAt: -1 }).limit(1).toArray()
    
    if (userPayments.length === 0) {
      console.log('❌ No payments found for user')
      return
    }

    const latestPayment = userPayments[0]
    console.log('📦 Latest payment:', {
      orderId: latestPayment.razorpayOrderId,
      amount: latestPayment.amount,
      status: latestPayment.status,
      planName: latestPayment.planName
    })

    // Update payment status to paid
    const paymentResult = await payments.updateOne(
      { _id: latestPayment._id },
      {
        $set: {
          status: 'paid',
          razorpayPaymentId: 'manual_payment_id',
          updatedAt: new Date()
        }
      }
    )

    if (paymentResult.modifiedCount > 0) {
      console.log('✅ Payment status updated to paid')

      // Determine plan type from payment amount
      let planType = 'zuper30' // Default
      let durationDays = 30

      if (latestPayment.amount === 49900) {
        planType = 'zuper15'
        durationDays = 15
      } else if (latestPayment.amount === 79900) {
        planType = 'zuper30'
        durationDays = 30
      } else if (latestPayment.amount === 599900) {
        planType = 'zuper360'
        durationDays = 360
      }

      // Calculate subscription end date
      const subscriptionEndDate = new Date()
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + durationDays)

      // Update user subscription
      const userResult = await users.updateOne(
        { _id: user._id },
        {
          $set: {
            subscriptionStatus: 'active',
            subscriptionPlan: planType,
            subscriptionExpiry: subscriptionEndDate,
            updatedAt: new Date()
          }
        }
      )

      if (userResult.modifiedCount > 0) {
        console.log('✅ User subscription activated:', {
          planType,
          durationDays,
          subscriptionEndDate
        })
      } else {
        console.log('❌ Failed to update user subscription')
      }
    } else {
      console.log('❌ Failed to update payment status')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

manuallyActivatePayment()

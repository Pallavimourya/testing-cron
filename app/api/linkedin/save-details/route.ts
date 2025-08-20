import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectDB from '@/lib/mongodb'
import LinkedInDetails from '@/models/LinkedInDetails'
import { authOptions } from '../../auth/[...nextauth]/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB()
    const { fullName, email, mobile, company, username, password } = await req.json()
    if (!fullName || !email || !mobile || !company || !username || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    // Save details to LinkedInDetails collection
    await LinkedInDetails.create({
      userId: session.user.id,
      fullName,
      email,
      mobile,
      company,
      username,
      password,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving LinkedIn details:', error)
    return NextResponse.json({ error: 'Failed to save LinkedIn details' }, { status: 500 })
  }
}

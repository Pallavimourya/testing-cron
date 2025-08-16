import mongoose from 'mongoose'

const LinkedInDetailsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  company: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.LinkedInDetails || mongoose.model('LinkedInDetails', LinkedInDetailsSchema)

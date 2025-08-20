import mongoose, { Schema, type Document } from "mongoose"
import bcrypt from "bcryptjs"

export interface IAdmin extends Document {
  _id: string
  name: string
  email: string
  password: string
  role: "super_admin" | "admin"
  profilePhoto?: string
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin"],
      default: "admin",
    },
    profilePhoto: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: any) => {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        delete ret.password
        return ret
      },
    },
  },
)

// Indexes
AdminSchema.index({ email: 1 })
AdminSchema.index({ isActive: 1 })

// Pre-save middleware to hash password
AdminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(10)
      this.password = await bcrypt.hash(this.password, salt)
    } catch (err) {
      return next(err as any)
    }
  }
  next()
})

// Method to compare password
AdminSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema)

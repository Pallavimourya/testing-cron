import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function uploadImageToCloudinary(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const arrayBuffer = file.arrayBuffer()
    arrayBuffer
      .then((buffer) => {
        const base64 = Buffer.from(buffer).toString("base64")
        cloudinary.uploader.upload(
          `data:${file.type};base64,${base64}`,
          {
            folder: "linkzup-approved-content",
            resource_type: "image",
            transformation: [
              { width: 1200, height: 630, crop: "fill", gravity: "center" },
              { quality: "auto", fetch_format: "auto" }
            ]
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error)
              return reject(new Error(`Cloudinary upload failed: ${error.message}`))
            }
            if (!result || !result.secure_url) {
              return reject(new Error("Cloudinary upload failed: No secure URL returned."))
            }
            resolve(result.secure_url)
          },
        )
      })
      .catch(reject)
  })
}

export async function uploadBase64ToCloudinary(base64Image: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64Image,
      {
        folder: "linkzup-approved-content",
        resource_type: "image",
        transformation: [
          { width: 1200, height: 630, crop: "fill", gravity: "center" },
          { quality: "auto", fetch_format: "auto" }
        ]
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error)
          return reject(new Error(`Cloudinary upload failed: ${error.message}`))
        }
        if (!result || !result.secure_url) {
          return reject(new Error("Cloudinary upload failed: No secure URL returned."))
        }
        resolve(result.secure_url)
      },
    )
  })
}

export async function deleteImageFromCloudinary(imageUrl: string): Promise<void> {
  try {
    // Extract public ID from the Cloudinary URL
    const publicIdMatch = imageUrl.match(/\/v\d+\/(.+?)\./)
    if (!publicIdMatch || !publicIdMatch[1]) {
      console.warn("Could not extract public ID from Cloudinary URL:", imageUrl)
      return // Cannot delete if public ID is not found
    }
    const publicId = publicIdMatch[1]

    const result = await cloudinary.uploader.destroy(publicId)
    console.log("Cloudinary delete result:", result)
    if (result.result !== "ok" && result.result !== "not found") {
      console.warn(`Failed to delete image ${publicId} from Cloudinary: ${result.result}`)
    }
  } catch (error: any) {
    console.error("Error deleting image from Cloudinary:", error.message)
    // Do not throw, as deletion failure should not block main operation
  }
}

export default cloudinary

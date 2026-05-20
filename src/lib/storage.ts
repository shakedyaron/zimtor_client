import { supabase } from "@/lib/supabase"

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"]

type BusinessImageBucket = "business-logos" | "business-covers"

function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("אפשר להעלות רק תמונות מסוג PNG, JPG, JPEG או WEBP.")
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("גודל התמונה חייב להיות עד 5MB.")
  }
}

function getImageExtension(file: File) {
  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  return "jpg"
}

function getStoragePathFromPublicUrl(bucket: BusinessImageBucket, url: string) {
  try {
    const parsedUrl = new URL(url)
    const marker = `/storage/v1/object/public/${bucket}/`
    const markerIndex = parsedUrl.pathname.indexOf(marker)

    if (markerIndex === -1) return null

    return decodeURIComponent(
      parsedUrl.pathname.slice(markerIndex + marker.length)
    )
  } catch {
    return null
  }
}

async function uploadBusinessImage(
  bucket: BusinessImageBucket,
  userId: string,
  file: File
) {
  validateImageFile(file)

  const extension = getImageExtension(file)
  const filePath = `${userId}-${Date.now()}.${extension}`

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    throw new Error("שגיאה בהעלאת התמונה. נסה שוב.")
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)

  return {
    path: filePath,
    publicUrl: data.publicUrl,
  }
}

export function uploadBusinessLogo(userId: string, file: File) {
  return uploadBusinessImage("business-logos", userId, file)
}

export function uploadBusinessCover(userId: string, file: File) {
  return uploadBusinessImage("business-covers", userId, file)
}

export async function deleteStorageFile(
  bucket: BusinessImageBucket,
  pathOrPublicUrl: string | null | undefined
) {
  if (!pathOrPublicUrl) return

  const path = pathOrPublicUrl.startsWith("http")
    ? getStoragePathFromPublicUrl(bucket, pathOrPublicUrl)
    : pathOrPublicUrl

  if (!path) return

  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    console.warn("deleteStorageFile: remove failed", error)
  }
}

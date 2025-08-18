// Simple in-memory store for generated content
// In a production app, this would be a database

interface GeneratedContent {
    id: string
    linkedinPost?: string
    twitterPost?: string
    facebookPost?: string
    instagramCaption?: string
    hashtags?: string[]
    keyPoints?: string[]
    status: "pending" | "approved" | "rejected"
    createdAt: Date
  }
  
  let contentStore: GeneratedContent[] = []
  
  export async function saveGeneratedContent(data: any): Promise<string> {
    const id = data.id || `content-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  
    const content: GeneratedContent = {
      id,
      linkedinPost: data.linkedinPost,
      twitterPost: data.twitterPost,
      facebookPost: data.facebookPost,
      instagramCaption: data.instagramCaption,
      hashtags: data.hashtags,
      keyPoints: data.keyPoints,
      status: data.status || "pending",
      createdAt: new Date(),
    }
  
    contentStore.unshift(content) // Add to beginning of array
  
    // Keep only the last 50 items
    if (contentStore.length > 50) {
      contentStore = contentStore.slice(0, 50)
    }
  
    return id
  }
  
  export async function getGeneratedContent(id: string): Promise<GeneratedContent | null> {
    return contentStore.find((content) => content.id === id) || null
  }
  
  export async function getAllGeneratedContent(): Promise<GeneratedContent[]> {
    return [...contentStore]
  }
  
  export async function getLatestGeneratedContent(): Promise<GeneratedContent | null> {
    return contentStore.length > 0 ? contentStore[0] : null
  }
  
  export async function approveContent(id: string): Promise<boolean> {
    const contentIndex = contentStore.findIndex((content) => content.id === id)
    if (contentIndex >= 0) {
      contentStore[contentIndex].status = "approved"
      return true
    }
    return false
  }
  
  export async function rejectContent(id: string): Promise<boolean> {
    const contentIndex = contentStore.findIndex((content) => content.id === id)
    if (contentIndex >= 0) {
      contentStore[contentIndex].status = "rejected"
      return true
    }
    return false
  }
  
  export async function updateContent(id: string, updates: Partial<GeneratedContent>): Promise<boolean> {
    const contentIndex = contentStore.findIndex((content) => content.id === id)
    if (contentIndex >= 0) {
      contentStore[contentIndex] = {
        ...contentStore[contentIndex],
        ...updates,
      }
      return true
    }
    return false
  }

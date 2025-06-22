export interface Confession {
    id: number
    userName: string
    title: string
    description: string
    image?: string
    hashtag: string
    adminHashtag?: string
    adminComment?: string
    link?: string
    feeling: string
    timeConfession: string
    status: "pending" | "approved" | "rejected"
    category?: string
    selected?: boolean
    hasWarning?: boolean
    isBanned?: boolean
    warningMessage?: string
    banReason?: string
    tags: string[]
    likeCount: number
    commentCount: number
  }
  
  export interface ConfessionStats {
    total: number
    pending: number
    approved: number
    rejected: number
    totalUsers: number
    today: number
    yesterday: number
    lastWeekend: number
  }
  
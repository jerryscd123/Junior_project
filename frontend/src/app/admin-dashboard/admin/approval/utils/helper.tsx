export const getStatusColor = (status: string | undefined | null) => {
    if (!status) {
      return "bg-gray-100 text-gray-700 border-gray-200"
    }
    
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "approved":
        return "bg-green-100 text-green-700 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }
  
  export const getFeelingEmoji = (feeling: string | undefined | null) => {
    if (!feeling) {
      return "😐"
    }
    
    switch (feeling.toLowerCase()) {
      case "anxious":
        return "😰"
      case "guilty":
        return "😔"
      case "embarrassed":
        return "😳"
      case "sad":
        return "😢"
      case "confused":
        return "😕"
      case "happy":
        return "😊"
      case "angry":
        return "😠"
      case "excited":
        return "🤗"
      case "worried":
        return "😟"
      case "scared":
        return "😨"
      default:
        return "😐"
    }
  }
  
  export const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) {
      const fallbackDate = new Date()
      return {
        date: fallbackDate.toLocaleDateString(),
        time: fallbackDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        relative: "Unknown",
      }
    }
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      const fallbackDate = new Date()
      return {
        date: fallbackDate.toLocaleDateString(),
        time: fallbackDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        relative: "Invalid date",
      }
    }
    
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      relative: getRelativeTime(date),
    }
  }
  
  export const getRelativeTime = (date: Date) => {
    if (!date || isNaN(date.getTime())) {
      return "Unknown"
    }
    
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return `${Math.floor(diffInHours / 24)}d ago`
  }
  
  export const getTimeFilter = (dateString: string | undefined | null) => {
    if (!dateString) {
      return "older"
    }
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "older"
    }
    
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
    if (diffInDays === 0) return "today"
    if (diffInDays === 1) return "yesterday"
    if (diffInDays >= 2 && diffInDays <= 8) return "lastWeekend"
    return "older"
  }
  
'use client'

import { CheckCircle2, XCircle, Info, Clock } from "lucide-react"

interface ActivityLog {
  id: string
  message: string
  status: "pending" | "success" | "error" | "info"
  timestamp: string
}

export function ActivityLogItem({ log }: { log: ActivityLog }) {
  const getStatusIcon = () => {
    switch (log.status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-slate-500" />
    }
  }

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  return (
    <div className="flex items-start gap-3">
      {getStatusIcon()}
      <div className="flex-1 space-y-1">
        <p className="text-sm text-slate-900">{log.message}</p>
        <p className="text-xs text-slate-500">
          {log.timestamp}
        </p>
      </div>
    </div>
  )
}

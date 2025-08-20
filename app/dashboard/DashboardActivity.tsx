"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, Zap, Target, FileText } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  recentActivity: {
    topics: Array<{
      title: string
      status: string
      createdAt: string
    }>
    content: Array<{
      topicTitle: string
      status: string
      createdAt: string
    }>
  }
}

interface DashboardActivityProps {
  stats: DashboardStats
  formatDate: (dateString: string) => string
  getStatusColor: (status: string) => string
}

export default function DashboardActivity({ stats, formatDate, getStatusColor }: DashboardActivityProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6 lg:mb-8">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
            <Activity className="h-5 w-5 text-purple-600" />
            Recent Topics
          </CardTitle>
          <CardDescription className="text-sm">Your latest topic activities</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.topics.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.topics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0 pr-3">
                    <h4 className="font-medium text-gray-900 truncate text-sm">{topic.title}</h4>
                    <p className="text-xs text-gray-500">{formatDate(topic.createdAt)}</p>
                  </div>
                  <Badge className={`${getStatusColor(topic.status)} text-xs flex-shrink-0`}>{topic.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-3">No recent topics</p>
              <Link href="/dashboard/topic-bank">
                <Button size="sm">Create Topics</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
            <Zap className="h-5 w-5 text-orange-600" />
            Recent Content
          </CardTitle>
          <CardDescription className="text-sm">Your latest generated content</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.content.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.content.map((content, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0 pr-3">
                    <h4 className="font-medium text-gray-900 truncate text-sm">{content.topicTitle}</h4>
                    <p className="text-xs text-gray-500">{formatDate(content.createdAt)}</p>
                  </div>
                  <Badge className={`${getStatusColor(content.status)} text-xs flex-shrink-0`}>
                    {content.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-3">No recent content</p>
              <Link href="/dashboard/approved-content">
                <Button size="sm">View Content</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


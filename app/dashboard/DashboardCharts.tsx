"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { BarChart3, PieChartIcon } from "lucide-react"

interface DashboardStats {
  contentByStatus: {
    generated: number
    approved: number
    posted: number
    failed: number
  }
  weeklyData?: Array<{
    name: string
    content: number
  }>
}

interface DashboardChartsProps {
  stats: DashboardStats
}

export default function DashboardCharts({ stats }: DashboardChartsProps) {
  // Prepare chart data
  const contentStatusData = [
    { name: "Generated", value: stats.contentByStatus.generated, color: "#3B82F6" },
    { name: "Approved", value: stats.contentByStatus.approved, color: "#10B981" },
    { name: "Posted", value: stats.contentByStatus.posted, color: "#8B5CF6" },
    { name: "Failed", value: stats.contentByStatus.failed, color: "#EF4444" },
  ]

  const weeklyData = stats.weeklyData || [
    { name: "Mon", content: 0 },
    { name: "Tue", content: 0 },
    { name: "Wed", content: 0 },
    { name: "Thu", content: 0 },
    { name: "Fri", content: 0 },
    { name: "Sat", content: 0 },
    { name: "Sun", content: 0 },
  ]

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6 lg:mb-8">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
            <PieChartIcon className="h-5 w-5 text-blue-600" />
            Content by Status
          </CardTitle>
          <CardDescription className="text-sm">
            Distribution of your content across different statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {contentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {contentStatusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600 truncate">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Weekly Activity
          </CardTitle>
          <CardDescription className="text-sm">Your content generation activity over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="content" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


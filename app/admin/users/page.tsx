"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Activity,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { UserEditModal } from "@/components/admin/user-edit-modal"

interface User {
  _id: string
  name: string
  email: string
  mobile?: string
  city?: string
  bio?: string
  company?: string
  subscriptionStatus: string
  subscriptionPlan?: string
  subscriptionExpiry?: string
  contentGenerated: number
  imagesGenerated: number
  isBlocked: boolean
  createdAt: string
  profilePhoto?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        throw new Error("Failed to fetch users")
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isBlocked: !isBlocked }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `User ${!isBlocked ? "blocked" : "unblocked"} successfully`,
        })
        fetchUsers()
      } else {
        throw new Error("Failed to update user")
      }
    } catch (error) {
      console.error("Block user error:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        fetchUsers()
      } else {
        throw new Error("Failed to delete user")
      }
    } catch (error) {
      console.error("Delete user error:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setModalOpen(true)
  }

  const handleModalClose = (shouldRefresh?: boolean) => {
    setModalOpen(false)
    setSelectedUser(null)
    if (shouldRefresh) {
      fetchUsers()
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "expired":
        return "bg-red-100 text-red-800 border-red-200"
      case "free":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mt-2 animate-pulse"></div>
          </div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage user accounts and subscriptions</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-3 sm:px-4 py-2 rounded-lg">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">{users.length} Total Users</span>
        </div>
      </div>

      {/* Search and Content */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
            <Search className="h-5 w-5" />
            Search Users
          </CardTitle>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, mobile, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div key={user._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarImage src={user.profilePhoto || "/placeholder.svg"} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm sm:text-base">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{user.name}</h3>
                          <Badge className={`${getStatusColor(user.subscriptionStatus)} text-xs`}>{user.subscriptionStatus}</Badge>
                          {user.isBlocked && <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Blocked</Badge>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-3">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.mobile && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                              <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{user.mobile}</span>
                            </div>
                          )}
                          {user.city && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{user.city}</span>
                            </div>
                          )}
                          {user.company && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                              <Building className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{user.company}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <Activity className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>
                              {user.contentGenerated} content, {user.imagesGenerated} images
                            </span>
                          </div>
                        </div>

                        {user.bio && <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{user.bio}</p>}

                        {user.subscriptionPlan && (
                          <div className="text-xs sm:text-sm text-gray-600">
                            <span className="font-medium">Plan:</span> {user.subscriptionPlan}
                            {user.subscriptionExpiry && (
                              <span className="ml-2">
                                (Expires: {new Date(user.subscriptionExpiry).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 lg:flex-col lg:gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(user)} className="text-xs">
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline ml-1">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBlockUser(user._id, user.isBlocked)}
                        className={`text-xs ${
                          user.isBlocked
                            ? "text-green-600 hover:text-green-700"
                            : "text-orange-600 hover:text-orange-700"
                        }`}
                      >
                        {user.isBlocked ? <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" /> : <UserX className="h-3 w-3 sm:h-4 sm:w-4" />}
                        <span className="hidden sm:inline ml-1">{user.isBlocked ? 'Unblock' : 'Block'}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline ml-1">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UserEditModal open={modalOpen} onClose={handleModalClose} user={selectedUser} />
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tag, Search, Plus, Edit, Trash2, Users, Percent, DollarSign, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CouponFormModal } from "@/components/admin/coupon-form-modal"

interface Coupon {
  _id: string
  code: string
  name: string
  description?: string
  type: "percentage" | "fixed"
  value: number
  minAmount?: number
  maxDiscount?: number
  usageLimit?: number
  perUserLimit?: number
  usageCount: number
  validFrom: string
  validUntil: string
  applicablePlans: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      const response = await fetch("/api/coupons")
      if (response.ok) {
        const data = await response.json()
        setCoupons(data.coupons || [])
      } else {
        throw new Error("Failed to fetch coupons")
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error)
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return

    try {
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Coupon deleted successfully",
        })
        fetchCoupons()
      } else {
        throw new Error("Failed to delete coupon")
      }
    } catch (error) {
      console.error("Delete coupon error:", error)
      toast({
        title: "Error",
        description: "Failed to delete coupon",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon({
      ...coupon,
      id: coupon._id,
    } as any)
    setModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedCoupon(null)
    setModalOpen(true)
  }

  const handleModalClose = (shouldRefresh?: boolean) => {
    setModalOpen(false)
    setSelectedCoupon(null)
    if (shouldRefresh) {
      fetchCoupons()
    }
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Coupons Management</h1>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupons Management</h1>
          <p className="text-gray-600 mt-1">Create and manage discount coupons</p>
        </div>
        <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Search className="h-5 w-5" />
            Search Coupons
          </CardTitle>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCoupons.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No coupons found</p>
              <Button onClick={handleCreate} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Coupon
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCoupons.map((coupon) => (
                <div key={coupon._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <Tag className="h-6 w-6 text-white" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">{coupon.code}</h3>
                          <Badge variant={coupon.isActive && !isExpired(coupon.validUntil) ? "default" : "secondary"}>
                            {isExpired(coupon.validUntil) ? "Expired" : coupon.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-gray-600">{coupon.name}</p>
                        {coupon.description && <p className="text-sm text-gray-500">{coupon.description}</p>}

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            {coupon.type === "percentage" ? (
                              <Percent className="h-4 w-4 text-blue-500" />
                            ) : (
                              <DollarSign className="h-4 w-4 text-green-500" />
                            )}
                            <span className="font-medium">
                              {coupon.type === "percentage" ? `${coupon.value}%` : `₹${coupon.value}`}
                            </span>
                          </div>

                          {coupon.usageLimit && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-purple-500" />
                              <span>
                                {coupon.usageCount}/{coupon.usageLimit} used
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span>Until {new Date(coupon.validUntil).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(coupon._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CouponFormModal open={modalOpen} onClose={handleModalClose} coupon={selectedCoupon} />
    </div>
  )
}

"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Star,
  Flag,
  Info
} from "lucide-react"
import { VerificationStatus, VerificationTarget } from "@prisma/client"

interface VerificationProps {
  targetId: string
  targetType: VerificationTarget
  title: string
  description?: string
  existingVerifications?: any[]
  onVerificationComplete?: (verification: any) => void
}

const statusConfig = {
  PENDING: {
    icon: AlertTriangle,
    color: "bg-yellow-100 text-yellow-800",
    label: "Pending Review"
  },
  VERIFIED: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
    label: "Verified"
  },
  REJECTED: {
    icon: XCircle,
    color: "bg-red-100 text-red-800",
    label: "Rejected"
  },
  SUSPENDED: {
    icon: AlertTriangle,
    color: "bg-gray-100 text-gray-800",
    label: "Suspended"
  }
}

export function VerificationSystem({
  targetId,
  targetType,
  title,
  description,
  existingVerifications = [],
  onVerificationComplete
}: VerificationProps) {
  const { data: session } = useSession()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [verificationData, setVerificationData] = useState({
    status: VerificationStatus.VERIFIED,
    confidence: [75],
    notes: "",
    evidence: ""
  })

  const canVerify = session && (
    session.user.role === "JOURNALIST" ||
    session.user.role === "ADMIN" ||
    session.user.role === "MODERATOR"
  )

  const hasVerified = existingVerifications.some(v => v.verifierId === session?.user?.id)

  const getVerificationStats = () => {
    const total = existingVerifications.length
    const verified = existingVerifications.filter(v => v.status === VerificationStatus.VERIFIED).length
    const rejected = existingVerifications.filter(v => v.status === VerificationStatus.REJECTED).length
    const pending = existingVerifications.filter(v => v.status === VerificationStatus.PENDING).length

    return { total, verified, rejected, pending }
  }

  const getAverageConfidence = () => {
    const verificationsWithConfidence = existingVerifications.filter(v => v.confidence)
    if (verificationsWithConfidence.length === 0) return 0
    const sum = verificationsWithConfidence.reduce((acc, v) => acc + v.confidence, 0)
    return Math.round(sum / verificationsWithConfidence.length)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/verifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetId,
          targetType,
          status: verificationData.status,
          confidence: verificationData.confidence[0],
          notes: verificationData.notes,
          evidence: verificationData.evidence
        }),
      })

      if (response.ok) {
        const verification = await response.json()
        setSuccess(true)
        onVerificationComplete?.(verification)
        
        setTimeout(() => {
          setIsDialogOpen(false)
          setSuccess(false)
          setVerificationData({
            status: VerificationStatus.VERIFIED,
            confidence: [75],
            notes: "",
            evidence: ""
          })
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Verification failed")
      }
    } catch (error) {
      console.error("Verification error:", error)
      setError("An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const stats = getVerificationStats()
  const avgConfidence = getAverageConfidence()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Verification Status</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {stats.total > 0 && (
              <Badge variant="outline">
                {stats.verified}/{stats.total} verified
              </Badge>
            )}
            {avgConfidence > 0 && (
              <Badge variant="outline">
                <Star className="h-3 w-3 mr-1" />
                {avgConfidence}% confidence
              </Badge>
            )}
          </div>
        </div>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Verification Stats */}
          {stats.total > 0 && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
                <div className="text-xs text-muted-foreground">Verified</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <div className="text-xs text-muted-foreground">Rejected</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          )}

          {/* Recent Verifications */}
          {existingVerifications.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Recent Verifications</h4>
              <div className="space-y-2">
                {existingVerifications.slice(0, 3).map((verification) => {
                  const config = statusConfig[verification.status]
                  const Icon = config.icon
                  return (
                    <div key={verification.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{verification.verifier.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {verification.confidence && (
                          <span className="text-xs text-muted-foreground">
                            {verification.confidence}%
                          </span>
                        )}
                        <Badge className={config.color} variant="secondary">
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Verification Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {stats.total === 0 ? (
                "No verifications yet. Be the first to verify this content."
              ) : hasVerified ? (
                "You have already verified this content."
              ) : !canVerify ? (
                "Only verified journalists and administrators can verify content."
              ) : (
                "Help maintain trust by verifying this content."
              )}
            </div>
            
            {canVerify && !hasVerified && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Flag className="mr-2 h-4 w-4" />
                    Verify Content
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Verify: {title}</DialogTitle>
                    <DialogDescription>
                      Your verification helps maintain trust and accuracy in our journalism network.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="status">Verification Status</Label>
                      <Select
                        value={verificationData.status}
                        onValueChange={(value) => setVerificationData(prev => ({ ...prev, status: value as VerificationStatus }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={VerificationStatus.VERIFIED}>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Verified - Content is accurate
                            </div>
                          </SelectItem>
                          <SelectItem value={VerificationStatus.REJECTED}>
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              Rejected - Content is inaccurate
                            </div>
                          </SelectItem>
                          <SelectItem value={VerificationStatus.PENDING}>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              Pending - Needs more review
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="confidence">Confidence Level: {verificationData.confidence[0]}%</Label>
                      <Slider
                        id="confidence"
                        min={1}
                        max={100}
                        step={1}
                        value={verificationData.confidence}
                        onValueChange={(value) => setVerificationData(prev => ({ ...prev, confidence: value }))}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={verificationData.notes}
                        onChange={(e) => setVerificationData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Provide your reasoning for this verification..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="evidence">Evidence (Optional)</Label>
                      <Textarea
                        id="evidence"
                        value={verificationData.evidence}
                        onChange={(e) => setVerificationData(prev => ({ ...prev, evidence: e.target.value }))}
                        placeholder="Link to any supporting evidence or references..."
                        rows={2}
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>Verification submitted successfully!</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Verification"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
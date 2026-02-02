"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  File,
  X,
  AlertCircle,
  CheckCircle,
  Paperclip
} from "lucide-react"
import { DocumentType } from "@prisma/client"
import { cn } from "@/lib/utils"

interface DocumentUploadProps {
  caseId: string
  onUploadComplete?: (document: any) => void
  onCancel?: () => void
}

const documentTypes = [
  { value: DocumentType.EVIDENCE, label: "Evidence" },
  { value: DocumentType.RTI, label: "RTI Response" },
  { value: DocumentType.FIR, label: "FIR" },
  { value: DocumentType.NOTICE, label: "Legal Notice" },
  { value: DocumentType.VIDEO, label: "Video" },
  { value: DocumentType.AUDIO, label: "Audio" },
  { value: DocumentType.IMAGE, label: "Image" },
  { value: DocumentType.LEGAL_DOCUMENT, label: "Legal Document" },
  { value: DocumentType.CORRESPONDENCE, label: "Correspondence" },
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'video/mp4': ['.mp4'],
  'video/avi': ['.avi'],
  'video/quicktime': ['.mov'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'text/plain': ['.txt'],
}

export function DocumentUpload({ caseId, onUploadComplete, onCancel }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    documentType: DocumentType.EVIDENCE,
    isPublic: false,
  })

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError("")
    
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0]
      if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setError("File size exceeds 50MB limit")
      } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setError("Invalid file type. Please upload PDF, DOC, images, videos, or audio files.")
      } else {
        setError("File upload failed. Please try again.")
      }
      return
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      // Auto-populate title with filename if empty
      if (!formData.title) {
        const nameWithoutExt = acceptedFiles[0].name.replace(/\.[^/.]+$/, "")
        setFormData(prev => ({ ...prev, title: nameWithoutExt }))
      }
    }
  }, [formData.title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE,
    accept: ACCEPTED_FILE_TYPES,
    multiple: false,
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    if (!formData.title.trim()) {
      setError("Please provide a title for the document")
      return
    }

    setUploading(true)
    setError("")
    setUploadProgress(0)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("metadata", JSON.stringify({
        ...formData,
        caseId
      }))

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/documents", {
        method: "POST",
        body: uploadFormData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const document = await response.json()
        setSuccess(true)
        onUploadComplete?.(document)
        
        // Reset form after delay
        setTimeout(() => {
          setFile(null)
          setFormData({
            title: "",
            description: "",
            documentType: DocumentType.EVIDENCE,
            isPublic: false,
          })
          setSuccess(false)
          setUploadProgress(0)
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setError("An unexpected error occurred")
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Document Uploaded Successfully!</h3>
            <p className="text-muted-foreground">
              Your document has been uploaded and is now available in the case.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Document
        </CardTitle>
        <CardDescription>
          Upload evidence, RTI responses, FIRs, or other supporting documents.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div>
            <Label>Document File *</Label>
            <div
              {...getRootProps()}
              className={cn(
                "mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
                file && "border-primary bg-primary/5"
              )}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <File className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Paperclip className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-lg font-medium">
                    {isDragActive ? "Drop the file here" : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, MP4, MP3 (Max 50MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Document Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter document title"
                required
              />
            </div>

            <div>
              <Label htmlFor="documentType">Document Type</Label>
              <Select
                value={formData.documentType}
                onValueChange={(value) => handleInputChange("documentType", value as DocumentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Provide a brief description of the document"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => handleInputChange("isPublic", checked)}
            />
            <Label htmlFor="isPublic" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Make this document public
            </Label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={uploading || !file}>
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
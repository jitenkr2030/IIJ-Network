"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Download,
  Smartphone,
  Monitor,
  X,
  CheckCircle
} from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installStatus, setInstallStatus] = useState<"idle" | "installing" | "success" | "error">("idle")

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
      }
    }

    checkInstalled()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    setInstallStatus("installing")
    
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setInstallStatus("success")
        setTimeout(() => {
          setShowInstallPrompt(false)
          setInstallStatus("idle")
        }, 2000)
      } else {
        setInstallStatus("idle")
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('Installation error:', error)
      setInstallStatus("error")
      setTimeout(() => setInstallStatus("idle"), 3000)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
  }

  // Don't show if already installed or no prompt available
  if (isInstalled || !deferredPrompt) {
    return null
  }

  return (
    <Dialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            <DialogTitle>Install IIJN App</DialogTitle>
          </div>
          <DialogDescription>
            Install the Indian Independent Journalists Network on your device for offline access and a better experience.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile App
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Access from your home screen, work offline, receive notifications
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Desktop App
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Install as a desktop app for quick access and offline functionality
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {installStatus === "success" && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                App installed successfully! You can now find it in your applications.
              </AlertDescription>
            </Alert>
          )}

          {installStatus === "error" && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertDescription>
                Installation failed. Please try again or use your browser's menu to install the app.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleDismiss}>
              Maybe Later
            </Button>
            <Button 
              onClick={handleInstallClick}
              disabled={installStatus === "installing"}
            >
              {installStatus === "installing" ? (
                "Installing..."
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Install App
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
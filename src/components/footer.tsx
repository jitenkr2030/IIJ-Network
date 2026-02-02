import Link from "next/link"
import { Shield, Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Organization Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">IIJN</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Indian Independent Journalists Network - Empowering independent journalists with platform-independent infrastructure and verified reporting.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/cases" className="text-muted-foreground hover:text-primary">
                  Browse Cases
                </Link>
              </li>
              <li>
                <Link href="/journalists" className="text-muted-foreground hover:text-primary">
                  Find Journalists
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary">
                  About IIJN
                </Link>
              </li>
              <li>
                <Link href="/membership" className="text-muted-foreground hover:text-primary">
                  Membership
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/resources/journalism-guide" className="text-muted-foreground hover:text-primary">
                  Journalism Guide
                </Link>
              </li>
              <li>
                <Link href="/resources/verification" className="text-muted-foreground hover:text-primary">
                  Verification Process
                </Link>
              </li>
              <li>
                <Link href="/resources/legal-aid" className="text-muted-foreground hover:text-primary">
                  Legal Aid Network
                </Link>
              </li>
              <li>
                <Link href="/resources/training" className="text-muted-foreground hover:text-primary">
                  Training Workshops
                </Link>
              </li>
              <li>
                <Link href="/resources/codes" className="text-muted-foreground hover:text-primary">
                  Code of Ethics
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Info</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>contact@iijn.org</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>New Delhi, India</span>
              </div>
            </div>
            <div className="pt-4">
              <p className="text-xs text-muted-foreground">
                Registered under the Societies Registration Act, 1860
              </p>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Indian Independent Journalists Network. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-muted-foreground mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms of Service
            </Link>
            <Link href="/disclaimer" className="hover:text-primary">
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
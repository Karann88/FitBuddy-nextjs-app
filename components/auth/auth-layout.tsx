// import type React from "react"
// import Link from "next/link"
// import { Activity, Shield, Lock } from "lucide-react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"

// interface AuthLayoutProps {
//   children: React.ReactNode
//   title: string
//   subtitle: string
//   showToggle?: boolean
//   toggleText?: string
//   toggleLink?: string
//   toggleLinkText?: string
// }

// export function AuthLayout({
//   children,
//   title,
//   subtitle,
//   showToggle = false,
//   toggleText,
//   toggleLink,
//   toggleLinkText,
// }: AuthLayoutProps) {
//   return (
//     <div className="min-h-screen flex">
//       {/* Left side - Branding and features */}
//       <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 p-8 flex-col justify-between">
//         <div>
//           <Link href="/" className="flex items-center gap-2 mb-8">
//             <Activity className="h-8 w-8 text-primary" />
//             <span className="text-2xl font-bold">Wellness Tracker</span>
//           </Link>

//           <div className="space-y-6">
//             <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
//               Your Health,
//               <br />
//               Your Journey
//             </h1>
//             <p className="text-lg text-gray-600 dark:text-gray-300">
//               Track your wellness journey with our comprehensive health monitoring platform. Secure, private, and
//               designed with your wellbeing in mind.
//             </p>

//             <div className="space-y-4">
//               <div className="flex items-center gap-3">
//                 <Shield className="h-5 w-5 text-green-600" />
//                 <span className="text-gray-700 dark:text-gray-300">Secure & Private</span>
//               </div>
//               <div className="flex items-center gap-3">
//                 <Lock className="h-5 w-5 text-green-600" />
//                 <span className="text-gray-700 dark:text-gray-300">Data Protection</span>
//               </div>
//               <div className="flex items-center gap-3">
//                 <Activity className="h-5 w-5 text-green-600" />
//                 <span className="text-gray-700 dark:text-gray-300">Comprehensive Tracking</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="space-y-4">
//           <div className="flex gap-2">
//             <Badge variant="secondary">GDPR Compliant</Badge>
//             <Badge variant="secondary">SOC 2 Certified</Badge>
//           </div>
//           <p className="text-sm text-gray-500 dark:text-gray-400">
//             Your data is encrypted and stored securely. We never share your personal health information.
//           </p>
//         </div>
//       </div>

//       {/* Right side - Auth form */}
//       <div className="flex-1 flex items-center justify-center p-8">
//         <div className="w-full max-w-md space-y-6">
//           {/* Mobile logo */}
//           <div className="lg:hidden text-center">
//             <Link href="/" className="inline-flex items-center gap-2 mb-6">
//               <Activity className="h-6 w-6 text-primary" />
//               <span className="text-xl font-bold">Wellness Tracker</span>
//             </Link>
//           </div>

//           <Card className="border-0 shadow-lg">
//             <CardHeader className="text-center">
//               <CardTitle className="text-2xl">{title}</CardTitle>
//               <CardDescription className="text-base">{subtitle}</CardDescription>
//             </CardHeader>
//             <CardContent>
//               {children}

//               {showToggle && toggleText && toggleLink && toggleLinkText && (
//                 <div className="text-center mt-6">
//                   <p className="text-sm text-muted-foreground">
//                     {toggleText}{" "}
//                     <Link href={toggleLink} className="text-primary hover:underline font-medium">
//                       {toggleLinkText}
//                     </Link>
//                   </p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           {/* Privacy notice */}
//           <div className="text-center text-xs text-muted-foreground">
//             <p>
//               By continuing, you agree to our{" "}
//               <Link href="/privacy" className="text-primary hover:underline">
//                 Privacy Policy
//               </Link>{" "}
//               and{" "}
//               <Link href="/terms" className="text-primary hover:underline">
//                 Terms of Service
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }


import type React from "react"
import Link from "next/link"
import { Activity, Shield, Lock, Heart, Sparkles, Leaf } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  showToggle?: boolean
  toggleText?: string
  toggleLink?: string
  toggleLinkText?: string
}

export function AuthLayout({
  children,
  title,
  subtitle,
  showToggle = false,
  toggleText,
  toggleLink,
  toggleLinkText,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-teal-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-cyan-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-violet-200/20 to-purple-300/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Left side - Branding and features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950 p-8 flex-col justify-between relative">
        {/* Floating elements */}
        <div className="absolute top-20 right-20 opacity-20">
          <Heart className="h-8 w-8 text-rose-400 animate-bounce" />
        </div>
        <div className="absolute bottom-40 right-32 opacity-20">
          <Leaf className="h-6 w-6 text-emerald-400 animate-pulse" />
        </div>
        <div className="absolute top-1/3 right-16 opacity-20">
          <Sparkles className="h-5 w-5 text-violet-400 animate-ping" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-8 group transition-all duration-300 hover:scale-105">
            <div className="relative">
              <Activity className="h-8 w-8 text-emerald-600 dark:text-emerald-400 transition-colors duration-300 group-hover:text-emerald-700" />
              <div className="absolute inset-0 bg-emerald-600/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              Wellness Tracker
            </span>
          </Link>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              Your Health,
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Your Journey
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Track your wellness journey with our comprehensive health monitoring platform. Secure, private, and
              designed with your wellbeing in mind.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 group cursor-pointer transition-all duration-300 hover:translate-x-2">
                <div className="relative">
                  <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 transition-colors duration-300 group-hover:text-emerald-700" />
                  <div className="absolute inset-0 bg-emerald-600/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Secure & Private</span>
              </div>
              <div className="flex items-center gap-3 group cursor-pointer transition-all duration-300 hover:translate-x-2">
                <div className="relative">
                  <Lock className="h-5 w-5 text-teal-600 dark:text-teal-400 transition-colors duration-300 group-hover:text-teal-700" />
                  <div className="absolute inset-0 bg-teal-600/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Data Protection</span>
              </div>
              <div className="flex items-center gap-3 group cursor-pointer transition-all duration-300 hover:translate-x-2">
                <div className="relative">
                  <Activity className="h-5 w-5 text-cyan-600 dark:text-cyan-400 transition-colors duration-300 group-hover:text-cyan-700" />
                  <div className="absolute inset-0 bg-cyan-600/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Comprehensive Tracking</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors duration-300">
              GDPR Compliant
            </Badge>
            <Badge variant="secondary" className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 border-teal-200 dark:border-teal-800 hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors duration-300">
              SOC 2 Certified
            </Badge>
            <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-200 dark:hover:bg-cyan-800 transition-colors duration-300">
              HIPAA Ready
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Your data is encrypted and stored securely. We never share your personal health information.
          </p>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 group transition-all duration-300 hover:scale-105">
              <div className="relative">
                <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400 transition-colors duration-300 group-hover:text-emerald-700" />
                <div className="absolute inset-0 bg-emerald-600/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                Wellness Tracker
              </span>
            </Link>
          </div>

          <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 transition-all duration-300 hover:shadow-3xl hover:scale-[1.02]">
            <CardHeader className="text-center space-y-3">
              <CardTitle className="text-2xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                {title}
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                {subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {children}

              {showToggle && toggleText && toggleLink && toggleLinkText && (
                <div className="text-center mt-6">
                  <p className="text-sm text-muted-foreground">
                    {toggleText}{" "}
                    <Link 
                      href={toggleLink} 
                      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline font-medium transition-colors duration-300"
                    >
                      {toggleLinkText}
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy notice */}
          <div className="text-center text-xs text-muted-foreground">
            <p className="leading-relaxed">
              By continuing, you agree to our{" "}
              <Link 
                href="/privacy" 
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors duration-300"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link 
                href="/terms" 
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors duration-300"
              >
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


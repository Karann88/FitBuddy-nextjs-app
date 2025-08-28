// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Lock, Database, UserCheck, Globe } from "lucide-react"

// export default function PrivacyPolicyPage() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 p-8">
//       <div className="max-w-4xl mx-auto space-y-8">
//         <div className="text-center space-y-4">
//           <h1 className="text-4xl font-bold">Privacy Policy</h1>
//           <p className="text-lg text-muted-foreground">Your privacy and data security are our top priorities</p>
//           <div className="flex justify-center gap-2">
//             <Badge variant="secondary">GDPR Compliant</Badge>
//             <Badge variant="secondary">HIPAA Compliant</Badge>
//             <Badge variant="secondary">SOC 2 Certified</Badge>
//           </div>
//         </div>

//         <div className="grid gap-6">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Database className="h-5 w-5" />
//                 Data Collection
//               </CardTitle>
//               <CardDescription>What information we collect and why</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div>
//                 <h4 className="font-semibold mb-2">Personal Information</h4>
//                 <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
//                   <li>Name, email address, and date of birth for account creation</li>
//                   <li>Health and wellness data you choose to track</li>
//                   <li>Device information for app functionality</li>
//                   <li>Usage analytics to improve our services</li>
//                 </ul>
//               </div>
//               <div>
//                 <h4 className="font-semibold mb-2">Health Data</h4>
//                 <p className="text-sm text-muted-foreground">
//                   All health data is encrypted and stored securely. We never share your personal health information with
//                   third parties without your explicit consent.
//                 </p>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Lock className="h-5 w-5" />
//                 Data Security
//               </CardTitle>
//               <CardDescription>How we protect your information</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <h4 className="font-semibold mb-2">Encryption</h4>
//                   <p className="text-sm text-muted-foreground">
//                     All data is encrypted in transit and at rest using industry-standard AES-256 encryption.
//                   </p>
//                 </div>
//                 <div>
//                   <h4 className="font-semibold mb-2">Access Controls</h4>
//                   <p className="text-sm text-muted-foreground">
//                     Strict access controls ensure only authorized personnel can access systems.
//                   </p>
//                 </div>
//                 <div>
//                   <h4 className="font-semibold mb-2">Regular Audits</h4>
//                   <p className="text-sm text-muted-foreground">
//                     We conduct regular security audits and penetration testing.
//                   </p>
//                 </div>
//                 <div>
//                   <h4 className="font-semibold mb-2">Compliance</h4>
//                   <p className="text-sm text-muted-foreground">
//                     We maintain HIPAA, GDPR, and SOC 2 compliance certifications.
//                   </p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <UserCheck className="h-5 w-5" />
//                 Your Rights
//               </CardTitle>
//               <CardDescription>Control over your personal data</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <h4 className="font-semibold mb-2">Access & Portability</h4>
//                   <p className="text-sm text-muted-foreground">
//                     Request a copy of all your personal data in a portable format.
//                   </p>
//                 </div>
//                 <div>
//                   <h4 className="font-semibold mb-2">Correction</h4>
//                   <p className="text-sm text-muted-foreground">
//                     Update or correct any inaccurate personal information.
//                   </p>
//                 </div>
//                 <div>
//                   <h4 className="font-semibold mb-2">Deletion</h4>
//                   <p className="text-sm text-muted-foreground">
//                     Request deletion of your account and all associated data.
//                   </p>
//                 </div>
//                 <div>
//                   <h4 className="font-semibold mb-2">Consent Withdrawal</h4>
//                   <p className="text-sm text-muted-foreground">Withdraw consent for data processing at any time.</p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Globe className="h-5 w-5" />
//                 International Transfers
//               </CardTitle>
//               <CardDescription>How we handle data across borders</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <p className="text-sm text-muted-foreground mb-4">
//                 Your data may be processed in countries other than your own. We ensure adequate protection through:
//               </p>
//               <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
//                 <li>Standard Contractual Clauses (SCCs) for EU data transfers</li>
//                 <li>Adequacy decisions where applicable</li>
//                 <li>Additional safeguards for sensitive health data</li>
//               </ul>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Contact Us</CardTitle>
//               <CardDescription>Questions about your privacy</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <p className="text-sm text-muted-foreground mb-4">
//                 If you have any questions about this Privacy Policy or your personal data, please contact us:
//               </p>
//               <div className="space-y-2 text-sm">
//                 <p>
//                   <strong>Email:</strong> privacy@wellnesstracker.com
//                 </p>
//                 <p>
//                   <strong>Data Protection Officer:</strong> dpo@wellnesstracker.com
//                 </p>
//                 <p>
//                   <strong>Address:</strong> 123 Health Street, Wellness City, WC 12345
//                 </p>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         <div className="text-center text-sm text-muted-foreground">
//           <p>Last updated: December 15, 2024</p>
//           <p>This policy is effective immediately and replaces all previous versions.</p>
//         </div>
//       </div>
//     </div>
//   )
// }


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h2>Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, log health data, or
              contact us for support.
            </p>

            <h2>How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services, including tracking your
              health and wellness progress.
            </p>

            <h2>Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information against unauthorized
              access, alteration, disclosure, or destruction.
            </p>

            <h2>Your Rights</h2>
            <p>
              You have the right to access, update, or delete your personal information at any time through your account
              settings.
            </p>

            <h2>Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@wellnesstracker.com</p>

            <div className="mt-8">
              <Link href="/" className="text-primary hover:underline">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

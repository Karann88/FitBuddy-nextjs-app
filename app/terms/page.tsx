// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { FileText, Shield, AlertTriangle, Scale } from "lucide-react"

// export default function TermsOfServicePage() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 p-8">
//       <div className="max-w-4xl mx-auto space-y-8">
//         <div className="text-center space-y-4">
//           <h1 className="text-4xl font-bold">Terms of Service</h1>
//           <p className="text-lg text-muted-foreground">Please read these terms carefully before using our service</p>
//           <Badge variant="secondary">Effective December 15, 2024</Badge>
//         </div>

//         <div className="grid gap-6">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <FileText className="h-5 w-5" />
//                 Acceptance of Terms
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-sm text-muted-foreground">
//                 By accessing and using Wellness Tracker, you accept and agree to be bound by the terms and provision of
//                 this agreement. If you do not agree to abide by the above, please do not use this service.
//               </p>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Shield className="h-5 w-5" />
//                 Medical Disclaimer
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
//                 <div className="flex items-start gap-2">
//                   <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
//                   <div>
//                     <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
//                       Important Medical Notice
//                     </h4>
//                     <p className="text-sm text-yellow-700 dark:text-yellow-300">
//                       This application is for informational and tracking purposes only. It is not intended to diagnose,
//                       treat, cure, or prevent any disease. Always consult with a qualified healthcare professional
//                       before making any health-related decisions.
//                     </p>
//                   </div>
//                 </div>
//               </div>
//               <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
//                 <li>The app does not provide medical advice or diagnosis</li>
//                 <li>Data tracked should not replace professional medical care</li>
//                 <li>Consult healthcare providers for medical concerns</li>
//                 <li>Emergency situations require immediate medical attention</li>
//               </ul>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>User Responsibilities</CardTitle>
//               <CardDescription>Your obligations when using our service</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 <div>
//                   <h4 className="font-semibold mb-2">Account Security</h4>
//                   <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
//                     <li>Maintain the confidentiality of your account credentials</li>
//                     <li>Use strong, unique passwords and enable two-factor authentication</li>
//                     <li>Notify us immediately of any unauthorized access</li>
//                     <li>You are responsible for all activities under your account</li>
//                   </ul>
//                 </div>
//                 <div>
//                   <h4 className="font-semibold mb-2">Data Accuracy</h4>
//                   <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
//                     <li>Provide accurate and truthful information</li>
//                     <li>Keep your profile information up to date</li>
//                     <li>Do not input false or misleading health data</li>
//                   </ul>
//                 </div>
//                 <div>
//                   <h4 className="font-semibold mb-2">Prohibited Uses</h4>
//                   <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
//                     <li>Do not use the service for illegal activities</li>
//                     <li>Do not attempt to hack, reverse engineer, or compromise security</li>
//                     <li>Do not share accounts or allow unauthorized access</li>
//                     <li>Do not use the service to harm others or spread misinformation</li>
//                   </ul>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Scale className="h-5 w-5" />
//                 Limitation of Liability
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-sm text-muted-foreground mb-4">
//                 To the fullest extent permitted by law, Wellness Tracker shall not be liable for any indirect,
//                 incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
//               </p>
//               <div className="space-y-2">
//                 <h4 className="font-semibold">Service Availability</h4>
//                 <p className="text-sm text-muted-foreground">
//                   We strive for 99.9% uptime but cannot guarantee uninterrupted service. Maintenance windows and
//                   unforeseen outages may occur.
//                 </p>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Data Retention and Deletion</CardTitle>
//               <CardDescription>How long we keep your data</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 <div>
//                   <h4 className="font-semibold mb-2">Active Accounts</h4>
//                   <p className="text-sm text-muted-foreground">
//                     Data is retained while your account is active and for legitimate business purposes.
//                   </p>
//                 </div>
//                 <div>
//                   <h4 className="font-semibold mb-2">Account Deletion</h4>
//                   <p className="text-sm text-muted-foreground">
//                     When you delete your account, personal data is removed within 30 days. Some anonymized data may be
//                     retained for analytics and service improvement.
//                   </p>
//                 </div>
//                 <div>
//                   <h4 className="font-semibold mb-2">Legal Requirements</h4>
//                   <p className="text-sm text-muted-foreground">
//                     We may retain certain data longer if required by law or for legitimate legal purposes.
//                   </p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Changes to Terms</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-sm text-muted-foreground">
//                 We reserve the right to modify these terms at any time. Users will be notified of significant changes
//                 via email or in-app notification. Continued use of the service after changes constitutes acceptance of
//                 the new terms.
//               </p>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Contact Information</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-sm text-muted-foreground mb-4">
//                 For questions about these Terms of Service, please contact us:
//               </p>
//               <div className="space-y-2 text-sm">
//                 <p>
//                   <strong>Email:</strong> legal@wellnesstracker.com
//                 </p>
//                 <p>
//                   <strong>Support:</strong> support@wellnesstracker.com
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
//           <p>These terms are governed by the laws of [Your Jurisdiction]</p>
//         </div>
//       </div>
//     </div>
//   )
// }


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing and using WellnessTracker, you accept and agree to be bound by the terms and provision of
              this agreement.
            </p>

            <h2>Use License</h2>
            <p>
              Permission is granted to temporarily use WellnessTracker for personal, non-commercial transitory viewing
              only.
            </p>

            <h2>Disclaimer</h2>
            <p>
              The information on WellnessTracker is provided on an &apos;as is&apos; basis. To the fullest extent permitted by
              law, this Company excludes all representations, warranties, conditions and terms.
            </p>

            <h2>Health Information Disclaimer</h2>
            <p>
              WellnessTracker is not intended to be a substitute for professional medical advice, diagnosis, or
              treatment. Always seek the advice of your physician or other qualified health provider with any questions
              you may have regarding a medical condition.
            </p>

            <h2>Limitations</h2>
            <p>
              In no event shall WellnessTracker or its suppliers be liable for any damages (including, without
              limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or
              inability to use the materials on WellnessTracker&apos;s website.
            </p>

            <h2>Accuracy of Materials</h2>
            <p>
              The materials appearing on WellnessTracker could include technical, typographical, or photographic errors.
              WellnessTracker does not warrant that any of the materials on its website are accurate, complete, or
              current.
            </p>

            <h2>Modifications</h2>
            <p>
              WellnessTracker may revise these terms of service at any time without notice. By using this application,
              you are agreeing to be bound by the then current version of these terms of service.
            </p>

            <h2>Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at legal@wellnesstracker.com
            </p>

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

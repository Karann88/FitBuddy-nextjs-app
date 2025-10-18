import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import "@n8n/chat/style.css"
// import { AppSidebar } from "@/components/app-sidebar"
// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AuthProvider } from "@/components/auth/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import Chat from "@/components/chatbot"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitBuddy",
  description: "Track your health and wellness with our comprehensive app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem >
          <AuthProvider>
            <Chat />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

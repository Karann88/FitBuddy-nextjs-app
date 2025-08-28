"use client"

import * as React from "react"

import { Activity, Home, Calendar, Droplets, Moon, Utensils, Scale, Wind, Dumbbell, StretchVerticalIcon as Stretch, BookHeart, LogOut } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    useSidebar,
} from "@/components/ui/sidebar"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"

// Menu items.
const items = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: Home,
    },
    {
        title: "Mood Tracker",
        href: "/dashboard/mood",
        icon: Calendar,
    },
    {
        title: "Water Intake",
        href: "/dashboard/water",
        icon: Droplets,
    },
    {
        title: "Breathing",
        href: "/dashboard/breathing",
        icon: Wind,
    },
    {
        title: "Meal Log",
        href: "/dashboard/meals",
        icon: Utensils,
    },
    {
        title: "Sleep Tracker",
        href: "/dashboard/sleep",
        icon: Moon,
    },
    {
        title: "Fitness Routine",
        href: "/dashboard/fitness",
        icon: Dumbbell,
    },
    {
        title: "Stretching",
        href: "/dashboard/stretching",
        icon: Stretch,
    },
    {
        title: "Weight Tracker",
        href: "/dashboard/weight",
        icon: Scale,
    },
    {
        title: "Mental Journal",
        href: "/dashboard/journal",
        icon: BookHeart,
    }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const { logout, user } = useAuth()
    const { open } = useSidebar()

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-3 overflow-hidden">
                    <Activity className="h-7 w-7 text-primary flex-shrink-0" />
                    {open && (
                        <span className="text-2xl font-bold text-primary whitespace-nowrap">
                            Wellness
                        </span>
                    )}
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                                <Link href={item.href}>
                                    <item.icon className="h-5 w-5" />
                                    <span className="text-md font-bold">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="flex flex-col gap-2 p-4">
                {open && user && (
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                        Welcome, {user?.firstName || "User"}!
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={logout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                    </Button>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
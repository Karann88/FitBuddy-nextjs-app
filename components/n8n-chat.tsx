"use client"

import { useEffect } from "react"
import { createChat } from "@n8n/chat"

const DEFAULT_WEBHOOK_URL = "https://karan1283.app.n8n.cloud/webhook/a889d2ae-2159-402f-b326-5f61e90f602e/chat"
type N8nChatProps = {
    webhookUrl?: string
}

export default function N8nChat({ webhookUrl }: N8nChatProps) {
    useEffect(() => {
        const url = webhookUrl || DEFAULT_WEBHOOK_URL
        if (!url) {
            console.warn("N8nChat: Missing webhook URL. Set NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL or pass prop.")
            return
        }

        createChat({
            webhookUrl: url,
            showWelcomeScreen: false,
            initialMessages: [
                "Welcome to FitBuddy! How can I help you today?",
            ],
            i18n: {
                en: {
                    title: "FitBuddy Assistant",
                    subtitle: "",
                    footer: "",
                    getStarted: "Start",
                    inputPlaceholder: "Ask me about workouts, meals, sleep, mood, and more…",
                    closeButtonTooltip: "Close",
                },
            },
        })
    }, [webhookUrl])

    return null
}



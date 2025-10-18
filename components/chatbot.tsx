"use client"

import { useEffect } from "react"
import { createChat } from "@n8n/chat"
import { useAuth } from "@/components/auth/auth-provider"

const DEFAULT_WEBHOOK_URL = "https://karan1283.app.n8n.cloud/webhook/a889d2ae-2159-402f-b326-5f61e90f602e/chat"
type N8nChatProps = {
    webhookUrl?: string
}

export default function N8nChat({ webhookUrl }: N8nChatProps) {
    const { isAuthenticated, isLoading } = useAuth()

    useEffect(() => {
        // Only initialize chat if user is authenticated
        if (!isAuthenticated || isLoading) {
            return
        }

        const url = webhookUrl || DEFAULT_WEBHOOK_URL
        if (!url) {
            console.warn("N8nChat: Missing webhook URL. Set NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL or pass prop.")
            return
        }

		createChat({
			webhookUrl: url,
			webhookConfig: {
				method: 'POST',
				headers: {}
			},
			target: '#n8n-chat',
			mode: 'window',
			chatInputKey: 'chatInput',
			chatSessionKey: 'sessionId',
			loadPreviousSession: true,
			metadata: {},
			showWelcomeScreen: false,
			defaultLanguage: 'en',
			initialMessages: [
				'I am your FitBuddy Chatbot. Ask me anything about your health and wellness.'
			],
			i18n: {
				en: {
					title: 'Hi there! 👋',
					subtitle: "Start first step towards a healthy lifestyle.",
					footer: '',
					getStarted: 'New Conversation',
					closeButtonTooltip: 'Close chat',
					inputPlaceholder: 'Type your question...',
				},
			},
			enableStreaming: false,
		})
    }, [webhookUrl, isAuthenticated, isLoading])

    // Don't render anything if user is not authenticated or still loading
    if (!isAuthenticated || isLoading) {
        return null
    }

	return <div id="n8n-chat" />
}



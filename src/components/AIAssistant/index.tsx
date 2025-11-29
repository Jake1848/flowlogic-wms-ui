import { useState, useEffect, useCallback } from 'react'
import { Package, MapPin, User } from 'lucide-react'
import * as aiService from '../../services/aiService'
import type { Message, SuggestedAction, ProactiveAlert, ActionQueueItem, AnalysisResult } from './types'
import {
  wmsSystemData,
  initialAlerts,
  aiPredictions,
  insightCards,
  defaultConversationHistory,
  welcomeMessage,
} from './mockData'
import AssistantHeader, { TabBar } from './AssistantHeader'
import FloatingButton from './FloatingButton'
import ChatTab from './ChatTab'
import InsightsTab from './InsightsTab'
import AlertsTab from './AlertsTab'

type TabType = 'chat' | 'insights' | 'alerts'
type AlertFilterType = 'all' | 'critical' | 'warning' | 'prediction'

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([welcomeMessage])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const [alerts, setAlerts] = useState<ProactiveAlert[]>(initialAlerts)
  const [actionQueue, setActionQueue] = useState<ActionQueueItem[]>([])
  const [conversationHistory] = useState(defaultConversationHistory)
  const [filterAlertType, setFilterAlertType] = useState<AlertFilterType>('all')
  const [isConnected, setIsConnected] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}`)

  const unreadAlertCount = alerts.filter((a) => !a.isRead).length

  // Check backend connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const health = await aiService.checkHealth()
      setIsConnected(health.status === 'ok')
    }
    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  // Keyboard shortcut to open assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const analyzeQuery = useCallback(
    async (
      query: string
    ): Promise<{ response: string; analysis?: AnalysisResult; actions?: SuggestedAction[] }> => {
      if (isConnected) {
        try {
          const result = await aiService.sendMessage(query, sessionId)
          return {
            response: result.response,
          }
        } catch {
          // Fall back to demo mode if API fails
        }
      }

      // Demo mode analysis
      return generateDemoResponse(query)
    },
    [isConnected, sessionId]
  )

  const handleSend = useCallback(async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    // Add typing indicator
    const typingId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      {
        id: typingId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isTyping: true,
        steps: [
          { id: '1', label: 'Parsing query', status: 'completed' },
          { id: '2', label: 'Searching systems', status: 'running' },
          { id: '3', label: 'Analyzing data', status: 'pending' },
          { id: '4', label: 'Generating response', status: 'pending' },
        ],
      },
    ])

    try {
      const result = await analyzeQuery(input.trim())

      // Remove typing indicator and add response
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => m.id !== typingId)
        return [
          ...withoutTyping,
          {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: result.response,
            timestamp: new Date(),
            analysis: result.analysis,
            actions: result.actions,
          },
        ]
      })
    } catch {
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => m.id !== typingId)
        return [
          ...withoutTyping,
          {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content:
              'I apologize, but I encountered an error processing your request. Please try again.',
            timestamp: new Date(),
          },
        ]
      })
    } finally {
      setIsProcessing(false)
    }
  }, [input, isProcessing, analyzeQuery])

  const executeAction = (messageId: string, actionId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.actions) {
          return {
            ...msg,
            actions: msg.actions.map((action) =>
              action.id === actionId ? { ...action, status: 'running' as const } : action
            ),
          }
        }
        return msg
      })
    )

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId && msg.actions) {
            return {
              ...msg,
              actions: msg.actions.map((action) =>
                action.id === actionId ? { ...action, status: 'completed' as const } : action
              ),
            }
          }
          return msg
        })
      )

      const action = messages.find((m) => m.id === messageId)?.actions?.find((a) => a.id === actionId)
      if (action) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'system',
            content: `${action.title} - Completed successfully`,
            timestamp: new Date(),
          },
        ])
      }
    }, 2000)
  }

  const queueAction = (action: SuggestedAction, messageId: string) => {
    setActionQueue((prev) => [
      ...prev,
      {
        id: `queue-${Date.now()}`,
        action,
        messageId,
        queuedAt: new Date(),
        priority: action.impact === 'high' ? 1 : action.impact === 'medium' ? 2 : 3,
      },
    ])
  }

  const removeFromQueue = (queueId: string) => {
    setActionQueue((prev) => prev.filter((item) => item.id !== queueId))
  }

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
  }

  const handleAlertAction = (alert: ProactiveAlert) => {
    setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, isRead: true } : a)))
    if (alert.suggestedQuery) {
      setInput(alert.suggestedQuery)
      setActiveTab('chat')
    }
  }

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })))
  }

  if (!isOpen) {
    return <FloatingButton onClick={() => setIsOpen(true)} unreadCount={unreadAlertCount} />
  }

  return (
    <div
      className={`fixed z-50 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 flex flex-col transition-all duration-300 ${
        isExpanded
          ? 'bottom-4 right-4 left-4 top-4'
          : isMinimized
          ? 'bottom-6 right-6 w-96 h-16'
          : 'bottom-6 right-6 w-[440px] h-[680px]'
      }`}
    >
      <AssistantHeader
        isMinimized={isMinimized}
        isExpanded={isExpanded}
        onToggleMinimize={() => setIsMinimized(!isMinimized)}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        onClose={() => setIsOpen(false)}
        isConnected={isConnected}
      />

      {!isMinimized && (
        <>
          <TabBar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            unreadAlertCount={unreadAlertCount}
          />

          {activeTab === 'chat' && (
            <ChatTab
              messages={messages}
              input={input}
              setInput={setInput}
              onSend={handleSend}
              isProcessing={isProcessing}
              isListening={isListening}
              setIsListening={setIsListening}
              onExecuteAction={executeAction}
              onQueueAction={queueAction}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsTab
              insightCards={insightCards}
              predictions={aiPredictions}
              conversationHistory={conversationHistory}
              wmsSystemData={wmsSystemData}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsTab
              alerts={alerts}
              filterAlertType={filterAlertType}
              setFilterAlertType={setFilterAlertType}
              onMarkAllRead={markAllRead}
              onDismissAlert={dismissAlert}
              onAlertAction={handleAlertAction}
              actionQueue={actionQueue}
              onRemoveFromQueue={removeFromQueue}
              unreadAlertCount={unreadAlertCount}
            />
          )}
        </>
      )}
    </div>
  )
}

// Demo mode response generator
function generateDemoResponse(query: string): {
  response: string
  analysis?: AnalysisResult
  actions?: SuggestedAction[]
} {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('287561') || lowerQuery.includes('overage')) {
    return {
      response:
        "I've completed a full investigation of the inventory discrepancy for product 287561 (VICKS VAL TWR W4). Here's what I found:",
      analysis: {
        type: 'root_cause',
        title: 'Root Cause Analysis - Product 287561',
        confidence: 94,
        findings: [
          {
            id: 'f1',
            severity: 'critical',
            description:
              'Over-receipt detected: PO-2025-1234 received 52 units instead of expected 48 units',
            source: 'Receiving Module',
            timestamp: '09:00',
            relatedData: { PO: 'PO-2025-1234', Expected: '48', Received: '52', Variance: '+4' },
          },
          {
            id: 'f2',
            severity: 'warning',
            description:
              'Location SA1474A now exceeds capacity (52/48 units) following putaway by JSMITH',
            source: 'Location Management',
            timestamp: '14:32',
          },
          {
            id: 'f3',
            severity: 'info',
            description:
              'This product has high velocity (A-class) with 145 picks today - may self-correct',
            source: 'Velocity Analysis',
          },
        ],
        dataPoints: [
          { label: 'Variance', value: '+4 units', trend: 'up', icon: Package, change: '+8.3%' },
          { label: 'Value Impact', value: '$94.00', trend: 'up', icon: Package },
          { label: 'Location', value: 'SA1474A', trend: 'stable', icon: MapPin },
          { label: 'Handler', value: 'K. Lee', trend: 'stable', icon: User },
        ],
        timeline: [
          { time: '09:00', event: 'Received 52 units on PO-2025-1234', type: 'transaction', user: 'KLEE' },
          { time: '09:45', event: 'Put away 48 units to SA1474A', type: 'transaction', user: 'JSMITH' },
          { time: '14:30', event: 'Pick cancelled - wrong location', type: 'error', user: 'JSMITH' },
          { time: '14:32', event: 'Put away additional 4 units', type: 'transaction', user: 'JSMITH' },
        ],
      },
      actions: [
        {
          id: 'a1',
          title: 'Create Inventory Adjustment',
          description: 'Reduce inventory by 4 units to match PO quantity',
          type: 'auto_fix',
          status: 'pending',
          impact: 'high',
          eta: '~2 min',
          details: [
            'Will create adjustment transaction ADJ-287561-001',
            'Updates location SA1474A: 52 → 48',
            'Notifies receiving supervisor of discrepancy',
          ],
        },
        {
          id: 'a2',
          title: 'Review Receiver Training',
          description: 'KLEE has 3 over-receipts this month - may need refresher training',
          type: 'investigate',
          status: 'pending',
          impact: 'medium',
        },
        {
          id: 'a3',
          title: 'Update Vendor ASN Settings',
          description: 'Enable stricter ASN validation for P&G shipments',
          type: 'prevent',
          status: 'pending',
          impact: 'low',
        },
      ],
    }
  }

  if (lowerQuery.includes('late') && lowerQuery.includes('order')) {
    return {
      response:
        "I've analyzed the late orders situation. Here's the current status and root causes:",
      analysis: {
        type: 'investigation',
        title: 'Late Orders Analysis',
        confidence: 87,
        findings: [
          {
            id: 'f1',
            severity: 'critical',
            description: '12 orders currently exceed SLA threshold (target: <5)',
            source: 'Shipping Module',
          },
          {
            id: 'f2',
            severity: 'warning',
            description: 'Primary cause: Picking backlog in Zone B affecting 8 orders',
            source: 'Wave Management',
          },
          {
            id: 'f3',
            severity: 'info',
            description: '2 rush orders delayed due to stock shortage on SKU 445566',
            source: 'Order Management',
          },
        ],
        dataPoints: [
          { label: 'Late Orders', value: '12', trend: 'up', icon: Package, change: '+4' },
          { label: 'Avg Delay', value: '1h 30m', trend: 'up', icon: Package },
          { label: 'At Risk', value: '18', trend: 'stable', icon: Package },
        ],
      },
      actions: [
        {
          id: 'a1',
          title: 'Reallocate Pickers to Zone B',
          description: 'Move 3 pickers from Zone A to clear backlog',
          type: 'auto_fix',
          status: 'pending',
          impact: 'high',
          eta: '~5 min',
        },
        {
          id: 'a2',
          title: 'Expedite Rush Orders',
          description: 'Prioritize the 2 delayed rush orders',
          type: 'auto_fix',
          status: 'pending',
          impact: 'high',
          eta: '~3 min',
        },
      ],
    }
  }

  // Default response
  return {
    response: `I understand you're asking about "${query}". Based on my analysis of the current warehouse data, I can help investigate this further. Would you like me to provide more specific details about inventory levels, order status, or workforce metrics?`,
  }
}

// Re-export types and utilities for external use
export * from './types'
export * from './utils'
export { wmsSystemData, initialAlerts, aiPredictions, insightCards } from './mockData'

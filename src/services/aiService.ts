// AI Service - Connects to FlowLogic AI Backend

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamCallbacks {
  onText: (text: string) => void;
  onToolStart?: (tool: string, id: string) => void;
  onToolExecuting?: () => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export interface WMSData {
  inventory: {
    totalItems: number;
    totalValue: number;
    accuracy: number;
    discrepancies: any[];
    recentTransactions: any[];
    hotItems: any[];
  };
  receiving: {
    openPOs: number;
    todayReceipts: number;
    issues: any[];
    dockUtilization: any[];
  };
  shipping: {
    pendingOrders: number;
    shippedToday: number;
    lateOrders: number;
    lateOrderDetails: any[];
  };
  labor: {
    activeUsers: number;
    totalUsers: number;
    productivity: number;
    topPerformers: any[];
    lowPerformers: any[];
  };
  locations: {
    totalLocations: number;
    utilizationRate: number;
    problemLocations: any[];
    replenishmentNeeded: any[];
  };
  systemHealth: {
    status: string;
    uptime: number;
    warnings: number;
  };
}

export interface ProactiveAlert {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'prediction';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  actionRequired: boolean;
  suggestedQuery?: string;
  module: string;
  metric?: {
    current: number;
    threshold: number;
    unit: string;
  };
}

// Check API health
export async function checkHealth(): Promise<{ status: string; anthropicConfigured: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'error', anthropicConfigured: false };
  }
}

// Get WMS data
export async function getWMSData(): Promise<WMSData | null> {
  try {
    const response = await fetch(`${API_BASE}/api/wms/data`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch WMS data:', error);
    return null;
  }
}

// Get proactive alerts
export async function getAlerts(): Promise<ProactiveAlert[]> {
  try {
    const response = await fetch(`${API_BASE}/api/wms/alerts`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return [];
  }
}

// Send chat message (non-streaming)
export async function sendMessage(
  message: string,
  sessionId: string = 'default'
): Promise<{ response: string; toolsUsed?: string[] }> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId, stream: false }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to send message');
  }

  return await response.json();
}

// Send chat message with streaming
export async function streamMessage(
  message: string,
  sessionId: string = 'default',
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId, stream: true }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to send message');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            switch (data.type) {
              case 'text':
                callbacks.onText(data.content);
                break;
              case 'tool_start':
                callbacks.onToolStart?.(data.tool, data.id);
                break;
              case 'tool_executing':
                callbacks.onToolExecuting?.();
                break;
              case 'done':
                callbacks.onDone();
                break;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    callbacks.onDone();
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

// Execute a specific action
export async function executeAction(
  action: string,
  params: Record<string, any>
): Promise<{ success: boolean; message?: string; [key: string]: any }> {
  const response = await fetch(`${API_BASE}/api/actions/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, params }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to execute action');
  }

  return await response.json();
}

// Clear conversation history
export async function clearConversation(sessionId: string = 'default'): Promise<void> {
  await fetch(`${API_BASE}/api/chat/${sessionId}`, { method: 'DELETE' });
}

import { Search, BarChart3, Wrench, Users, AlertTriangle, TruckIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface QuickPrompt {
  icon: LucideIcon
  label: string
  prompt: string
}

export const defaultQuickPrompts: QuickPrompt[] = [
  {
    icon: Search,
    label: 'Investigate overage',
    prompt: "What's causing the inventory overage for product 287561?",
  },
  { icon: BarChart3, label: 'System status', prompt: 'Show me the warehouse status overview' },
  { icon: Wrench, label: 'Auto-fix issues', prompt: 'Fix all inventory discrepancies' },
  { icon: Users, label: 'Labor report', prompt: 'How is the team performing today?' },
  { icon: AlertTriangle, label: 'Find shortages', prompt: 'Are there any inventory shortages?' },
  { icon: TruckIcon, label: 'Late orders', prompt: 'Why are there late orders?' },
]

interface QuickPromptsProps {
  prompts?: QuickPrompt[]
  onSelectPrompt: (prompt: string) => void
}

export default function QuickPrompts({
  prompts = defaultQuickPrompts,
  onSelectPrompt,
}: QuickPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-800">
      {prompts.map((item, index) => {
        const Icon = item.icon
        return (
          <button
            key={index}
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-xs text-gray-300 transition-colors"
          >
            <Icon className="w-3 h-3" />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

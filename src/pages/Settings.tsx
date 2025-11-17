import { useState } from 'react'
import { Save, Key, Bell, Brain, Clock, Shield } from 'lucide-react'
import { useWMSStore } from '../store/useWMSStore'

export default function Settings() {
  const { darkMode, toggleDarkMode } = useWMSStore()
  const [apiKey, setApiKey] = useState('')
  const [aiModel, setAiModel] = useState<'basic' | 'advanced'>('basic')
  const [alertThreshold, setAlertThreshold] = useState({
    variance: 5,
    skipCount: 3,
    abnCount: 3,
  })
  const [reportSchedule, setReportSchedule] = useState({
    enabled: false,
    frequency: 'daily',
    time: '09:00',
    email: '',
  })
  const [showApiKey, setShowApiKey] = useState(false)

  const handleSave = () => {
    // Mock save functionality
    alert('Settings saved successfully!')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure system preferences and integrations
        </p>
      </div>

      {/* API Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              API Configuration
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage API keys and authentication
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 pr-20"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Keep your API key secure. Do not share it with anyone.
            </p>
          </div>
        </div>
      </div>

      {/* AI Model Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              AI Model Configuration
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose between basic and advanced AI reasoning
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setAiModel('basic')}
              className={`p-4 rounded-xl border-2 transition-all ${
                aiModel === 'basic'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Basic Model
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fast processing for standard warehouse operations
              </p>
            </button>
            <button
              onClick={() => setAiModel('advanced')}
              className={`p-4 rounded-xl border-2 transition-all ${
                aiModel === 'advanced'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Advanced Model
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enhanced reasoning for complex analysis and predictions
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Thresholds */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Bell className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Alert Thresholds
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure when alerts should be triggered
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Variance Threshold (%)
            </label>
            <input
              type="number"
              value={alertThreshold.variance}
              onChange={(e) =>
                setAlertThreshold({ ...alertThreshold, variance: Number(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Alert when variance exceeds this percentage
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location Skip Count
            </label>
            <input
              type="number"
              value={alertThreshold.skipCount}
              onChange={(e) =>
                setAlertThreshold({ ...alertThreshold, skipCount: Number(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Alert when a location is skipped this many times
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ABN Count Threshold
            </label>
            <input
              type="number"
              value={alertThreshold.abnCount}
              onChange={(e) =>
                setAlertThreshold({ ...alertThreshold, abnCount: Number(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Alert when an item has this many ABNs in 7 days
            </p>
          </div>
        </div>
      </div>

      {/* Report Scheduling */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Report Scheduling
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automate report generation and delivery
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="reportEnabled"
              checked={reportSchedule.enabled}
              onChange={(e) =>
                setReportSchedule({ ...reportSchedule, enabled: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="reportEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable automated reports
            </label>
          </div>
          {reportSchedule.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequency
                </label>
                <select
                  value={reportSchedule.frequency}
                  onChange={(e) =>
                    setReportSchedule({ ...reportSchedule, frequency: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={reportSchedule.time}
                  onChange={(e) =>
                    setReportSchedule({ ...reportSchedule, time: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={reportSchedule.email}
                  onChange={(e) =>
                    setReportSchedule({ ...reportSchedule, email: e.target.value })
                  }
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Shield className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Appearance
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Customize the look and feel of the application
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Use dark theme for reduced eye strain
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              darkMode ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors font-medium"
        >
          <Save className="w-5 h-5" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  )
}

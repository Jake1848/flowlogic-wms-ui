import { useState } from 'react'
import { Smartphone, Scan, Package, CheckCircle, XCircle } from 'lucide-react'

type ScanMode = 'receive' | 'pick' | 'pack' | 'ship' | 'count' | 'putaway'

export default function MobileScanner() {
  const [scanMode, setScanMode] = useState<ScanMode>('pick')
  const [scanInput, setScanInput] = useState('')
  const [scannedItems, setScannedItems] = useState<Array<{sku: string, qty: number, location?: string}>>([])

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (scanInput.trim()) {
      setScannedItems([...scannedItems, { sku: scanInput, qty: 1, location: 'A-01-02' }])
      setScanInput('')
    }
  }

  const getModeColor = (mode: ScanMode) => {
    switch (mode) {
      case 'receive':
        return 'bg-blue-500'
      case 'pick':
        return 'bg-green-500'
      case 'pack':
        return 'bg-purple-500'
      case 'ship':
        return 'bg-orange-500'
      case 'count':
        return 'bg-yellow-500'
      case 'putaway':
        return 'bg-teal-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-3">
            <Smartphone className="w-8 h-8" />
            <span>Mobile Scanner</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            RF scanning interface for warehouse floor operations
          </p>
        </div>
      </div>

      {/* Scanner Mode Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {(['receive', 'pick', 'pack', 'ship', 'count', 'putaway'] as ScanMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => {setScanMode(mode); setScannedItems([])}}
            className={`p-4 rounded-xl text-white font-semibold capitalize transition-all ${
              scanMode === mode
                ? `${getModeColor(mode)} ring-4 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900`
                : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Scanner Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 max-w-2xl mx-auto">
        <div className={`text-center mb-8 ${getModeColor(scanMode)} text-white p-6 rounded-xl`}>
          <Scan className="w-16 h-16 mx-auto mb-2" />
          <h2 className="text-2xl font-bold capitalize">{scanMode} Mode</h2>
        </div>

        {/* Scan Input */}
        <form onSubmit={handleScan} className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Scan Barcode
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Scan or enter SKU/Location..."
              className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 font-mono"
              autoFocus
            />
            <button
              type="submit"
              className={`px-6 py-3 ${getModeColor(scanMode)} text-white rounded-lg font-semibold`}
            >
              Scan
            </button>
          </div>
        </form>

        {/* Scanned Items */}
        {scannedItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Scanned Items ({scannedItems.length})
            </h3>
            {scannedItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-mono font-medium text-gray-900 dark:text-gray-100">
                      {item.sku}
                    </div>
                    {item.location && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Location: {item.location}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Qty: {item.qty}
                  </span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {scannedItems.length > 0 && (
          <div className="flex space-x-3 mt-6">
            <button className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Complete</span>
            </button>
            <button
              onClick={() => setScannedItems([])}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center space-x-2"
            >
              <XCircle className="w-5 h-5" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 max-w-2xl mx-auto">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Quick Guide</h3>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
          <li>• Select operation mode (Receive, Pick, Pack, etc.)</li>
          <li>• Scan barcodes or manually enter SKU/Location codes</li>
          <li>• Review scanned items list</li>
          <li>• Complete transaction or clear to start over</li>
          <li>• Works with handheld RF scanners and Bluetooth scanners</li>
        </ul>
      </div>
    </div>
  )
}

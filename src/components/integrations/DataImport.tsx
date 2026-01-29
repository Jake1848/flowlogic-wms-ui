import { useState, useRef } from 'react'
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface ImportResult {
  success: boolean
  ingestionId?: string
  recordsProcessed?: number
  error?: string
}

const TEMPLATES = {
  inventory: {
    name: 'Inventory Snapshot',
    description: 'Current inventory levels by SKU and location',
    columns: ['sku', 'location', 'quantity', 'allocated', 'available'],
    example: `sku,location,quantity,allocated,available
SKU-001,A1-01-01,100,10,90
SKU-002,A1-01-02,50,5,45
SKU-003,B2-03-01,200,0,200`
  },
  transactions: {
    name: 'Transactions',
    description: 'Inventory movements and adjustments',
    columns: ['sku', 'location', 'type', 'quantity', 'timestamp', 'user'],
    example: `sku,location,type,quantity,timestamp,user
SKU-001,A1-01-01,RECEIPT,100,2026-01-25T10:00:00Z,jsmith
SKU-002,A1-01-02,PICK,-5,2026-01-25T10:30:00Z,mjones
SKU-001,A1-01-01,ADJUSTMENT,-2,2026-01-25T11:00:00Z,admin`
  },
  cycle_counts: {
    name: 'Cycle Counts',
    description: 'Physical count results',
    columns: ['sku', 'location', 'expected', 'counted', 'variance', 'timestamp'],
    example: `sku,location,expected,counted,variance,timestamp
SKU-001,A1-01-01,100,98,-2,2026-01-25T14:00:00Z
SKU-002,A1-01-02,50,50,0,2026-01-25T14:15:00Z
SKU-003,B2-03-01,200,195,-5,2026-01-25T14:30:00Z`
  }
}

export function DataImport() {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES>('inventory')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = (type: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[type]
    const blob = new Blob([template.example], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flowlogic_${type}_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('dataType', selectedTemplate === 'inventory' ? 'inventory_snapshot' : selectedTemplate)
    formData.append('mappingType', 'generic')

    try {
      const token = localStorage.getItem('flowlogic_token')
      const response = await fetch('/api/intelligence/ingest/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'FlowLogic'
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          ingestionId: data.ingestionId,
          recordsProcessed: data.recordsProcessed
        })
      } else {
        setResult({
          success: false,
          error: data.error || data.message || 'Upload failed'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error. Please try again.'
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Data Type
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => setSelectedTemplate(key as keyof typeof TEMPLATES)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedTemplate === key
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <FileSpreadsheet className={`w-5 h-5 ${
                  selectedTemplate === key ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  selectedTemplate === key
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {template.name}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {template.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Expected Columns */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Expected CSV Columns
        </h4>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES[selectedTemplate].columns.map((col) => (
            <span
              key={col}
              className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300"
            >
              {col}
            </span>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".csv,.xlsx,.xls"
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Processing your file...</p>
          </div>
        ) : result ? (
          <div className="flex flex-col items-center">
            {result.success ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <p className="text-green-600 dark:text-green-400 font-medium mb-2">
                  Import Successful!
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {result.recordsProcessed} records processed
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-red-600 dark:text-red-400 font-medium mb-2">
                  Import Failed
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {result.error}
                </p>
              </>
            )}
            <button
              onClick={() => setResult(null)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Upload Another File
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Drag and drop your CSV file here, or click to browse
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Select File
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Supported formats: CSV, Excel (.xlsx, .xls)
            </p>
          </>
        )}
      </div>

      {/* Download Templates */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div>
          <h4 className="font-semibold mb-1">Need a template?</h4>
          <p className="text-blue-100 text-sm">
            Download a sample CSV with the correct format
          </p>
        </div>
        <button
          onClick={() => downloadTemplate(selectedTemplate)}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Download {TEMPLATES[selectedTemplate].name} Template
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  Package,
  Save,
  AlertTriangle,
  CheckCircle,
  Tag,
  DollarSign,
} from 'lucide-react'

export default function ItemConfiguration() {
  const [activeTab, setActiveTab] = useState<'general' | 'reference'>('general')
  const [status, setStatus] = useState('AC')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Item Configuration</h1>
          <p className="text-gray-600 dark:text-gray-400">General product maintenance and configuration (ICF)</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Product Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DISTRIBUTION CENTER</label>
            <input
              type="text"
              value="8"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PRODUCT</label>
            <input
              type="text"
              value="896727"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center font-medium"
              />
              <input
                type="text"
                value="ACTIVE"
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-green-600 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'general', label: 'General Information' },
            { id: 'reference', label: 'Reference Items' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short Description</label>
                  <input
                    type="text"
                    defaultValue="EMC ORANGE DRNK"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Long Description</label>
                  <input
                    type="text"
                    defaultValue="EMC ORANGE DRNK MX"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pending Delete</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value="N" readOnly className="w-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">NO</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor Product Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UCN</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Crush Factor</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commodity Type</label>
                    <input
                      type="text"
                      defaultValue="STD"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cycle Class</label>
                    <input
                      type="text"
                      defaultValue="B"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Accounting Department</label>
                    <input
                      type="text"
                      defaultValue="A"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buyer</label>
                    <input
                      type="text"
                      defaultValue="F"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hazmat & Tracking */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Safety & Compliance
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hazardous Indicator</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value="N" readOnly className="w-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">NO</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hazardous Class</label>
                    <input
                      type="text"
                      defaultValue="NN"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio-Terrorism Tracking</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value="N" readOnly className="w-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">NO</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lot Number Control</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value="N" readOnly className="w-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">NO</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country of Origin Label</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value="N" readOnly className="w-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">NO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Pharmacy Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Pharmacy Controls
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RX Item</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value="N" readOnly className="w-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">NO</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RX Controlled Drug</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value="N" readOnly className="w-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">NO</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DEA Schedule</label>
                    <input
                      type="number"
                      defaultValue="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State Controlled Drug</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value="N" readOnly className="w-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">NO</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Special Control Slotting</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value="N" readOnly className="w-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">NO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost & Temperature */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Cost & Handling
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Case Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue="142.560"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capture Temperature</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value="N" readOnly className="w-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">NO</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Family Group</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bag Exclusion</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shipable Qty</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rebox Shippable Qty</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reference' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Reference Items
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Major Minor Class</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">0221</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Private Label Flag</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">NO</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Cigarette Flag</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">NO</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Unit Cost</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">3.960</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">EAS Indicator</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">-</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Tolerance Code</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">Front</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Base Unit of Measure</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">0</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Hazardous Waste Code</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">NO</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Strength</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">-</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Special Packing Flag</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">NO</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Special Marking Flag</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">NO</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Special Labeling Flag</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">NO</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Shipping Paper Flag</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">NO</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Tobacco Flag</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">NO</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Display Item Flag</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">NO</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Web Status</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">Y</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Discontinue</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">NO</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Store Return Code</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">DONATE</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">UN Code</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">-</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Store Item Disposition</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">N</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Web Only Flag</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">NO</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Price Label</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">NO</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Hazmat Class Text</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">N/A</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Packing Group</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">-</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Web On Demand</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">NO</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">DSCSA Eligible</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">N</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">WEE Exemption</label>
                <p className="text-base font-medium text-gray-900 dark:text-white">N</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

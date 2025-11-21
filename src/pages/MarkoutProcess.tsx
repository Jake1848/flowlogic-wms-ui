import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CheckCircle,
  ArrowRight,
  Package,
  AlertTriangle,
  Clipboard,
  History,
  ChevronDown,
  ChevronUp,
  Play
} from 'lucide-react';

// Markout Process Steps from FlowLogic documentation
const MARKOUT_STEPS = [
  {
    id: 1,
    title: 'Go to the Pick Bay',
    description: 'Start by physically going to the pick bay where the product should be.',
    action: 'Navigate to pick location',
    system: null
  },
  {
    id: 2,
    title: 'Check Backstock',
    description: 'Check the backstock to see if the product is present. If the product is not there, proceed to the next step.',
    action: 'Visual inspection of backstock area',
    system: null
  },
  {
    id: 3,
    title: 'Run Item Number in RMVUA',
    description: 'Access the RMVUA screen in WMS. Enter the item number and retrieve the last location from which the item was chased.',
    action: 'Query RMVUA system',
    system: 'RMVUA'
  },
  {
    id: 4,
    title: 'Look for ABN Work-Units',
    description: 'Check for any ABN (abnormal) work-units related to the item. Investigate and resolve any issues identified in these work-units.',
    action: 'Review ABN codes',
    system: 'ABN System'
  },
  {
    id: 5,
    title: 'Verify Last Location',
    description: 'Note the last location where the item was found. Get the IC machine operator to check this location.',
    action: 'Coordinate with IC operator',
    system: null
  },
  {
    id: 6,
    title: 'Check Location Count',
    description: 'If the count at the location is over, the IC machine operator will take the product to the pick bay. If the product is not at the location, proceed to the next step.',
    action: 'Verify count accuracy',
    system: null
  },
  {
    id: 7,
    title: 'Run Location History in WMS',
    description: 'Access the location history in WMS to track the movements of the item.',
    action: 'Query location history',
    system: 'WMS'
  },
  {
    id: 8,
    title: 'Check for MPP Pallet',
    description: 'Determine if the pallet was an MPP (Mixed Product Pallet) pallet. If it was, check the other items on that pallet to see where they are located.',
    action: 'Identify MPP associations',
    system: null
  },
  {
    id: 9,
    title: 'Check Invalid/Stray Case Pallets',
    description: 'Check the invalid/stray case pallets near where the other items on the MPP pick locations are located.',
    action: 'Inspect stray pallets',
    system: null
  },
  {
    id: 10,
    title: 'Check PND (Pending) Area',
    description: 'Check the PND area near the aisle from which the item was last pulled.',
    action: 'Search pending area',
    system: null
  },
  {
    id: 11,
    title: 'Check the Twilight Area',
    description: 'Inspect the twilight area for the item.',
    action: 'Search twilight zone',
    system: null
  },
  {
    id: 12,
    title: 'Adjust Pick Bay (If Necessary)',
    description: 'If the item is still not found, adjust the pick bay count if required.',
    action: 'Submit count adjustment',
    system: 'Inventory'
  },
  {
    id: 13,
    title: 'Communicate with Team Members',
    description: 'Inform relevant team members about the missing product and any adjustments made.',
    action: 'Team notification',
    system: null
  },
  {
    id: 14,
    title: 'Document the Process',
    description: 'Keep a record of all steps taken during the mark out process.',
    action: 'Create documentation',
    system: 'Documentation'
  },
  {
    id: 15,
    title: 'Review and Update Procedures',
    description: 'Regularly review the mark out process for efficiency. Update procedures based on any recurring issues or feedback from team members.',
    action: 'Process review',
    system: null
  }
];

// Mock active markout investigations
const mockInvestigations = [
  {
    id: 'MO-2024-001',
    sku: 'SKU-10045',
    description: 'Wireless Bluetooth Headphones',
    pickBay: 'A-12-03',
    currentStep: 4,
    assignee: 'John Smith',
    startTime: '2024-01-15 08:32:00',
    status: 'in_progress',
    notes: ['Backstock empty', 'RMVUA shows last chase from R-05-12']
  },
  {
    id: 'MO-2024-002',
    sku: 'SKU-30156',
    description: 'Laptop Stand Adjustable',
    pickBay: 'C-08-01',
    currentStep: 8,
    assignee: 'Maria Garcia',
    startTime: '2024-01-15 09:15:00',
    status: 'in_progress',
    notes: ['Product was on MPP pallet', 'Checking associated items']
  },
  {
    id: 'MO-2024-003',
    sku: 'SKU-20089',
    description: 'USB-C Charging Cable 6ft',
    pickBay: 'B-05-08',
    currentStep: 15,
    assignee: 'Robert Chen',
    startTime: '2024-01-15 07:45:00',
    status: 'resolved',
    notes: ['Found in twilight area', 'Product returned to pick bay', 'Count adjusted']
  }
];

export default function MarkoutProcess() {
  const [activeTab, setActiveTab] = useState<'workflow' | 'investigations' | 'guide'>('investigations');
  const [selectedInvestigation, setSelectedInvestigation] = useState<typeof mockInvestigations[0] | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [newInvestigation, setNewInvestigation] = useState({ sku: '', pickBay: '' });
  const [showNewModal, setShowNewModal] = useState(false);

  const getStepStatus = (stepId: number, currentStep: number) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mark Out Process</h1>
          <p className="text-gray-500 mt-1">Track and resolve missing product investigations</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Play className="w-4 h-4" />
          Start New Investigation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Investigations</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Search className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolved Today</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Resolution Time</p>
              <p className="text-2xl font-bold text-gray-900">42 min</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <History className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Found Rate</p>
              <p className="text-2xl font-bold text-gray-900">87%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('investigations')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'investigations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Active Investigations
            </button>
            <button
              onClick={() => setActiveTab('workflow')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'workflow'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Workflow Tracker
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'guide'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Process Guide
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Investigations Tab */}
          {activeTab === 'investigations' && (
            <div className="space-y-4">
              {mockInvestigations.map((inv) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    inv.status === 'resolved'
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                  onClick={() => setSelectedInvestigation(selectedInvestigation?.id === inv.id ? null : inv)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        inv.status === 'resolved' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        {inv.status === 'resolved' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Search className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{inv.id}</span>
                          <span className="text-gray-400">|</span>
                          <span className="font-mono text-blue-600">{inv.sku}</span>
                        </div>
                        <p className="text-sm text-gray-500">{inv.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Pick Bay: <span className="font-mono">{inv.pickBay}</span></p>
                      <p className="text-sm text-gray-400">Step {inv.currentStep} of 15</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          inv.status === 'resolved' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${(inv.currentStep / 15) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {selectedInvestigation?.id === inv.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Assignee</p>
                            <p className="font-medium">{inv.assignee}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Started</p>
                            <p className="font-medium">{inv.startTime}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Investigation Notes</p>
                          <ul className="space-y-1">
                            {inv.notes.map((note, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <ArrowRight className="w-3 h-3 text-gray-400 mt-1 flex-shrink-0" />
                                {note}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {inv.status !== 'resolved' && (
                          <div className="flex gap-2 mt-4">
                            <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                              Advance to Step {inv.currentStep + 1}
                            </button>
                            <button className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                              Mark Resolved
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}

          {/* Workflow Tab */}
          {activeTab === 'workflow' && selectedInvestigation && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  Tracking: <strong>{selectedInvestigation.id}</strong> - {selectedInvestigation.sku}
                </p>
              </div>
              {MARKOUT_STEPS.map((step) => {
                const status = getStepStatus(step.id, selectedInvestigation.currentStep);
                return (
                  <div
                    key={step.id}
                    className={`border rounded-lg p-4 transition-all ${
                      status === 'completed'
                        ? 'border-green-200 bg-green-50'
                        : status === 'current'
                        ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        status === 'completed'
                          ? 'bg-green-500 text-white'
                          : status === 'current'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {status === 'completed' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <span className="font-medium">{step.id}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{step.title}</h4>
                        {step.system && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 mt-1">
                            {step.system}
                          </span>
                        )}
                      </div>
                      {status === 'current' && (
                        <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                          Current Step
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2 ml-12">{step.description}</p>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'workflow' && !selectedInvestigation && (
            <div className="text-center py-12">
              <Clipboard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Investigation Selected</h3>
              <p className="text-gray-500">Select an investigation from the list to track its workflow progress.</p>
            </div>
          )}

          {/* Guide Tab */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Mark Out Process Guide</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Follow these 15 steps systematically when investigating missing products.
                      Document all findings and communicate with team members throughout the process.
                    </p>
                  </div>
                </div>
              </div>

              {MARKOUT_STEPS.map((step) => (
                <div key={step.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-blue-600">{step.id}</span>
                      </div>
                      <span className="font-medium text-gray-900">{step.title}</span>
                      {step.system && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                          {step.system}
                        </span>
                      )}
                    </div>
                    {expandedStep === step.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedStep === step.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-200 bg-gray-50 p-4"
                      >
                        <p className="text-gray-700 mb-3">{step.description}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Action:</span>
                          <span className="px-2 py-1 bg-white border border-gray-200 rounded text-gray-700">
                            {step.action}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Investigation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">Start New Investigation</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Item Number</label>
                <input
                  type="text"
                  value={newInvestigation.sku}
                  onChange={(e) => setNewInvestigation({ ...newInvestigation, sku: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter SKU..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pick Bay Location</label>
                <input
                  type="text"
                  value={newInvestigation.pickBay}
                  onChange={(e) => setNewInvestigation({ ...newInvestigation, pickBay: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., A-12-03"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start Investigation
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

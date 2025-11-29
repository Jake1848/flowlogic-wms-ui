import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Grid3X3,
  TrendingUp,
  Package,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Zap,
  Settings,
  Play
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Slotting strategies
const SLOTTING_STRATEGIES = [
  { id: 'velocity', label: 'Velocity-Based', description: 'Place fast movers in prime locations' },
  { id: 'family', label: 'Product Family', description: 'Group similar products together' },
  { id: 'ergonomic', label: 'Ergonomic', description: 'Optimize for picker comfort and safety' },
  { id: 'cube', label: 'Cube Utilization', description: 'Maximize storage density' },
  { id: 'pick_path', label: 'Pick Path', description: 'Minimize travel distance' },
];

// Velocity classes
const VELOCITY_CLASSES = [
  { class: 'A', label: 'Fast Mover', picks: '> 50/day', zone: 'Golden Zone', color: 'bg-red-100 text-red-800' },
  { class: 'B', label: 'Medium Mover', picks: '10-50/day', zone: 'Eye Level', color: 'bg-yellow-100 text-yellow-800' },
  { class: 'C', label: 'Slow Mover', picks: '< 10/day', zone: 'High/Low', color: 'bg-green-100 text-green-800' },
  { class: 'D', label: 'Very Slow', picks: '< 1/day', zone: 'Reserve', color: 'bg-gray-100 text-gray-800' },
];

// Mock slotting recommendations
const mockRecommendations = [
  {
    id: 'SLOT-001',
    sku: 'SKU-10045',
    description: 'Wireless Bluetooth Headphones',
    currentLocation: 'C-15-02',
    recommendedLocation: 'A-05-03',
    currentVelocity: 'C',
    actualVelocity: 'A',
    dailyPicks: 85,
    reason: 'High velocity item in slow zone - move to golden zone',
    travelSavings: '45%',
    priority: 'high',
    status: 'pending'
  },
  {
    id: 'SLOT-002',
    sku: 'SKU-20089',
    description: 'USB-C Charging Cable',
    currentLocation: 'A-03-01',
    recommendedLocation: 'A-03-02',
    currentVelocity: 'A',
    actualVelocity: 'A',
    dailyPicks: 120,
    reason: 'Move adjacent to related product SKU-20090 for family grouping',
    travelSavings: '12%',
    priority: 'medium',
    status: 'pending'
  },
  {
    id: 'SLOT-003',
    sku: 'SKU-30156',
    description: 'Laptop Stand Adjustable',
    currentLocation: 'A-08-01',
    recommendedLocation: 'B-12-04',
    currentVelocity: 'A',
    actualVelocity: 'C',
    dailyPicks: 8,
    reason: 'Low velocity item occupying prime location - relocate',
    travelSavings: '0%',
    priority: 'medium',
    status: 'pending'
  },
  {
    id: 'SLOT-004',
    sku: 'SKU-75521',
    description: 'Heavy Equipment Part',
    currentLocation: 'A-02-05',
    recommendedLocation: 'A-02-01',
    currentVelocity: 'B',
    actualVelocity: 'B',
    dailyPicks: 25,
    reason: 'Ergonomic - heavy item should be at waist level',
    travelSavings: '8%',
    priority: 'low',
    status: 'approved'
  },
  {
    id: 'SLOT-005',
    sku: 'SKU-88902',
    description: 'Seasonal Holiday Item',
    currentLocation: 'R-15-08',
    recommendedLocation: 'A-10-02',
    currentVelocity: 'D',
    actualVelocity: 'A',
    dailyPicks: 95,
    reason: 'Seasonal spike - temporary relocation to forward pick',
    travelSavings: '62%',
    priority: 'high',
    status: 'pending'
  },
];

// Zone efficiency data
const zoneEfficiency = [
  { zone: 'A (Golden)', efficiency: 94, utilization: 88, picks: 2450 },
  { zone: 'B (Eye)', efficiency: 87, utilization: 92, picks: 1820 },
  { zone: 'C (Low)', efficiency: 72, utilization: 78, picks: 890 },
  { zone: 'D (High)', efficiency: 68, utilization: 65, picks: 420 },
  { zone: 'Reserve', efficiency: 45, utilization: 82, picks: 180 },
];

// Pick density heatmap data
const pickDensityData = [
  { aisle: 'A-01', picks: 320 },
  { aisle: 'A-02', picks: 285 },
  { aisle: 'A-03', picks: 410 },
  { aisle: 'A-04', picks: 195 },
  { aisle: 'A-05', picks: 380 },
  { aisle: 'B-01', picks: 220 },
  { aisle: 'B-02', picks: 175 },
  { aisle: 'B-03', picks: 290 },
];

export default function Slotting() {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'analysis' | 'optimize'>('recommendations');
  const [selectedRec, setSelectedRec] = useState<typeof mockRecommendations[0] | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVelocityInfo = (velocity: string) => VELOCITY_CLASSES.find(v => v.class === velocity);

  const filteredRecs = mockRecommendations.filter(rec =>
    filterPriority === 'all' || rec.priority === filterPriority
  );

  const pendingCount = mockRecommendations.filter(r => r.status === 'pending').length;
  const totalSavings = mockRecommendations.reduce((sum, r) => sum + parseInt(r.travelSavings), 0) / mockRecommendations.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Slotting Optimization</h1>
          <p className="text-gray-500 mt-1">Optimize product placement for maximum efficiency</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Settings className="w-4 h-4" />
            Slotting Rules
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Zap className="w-4 h-4" />
            Run Analysis
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Moves</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <RefreshCw className="w-6 h-6 text-yellow-600" />
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
              <p className="text-sm text-gray-500">Avg Travel Savings</p>
              <p className="text-2xl font-bold text-green-600">{Math.round(totalSavings)}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
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
              <p className="text-sm text-gray-500">Slot Efficiency</p>
              <p className="text-2xl font-bold text-blue-600">78%</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Grid3X3 className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm text-gray-500">Misslotted Items</p>
              <p className="text-2xl font-bold text-red-600">23</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Velocity Classes Reference */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="font-medium text-gray-900 mb-3">Velocity Classification</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {VELOCITY_CLASSES.map((vc) => (
            <div key={vc.class} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${vc.color}`}>
                  {vc.class}
                </span>
                <span className="font-medium text-gray-900">{vc.label}</span>
              </div>
              <p className="text-sm text-gray-500">{vc.picks}</p>
              <p className="text-xs text-gray-400">Zone: {vc.zone}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'recommendations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Recommendations ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'analysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Zone Analysis
            </button>
            <button
              onClick={() => setActiveTab('optimize')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'optimize'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Optimization Settings
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {/* Filter */}
              <div className="flex items-center gap-4">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <button className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Approve All
                </button>
              </div>

              {/* Recommendations List */}
              <div className="space-y-3">
                {filteredRecs.map((rec) => {
                  const currentVel = getVelocityInfo(rec.currentVelocity);
                  const actualVel = getVelocityInfo(rec.actualVelocity);

                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedRec?.id === rec.id
                          ? 'border-blue-300 bg-blue-50'
                          : rec.status === 'approved'
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedRec(selectedRec?.id === rec.id ? null : rec)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Package className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{rec.sku}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                                {rec.priority}
                              </span>
                              {rec.status === 'approved' && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Approved
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{rec.description}</p>
                            <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-mono">{rec.currentLocation}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-blue-600">{rec.recommendedLocation}</span>
                          </div>
                          <p className="text-sm text-green-600 mt-1">-{rec.travelSavings} travel</p>
                        </div>
                      </div>

                      {/* Velocity Mismatch */}
                      {rec.currentVelocity !== rec.actualVelocity && (
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <span className="text-gray-500">Velocity:</span>
                          <span className={`px-2 py-0.5 rounded ${currentVel?.color}`}>
                            Slotted as {currentVel?.class}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className={`px-2 py-0.5 rounded ${actualVel?.color}`}>
                            Actual {actualVel?.class} ({rec.dailyPicks}/day)
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      {selectedRec?.id === rec.id && rec.status === 'pending' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 pt-4 border-t border-gray-200 flex gap-2"
                        >
                          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                            Approve Move
                          </button>
                          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                            Schedule Later
                          </button>
                          <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">
                            Reject
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Zone Efficiency */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Zone Efficiency</h3>
                  <div className="space-y-3">
                    {zoneEfficiency.map((zone) => (
                      <div key={zone.zone} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-gray-700">{zone.zone}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${zone.efficiency}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12">{zone.efficiency}%</span>
                          </div>
                          <div className="text-xs text-gray-500">{zone.picks} picks • {zone.utilization}% utilized</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pick Density */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Pick Density by Aisle</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={pickDensityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="aisle" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="picks" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Optimize Tab */}
          {activeTab === 'optimize' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-800">Slotting Optimization Engine</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Configure slotting rules and run optimization analysis to generate recommendations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Optimization Strategy</h4>
                  {SLOTTING_STRATEGIES.map((strategy) => (
                    <label key={strategy.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" className="mt-1 rounded border-gray-300" defaultChecked={strategy.id === 'velocity'} />
                      <div>
                        <p className="font-medium text-gray-900">{strategy.label}</p>
                        <p className="text-sm text-gray-500">{strategy.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Parameters</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Period</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                      <option>Last 90 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Daily Picks for A-Class</label>
                    <input type="number" defaultValue={50} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Golden Zone Height (inches)</label>
                    <input type="text" defaultValue="24-48" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Play className="w-4 h-4" />
                    Run Optimization
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

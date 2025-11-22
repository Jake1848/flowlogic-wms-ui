import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Truck,
  CheckCircle,
  AlertTriangle,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine
} from 'lucide-react';

// Dock doors configuration
const DOCK_DOORS = [
  { id: 'D-01', type: 'both', status: 'available', equipment: 'Forklift access' },
  { id: 'D-02', type: 'both', status: 'occupied', equipment: 'Forklift access' },
  { id: 'D-03', type: 'inbound', status: 'available', equipment: 'Conveyor' },
  { id: 'D-04', type: 'inbound', status: 'scheduled', equipment: 'Conveyor' },
  { id: 'D-05', type: 'outbound', status: 'available', equipment: 'Forklift access' },
  { id: 'D-06', type: 'outbound', status: 'occupied', equipment: 'Pallet jack' },
  { id: 'D-07', type: 'ltl', status: 'available', equipment: 'Dock leveler' },
  { id: 'D-08', type: 'ltl', status: 'maintenance', equipment: 'Dock leveler' },
];

// Time slots for scheduling
const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

// Mock appointments
const mockAppointments = [
  {
    id: 'APT-001',
    type: 'inbound',
    carrier: 'ABC Trucking',
    driver: 'Mike Johnson',
    phone: '555-0123',
    dock: 'D-02',
    scheduledTime: '08:00',
    duration: 2,
    status: 'checked_in',
    poNumbers: ['PO-45821', 'PO-45822'],
    pallets: 24,
    trailerNumber: 'TR-5521'
  },
  {
    id: 'APT-002',
    type: 'inbound',
    carrier: 'Fast Freight',
    driver: 'Sarah Williams',
    phone: '555-0456',
    dock: 'D-04',
    scheduledTime: '10:00',
    duration: 1,
    status: 'scheduled',
    poNumbers: ['PO-45825'],
    pallets: 12,
    trailerNumber: null
  },
  {
    id: 'APT-003',
    type: 'outbound',
    carrier: 'UPS Freight',
    driver: 'Tom Brown',
    phone: '555-0789',
    dock: 'D-06',
    scheduledTime: '09:00',
    duration: 2,
    status: 'loading',
    orderNumbers: ['ORD-78521', 'ORD-78522', 'ORD-78523'],
    pallets: 18,
    trailerNumber: 'UP-8842'
  },
  {
    id: 'APT-004',
    type: 'outbound',
    carrier: 'FedEx Freight',
    driver: null,
    phone: null,
    dock: null,
    scheduledTime: '14:00',
    duration: 1,
    status: 'scheduled',
    orderNumbers: ['ORD-78530'],
    pallets: 8,
    trailerNumber: null
  },
];

export default function DockScheduling() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDock, setSelectedDock] = useState<string | null>(null);
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 border-green-300';
      case 'occupied': return 'bg-blue-100 border-blue-300';
      case 'scheduled': return 'bg-yellow-100 border-yellow-300';
      case 'maintenance': return 'bg-red-100 border-red-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getAppointmentColor = (status: string) => {
    switch (status) {
      case 'checked_in': return 'bg-blue-500';
      case 'loading': return 'bg-green-500';
      case 'unloading': return 'bg-green-500';
      case 'scheduled': return 'bg-yellow-500';
      case 'completed': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  const getAppointmentStatusLabel = (status: string) => {
    switch (status) {
      case 'checked_in': return 'Checked In';
      case 'loading': return 'Loading';
      case 'unloading': return 'Unloading';
      case 'scheduled': return 'Scheduled';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dock Scheduling</h1>
          <p className="text-gray-500 mt-1">Manage dock door appointments and carrier check-ins</p>
        </div>
        <button
          onClick={() => setShowNewAppointment(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Appointment
        </button>
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
              <p className="text-sm text-gray-500">Inbound Today</p>
              <p className="text-2xl font-bold text-blue-600">8</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ArrowDownToLine className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm text-gray-500">Outbound Today</p>
              <p className="text-2xl font-bold text-green-600">12</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowUpFromLine className="w-6 h-6 text-green-600" />
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
              <p className="text-sm text-gray-500">Available Docks</p>
              <p className="text-2xl font-bold text-gray-900">5/8</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <MapPin className="w-6 h-6 text-gray-600" />
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
              <p className="text-sm text-gray-500">Waiting Check-in</p>
              <p className="text-2xl font-bold text-orange-600">2</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dock Status Overview */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="font-medium text-gray-900 mb-4">Dock Door Status</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {DOCK_DOORS.map((dock) => (
            <button
              key={dock.id}
              onClick={() => setSelectedDock(selectedDock === dock.id ? null : dock.id)}
              className={`p-3 rounded-lg border-2 transition-all ${getStatusColor(dock.status)} ${
                selectedDock === dock.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <p className="font-bold text-gray-900">{dock.id}</p>
              <p className="text-xs text-gray-600 capitalize">{dock.type}</p>
              <div className="mt-1">
                {dock.status === 'available' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {dock.status === 'occupied' && <Truck className="w-4 h-4 text-blue-600" />}
                {dock.status === 'scheduled' && <Clock className="w-4 h-4 text-yellow-600" />}
                {dock.status === 'maintenance' && <AlertTriangle className="w-4 h-4 text-red-600" />}
              </div>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-400"></div>
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-400"></div>
            <span className="text-gray-600">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-400"></div>
            <span className="text-gray-600">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-400"></div>
            <span className="text-gray-600">Maintenance</span>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Date Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-900">{formatDate(selectedDate)}</span>
          </div>
          <button
            onClick={() => navigateDate(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Schedule Grid */}
        <div className="p-4 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-9 gap-2 mb-2">
              <div className="text-sm font-medium text-gray-500">Time</div>
              {DOCK_DOORS.map(dock => (
                <div key={dock.id} className="text-sm font-medium text-gray-900 text-center">
                  {dock.id}
                </div>
              ))}
            </div>

            {/* Time Slots */}
            {TIME_SLOTS.map((time) => (
              <div key={time} className="grid grid-cols-9 gap-2 mb-1">
                <div className="text-sm text-gray-500 py-2">{time}</div>
                {DOCK_DOORS.map(dock => {
                  const appointment = mockAppointments.find(
                    apt => apt.dock === dock.id && apt.scheduledTime === time
                  );
                  return (
                    <div
                      key={`${dock.id}-${time}`}
                      className={`h-10 rounded border ${
                        appointment
                          ? `${getAppointmentColor(appointment.status)} border-transparent`
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      {appointment && (
                        <div className="h-full flex items-center justify-center text-xs text-white font-medium truncate px-1">
                          {appointment.carrier}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Today's Appointments</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {mockAppointments.map((apt) => (
            <div key={apt.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    apt.type === 'inbound' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {apt.type === 'inbound' ? (
                      <ArrowDownToLine className={`w-5 h-5 ${
                        apt.type === 'inbound' ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    ) : (
                      <ArrowUpFromLine className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{apt.carrier}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        apt.type === 'inbound' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {apt.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        apt.status === 'loading' || apt.status === 'unloading' ? 'bg-green-100 text-green-800' :
                        apt.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getAppointmentStatusLabel(apt.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {apt.scheduledTime}
                      </span>
                      {apt.dock && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {apt.dock}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {apt.pallets} pallets
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {apt.status === 'scheduled' && !apt.dock && (
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                      Assign Dock
                    </button>
                  )}
                  {apt.status === 'scheduled' && apt.dock && (
                    <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                      Check In
                    </button>
                  )}
                  {(apt.status === 'loading' || apt.status === 'unloading' || apt.status === 'checked_in') && (
                    <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Dock Appointment</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="inbound">Inbound (Receiving)</option>
                  <option value="outbound">Outbound (Shipping)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter carrier name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dock Door</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">Auto-assign</option>
                  {DOCK_DOORS.filter(d => d.status === 'available').map(dock => (
                    <option key={dock.id} value={dock.id}>{dock.id} ({dock.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Pallets</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowNewAppointment(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowNewAppointment(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Appointment
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

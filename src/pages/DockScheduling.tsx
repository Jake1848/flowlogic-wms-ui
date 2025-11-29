import { useState, useEffect } from 'react';
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
  ArrowUpFromLine,
  Boxes,
  FileText,
  Layers,
  RefreshCw,
  X,
  Eye
} from 'lucide-react';

interface DockDoor {
  id: string;
  code: string;
  name: string;
  type: string;
  currentStatus: string;
}

interface Appointment {
  id: string;
  type: 'inbound' | 'outbound';
  appointmentNumber: string;
  status: string;
  scheduledTime: string;
  dock: { id: string; code: string; name: string } | null;
  carrier: string;
  vendorName?: string;
  vendorCode?: string;
  trackingNumber?: string;
  bolNumber?: string;
  sealNumber?: string;
  trailerNumber?: string;
  poCount: number;
  poNumbers?: string[];
  orderCount?: number;
  orderNumbers?: string[];
  skuCount: number;
  skus?: string[];
  palletCount: number;
  caseCount: number;
  unitCount: number;
  lineCount: number;
  notes?: string;
}

interface AppointmentSummary {
  totalInbound: number;
  totalOutbound: number;
  totalPOs: number;
  totalOrders: number;
  totalSKUs: number;
  totalPallets: number;
  totalCases: number;
  totalUnits: number;
  byStatus: {
    scheduled: number;
    checkedIn: number;
    inProgress: number;
    completed: number;
  };
}

// Dock doors configuration (fallback)
const DEFAULT_DOCK_DOORS: DockDoor[] = [
  { id: 'D-01', code: 'D-01', name: 'Dock 1', type: 'BOTH', currentStatus: 'AVAILABLE' },
  { id: 'D-02', code: 'D-02', name: 'Dock 2', type: 'BOTH', currentStatus: 'OCCUPIED' },
  { id: 'D-03', code: 'D-03', name: 'Dock 3', type: 'RECEIVING', currentStatus: 'AVAILABLE' },
  { id: 'D-04', code: 'D-04', name: 'Dock 4', type: 'RECEIVING', currentStatus: 'RESERVED' },
  { id: 'D-05', code: 'D-05', name: 'Dock 5', type: 'SHIPPING', currentStatus: 'AVAILABLE' },
  { id: 'D-06', code: 'D-06', name: 'Dock 6', type: 'SHIPPING', currentStatus: 'OCCUPIED' },
  { id: 'D-07', code: 'D-07', name: 'Dock 7', type: 'BOTH', currentStatus: 'AVAILABLE' },
  { id: 'D-08', code: 'D-08', name: 'Dock 8', type: 'BOTH', currentStatus: 'MAINTENANCE' },
];

// Time slots for scheduling
const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

// Initial demo data generator (defined outside component)
const getInitialDemoAppointments = (): Appointment[] => {
  const today = new Date();
  const hour8 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0, 0);
  const hour9 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0);
  const hour10 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0);
  const hour14 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0);

  return [
    {
      id: 'apt-001',
      type: 'inbound',
      appointmentNumber: 'RCV-2024-001',
      status: 'checked_in',
      scheduledTime: hour8.toISOString(),
      dock: { id: 'D-02', code: 'D-02', name: 'Dock 2' },
      carrier: 'ABC Trucking',
      vendorName: 'Acme Supplies',
      trackingNumber: 'TRK-445521',
      bolNumber: 'BOL-8821',
      sealNumber: 'SEAL-1234',
      poCount: 2,
      poNumbers: ['PO-45821', 'PO-45822'],
      skuCount: 8,
      palletCount: 12,
      caseCount: 48,
      unitCount: 960,
      lineCount: 8
    },
    {
      id: 'apt-002',
      type: 'inbound',
      appointmentNumber: 'RCV-2024-002',
      status: 'scheduled',
      scheduledTime: hour10.toISOString(),
      dock: { id: 'D-04', code: 'D-04', name: 'Dock 4' },
      carrier: 'Fast Freight',
      vendorName: 'Global Parts Inc',
      poCount: 1,
      poNumbers: ['PO-45825'],
      skuCount: 4,
      palletCount: 6,
      caseCount: 24,
      unitCount: 480,
      lineCount: 4
    },
    {
      id: 'apt-003',
      type: 'outbound',
      appointmentNumber: 'SHP-2024-001',
      status: 'loading',
      scheduledTime: hour9.toISOString(),
      dock: { id: 'D-06', code: 'D-06', name: 'Dock 6' },
      carrier: 'UPS Freight',
      trackingNumber: 'UP-8842',
      trailerNumber: 'TRL-5521',
      poCount: 0,
      orderCount: 3,
      orderNumbers: ['ORD-78521', 'ORD-78522', 'ORD-78523'],
      skuCount: 12,
      palletCount: 18,
      caseCount: 72,
      unitCount: 1440,
      lineCount: 12
    },
    {
      id: 'apt-004',
      type: 'outbound',
      appointmentNumber: 'SHP-2024-002',
      status: 'scheduled',
      scheduledTime: hour14.toISOString(),
      dock: null,
      carrier: 'FedEx Freight',
      poCount: 0,
      orderCount: 2,
      orderNumbers: ['ORD-78530', 'ORD-78531'],
      skuCount: 6,
      palletCount: 8,
      caseCount: 32,
      unitCount: 640,
      lineCount: 6
    }
  ];
};

const INITIAL_APPOINTMENTS = getInitialDemoAppointments();
const INITIAL_SUMMARY: AppointmentSummary = {
  totalInbound: 2,
  totalOutbound: 2,
  totalPOs: 3,
  totalOrders: 5,
  totalSKUs: 30,
  totalPallets: 44,
  totalCases: 176,
  totalUnits: 3520,
  byStatus: { scheduled: 2, checkedIn: 1, inProgress: 1, completed: 0 }
};

export default function DockScheduling() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDock, setSelectedDock] = useState<string | null>(null);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showAppointmentDetail, setShowAppointmentDetail] = useState<Appointment | null>(null);
  const [dockDoors, setDockDoors] = useState<DockDoor[]>(DEFAULT_DOCK_DOORS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [summary, setSummary] = useState<AppointmentSummary | null>(INITIAL_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch appointments from API
  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`http://localhost:3001/api/docks/appointments?date=${dateStr}`);
      const data = await response.json();

      // If we got appointments from API, use them; otherwise use demo data
      if (data.appointments && data.appointments.length > 0) {
        setAppointments(data.appointments);
        setSummary(data.summary || null);
      } else {
        // Use demo data when API returns empty
        loadDemoData();
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      // Use demo data on error
      loadDemoData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoData = () => {
    const demoAppts = getDemoAppointments();
    setAppointments(demoAppts);

    // Calculate summary from demo data
    const inbound = demoAppts.filter(a => a.type === 'inbound');
    const outbound = demoAppts.filter(a => a.type === 'outbound');
    setSummary({
      totalInbound: inbound.length,
      totalOutbound: outbound.length,
      totalPOs: inbound.reduce((sum, a) => sum + a.poCount, 0),
      totalOrders: outbound.reduce((sum, a) => sum + (a.orderCount || 0), 0),
      totalSKUs: demoAppts.reduce((sum, a) => sum + a.skuCount, 0),
      totalPallets: demoAppts.reduce((sum, a) => sum + a.palletCount, 0),
      totalCases: demoAppts.reduce((sum, a) => sum + a.caseCount, 0),
      totalUnits: demoAppts.reduce((sum, a) => sum + a.unitCount, 0),
      byStatus: { scheduled: 2, checkedIn: 1, inProgress: 1, completed: 0 }
    });
  };

  const getDemoAppointments = (): Appointment[] => {
    // Create fresh date objects for each appointment
    const today = new Date();
    const hour8 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0, 0);
    const hour9 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0);
    const hour10 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0);
    const hour14 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0);

    return [
      {
        id: 'apt-001',
        type: 'inbound',
        appointmentNumber: 'RCV-2024-001',
        status: 'checked_in',
        scheduledTime: hour8.toISOString(),
        dock: { id: 'D-02', code: 'D-02', name: 'Dock 2' },
        carrier: 'ABC Trucking',
        vendorName: 'Acme Supplies',
        trackingNumber: 'TRK-445521',
        bolNumber: 'BOL-8821',
        sealNumber: 'SEAL-1234',
        poCount: 2,
        poNumbers: ['PO-45821', 'PO-45822'],
        skuCount: 8,
        palletCount: 12,
        caseCount: 48,
        unitCount: 960,
        lineCount: 8
      },
      {
        id: 'apt-002',
        type: 'inbound',
        appointmentNumber: 'RCV-2024-002',
        status: 'scheduled',
        scheduledTime: hour10.toISOString(),
        dock: { id: 'D-04', code: 'D-04', name: 'Dock 4' },
        carrier: 'Fast Freight',
        vendorName: 'Global Parts Inc',
        poCount: 1,
        poNumbers: ['PO-45825'],
        skuCount: 4,
        palletCount: 6,
        caseCount: 24,
        unitCount: 480,
        lineCount: 4
      },
      {
        id: 'apt-003',
        type: 'outbound',
        appointmentNumber: 'SHP-2024-001',
        status: 'loading',
        scheduledTime: hour9.toISOString(),
        dock: { id: 'D-06', code: 'D-06', name: 'Dock 6' },
        carrier: 'UPS Freight',
        trackingNumber: 'UP-8842',
        trailerNumber: 'TRL-5521',
        poCount: 0,
        orderCount: 3,
        orderNumbers: ['ORD-78521', 'ORD-78522', 'ORD-78523'],
        skuCount: 12,
        palletCount: 18,
        caseCount: 72,
        unitCount: 1440,
        lineCount: 12
      },
      {
        id: 'apt-004',
        type: 'outbound',
        appointmentNumber: 'SHP-2024-002',
        status: 'scheduled',
        scheduledTime: hour14.toISOString(),
        dock: null,
        carrier: 'FedEx Freight',
        poCount: 0,
        orderCount: 2,
        orderNumbers: ['ORD-78530', 'ORD-78531'],
        skuCount: 6,
        palletCount: 8,
        caseCount: 32,
        unitCount: 640,
        lineCount: 6
      }
    ];
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'available': return 'bg-green-100 border-green-300';
      case 'occupied': return 'bg-blue-100 border-blue-300';
      case 'reserved':
      case 'scheduled': return 'bg-yellow-100 border-yellow-300';
      case 'maintenance': return 'bg-red-100 border-red-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getAppointmentColor = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'checked_in': return 'bg-blue-500';
      case 'loading':
      case 'unloading':
      case 'receiving': return 'bg-green-500';
      case 'scheduled':
      case 'new': return 'bg-yellow-500';
      case 'completed':
      case 'received':
      case 'shipped': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  const getAppointmentStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'checked_in': return 'Checked In';
      case 'loading': return 'Loading';
      case 'unloading': return 'Unloading';
      case 'receiving': return 'Receiving';
      case 'scheduled':
      case 'new': return 'Scheduled';
      case 'completed':
      case 'received': return 'Completed';
      case 'shipped': return 'Shipped';
      default: return status;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getAppointmentForSlot = (dockCode: string, time: string) => {
    return appointments.find(apt => {
      if (!apt.dock || apt.dock.code !== dockCode) return false;
      const aptTime = formatTime(apt.scheduledTime);
      return aptTime === time;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dock Scheduling</h1>
          <p className="text-gray-500 mt-1">Manage dock door appointments and carrier check-ins</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAppointments}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowNewAppointment(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inbound</p>
              <p className="text-2xl font-bold text-blue-600">{summary?.totalInbound || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ArrowDownToLine className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Outbound</p>
              <p className="text-2xl font-bold text-green-600">{summary?.totalOutbound || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowUpFromLine className="w-6 h-6 text-green-600" />
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
              <p className="text-sm text-gray-500">Total POs</p>
              <p className="text-2xl font-bold text-purple-600">{summary?.totalPOs || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total SKUs</p>
              <p className="text-2xl font-bold text-orange-600">{summary?.totalSKUs || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Package className="w-6 h-6 text-orange-600" />
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
              <p className="text-sm text-gray-500">Total Pallets</p>
              <p className="text-2xl font-bold text-cyan-600">{summary?.totalPallets || 0}</p>
            </div>
            <div className="p-3 bg-cyan-100 rounded-lg">
              <Layers className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Cases</p>
              <p className="text-2xl font-bold text-pink-600">{summary?.totalCases || 0}</p>
            </div>
            <div className="p-3 bg-pink-100 rounded-lg">
              <Boxes className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dock Status Overview */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="font-medium text-gray-900 mb-4">Dock Door Status</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {dockDoors.map((dock) => (
            <button
              key={dock.id}
              onClick={() => setSelectedDock(selectedDock === dock.id ? null : dock.id)}
              className={`p-3 rounded-lg border-2 transition-all ${getStatusColor(dock.currentStatus)} ${
                selectedDock === dock.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <p className="font-bold text-gray-900">{dock.code}</p>
              <p className="text-xs text-gray-600 capitalize">{dock.type.toLowerCase()}</p>
              <div className="mt-1">
                {dock.currentStatus === 'AVAILABLE' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {dock.currentStatus === 'OCCUPIED' && <Truck className="w-4 h-4 text-blue-600" />}
                {dock.currentStatus === 'RESERVED' && <Clock className="w-4 h-4 text-yellow-600" />}
                {dock.currentStatus === 'MAINTENANCE' && <AlertTriangle className="w-4 h-4 text-red-600" />}
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
            <span className="text-gray-600">Reserved</span>
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
              {dockDoors.map(dock => (
                <div key={dock.id} className="text-sm font-medium text-gray-900 text-center">
                  {dock.code}
                </div>
              ))}
            </div>

            {/* Time Slots */}
            {TIME_SLOTS.map((time) => (
              <div key={time} className="grid grid-cols-9 gap-2 mb-1">
                <div className="text-sm text-gray-500 py-2">{time}</div>
                {dockDoors.map(dock => {
                  const appointment = getAppointmentForSlot(dock.code, time);
                  return (
                    <div
                      key={`${dock.id}-${time}`}
                      onClick={() => appointment && setShowAppointmentDetail(appointment)}
                      className={`h-10 rounded border cursor-pointer transition-all ${
                        appointment
                          ? `${getAppointmentColor(appointment.status)} border-transparent hover:opacity-80`
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
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
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No appointments scheduled for this date
            </div>
          ) : (
            appointments.map((apt) => (
              <div key={apt.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      apt.type === 'inbound' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {apt.type === 'inbound' ? (
                        <ArrowDownToLine className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ArrowUpFromLine className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{apt.carrier}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          apt.type === 'inbound' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {apt.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          apt.status === 'loading' || apt.status === 'receiving' ? 'bg-green-100 text-green-800' :
                          apt.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getAppointmentStatusLabel(apt.status)}
                        </span>
                      </div>

                      {/* Basic Info Row */}
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(apt.scheduledTime)}
                        </span>
                        {apt.dock && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {apt.dock.code}
                          </span>
                        )}
                        {apt.vendorName && (
                          <span className="text-gray-600">
                            Vendor: {apt.vendorName}
                          </span>
                        )}
                      </div>

                      {/* Metrics Row - Key Addition */}
                      <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                        {apt.type === 'inbound' && apt.poCount > 0 && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded">
                            <FileText className="w-3 h-3" />
                            {apt.poCount} PO{apt.poCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {apt.type === 'outbound' && apt.orderCount && apt.orderCount > 0 && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded">
                            <FileText className="w-3 h-3" />
                            {apt.orderCount} Order{apt.orderCount > 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded">
                          <Package className="w-3 h-3" />
                          {apt.skuCount} SKU{apt.skuCount > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-cyan-50 text-cyan-700 rounded">
                          <Layers className="w-3 h-3" />
                          {apt.palletCount} Pallet{apt.palletCount > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-pink-50 text-pink-700 rounded">
                          <Boxes className="w-3 h-3" />
                          {apt.caseCount} Case{apt.caseCount > 1 ? 's' : ''}
                        </span>
                        <span className="text-gray-500">
                          ({apt.unitCount.toLocaleString()} units)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAppointmentDetail(apt)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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
                    {['loading', 'receiving', 'checked_in'].includes(apt.status.toLowerCase()) && (
                      <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {showAppointmentDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  showAppointmentDetail.type === 'inbound' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {showAppointmentDetail.type === 'inbound' ? (
                    <ArrowDownToLine className="w-5 h-5 text-blue-600" />
                  ) : (
                    <ArrowUpFromLine className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {showAppointmentDetail.appointmentNumber}
                  </h2>
                  <p className="text-sm text-gray-500">{showAppointmentDetail.carrier}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAppointmentDetail(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p className={`mt-1 inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    showAppointmentDetail.status === 'loading' || showAppointmentDetail.status === 'receiving'
                      ? 'bg-green-100 text-green-800'
                      : showAppointmentDetail.status === 'checked_in'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getAppointmentStatusLabel(showAppointmentDetail.status)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Scheduled Time</label>
                  <p className="mt-1 font-medium">{formatTime(showAppointmentDetail.scheduledTime)}</p>
                </div>
              </div>

              {/* Dock & Carrier */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Dock</label>
                  <p className="mt-1 font-medium">
                    {showAppointmentDetail.dock?.code || 'Not Assigned'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    {showAppointmentDetail.type === 'inbound' ? 'Vendor' : 'Carrier'}
                  </label>
                  <p className="mt-1 font-medium">
                    {showAppointmentDetail.vendorName || showAppointmentDetail.carrier}
                  </p>
                </div>
              </div>

              {/* References */}
              {(showAppointmentDetail.trackingNumber || showAppointmentDetail.bolNumber || showAppointmentDetail.sealNumber) && (
                <div className="grid grid-cols-3 gap-4">
                  {showAppointmentDetail.trackingNumber && (
                    <div>
                      <label className="text-sm text-gray-500">Tracking #</label>
                      <p className="mt-1 font-mono text-sm">{showAppointmentDetail.trackingNumber}</p>
                    </div>
                  )}
                  {showAppointmentDetail.bolNumber && (
                    <div>
                      <label className="text-sm text-gray-500">BOL #</label>
                      <p className="mt-1 font-mono text-sm">{showAppointmentDetail.bolNumber}</p>
                    </div>
                  )}
                  {showAppointmentDetail.sealNumber && (
                    <div>
                      <label className="text-sm text-gray-500">Seal #</label>
                      <p className="mt-1 font-mono text-sm">{showAppointmentDetail.sealNumber}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Metrics Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Load Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {showAppointmentDetail.type === 'inbound'
                        ? showAppointmentDetail.poCount
                        : showAppointmentDetail.orderCount || 0}
                    </p>
                    <p className="text-sm text-gray-500">
                      {showAppointmentDetail.type === 'inbound' ? 'POs' : 'Orders'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{showAppointmentDetail.skuCount}</p>
                    <p className="text-sm text-gray-500">SKUs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-600">{showAppointmentDetail.palletCount}</p>
                    <p className="text-sm text-gray-500">Pallets</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pink-600">{showAppointmentDetail.caseCount}</p>
                    <p className="text-sm text-gray-500">Cases</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                  <p className="text-lg font-medium text-gray-900">
                    {showAppointmentDetail.unitCount.toLocaleString()} Total Units
                  </p>
                </div>
              </div>

              {/* PO/Order Numbers */}
              {showAppointmentDetail.poNumbers && showAppointmentDetail.poNumbers.length > 0 && (
                <div>
                  <label className="text-sm text-gray-500">Purchase Orders</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {showAppointmentDetail.poNumbers.map(po => (
                      <span key={po} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {po}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {showAppointmentDetail.orderNumbers && showAppointmentDetail.orderNumbers.length > 0 && (
                <div>
                  <label className="text-sm text-gray-500">Orders</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {showAppointmentDetail.orderNumbers.map(ord => (
                      <span key={ord} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {ord}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowAppointmentDetail(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              {showAppointmentDetail.status === 'scheduled' && (
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Check In
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

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
                    defaultValue={selectedDate.toISOString().split('T')[0]}
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
                  {dockDoors.filter(d => d.currentStatus === 'AVAILABLE').map(dock => (
                    <option key={dock.id} value={dock.id}>{dock.code} ({dock.type.toLowerCase()})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Pallets</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Cases</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0"
                  />
                </div>
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

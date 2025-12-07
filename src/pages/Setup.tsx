import React, { useState } from 'react';
import {
  Database,
  Link,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  ChevronRight,
  Building2,
  Warehouse,
  Users,
  Zap
} from 'lucide-react';

interface ConnectionStatus {
  connected: boolean;
  message: string;
  lastChecked?: string;
}

interface ERPConfig {
  type: string;
  host: string;
  port: string;
  username: string;
  password: string;
  database?: string;
  client?: string;
  accountId?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
}

const Setup: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, ConnectionStatus>>({});

  // Company setup
  const [companyConfig, setCompanyConfig] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
    phone: '',
    email: ''
  });

  // Database setup
  const [dbConfig, setDbConfig] = useState({
    type: 'postgresql',
    host: 'localhost',
    port: '5432',
    database: 'flowlogic_wms',
    username: 'flowlogic',
    password: ''
  });

  // ERP setup
  const [erpConfig, setErpConfig] = useState<ERPConfig>({
    type: 'none',
    host: '',
    port: '',
    username: '',
    password: ''
  });

  // Warehouse setup
  const [warehouses, setWarehouses] = useState([
    { code: 'DC01', name: 'Main Distribution Center', address: '', timezone: 'America/New_York' }
  ]);

  const steps = [
    { id: 1, name: 'Company', icon: Building2 },
    { id: 2, name: 'Database', icon: Database },
    { id: 3, name: 'ERP Integration', icon: Link },
    { id: 4, name: 'Warehouses', icon: Warehouse },
    { id: 5, name: 'Users', icon: Users },
    { id: 6, name: 'Complete', icon: CheckCircle }
  ];

  const erpOptions = [
    { value: 'none', label: 'No ERP (Standalone Mode)', description: 'Use FlowLogic as your primary system' },
    { value: 'sap', label: 'SAP ECC / S/4HANA', description: 'Connect via RFC, OData, or IDoc' },
    { value: 'oracle', label: 'Oracle (Fusion, EBS, JDE)', description: 'Oracle Cloud, E-Business Suite, JD Edwards' },
    { value: 'netsuite', label: 'NetSuite', description: 'SuiteTalk REST API with OAuth' },
    { value: 'dynamics', label: 'Microsoft Dynamics', description: 'D365 F&O, Business Central, GP' },
    { value: 'quickbooks', label: 'QuickBooks', description: 'QuickBooks Online or Desktop' },
    { value: 'sage', label: 'Sage', description: 'Sage 100, 300, Intacct' },
    { value: 'custom', label: 'Custom API', description: 'Connect to any system via REST/SOAP' }
  ];

  const testConnection = async (type: string) => {
    setIsTestingConnection(true);
    setConnectionStatus(prev => ({
      ...prev,
      [type]: { connected: false, message: 'Testing connection...' }
    }));

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo, always succeed
    setConnectionStatus(prev => ({
      ...prev,
      [type]: {
        connected: true,
        message: 'Connection successful',
        lastChecked: new Date().toISOString()
      }
    }));
    setIsTestingConnection(false);
  };

  const saveConfiguration = async () => {
    try {
      const response = await fetch('/api/settings/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: companyConfig,
          database: dbConfig,
          erp: erpConfig,
          warehouses
        })
      });

      if (response.ok) {
        setCurrentStep(6);
      }
    } catch (error) {
      console.error('Setup failed:', error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
              <p className="text-gray-600 mt-1">Enter your company details to get started.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                <input
                  type="text"
                  value={companyConfig.name}
                  onChange={(e) => setCompanyConfig({ ...companyConfig, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Acme Logistics Inc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Code *</label>
                <input
                  type="text"
                  value={companyConfig.code}
                  onChange={(e) => setCompanyConfig({ ...companyConfig, code: e.target.value.toUpperCase() })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="ACME"
                  maxLength={10}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  value={companyConfig.address}
                  onChange={(e) => setCompanyConfig({ ...companyConfig, address: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="123 Warehouse Blvd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  value={companyConfig.city}
                  onChange={(e) => setCompanyConfig({ ...companyConfig, city: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  value={companyConfig.state}
                  onChange={(e) => setCompanyConfig({ ...companyConfig, state: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={companyConfig.phone}
                  onChange={(e) => setCompanyConfig({ ...companyConfig, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={companyConfig.email}
                  onChange={(e) => setCompanyConfig({ ...companyConfig, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Database Configuration</h2>
              <p className="text-gray-600 mt-1">Configure your database connection.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Database Type</label>
                <select
                  value={dbConfig.type}
                  onChange={(e) => setDbConfig({ ...dbConfig, type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="postgresql">PostgreSQL (Recommended)</option>
                  <option value="mysql">MySQL / MariaDB</option>
                  <option value="sqlserver">SQL Server</option>
                  <option value="sqlite">SQLite (Demo/Dev only)</option>
                </select>
              </div>

              {dbConfig.type !== 'sqlite' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Host</label>
                    <input
                      type="text"
                      value={dbConfig.host}
                      onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="localhost"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Port</label>
                    <input
                      type="text"
                      value={dbConfig.port}
                      onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="5432"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Database Name</label>
                    <input
                      type="text"
                      value={dbConfig.database}
                      onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="flowlogic_wms"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      value={dbConfig.username}
                      onChange={(e) => setDbConfig({ ...dbConfig, username: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      value={dbConfig.password}
                      onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="col-span-2">
                <button
                  onClick={() => testConnection('database')}
                  disabled={isTestingConnection}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {isTestingConnection ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </button>

                {connectionStatus.database && (
                  <div className={`mt-2 flex items-center ${connectionStatus.database.connected ? 'text-green-600' : 'text-red-600'}`}>
                    {connectionStatus.database.connected ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    {connectionStatus.database.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">ERP Integration</h2>
              <p className="text-gray-600 mt-1">Connect FlowLogic to your existing ERP system.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {erpOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => setErpConfig({ ...erpConfig, type: option.value })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    erpConfig.type === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </div>
              ))}
            </div>

            {erpConfig.type !== 'none' && (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {erpOptions.find(o => o.value === erpConfig.type)?.label} Configuration
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  {/* SAP Configuration */}
                  {erpConfig.type === 'sap' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">SAP Host</label>
                        <input
                          type="text"
                          value={erpConfig.host}
                          onChange={(e) => setErpConfig({ ...erpConfig, host: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="sap.company.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">System Number</label>
                        <input
                          type="text"
                          value={erpConfig.port}
                          onChange={(e) => setErpConfig({ ...erpConfig, port: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Client</label>
                        <input
                          type="text"
                          value={erpConfig.client || ''}
                          onChange={(e) => setErpConfig({ ...erpConfig, client: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                          type="text"
                          value={erpConfig.username}
                          onChange={(e) => setErpConfig({ ...erpConfig, username: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                          type="password"
                          value={erpConfig.password}
                          onChange={(e) => setErpConfig({ ...erpConfig, password: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Oracle Configuration */}
                  {erpConfig.type === 'oracle' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Oracle Host</label>
                        <input
                          type="text"
                          value={erpConfig.host}
                          onChange={(e) => setErpConfig({ ...erpConfig, host: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Port</label>
                        <input
                          type="text"
                          value={erpConfig.port}
                          onChange={(e) => setErpConfig({ ...erpConfig, port: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="1521"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Service Name</label>
                        <input
                          type="text"
                          value={erpConfig.database || ''}
                          onChange={(e) => setErpConfig({ ...erpConfig, database: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                          type="text"
                          value={erpConfig.username}
                          onChange={(e) => setErpConfig({ ...erpConfig, username: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                          type="password"
                          value={erpConfig.password}
                          onChange={(e) => setErpConfig({ ...erpConfig, password: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {/* NetSuite Configuration */}
                  {erpConfig.type === 'netsuite' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Account ID</label>
                        <input
                          type="text"
                          value={erpConfig.accountId || ''}
                          onChange={(e) => setErpConfig({ ...erpConfig, accountId: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="1234567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Consumer Key</label>
                        <input
                          type="text"
                          value={erpConfig.username}
                          onChange={(e) => setErpConfig({ ...erpConfig, username: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Consumer Secret</label>
                        <input
                          type="password"
                          value={erpConfig.password}
                          onChange={(e) => setErpConfig({ ...erpConfig, password: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Dynamics Configuration */}
                  {erpConfig.type === 'dynamics' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tenant ID</label>
                        <input
                          type="text"
                          value={erpConfig.tenantId || ''}
                          onChange={(e) => setErpConfig({ ...erpConfig, tenantId: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Client ID</label>
                        <input
                          type="text"
                          value={erpConfig.clientId || ''}
                          onChange={(e) => setErpConfig({ ...erpConfig, clientId: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Client Secret</label>
                        <input
                          type="password"
                          value={erpConfig.clientSecret || ''}
                          onChange={(e) => setErpConfig({ ...erpConfig, clientSecret: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Environment URL</label>
                        <input
                          type="text"
                          value={erpConfig.host}
                          onChange={(e) => setErpConfig({ ...erpConfig, host: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="company.crm.dynamics.com"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => testConnection('erp')}
                    disabled={isTestingConnection}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {isTestingConnection ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Test ERP Connection
                  </button>

                  {connectionStatus.erp && (
                    <div className={`mt-2 flex items-center ${connectionStatus.erp.connected ? 'text-green-600' : 'text-red-600'}`}>
                      {connectionStatus.erp.connected ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      {connectionStatus.erp.message}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Warehouse Setup</h2>
              <p className="text-gray-600 mt-1">Configure your warehouse locations.</p>
            </div>

            {warehouses.map((warehouse, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Warehouse Code</label>
                    <input
                      type="text"
                      value={warehouse.code}
                      onChange={(e) => {
                        const updated = [...warehouses];
                        updated[index].code = e.target.value.toUpperCase();
                        setWarehouses(updated);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Warehouse Name</label>
                    <input
                      type="text"
                      value={warehouse.name}
                      onChange={(e) => {
                        const updated = [...warehouses];
                        updated[index].name = e.target.value;
                        setWarehouses(updated);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      type="text"
                      value={warehouse.address}
                      onChange={(e) => {
                        const updated = [...warehouses];
                        updated[index].address = e.target.value;
                        setWarehouses(updated);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Timezone</label>
                    <select
                      value={warehouse.timezone}
                      onChange={(e) => {
                        const updated = [...warehouses];
                        updated[index].timezone = e.target.value;
                        setWarehouses(updated);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="America/Phoenix">Arizona Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                      <option value="Asia/Shanghai">Shanghai</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setWarehouses([...warehouses, { code: '', name: '', address: '', timezone: 'America/New_York' }])}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              + Add Another Warehouse
            </button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Admin User Setup</h2>
              <p className="text-gray-600 mt-1">Create your administrator account.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username *</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="admin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Setup Complete!</h2>
            <p className="mt-2 text-gray-600">FlowLogic WMS is ready to use.</p>

            <div className="mt-8 space-y-4">
              <a
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
                <ChevronRight className="ml-2 h-5 w-5" />
              </a>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg text-left max-w-md mx-auto">
              <h3 className="font-medium text-gray-900">Next Steps:</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• Import your products and locations</li>
                <li>• Configure zone and slot assignments</li>
                <li>• Set up receiving and shipping workflows</li>
                <li>• Invite your team members</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <Warehouse className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">FlowLogic WMS</span>
            <span className="ml-2 text-sm text-gray-500">Setup Wizard</span>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''}`}>
                <div className="flex items-center">
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                      currentStep > step.id
                        ? 'bg-blue-600'
                        : currentStep === step.id
                        ? 'border-2 border-blue-600 bg-white'
                        : 'border-2 border-gray-300 bg-white'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      <step.icon className={`h-4 w-4 ${currentStep === step.id ? 'text-blue-600' : 'text-gray-500'}`} />
                    )}
                  </div>
                  {stepIdx !== steps.length - 1 && (
                    <div className={`absolute top-4 w-full h-0.5 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'}`} style={{ left: '2rem' }} />
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'}`}>
                  {step.name}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white shadow rounded-lg p-8">
          {renderStepContent()}

          {/* Navigation Buttons */}
          {currentStep < 6 && (
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>

              {currentStep === 5 ? (
                <button
                  onClick={saveConfiguration}
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Complete Setup
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setup;

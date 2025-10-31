
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SensorData, LogEntry } from './types';

// FIX: Add minimal Web Bluetooth API type definitions to resolve TypeScript errors.
declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
    };
  }

  interface RequestDeviceOptions {
    filters?: { name?: string }[];
    optionalServices?: string[];
  }

  interface BluetoothDevice extends EventTarget {
    readonly name?: string | null;
    readonly gatt?: BluetoothRemoteGATTServer | null;
    addEventListener(
      type: 'gattserverdisconnected',
      listener: (this: this, ev: Event) => any,
      useCapture?: boolean,
    ): void;
  }

  interface BluetoothRemoteGATTServer {
    readonly connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
  }

  interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    readValue(): Promise<DataView>;
  }
}


// --- Configuration ---
const DEVICE_NAME = 'ESP32-SoilSensor';
const BLE_SERVICE_UUID = '0000181a-0000-1000-8000-00805f9b34fb'; // Environmental Sensing
const TEMP_CHARACTERISTIC_UUID = '00002a6e-0000-1000-8000-00805f9b34fb'; // Temperature
const MOISTURE_CHARACTERISTIC_UUID = '00002a6c-0000-1000-8000-00805f9b34fb'; // Humidity
const PH_CHARACTERISTIC_UUID = 'b4250402-fb4b-4746-b2b0-93f0e61122c6'; // Custom pH characteristic

// --- Helper Icons ---
const BluetoothIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m7 7 10 10-5 5V2l5 5L7 17"/></svg>;
const ThermometerIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>;
const DropletIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>;
const TestTubeIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5h0c-1.4 0-2.5-1.1-2.5-2.5V2"/><path d="M8.5 2h7"/><path d="M14.5 16h-5"/></svg>;
const LoadingIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;


const App = () => {
    const [isBluetoothSupported, setIsBluetoothSupported] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [device, setDevice] = useState<BluetoothDevice | null>(null);
    const [sensorData, setSensorData] = useState<SensorData>({ temperature: null, moisture: null, ph: null });
    const [logs, setLogs] = useState<LogEntry[]>([]);
    
    const pollingIntervalRef = useRef<number | null>(null);

    const addLog = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prevLogs => [{ timestamp, message }, ...prevLogs]);
    }, []);

    useEffect(() => {
        if ('bluetooth' in navigator) {
            setIsBluetoothSupported(true);
        } else {
            addLog("Web Bluetooth API is not supported in this browser.");
        }
    }, [addLog]);

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const handleDisconnect = useCallback(() => {
        stopPolling();
        if (device?.gatt?.connected) {
            device.gatt.disconnect();
            addLog("Disconnected from device.");
        }
        setIsConnected(false);
        setDevice(null);
        setSensorData({ temperature: null, moisture: null, ph: null });
    }, [device, addLog]);

    const readSensorData = useCallback(async (server: BluetoothRemoteGATTServer) => {
        try {
            addLog("Reading sensor data...");
            const service = await server.getPrimaryService(BLE_SERVICE_UUID);

            // Read Temperature
            const tempChar = await service.getCharacteristic(TEMP_CHARACTERISTIC_UUID);
            const tempValue = await tempChar.readValue();
            const temperature = tempValue.getInt16(0, true) / 100.0; // Little Endian, divided by 100
            
            // Read Moisture
            const moistureChar = await service.getCharacteristic(MOISTURE_CHARACTERISTIC_UUID);
            const moistureValue = await moistureChar.readValue();
            const moisture = moistureValue.getUint16(0, true) / 100.0; // Little Endian, divided by 100

            // Read pH
            const phChar = await service.getCharacteristic(PH_CHARACTERISTIC_UUID);
            const phValue = await phChar.readValue();
            const ph = phValue.getFloat32(0, true); // Little Endian

            setSensorData({ temperature, moisture, ph });
            addLog("Sensor data updated successfully.");
        } catch (error) {
            addLog(`Error reading sensor data: ${error}`);
            handleDisconnect();
        }
    }, [addLog, handleDisconnect]);

    const handleConnect = async () => {
        if (!isBluetoothSupported) return;
        setIsConnecting(true);
        addLog("Scanning for devices...");

        try {
            const bleDevice = await navigator.bluetooth.requestDevice({
                filters: [{ name: DEVICE_NAME }],
                optionalServices: [BLE_SERVICE_UUID],
            });

            addLog(`Found device: ${bleDevice.name}. Connecting...`);
            setDevice(bleDevice);
            
            bleDevice.addEventListener('gattserverdisconnected', handleDisconnect);
            
            const server = await bleDevice.gatt?.connect();
            if (!server) {
                throw new Error("GATT Server connection failed.");
            }
            
            addLog("Connected to GATT Server.");
            setIsConnected(true);

            await readSensorData(server);
            pollingIntervalRef.current = window.setInterval(() => readSensorData(server), 5000);

        } catch (error) {
            addLog(`Connection failed: ${error}`);
            setDevice(null);
        } finally {
            setIsConnecting(false);
        }
    };
    
    if (!isBluetoothSupported) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white p-4">
                <div className="text-center bg-slate-800 p-8 rounded-lg">
                    <h1 className="text-2xl font-bold text-red-500">Bluetooth Not Supported</h1>
                    <p className="mt-2">Your browser does not support the Web Bluetooth API. Please try a different browser like Chrome or Edge on a desktop or Android device.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen text-gray-300 font-sans p-4 md:p-6">
            <header className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
                <h1 className="text-2xl font-bold text-cyan-400">ESP32 Soil Sensor</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full transition-colors ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    {!isConnected ? (
                        <button onClick={handleConnect} disabled={isConnecting} className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                            {isConnecting ? <LoadingIcon className="w-5 h-5"/> : <BluetoothIcon className="w-5 h-5"/>}
                            {isConnecting ? 'Connecting...' : 'Connect'}
                        </button>
                    ) : (
                        <button onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                            Disconnect
                        </button>
                    )}
                </div>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <SensorCard icon={<TestTubeIcon className="w-8 h-8 text-violet-400"/>} label="pH Level" value={sensorData.ph?.toFixed(2)} unit="" />
                <SensorCard icon={<ThermometerIcon className="w-8 h-8 text-orange-400"/>} label="Temperature" value={sensorData.temperature?.toFixed(1)} unit="°C" />
                <SensorCard icon={<DropletIcon className="w-8 h-8 text-sky-400"/>} label="Soil Moisture" value={sensorData.moisture?.toFixed(1)} unit="%" />
            </main>

            <LogPanel logs={logs} />
        </div>
    );
};

// FIX: Change JSX.Element to React.ReactElement to resolve the missing JSX namespace error.
const SensorCard = ({ icon, label, value, unit }: { icon: React.ReactElement, label: string, value?: string, unit: string }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 shadow-lg flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300">
        <div className="flex items-center gap-4 mb-4">
            {icon}
            <h2 className="text-lg font-semibold text-gray-400">{label}</h2>
        </div>
        <p className="text-5xl font-mono font-bold text-white">
            {value ?? '--'}
            {value && <span className="text-3xl ml-1">{unit}</span>}
        </p>
    </div>
);

const LogPanel = ({ logs }: { logs: LogEntry[] }) => (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 shadow-lg">
        <h2 className="text-lg font-semibold mb-2 text-gray-400">Connection Log</h2>
        <div className="h-40 overflow-y-auto bg-black/30 rounded-md p-3 font-mono text-sm space-y-1">
            {logs.map((log, index) => (
                <p key={index} className="text-gray-400">
                    <span className="text-cyan-500 mr-2">{log.timestamp}</span>
                    {log.message}
                </p>
            ))}
        </div>
    </div>
);

export default App;
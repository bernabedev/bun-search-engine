export interface SystemStats {
  memory: {
    rss: number; // Resident Set Size (total memory allocated for the process)
    heapTotal: number; // Total size of the V8 heap
    heapUsed: number; // Memory currently used by V8 heap
    external: number; // Memory used by C++ objects bound to JS objects
    arrayBuffers: number; // Memory allocated for ArrayBuffers and SharedArrayBuffers
    totalSystem?: number; // Optional: Total system memory
  };
  cpu: {
    loadAvg: number[]; // [1min, 5min, 15min] load averages
    // Note: Real-time percentage requires interval calculation, loadAvg is simpler
  };
  bunVersion: string;
  uptime: number; // Process uptime in seconds
}

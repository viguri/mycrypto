#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default values for automatic fixes
// Blockchain configuration limits
// Mining pool configuration limits
// Pool monitoring configuration limits
// Performance metrics configuration limits
// Transaction metrics configuration limits
// Memory metrics configuration limits
// Network metrics configuration limits
// Disk metrics configuration limits
// CPU metrics configuration limits
// Memory allocation metrics configuration limits
const HEAP_ALLOCATION_LIMITS = {
  development: {
    minInitialHeap: '64M',       // bytes
    maxInitialHeap: '512M',      // bytes
    minHeapGrowth: '16M',        // bytes
    maxHeapGrowth: '128M',       // bytes
    minAllocationRate: '1M',     // bytes/s
    maxAllocationRate: '50M',    // bytes/s
    minObjectCount: 1000,        // count
    maxObjectCount: 100000,      // count
    minObjectSize: '1K',         // bytes
    maxObjectSize: '1M',         // bytes
    minGcTrigger: '32M',        // bytes
    maxGcTrigger: '256M',       // bytes
    minHeapUsage: 0.1,          // ratio
    maxHeapUsage: 0.8,          // ratio
  },
  production: {
    minInitialHeap: '256M',
    maxInitialHeap: '4G',
    minHeapGrowth: '64M',
    maxHeapGrowth: '512M',
    minAllocationRate: '10M',
    maxAllocationRate: '200M',
    minObjectCount: 10000,
    maxObjectCount: 1000000,
    minObjectSize: '4K',
    maxObjectSize: '4M',
    minGcTrigger: '128M',
    maxGcTrigger: '1G',
    minHeapUsage: 0.2,
    maxHeapUsage: 0.9,
  },
  test: {
    minInitialHeap: '32M',
    maxInitialHeap: '256M',
    minHeapGrowth: '8M',
    maxHeapGrowth: '64M',
    minAllocationRate: '100K',
    maxAllocationRate: '10M',
    minObjectCount: 100,
    maxObjectCount: 10000,
    minObjectSize: '512B',
    maxObjectSize: '256K',
    minGcTrigger: '16M',
    maxGcTrigger: '128M',
    minHeapUsage: 0.05,
    maxHeapUsage: 0.7,
  },
};

const MEMORY_FRAGMENTATION_LIMITS = {
  development: {
    minFragmentationRatio: 0.1,      // ratio
    maxFragmentationRatio: 0.4,      // ratio
    minFragmentSize: '4K',           // bytes
    maxFragmentSize: '1M',           // bytes
    minFragmentCount: 100,           // count
    maxFragmentCount: 10000,         // count
    minDefragInterval: 300000,       // ms
    maxDefragInterval: 3600000,      // ms
    minCompactionThreshold: 0.3,     // ratio
    maxCompactionThreshold: 0.7,     // ratio
    minFreeBlockRatio: 0.1,         // ratio
    maxFreeBlockRatio: 0.5,         // ratio
    minBlockSize: '16K',            // bytes
    maxBlockSize: '4M',             // bytes
  },
  production: {
    minFragmentationRatio: 0.05,
    maxFragmentationRatio: 0.3,
    minFragmentSize: '16K',
    maxFragmentSize: '4M',
    minFragmentCount: 500,
    maxFragmentCount: 50000,
    minDefragInterval: 1800000,
    maxDefragInterval: 21600000,
    minCompactionThreshold: 0.4,
    maxCompactionThreshold: 0.8,
    minFreeBlockRatio: 0.15,
    maxFreeBlockRatio: 0.6,
    minBlockSize: '64K',
    maxBlockSize: '16M',
  },
  test: {
    minFragmentationRatio: 0.2,
    maxFragmentationRatio: 0.6,
    minFragmentSize: '1K',
    maxFragmentSize: '256K',
    minFragmentCount: 10,
    maxFragmentCount: 1000,
    minDefragInterval: 60000,
    maxDefragInterval: 600000,
    minCompactionThreshold: 0.2,
    maxCompactionThreshold: 0.6,
    minFreeBlockRatio: 0.05,
    maxFreeBlockRatio: 0.4,
    minBlockSize: '4K',
    maxBlockSize: '1M',
  },
};

const MEMORY_LEAK_LIMITS = {
  development: {
    minDetectionInterval: 60000,    // ms
    maxDetectionInterval: 300000,   // ms
    minGrowthRate: '100K',         // bytes/interval
    maxGrowthRate: '10M',          // bytes/interval
    minSuspectObjects: 10,         // count
    maxSuspectObjects: 1000,       // count
    minLeakSize: '1M',             // bytes
    maxLeakSize: '50M',            // bytes
    minRetentionTime: 300000,      // ms
    maxRetentionTime: 3600000,     // ms
    minStackTraceDepth: 10,        // frames
    maxStackTraceDepth: 50,        // frames
    minHistorySize: 10,            // snapshots
    maxHistorySize: 50,            // snapshots
  },
  production: {
    minDetectionInterval: 300000,
    maxDetectionInterval: 3600000,
    minGrowthRate: '1M',
    maxGrowthRate: '100M',
    minSuspectObjects: 50,
    maxSuspectObjects: 5000,
    minLeakSize: '10M',
    maxLeakSize: '500M',
    minRetentionTime: 1800000,
    maxRetentionTime: 86400000,
    minStackTraceDepth: 20,
    maxStackTraceDepth: 100,
    minHistorySize: 24,
    maxHistorySize: 168,
  },
  test: {
    minDetectionInterval: 10000,
    maxDetectionInterval: 60000,
    minGrowthRate: '10K',
    maxGrowthRate: '1M',
    minSuspectObjects: 5,
    maxSuspectObjects: 100,
    minLeakSize: '100K',
    maxLeakSize: '5M',
    minRetentionTime: 60000,
    maxRetentionTime: 300000,
    minStackTraceDepth: 5,
    maxStackTraceDepth: 30,
    minHistorySize: 5,
    maxHistorySize: 20,
  },
};

const MEMORY_PROFILING_LIMITS = {
  development: {
    minSamplingRate: 100,       // samples/s
    maxSamplingRate: 1000,      // samples/s
    minStackDepth: 10,          // frames
    maxStackDepth: 50,          // frames
    minHeapSnapshotInterval: 60000,  // ms
    maxHeapSnapshotInterval: 3600000, // ms
    minRetainedSize: '1M',      // bytes
    maxRetainedSize: '100M',    // bytes
    minLeakThreshold: '100K',   // bytes
    maxLeakThreshold: '10M',    // bytes
    minProfileBufferSize: '16M', // bytes
    maxProfileBufferSize: '256M',// bytes
    minCallGraphDepth: 5,       // levels
    maxCallGraphDepth: 20,      // levels
  },
  production: {
    minSamplingRate: 10,
    maxSamplingRate: 100,
    minStackDepth: 20,
    maxStackDepth: 100,
    minHeapSnapshotInterval: 300000,
    maxHeapSnapshotInterval: 86400000,
    minRetainedSize: '10M',
    maxRetainedSize: '1G',
    minLeakThreshold: '1M',
    maxLeakThreshold: '100M',
    minProfileBufferSize: '64M',
    maxProfileBufferSize: '1G',
    minCallGraphDepth: 10,
    maxCallGraphDepth: 30,
  },
  test: {
    minSamplingRate: 500,
    maxSamplingRate: 5000,
    minStackDepth: 5,
    maxStackDepth: 30,
    minHeapSnapshotInterval: 10000,
    maxHeapSnapshotInterval: 300000,
    minRetainedSize: '100K',
    maxRetainedSize: '10M',
    minLeakThreshold: '10K',
    maxLeakThreshold: '1M',
    minProfileBufferSize: '4M',
    maxProfileBufferSize: '64M',
    minCallGraphDepth: 3,
    maxCallGraphDepth: 15,
  },
};

const MEMORY_ALLOCATION_LIMITS = {
  development: {
    minHeapAlloc: '64M',        // bytes
    maxHeapAlloc: '512M',       // bytes
    minStackAlloc: '1M',        // bytes
    maxStackAlloc: '8M',        // bytes
    minPageSize: '4K',          // bytes
    maxPageSize: '64K',         // bytes
    minFragmentation: 0,        // percentage
    maxFragmentation: 30,       // percentage
    minAllocationRate: '1M',    // bytes/s
    maxAllocationRate: '50M',   // bytes/s
    minDeallocationRate: '1M',  // bytes/s
    maxDeallocationRate: '50M', // bytes/s
    minPoolSize: '32M',         // bytes
    maxPoolSize: '256M',        // bytes
    minGcPause: 10,            // ms
    maxGcPause: 200,           // ms
  },
  production: {
    minHeapAlloc: '256M',
    maxHeapAlloc: '4G',
    minStackAlloc: '4M',
    maxStackAlloc: '32M',
    minPageSize: '4K',
    maxPageSize: '2M',
    minFragmentation: 0,
    maxFragmentation: 20,
    minAllocationRate: '10M',
    maxAllocationRate: '500M',
    minDeallocationRate: '10M',
    maxDeallocationRate: '500M',
    minPoolSize: '128M',
    maxPoolSize: '1G',
    minGcPause: 50,
    maxGcPause: 500,
  },
  test: {
    minHeapAlloc: '32M',
    maxHeapAlloc: '256M',
    minStackAlloc: '512K',
    maxStackAlloc: '4M',
    minPageSize: '4K',
    maxPageSize: '16K',
    minFragmentation: 0,
    maxFragmentation: 40,
    minAllocationRate: '100K',
    maxAllocationRate: '10M',
    minDeallocationRate: '100K',
    maxDeallocationRate: '10M',
    minPoolSize: '16M',
    maxPoolSize: '128M',
    minGcPause: 5,
    maxGcPause: 100,
  },
};

const CPU_METRICS_LIMITS = {
  development: {
    minUsage: 0,              // percentage
    maxUsage: 80,             // percentage
    minLoadAvg1: 0,           // load average 1m
    maxLoadAvg1: 2,           // load average 1m
    minLoadAvg5: 0,           // load average 5m
    maxLoadAvg5: 1.5,         // load average 5m
    minLoadAvg15: 0,          // load average 15m
    maxLoadAvg15: 1,          // load average 15m
    minThreads: 1,            // threads
    maxThreads: 100,          // threads
    minProcesses: 1,          // processes
    maxProcesses: 50,         // processes
    minContextSwitches: 100,  // switches/s
    maxContextSwitches: 10000,// switches/s
    minInterrupts: 100,       // interrupts/s
    maxInterrupts: 5000,      // interrupts/s
  },
  production: {
    minUsage: 0,
    maxUsage: 90,
    minLoadAvg1: 0,
    maxLoadAvg1: 4,
    minLoadAvg5: 0,
    maxLoadAvg5: 3,
    minLoadAvg15: 0,
    maxLoadAvg15: 2,
    minThreads: 10,
    maxThreads: 500,
    minProcesses: 5,
    maxProcesses: 200,
    minContextSwitches: 1000,
    maxContextSwitches: 50000,
    minInterrupts: 500,
    maxInterrupts: 20000,
  },
  test: {
    minUsage: 0,
    maxUsage: 95,
    minLoadAvg1: 0,
    maxLoadAvg1: 1,
    minLoadAvg5: 0,
    maxLoadAvg5: 0.8,
    minLoadAvg15: 0,
    maxLoadAvg15: 0.5,
    minThreads: 1,
    maxThreads: 50,
    minProcesses: 1,
    maxProcesses: 20,
    minContextSwitches: 10,
    maxContextSwitches: 1000,
    minInterrupts: 10,
    maxInterrupts: 1000,
  },
};

const DISK_METRICS_LIMITS = {
  development: {
    minDiskSpace: '10G',        // bytes
    maxDiskSpace: '100G',       // bytes
    minIopsRead: 100,           // ops/s
    maxIopsRead: 1000,          // ops/s
    minIopsWrite: 50,           // ops/s
    maxIopsWrite: 500,          // ops/s
    minLatencyRead: 1,          // ms
    maxLatencyRead: 100,        // ms
    minLatencyWrite: 5,         // ms
    maxLatencyWrite: 200,       // ms
    minThroughputRead: '10M',   // bytes/s
    maxThroughputRead: '100M',  // bytes/s
    minThroughputWrite: '5M',   // bytes/s
    maxThroughputWrite: '50M',  // bytes/s
    minUtilization: 0,          // percentage
    maxUtilization: 80,         // percentage
  },
  production: {
    minDiskSpace: '100G',
    maxDiskSpace: '1T',
    minIopsRead: 1000,
    maxIopsRead: 10000,
    minIopsWrite: 500,
    maxIopsWrite: 5000,
    minLatencyRead: 5,
    maxLatencyRead: 500,
    minLatencyWrite: 10,
    maxLatencyWrite: 1000,
    minThroughputRead: '100M',
    maxThroughputRead: '1G',
    minThroughputWrite: '50M',
    maxThroughputWrite: '500M',
    minUtilization: 0,
    maxUtilization: 90,
  },
  test: {
    minDiskSpace: '1G',
    maxDiskSpace: '10G',
    minIopsRead: 10,
    maxIopsRead: 100,
    minIopsWrite: 5,
    maxIopsWrite: 50,
    minLatencyRead: 0.1,
    maxLatencyRead: 50,
    minLatencyWrite: 1,
    maxLatencyWrite: 100,
    minThroughputRead: '1M',
    maxThroughputRead: '10M',
    minThroughputWrite: '500K',
    maxThroughputWrite: '5M',
    minUtilization: 0,
    maxUtilization: 95,
  },
};

const NETWORK_METRICS_LIMITS = {
  development: {
    minBandwidth: '10M',        // bytes/s
    maxBandwidth: '100M',       // bytes/s
    minLatency: 10,             // ms
    maxLatency: 1000,           // ms
    minPacketLoss: 0,           // percentage
    maxPacketLoss: 5,           // percentage
    minConnections: 10,         // connections
    maxConnections: 1000,       // connections
    minRequestTimeout: 1000,    // ms
    maxRequestTimeout: 10000,   // ms
    minRetryAttempts: 1,        // count
    maxRetryAttempts: 5,        // count
    minKeepAlive: 30000,       // ms
    maxKeepAlive: 300000,      // ms
  },
  production: {
    minBandwidth: '100M',
    maxBandwidth: '1G',
    minLatency: 50,
    maxLatency: 2000,
    minPacketLoss: 0,
    maxPacketLoss: 1,
    minConnections: 100,
    maxConnections: 10000,
    minRequestTimeout: 5000,
    maxRequestTimeout: 30000,
    minRetryAttempts: 3,
    maxRetryAttempts: 10,
    minKeepAlive: 60000,
    maxKeepAlive: 600000,
  },
  test: {
    minBandwidth: '1M',
    maxBandwidth: '10M',
    minLatency: 1,
    maxLatency: 100,
    minPacketLoss: 0,
    maxPacketLoss: 10,
    minConnections: 1,
    maxConnections: 100,
    minRequestTimeout: 500,
    maxRequestTimeout: 5000,
    minRetryAttempts: 1,
    maxRetryAttempts: 3,
    minKeepAlive: 5000,
    maxKeepAlive: 60000,
  },
};

const MEMORY_METRICS_LIMITS = {
  development: {
    minHeapSize: '128M',        // bytes
    maxHeapSize: '1G',          // bytes
    minStackSize: '2M',         // bytes
    maxStackSize: '16M',        // bytes
    minGcInterval: 30000,       // ms
    maxGcInterval: 300000,      // ms
    minMemoryLimit: '256M',     // bytes
    maxMemoryLimit: '2G',       // bytes
    minBufferSize: '16M',       // bytes
    maxBufferSize: '128M',      // bytes
    minGcThreshold: 70,         // percentage
    maxGcThreshold: 90,         // percentage
  },
  production: {
    minHeapSize: '1G',
    maxHeapSize: '8G',
    minStackSize: '8M',
    maxStackSize: '64M',
    minGcInterval: 60000,
    maxGcInterval: 600000,
    minMemoryLimit: '2G',
    maxMemoryLimit: '16G',
    minBufferSize: '64M',
    maxBufferSize: '512M',
    minGcThreshold: 80,
    maxGcThreshold: 95,
  },
  test: {
    minHeapSize: '64M',
    maxHeapSize: '512M',
    minStackSize: '1M',
    maxStackSize: '8M',
    minGcInterval: 10000,
    maxGcInterval: 60000,
    minMemoryLimit: '128M',
    maxMemoryLimit: '1G',
    minBufferSize: '8M',
    maxBufferSize: '64M',
    minGcThreshold: 60,
    maxGcThreshold: 85,
  },
};

const TX_METRICS_LIMITS = {
  development: {
    minTxPoolSize: 100,          // transactions
    maxTxPoolSize: 1000,         // transactions
    minTxConfirmTime: 500,       // ms
    maxTxConfirmTime: 5000,      // ms
    minTxFeeRate: 0.1,           // tokens
    maxTxFeeRate: 5.0,           // tokens
    minTxThroughput: 10,         // tx/s
    maxTxThroughput: 100,        // tx/s
    minPendingTxLimit: 50,       // transactions
    maxPendingTxLimit: 500,      // transactions
    minTxRetryInterval: 1000,    // ms
    maxTxRetryInterval: 10000,   // ms
  },
  production: {
    minTxPoolSize: 1000,
    maxTxPoolSize: 10000,
    minTxConfirmTime: 1000,
    maxTxConfirmTime: 20000,
    minTxFeeRate: 0.5,
    maxTxFeeRate: 10.0,
    minTxThroughput: 50,
    maxTxThroughput: 500,
    minPendingTxLimit: 200,
    maxPendingTxLimit: 2000,
    minTxRetryInterval: 5000,
    maxTxRetryInterval: 30000,
  },
  test: {
    minTxPoolSize: 10,
    maxTxPoolSize: 100,
    minTxConfirmTime: 100,
    maxTxConfirmTime: 1000,
    minTxFeeRate: 0.01,
    maxTxFeeRate: 1.0,
    minTxThroughput: 1,
    maxTxThroughput: 10,
    minPendingTxLimit: 10,
    maxPendingTxLimit: 50,
    minTxRetryInterval: 500,
    maxTxRetryInterval: 5000,
  },
};

const METRICS_LIMITS = {
  development: {
    minBlockTime: 500,       // ms
    maxBlockTime: 5000,      // ms
    minTxPerBlock: 1,        // transactions
    maxTxPerBlock: 100,      // transactions
    minHashPower: 100,       // H/s
    maxHashPower: 1000,      // H/s
    minSyncDelay: 100,       // ms
    maxSyncDelay: 2000,      // ms
    minPeerCount: 1,         // peers
    maxPeerCount: 10,        // peers
  },
  production: {
    minBlockTime: 1000,
    maxBlockTime: 10000,
    minTxPerBlock: 10,
    maxTxPerBlock: 1000,
    minHashPower: 500,
    maxHashPower: 5000,
    minSyncDelay: 500,
    maxSyncDelay: 5000,
    minPeerCount: 3,
    maxPeerCount: 50,
  },
  test: {
    minBlockTime: 100,
    maxBlockTime: 1000,
    minTxPerBlock: 1,
    maxTxPerBlock: 10,
    minHashPower: 10,
    maxHashPower: 100,
    minSyncDelay: 50,
    maxSyncDelay: 500,
    minPeerCount: 1,
    maxPeerCount: 3,
  },
};

const MONITORING_LIMITS = {
  development: {
    minMetricsInterval: 5000,    // ms
    maxMetricsInterval: 30000,   // ms
    minAlertThreshold: 50,       // percentage
    maxAlertThreshold: 90,       // percentage
    minRetentionDays: 1,         // days
    maxRetentionDays: 7,         // days
    minLogRotateSize: '10M',     // bytes
    maxLogRotateSize: '100M',    // bytes
  },
  production: {
    minMetricsInterval: 10000,
    maxMetricsInterval: 60000,
    minAlertThreshold: 70,
    maxAlertThreshold: 95,
    minRetentionDays: 7,
    maxRetentionDays: 30,
    minLogRotateSize: '100M',
    maxLogRotateSize: '1G',
  },
  test: {
    minMetricsInterval: 1000,
    maxMetricsInterval: 5000,
    minAlertThreshold: 30,
    maxAlertThreshold: 80,
    minRetentionDays: 1,
    maxRetentionDays: 2,
    minLogRotateSize: '1M',
    maxLogRotateSize: '10M',
  },
};

const POOL_LIMITS = {
  development: {
    minWorkers: 1,
    maxWorkers: 4,
    minHashRate: 100,    // hashes per second
    maxHashRate: 1000,   // hashes per second
    minPayout: 1,        // minimum payout in tokens
    maxPayout: 100,      // maximum payout in tokens
    minFeeRate: 0,       // minimum fee rate in percentage
    maxFeeRate: 5,       // maximum fee rate in percentage
  },
  production: {
    minWorkers: 2,
    maxWorkers: 16,
    minHashRate: 500,
    maxHashRate: 5000,
    minPayout: 10,
    maxPayout: 1000,
    minFeeRate: 1,
    maxFeeRate: 10,
  },
  test: {
    minWorkers: 1,
    maxWorkers: 2,
    minHashRate: 10,
    maxHashRate: 100,
    minPayout: 0.1,
    maxPayout: 10,
    minFeeRate: 0,
    maxFeeRate: 1,
  },
};

const BLOCKCHAIN_LIMITS = {
  development: {
    minDifficulty: 2,
    maxDifficulty: 4,
    minReward: 10,
    maxReward: 200,
  },
  production: {
    minDifficulty: 4,
    maxDifficulty: 8,
    minReward: 25,
    maxReward: 100,
  },
  test: {
    minDifficulty: 1,
    maxDifficulty: 2,
    minReward: 1,
    maxReward: Number.MAX_SAFE_INTEGER,
  },
};

const DEFAULT_VALUES = {
  development: {
    // Heap allocation tracking configuration
    HEAP_INITIAL_SIZE: '128M',
    HEAP_GROWTH_SIZE: '32M',
    HEAP_ALLOC_RATE: '10M',
    HEAP_OBJECT_COUNT: 10000,
    HEAP_OBJECT_SIZE: '64K',
    HEAP_GC_TRIGGER: '64M',
    HEAP_USAGE_RATIO: 0.5,
    HEAP_TRACKING_ENABLED: true,
    HEAP_COLLECT_INTERVAL: 1000,
    HEAP_AGGREGATE_INTERVAL: 60000,
    HEAP_RETENTION_DAYS: 7,
  },
  production: {
    HEAP_INITIAL_SIZE: '512M',
    HEAP_GROWTH_SIZE: '128M',
    HEAP_ALLOC_RATE: '50M',
    HEAP_OBJECT_COUNT: 100000,
    HEAP_OBJECT_SIZE: '256K',
    HEAP_GC_TRIGGER: '256M',
    HEAP_USAGE_RATIO: 0.6,
    HEAP_TRACKING_ENABLED: true,
    HEAP_COLLECT_INTERVAL: 5000,
    HEAP_AGGREGATE_INTERVAL: 300000,
    HEAP_RETENTION_DAYS: 30,
  },
  test: {
    HEAP_INITIAL_SIZE: '64M',
    HEAP_GROWTH_SIZE: '16M',
    HEAP_ALLOC_RATE: '1M',
    HEAP_OBJECT_COUNT: 1000,
    HEAP_OBJECT_SIZE: '16K',
    HEAP_GC_TRIGGER: '32M',
    HEAP_USAGE_RATIO: 0.4,
    HEAP_TRACKING_ENABLED: true,
    HEAP_COLLECT_INTERVAL: 500,
    HEAP_AGGREGATE_INTERVAL: 5000,
    HEAP_RETENTION_DAYS: 1,
  },
  development: {
    // Memory fragmentation metrics configuration
    MEMORY_FRAG_RATIO: 0.2,
    MEMORY_FRAG_SIZE: '64K',
    MEMORY_FRAG_COUNT: 1000,
    MEMORY_DEFRAG_INTERVAL: 600000,
    MEMORY_COMPACT_THRESHOLD: 0.5,
    MEMORY_FREE_BLOCK_RATIO: 0.2,
    MEMORY_BLOCK_SIZE: '256K',
    MEMORY_FRAG_ENABLED: true,
    MEMORY_FRAG_COLLECT_INTERVAL: 5000,
    MEMORY_FRAG_AGGREGATE_INTERVAL: 300000,
    MEMORY_FRAG_RETENTION_DAYS: 7,
  },
  production: {
    MEMORY_FRAG_RATIO: 0.1,
    MEMORY_FRAG_SIZE: '256K',
    MEMORY_FRAG_COUNT: 5000,
    MEMORY_DEFRAG_INTERVAL: 3600000,
    MEMORY_COMPACT_THRESHOLD: 0.6,
    MEMORY_FREE_BLOCK_RATIO: 0.3,
    MEMORY_BLOCK_SIZE: '1M',
    MEMORY_FRAG_ENABLED: true,
    MEMORY_FRAG_COLLECT_INTERVAL: 30000,
    MEMORY_FRAG_AGGREGATE_INTERVAL: 900000,
    MEMORY_FRAG_RETENTION_DAYS: 30,
  },
  test: {
    MEMORY_FRAG_RATIO: 0.3,
    MEMORY_FRAG_SIZE: '16K',
    MEMORY_FRAG_COUNT: 100,
    MEMORY_DEFRAG_INTERVAL: 120000,
    MEMORY_COMPACT_THRESHOLD: 0.4,
    MEMORY_FREE_BLOCK_RATIO: 0.15,
    MEMORY_BLOCK_SIZE: '64K',
    MEMORY_FRAG_ENABLED: true,
    MEMORY_FRAG_COLLECT_INTERVAL: 1000,
    MEMORY_FRAG_AGGREGATE_INTERVAL: 60000,
    MEMORY_FRAG_RETENTION_DAYS: 1,
  },
  development: {
    // Memory leak detection metrics configuration
    MEMORY_LEAK_DETECTION_INTERVAL: 120000,
    MEMORY_LEAK_GROWTH_RATE: '1M',
    MEMORY_LEAK_SUSPECT_OBJECTS: 100,
    MEMORY_LEAK_SIZE: '10M',
    MEMORY_LEAK_RETENTION_TIME: 600000,
    MEMORY_LEAK_STACK_TRACE_DEPTH: 30,
    MEMORY_LEAK_HISTORY_SIZE: 24,
    MEMORY_LEAK_ENABLED: true,
    MEMORY_LEAK_COLLECT_INTERVAL: 1000,
    MEMORY_LEAK_AGGREGATE_INTERVAL: 60000,
    MEMORY_LEAK_RETENTION_DAYS: 7,
  },
  production: {
    MEMORY_LEAK_DETECTION_INTERVAL: 900000,
    MEMORY_LEAK_GROWTH_RATE: '10M',
    MEMORY_LEAK_SUSPECT_OBJECTS: 500,
    MEMORY_LEAK_SIZE: '50M',
    MEMORY_LEAK_RETENTION_TIME: 3600000,
    MEMORY_LEAK_STACK_TRACE_DEPTH: 50,
    MEMORY_LEAK_HISTORY_SIZE: 72,
    MEMORY_LEAK_ENABLED: true,
    MEMORY_LEAK_COLLECT_INTERVAL: 5000,
    MEMORY_LEAK_AGGREGATE_INTERVAL: 300000,
    MEMORY_LEAK_RETENTION_DAYS: 30,
  },
  test: {
    MEMORY_LEAK_DETECTION_INTERVAL: 30000,
    MEMORY_LEAK_GROWTH_RATE: '100K',
    MEMORY_LEAK_SUSPECT_OBJECTS: 20,
    MEMORY_LEAK_SIZE: '1M',
    MEMORY_LEAK_RETENTION_TIME: 120000,
    MEMORY_LEAK_STACK_TRACE_DEPTH: 15,
    MEMORY_LEAK_HISTORY_SIZE: 10,
    MEMORY_LEAK_ENABLED: true,
    MEMORY_LEAK_COLLECT_INTERVAL: 500,
    MEMORY_LEAK_AGGREGATE_INTERVAL: 5000,
    MEMORY_LEAK_RETENTION_DAYS: 1,
  },
  development: {
    // Memory profiling metrics configuration
    MEMORY_PROF_SAMPLING_RATE: 500,
    MEMORY_PROF_STACK_DEPTH: 30,
    MEMORY_PROF_HEAP_SNAPSHOT_INTERVAL: 300000,
    MEMORY_PROF_RETAINED_SIZE: '50M',
    MEMORY_PROF_LEAK_THRESHOLD: '1M',
    MEMORY_PROF_BUFFER_SIZE: '128M',
    MEMORY_PROF_CALL_GRAPH_DEPTH: 10,
    MEMORY_PROF_ENABLED: true,
    MEMORY_PROF_COLLECT_INTERVAL: 1000,
    MEMORY_PROF_AGGREGATE_INTERVAL: 60000,
    MEMORY_PROF_RETENTION_DAYS: 7,
  },
  production: {
    MEMORY_PROF_SAMPLING_RATE: 50,
    MEMORY_PROF_STACK_DEPTH: 50,
    MEMORY_PROF_HEAP_SNAPSHOT_INTERVAL: 3600000,
    MEMORY_PROF_RETAINED_SIZE: '500M',
    MEMORY_PROF_LEAK_THRESHOLD: '10M',
    MEMORY_PROF_BUFFER_SIZE: '512M',
    MEMORY_PROF_CALL_GRAPH_DEPTH: 20,
    MEMORY_PROF_ENABLED: true,
    MEMORY_PROF_COLLECT_INTERVAL: 5000,
    MEMORY_PROF_AGGREGATE_INTERVAL: 300000,
    MEMORY_PROF_RETENTION_DAYS: 30,
  },
  test: {
    MEMORY_PROF_SAMPLING_RATE: 2000,
    MEMORY_PROF_STACK_DEPTH: 15,
    MEMORY_PROF_HEAP_SNAPSHOT_INTERVAL: 60000,
    MEMORY_PROF_RETAINED_SIZE: '5M',
    MEMORY_PROF_LEAK_THRESHOLD: '100K',
    MEMORY_PROF_BUFFER_SIZE: '32M',
    MEMORY_PROF_CALL_GRAPH_DEPTH: 5,
    MEMORY_PROF_ENABLED: true,
    MEMORY_PROF_COLLECT_INTERVAL: 500,
    MEMORY_PROF_AGGREGATE_INTERVAL: 5000,
    MEMORY_PROF_RETENTION_DAYS: 1,
  },
  development: {
    // Memory allocation metrics configuration
    MEMORY_ALLOC_HEAP: '256M',
    MEMORY_ALLOC_STACK: '4M',
    MEMORY_ALLOC_PAGE_SIZE: '8K',
    MEMORY_ALLOC_FRAGMENTATION: 15,
    MEMORY_ALLOC_RATE: '20M',
    MEMORY_DEALLOC_RATE: '20M',
    MEMORY_ALLOC_POOL_SIZE: '128M',
    MEMORY_ALLOC_GC_PAUSE: 50,
    MEMORY_ALLOC_ENABLED: true,
    MEMORY_ALLOC_COLLECT_INTERVAL: 1000,
    MEMORY_ALLOC_AGGREGATE_INTERVAL: 30000,
    MEMORY_ALLOC_RETENTION_DAYS: 7,
  },
  production: {
    MEMORY_ALLOC_HEAP: '1G',
    MEMORY_ALLOC_STACK: '16M',
    MEMORY_ALLOC_PAGE_SIZE: '16K',
    MEMORY_ALLOC_FRAGMENTATION: 10,
    MEMORY_ALLOC_RATE: '100M',
    MEMORY_DEALLOC_RATE: '100M',
    MEMORY_ALLOC_POOL_SIZE: '512M',
    MEMORY_ALLOC_GC_PAUSE: 200,
    MEMORY_ALLOC_ENABLED: true,
    MEMORY_ALLOC_COLLECT_INTERVAL: 5000,
    MEMORY_ALLOC_AGGREGATE_INTERVAL: 60000,
    MEMORY_ALLOC_RETENTION_DAYS: 30,
  },
  test: {
    MEMORY_ALLOC_HEAP: '128M',
    MEMORY_ALLOC_STACK: '2M',
    MEMORY_ALLOC_PAGE_SIZE: '4K',
    MEMORY_ALLOC_FRAGMENTATION: 20,
    MEMORY_ALLOC_RATE: '5M',
    MEMORY_DEALLOC_RATE: '5M',
    MEMORY_ALLOC_POOL_SIZE: '64M',
    MEMORY_ALLOC_GC_PAUSE: 20,
    MEMORY_ALLOC_ENABLED: true,
    MEMORY_ALLOC_COLLECT_INTERVAL: 500,
    MEMORY_ALLOC_AGGREGATE_INTERVAL: 5000,
    MEMORY_ALLOC_RETENTION_DAYS: 1,
  },
  development: {
    // CPU metrics configuration
    CPU_METRICS_USAGE: 50,
    CPU_METRICS_LOAD_AVG_1: 1,
    CPU_METRICS_LOAD_AVG_5: 0.8,
    CPU_METRICS_LOAD_AVG_15: 0.6,
    CPU_METRICS_THREADS: 50,
    CPU_METRICS_PROCESSES: 25,
    CPU_METRICS_CONTEXT_SWITCHES: 5000,
    CPU_METRICS_INTERRUPTS: 2500,
    CPU_METRICS_ENABLED: true,
    CPU_METRICS_COLLECT_INTERVAL: 1000,
    CPU_METRICS_AGGREGATE_INTERVAL: 30000,
    CPU_METRICS_RETENTION_DAYS: 7,
  },
  production: {
    CPU_METRICS_USAGE: 70,
    CPU_METRICS_LOAD_AVG_1: 2,
    CPU_METRICS_LOAD_AVG_5: 1.5,
    CPU_METRICS_LOAD_AVG_15: 1,
    CPU_METRICS_THREADS: 200,
    CPU_METRICS_PROCESSES: 100,
    CPU_METRICS_CONTEXT_SWITCHES: 20000,
    CPU_METRICS_INTERRUPTS: 10000,
    CPU_METRICS_ENABLED: true,
    CPU_METRICS_COLLECT_INTERVAL: 5000,
    CPU_METRICS_AGGREGATE_INTERVAL: 60000,
    CPU_METRICS_RETENTION_DAYS: 30,
  },
  test: {
    CPU_METRICS_USAGE: 30,
    CPU_METRICS_LOAD_AVG_1: 0.5,
    CPU_METRICS_LOAD_AVG_5: 0.4,
    CPU_METRICS_LOAD_AVG_15: 0.3,
    CPU_METRICS_THREADS: 20,
    CPU_METRICS_PROCESSES: 10,
    CPU_METRICS_CONTEXT_SWITCHES: 500,
    CPU_METRICS_INTERRUPTS: 250,
    CPU_METRICS_ENABLED: true,
    CPU_METRICS_COLLECT_INTERVAL: 500,
    CPU_METRICS_AGGREGATE_INTERVAL: 5000,
    CPU_METRICS_RETENTION_DAYS: 1,
  },
  development: {
    // Disk metrics configuration
    DISK_METRICS_SPACE: '50G',
    DISK_METRICS_IOPS_READ: 500,
    DISK_METRICS_IOPS_WRITE: 200,
    DISK_METRICS_LATENCY_READ: 10,
    DISK_METRICS_LATENCY_WRITE: 50,
    DISK_METRICS_THROUGHPUT_READ: '50M',
    DISK_METRICS_THROUGHPUT_WRITE: '20M',
    DISK_METRICS_UTILIZATION: 50,
    DISK_METRICS_ENABLED: true,
    DISK_METRICS_COLLECT_INTERVAL: 5000,
    DISK_METRICS_AGGREGATE_INTERVAL: 60000,
    DISK_METRICS_RETENTION_DAYS: 7,
  },
  production: {
    DISK_METRICS_SPACE: '500G',
    DISK_METRICS_IOPS_READ: 5000,
    DISK_METRICS_IOPS_WRITE: 2000,
    DISK_METRICS_LATENCY_READ: 50,
    DISK_METRICS_LATENCY_WRITE: 200,
    DISK_METRICS_THROUGHPUT_READ: '500M',
    DISK_METRICS_THROUGHPUT_WRITE: '200M',
    DISK_METRICS_UTILIZATION: 70,
    DISK_METRICS_ENABLED: true,
    DISK_METRICS_COLLECT_INTERVAL: 30000,
    DISK_METRICS_AGGREGATE_INTERVAL: 300000,
    DISK_METRICS_RETENTION_DAYS: 30,
  },
  test: {
    DISK_METRICS_SPACE: '5G',
    DISK_METRICS_IOPS_READ: 50,
    DISK_METRICS_IOPS_WRITE: 20,
    DISK_METRICS_LATENCY_READ: 5,
    DISK_METRICS_LATENCY_WRITE: 20,
    DISK_METRICS_THROUGHPUT_READ: '5M',
    DISK_METRICS_THROUGHPUT_WRITE: '2M',
    DISK_METRICS_UTILIZATION: 60,
    DISK_METRICS_ENABLED: true,
    DISK_METRICS_COLLECT_INTERVAL: 1000,
    DISK_METRICS_AGGREGATE_INTERVAL: 10000,
    DISK_METRICS_RETENTION_DAYS: 1,
  },
  development: {
    // Network metrics configuration
    NETWORK_METRICS_BANDWIDTH: '50M',
    NETWORK_METRICS_LATENCY: 100,
    NETWORK_METRICS_PACKET_LOSS: 1,
    NETWORK_METRICS_CONNECTIONS: 100,
    NETWORK_METRICS_REQUEST_TIMEOUT: 5000,
    NETWORK_METRICS_RETRY_ATTEMPTS: 3,
    NETWORK_METRICS_KEEP_ALIVE: 60000,
    NETWORK_METRICS_ENABLED: true,
    NETWORK_METRICS_COLLECT_INTERVAL: 5000,
    NETWORK_METRICS_AGGREGATE_INTERVAL: 60000,
    NETWORK_METRICS_RETENTION_DAYS: 7,
  },
  production: {
    NETWORK_METRICS_BANDWIDTH: '500M',
    NETWORK_METRICS_LATENCY: 200,
    NETWORK_METRICS_PACKET_LOSS: 0.1,
    NETWORK_METRICS_CONNECTIONS: 1000,
    NETWORK_METRICS_REQUEST_TIMEOUT: 10000,
    NETWORK_METRICS_RETRY_ATTEMPTS: 5,
    NETWORK_METRICS_KEEP_ALIVE: 300000,
    NETWORK_METRICS_ENABLED: true,
    NETWORK_METRICS_COLLECT_INTERVAL: 30000,
    NETWORK_METRICS_AGGREGATE_INTERVAL: 300000,
    NETWORK_METRICS_RETENTION_DAYS: 30,
  },
  test: {
    NETWORK_METRICS_BANDWIDTH: '5M',
    NETWORK_METRICS_LATENCY: 50,
    NETWORK_METRICS_PACKET_LOSS: 2,
    NETWORK_METRICS_CONNECTIONS: 10,
    NETWORK_METRICS_REQUEST_TIMEOUT: 1000,
    NETWORK_METRICS_RETRY_ATTEMPTS: 2,
    NETWORK_METRICS_KEEP_ALIVE: 30000,
    NETWORK_METRICS_ENABLED: true,
    NETWORK_METRICS_COLLECT_INTERVAL: 1000,
    NETWORK_METRICS_AGGREGATE_INTERVAL: 10000,
    NETWORK_METRICS_RETENTION_DAYS: 1,
  },
  development: {
    // Memory metrics configuration
    MEMORY_METRICS_HEAP_SIZE: '512M',
    MEMORY_METRICS_STACK_SIZE: '8M',
    MEMORY_METRICS_GC_INTERVAL: 60000,
    MEMORY_METRICS_MEMORY_LIMIT: '1G',
    MEMORY_METRICS_BUFFER_SIZE: '64M',
    MEMORY_METRICS_GC_THRESHOLD: 80,
    MEMORY_METRICS_ENABLED: true,
    MEMORY_METRICS_COLLECT_INTERVAL: 5000,
    MEMORY_METRICS_AGGREGATE_INTERVAL: 60000,
    MEMORY_METRICS_RETENTION_DAYS: 7,
  },
  production: {
    MEMORY_METRICS_HEAP_SIZE: '4G',
    MEMORY_METRICS_STACK_SIZE: '32M',
    MEMORY_METRICS_GC_INTERVAL: 300000,
    MEMORY_METRICS_MEMORY_LIMIT: '8G',
    MEMORY_METRICS_BUFFER_SIZE: '256M',
    MEMORY_METRICS_GC_THRESHOLD: 85,
    MEMORY_METRICS_ENABLED: true,
    MEMORY_METRICS_COLLECT_INTERVAL: 30000,
    MEMORY_METRICS_AGGREGATE_INTERVAL: 300000,
    MEMORY_METRICS_RETENTION_DAYS: 30,
  },
  test: {
    MEMORY_METRICS_HEAP_SIZE: '256M',
    MEMORY_METRICS_STACK_SIZE: '4M',
    MEMORY_METRICS_GC_INTERVAL: 30000,
    MEMORY_METRICS_MEMORY_LIMIT: '512M',
    MEMORY_METRICS_BUFFER_SIZE: '32M',
    MEMORY_METRICS_GC_THRESHOLD: 75,
    MEMORY_METRICS_ENABLED: true,
    MEMORY_METRICS_COLLECT_INTERVAL: 1000,
    MEMORY_METRICS_AGGREGATE_INTERVAL: 10000,
    MEMORY_METRICS_RETENTION_DAYS: 1,
  },
  development: {
    // ... existing values ...
    TX_METRICS_POOL_SIZE: 500,
    TX_METRICS_CONFIRM_TIME: 2000,
    TX_METRICS_FEE_RATE: 1.0,
    TX_METRICS_THROUGHPUT: 50,
    TX_METRICS_PENDING_LIMIT: 200,
    TX_METRICS_RETRY_INTERVAL: 5000,
    TX_METRICS_ENABLED: true,
    TX_METRICS_COLLECT_INTERVAL: 1000,
    TX_METRICS_AGGREGATE_INTERVAL: 10000,
    TX_METRICS_RETENTION_DAYS: 7,
  },
  production: {
    // ... existing values ...
    TX_METRICS_POOL_SIZE: 5000,
    TX_METRICS_CONFIRM_TIME: 5000,
    TX_METRICS_FEE_RATE: 2.0,
    TX_METRICS_THROUGHPUT: 200,
    TX_METRICS_PENDING_LIMIT: 1000,
    TX_METRICS_RETRY_INTERVAL: 10000,
    TX_METRICS_ENABLED: true,
    TX_METRICS_COLLECT_INTERVAL: 5000,
    TX_METRICS_AGGREGATE_INTERVAL: 60000,
    TX_METRICS_RETENTION_DAYS: 30,
  },
  test: {
    // ... existing values ...
    TX_METRICS_POOL_SIZE: 50,
    TX_METRICS_CONFIRM_TIME: 500,
    TX_METRICS_FEE_RATE: 0.1,
    TX_METRICS_THROUGHPUT: 5,
    TX_METRICS_PENDING_LIMIT: 20,
    TX_METRICS_RETRY_INTERVAL: 1000,
    TX_METRICS_ENABLED: true,
    TX_METRICS_COLLECT_INTERVAL: 500,
    TX_METRICS_AGGREGATE_INTERVAL: 5000,
    TX_METRICS_RETENTION_DAYS: 1,
  },
  development: {
    // ... existing values ...
    METRICS_BLOCK_TIME: 2000,
    METRICS_TX_PER_BLOCK: 50,
    METRICS_HASH_POWER: 500,
    METRICS_SYNC_DELAY: 500,
    METRICS_PEER_COUNT: 5,
    METRICS_PROMETHEUS_ENABLED: true,
    METRICS_GRAFANA_ENABLED: true,
    METRICS_DASHBOARD_PORT: 3001,
    METRICS_COLLECT_INTERVAL: 5000,
    METRICS_AGGREGATE_INTERVAL: 60000,
  },
  production: {
    // ... existing values ...
    METRICS_BLOCK_TIME: 5000,
    METRICS_TX_PER_BLOCK: 200,
    METRICS_HASH_POWER: 2000,
    METRICS_SYNC_DELAY: 1000,
    METRICS_PEER_COUNT: 10,
    METRICS_PROMETHEUS_ENABLED: true,
    METRICS_GRAFANA_ENABLED: true,
    METRICS_DASHBOARD_PORT: 3002,
    METRICS_COLLECT_INTERVAL: 10000,
    METRICS_AGGREGATE_INTERVAL: 300000,
  },
  test: {
    // ... existing values ...
    METRICS_BLOCK_TIME: 500,
    METRICS_TX_PER_BLOCK: 5,
    METRICS_HASH_POWER: 50,
    METRICS_SYNC_DELAY: 100,
    METRICS_PEER_COUNT: 2,
    METRICS_PROMETHEUS_ENABLED: false,
    METRICS_GRAFANA_ENABLED: false,
    METRICS_DASHBOARD_PORT: 3003,
    METRICS_COLLECT_INTERVAL: 1000,
    METRICS_AGGREGATE_INTERVAL: 5000,
  },
  development: {
    // ... existing values ...
    POOL_METRICS_ENABLED: true,
    POOL_METRICS_INTERVAL: 10000,
    POOL_METRICS_PORT: 9090,
    POOL_ALERT_CPU_THRESHOLD: 70,
    POOL_ALERT_MEMORY_THRESHOLD: 80,
    POOL_ALERT_DISK_THRESHOLD: 85,
    POOL_METRICS_RETENTION_DAYS: 3,
    POOL_LOG_ROTATE_SIZE: '50M',
    POOL_LOG_COMPRESS: true,
    POOL_HEALTHCHECK_ENABLED: true,
    POOL_HEALTHCHECK_INTERVAL: 30000,
  },
  production: {
    // ... existing values ...
    POOL_METRICS_ENABLED: true,
    POOL_METRICS_INTERVAL: 30000,
    POOL_METRICS_PORT: 9091,
    POOL_ALERT_CPU_THRESHOLD: 85,
    POOL_ALERT_MEMORY_THRESHOLD: 90,
    POOL_ALERT_DISK_THRESHOLD: 90,
    POOL_METRICS_RETENTION_DAYS: 14,
    POOL_LOG_ROTATE_SIZE: '500M',
    POOL_LOG_COMPRESS: true,
    POOL_HEALTHCHECK_ENABLED: true,
    POOL_HEALTHCHECK_INTERVAL: 60000,
  },
  test: {
    // ... existing values ...
    POOL_METRICS_ENABLED: false,
    POOL_METRICS_INTERVAL: 1000,
    POOL_METRICS_PORT: 9092,
    POOL_ALERT_CPU_THRESHOLD: 50,
    POOL_ALERT_MEMORY_THRESHOLD: 60,
    POOL_ALERT_DISK_THRESHOLD: 70,
    POOL_METRICS_RETENTION_DAYS: 1,
    POOL_LOG_ROTATE_SIZE: '5M',
    POOL_LOG_COMPRESS: false,
    POOL_HEALTHCHECK_ENABLED: false,
    POOL_HEALTHCHECK_INTERVAL: 5000,
  },
  development: {
    // ... existing development values ...
    POOL_ENABLED: true,
    POOL_MAX_WORKERS: 4,
    POOL_TARGET_HASH_RATE: 500,
    POOL_MIN_PAYOUT: 5,
    POOL_FEE_RATE: 2,
    POOL_SHARE_DIFFICULTY: 1,
    POOL_UPDATE_INTERVAL: 5000,
    POOL_STATS_INTERVAL: 30000,
  },
  production: {
    // ... existing production values ...
    POOL_ENABLED: true,
    POOL_MAX_WORKERS: 8,
    POOL_TARGET_HASH_RATE: 2000,
    POOL_MIN_PAYOUT: 25,
    POOL_FEE_RATE: 5,
    POOL_SHARE_DIFFICULTY: 2,
    POOL_UPDATE_INTERVAL: 3000,
    POOL_STATS_INTERVAL: 60000,
  },
  test: {
    // ... existing test values ...
    POOL_ENABLED: false,
    POOL_MAX_WORKERS: 1,
    POOL_TARGET_HASH_RATE: 50,
    POOL_MIN_PAYOUT: 1,
    POOL_FEE_RATE: 0,
    POOL_SHARE_DIFFICULTY: 1,
    POOL_UPDATE_INTERVAL: 1000,
    POOL_STATS_INTERVAL: 5000,
  },
  development: {
    PORT: 3000,
    NODE_ENV: 'development',
    API_PREFIX: '/api',
    ALLOWED_ORIGINS: 'http://localhost:3000',
    RATE_LIMIT_MAX: 1000,
    BLOCKCHAIN_DIFFICULTY: 2,
    MINING_REWARD: 50,
    LOG_LEVEL: 'debug',
    LOG_DIR: 'logs',
    DOCKER_NETWORK_NAME: 'mycrypto_dev',
    DOCKER_CONTAINER_NAME: 'mycrypto_dev_server',
    MEMORY_LIMIT: '2G',
    CPU_LIMIT: 2,
  },
  production: {
    PORT: 3000,
    NODE_ENV: 'production',
    API_PREFIX: '/api',
    ALLOWED_ORIGINS: 'https://mycrypto.com',
    RATE_LIMIT_MAX: 100,
    BLOCKCHAIN_DIFFICULTY: 4,
    MINING_REWARD: 50,
    LOG_LEVEL: 'info',
    LOG_DIR: '/var/log/mycrypto',
    DOCKER_NETWORK_NAME: 'mycrypto_prod',
    DOCKER_CONTAINER_NAME: 'mycrypto_prod_server',
    MEMORY_LIMIT: '1G',
    CPU_LIMIT: 1,
    MEMORY_RESERVATION: '512M',
    CPU_RESERVATION: 0.5,
    METRICS_PORT: 9090,
  },
  test: {
    PORT: 3001,
    NODE_ENV: 'test',
    API_PREFIX: '/api',
    ALLOWED_ORIGINS: 'http://localhost:3001',
    RATE_LIMIT_MAX: 10000,
    BLOCKCHAIN_DIFFICULTY: 1,
    MINING_REWARD: 50,
    LOG_LEVEL: 'debug',
    LOG_DIR: 'logs/test',
    DOCKER_NETWORK_NAME: 'mycrypto_test',
    DOCKER_CONTAINER_NAME: 'mycrypto_test_server',
    MEMORY_LIMIT: '512M',
    CPU_LIMIT: 0.5,
    SKIP_BLOCKCHAIN_SYNC: true,
    ENABLE_MOCK_SERVICES: true,
    TEST_WALLET_SEED: 'test_seed_' + Math.random().toString(36).substring(2, 15),
  },
};

// Blockchain-specific fixes and validations
const HEAP_ALLOCATION_FIXES = {
  calculateInitialHeap: (value, envName) => {
    const limits = HEAP_ALLOCATION_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minInitialHeap;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minInitialHeap);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxInitialHeap);
    if (bytes < minBytes) return limits.minInitialHeap;
    if (bytes > maxBytes) return limits.maxInitialHeap;
    return value;
  },

  calculateHeapGrowth: (value, envName) => {
    const limits = HEAP_ALLOCATION_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minHeapGrowth;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minHeapGrowth);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxHeapGrowth);
    if (bytes < minBytes) return limits.minHeapGrowth;
    if (bytes > maxBytes) return limits.maxHeapGrowth;
    return value;
  },

  calculateAllocationRate: (value, envName) => {
    const limits = HEAP_ALLOCATION_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minAllocationRate;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minAllocationRate);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxAllocationRate);
    if (bytes < minBytes) return limits.minAllocationRate;
    if (bytes > maxBytes) return limits.maxAllocationRate;
    return value;
  },

  calculateObjectCount: (value, envName) => {
    const limits = HEAP_ALLOCATION_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minObjectCount;
    return Math.max(limits.minObjectCount, Math.min(limits.maxObjectCount, num));
  },

  calculateObjectSize: (value, envName) => {
    const limits = HEAP_ALLOCATION_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minObjectSize;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minObjectSize);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxObjectSize);
    if (bytes < minBytes) return limits.minObjectSize;
    if (bytes > maxBytes) return limits.maxObjectSize;
    return value;
  },

  calculateGcTrigger: (value, envName) => {
    const limits = HEAP_ALLOCATION_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minGcTrigger;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minGcTrigger);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxGcTrigger);
    if (bytes < minBytes) return limits.minGcTrigger;
    if (bytes > maxBytes) return limits.maxGcTrigger;
    return value;
  },

  calculateHeapUsage: (value, envName) => {
    const limits = HEAP_ALLOCATION_LIMITS[envName];
    const num = parseFloat(value);
    if (isNaN(num)) return limits.minHeapUsage;
    return Math.max(limits.minHeapUsage, Math.min(limits.maxHeapUsage, num));
  },

  validateHeapAllocationConfig: (envVars, envName) => {
    const fixes = {};
    const limits = HEAP_ALLOCATION_LIMITS[envName];

    // Skip validation if heap tracking is disabled
    if (envVars.HEAP_TRACKING_ENABLED === 'false') return fixes;

    // Ensure heap growth size is appropriate for initial heap
    const initialHeap = COMMON_FIXES.formatMemory(envVars.HEAP_INITIAL_SIZE);
    const heapGrowth = COMMON_FIXES.formatMemory(envVars.HEAP_GROWTH_SIZE);
    if (heapGrowth > initialHeap / 2) { // Growth shouldn't exceed 50% of initial
      fixes.HEAP_GROWTH_SIZE = `${Math.ceil(initialHeap / 2 / (1024 * 1024))}M`;
    }

    // Adjust GC trigger based on heap usage and growth
    const gcTrigger = COMMON_FIXES.formatMemory(envVars.HEAP_GC_TRIGGER);
    const heapUsage = parseFloat(envVars.HEAP_USAGE_RATIO);
    if (!isNaN(heapUsage)) {
      const minTrigger = Math.ceil(initialHeap * heapUsage);
      if (gcTrigger < minTrigger) {
        fixes.HEAP_GC_TRIGGER = `${Math.ceil(minTrigger / (1024 * 1024))}M`;
      }
    }

    // Adjust object size based on allocation rate and count
    const allocRate = COMMON_FIXES.formatMemory(envVars.HEAP_ALLOC_RATE);
    const objectCount = parseInt(envVars.HEAP_OBJECT_COUNT);
    const objectSize = COMMON_FIXES.formatMemory(envVars.HEAP_OBJECT_SIZE);
    if (!isNaN(objectCount)) {
      const avgObjSize = Math.ceil(allocRate / objectCount);
      if (objectSize > avgObjSize * 10) { // Object size shouldn't be too large
        fixes.HEAP_OBJECT_SIZE = `${Math.ceil(avgObjSize * 10 / 1024)}K`;
      }
    }

    return fixes;
  },
};

const MEMORY_FRAGMENTATION_FIXES = {
  calculateFragmentationRatio: (value, envName) => {
    const limits = MEMORY_FRAGMENTATION_LIMITS[envName];
    const num = parseFloat(value);
    if (isNaN(num)) return limits.minFragmentationRatio;
    return Math.max(limits.minFragmentationRatio, Math.min(limits.maxFragmentationRatio, num));
  },

  calculateFragmentSize: (value, envName) => {
    const limits = MEMORY_FRAGMENTATION_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minFragmentSize;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minFragmentSize);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxFragmentSize);
    if (bytes < minBytes) return limits.minFragmentSize;
    if (bytes > maxBytes) return limits.maxFragmentSize;
    return value;
  },

  calculateFragmentCount: (value, envName) => {
    const limits = MEMORY_FRAGMENTATION_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minFragmentCount;
    return Math.max(limits.minFragmentCount, Math.min(limits.maxFragmentCount, num));
  },

  calculateDefragInterval: (value, envName) => {
    const limits = MEMORY_FRAGMENTATION_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minDefragInterval;
    return Math.max(limits.minDefragInterval, Math.min(limits.maxDefragInterval, num));
  },

  calculateCompactionThreshold: (value, envName) => {
    const limits = MEMORY_FRAGMENTATION_LIMITS[envName];
    const num = parseFloat(value);
    if (isNaN(num)) return limits.minCompactionThreshold;
    return Math.max(limits.minCompactionThreshold, Math.min(limits.maxCompactionThreshold, num));
  },

  calculateFreeBlockRatio: (value, envName) => {
    const limits = MEMORY_FRAGMENTATION_LIMITS[envName];
    const num = parseFloat(value);
    if (isNaN(num)) return limits.minFreeBlockRatio;
    return Math.max(limits.minFreeBlockRatio, Math.min(limits.maxFreeBlockRatio, num));
  },

  calculateBlockSize: (value, envName) => {
    const limits = MEMORY_FRAGMENTATION_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minBlockSize;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minBlockSize);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxBlockSize);
    if (bytes < minBytes) return limits.minBlockSize;
    if (bytes > maxBytes) return limits.maxBlockSize;
    return value;
  },

  validateMemoryFragmentationConfig: (envVars, envName) => {
    const fixes = {};
    const limits = MEMORY_FRAGMENTATION_LIMITS[envName];

    // Skip validation if memory fragmentation analysis is disabled
    if (envVars.MEMORY_FRAG_ENABLED === 'false') return fixes;

    // Adjust defrag interval based on fragmentation ratio and count
    const fragRatio = parseFloat(envVars.MEMORY_FRAG_RATIO);
    const fragCount = parseInt(envVars.MEMORY_FRAG_COUNT);
    const defragInterval = parseInt(envVars.MEMORY_DEFRAG_INTERVAL);
    if (!isNaN(fragRatio) && !isNaN(fragCount) && !isNaN(defragInterval)) {
      const minInterval = Math.ceil(fragCount * fragRatio * 1000); // More frequent for higher fragmentation
      if (defragInterval < minInterval) {
        fixes.MEMORY_DEFRAG_INTERVAL = minInterval;
      }
    }

    // Adjust block size based on fragment size and count
    const fragSize = COMMON_FIXES.formatMemory(envVars.MEMORY_FRAG_SIZE);
    const blockSize = COMMON_FIXES.formatMemory(envVars.MEMORY_BLOCK_SIZE);
    if (blockSize < fragSize * 4) { // Block size should be at least 4x fragment size
      fixes.MEMORY_BLOCK_SIZE = `${Math.ceil(fragSize * 4 / (1024 * 1024))}M`;
    }

    // Adjust compaction threshold based on free block ratio
    const freeBlockRatio = parseFloat(envVars.MEMORY_FREE_BLOCK_RATIO);
    const compactThreshold = parseFloat(envVars.MEMORY_COMPACT_THRESHOLD);
    if (!isNaN(freeBlockRatio) && !isNaN(compactThreshold)) {
      if (compactThreshold <= freeBlockRatio) {
        fixes.MEMORY_COMPACT_THRESHOLD = Math.min(
          limits.maxCompactionThreshold,
          freeBlockRatio + 0.2
        );
      }
    }

    return fixes;
  },
};

const MEMORY_LEAK_FIXES = {
  calculateDetectionInterval: (value, envName) => {
    const limits = MEMORY_LEAK_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minDetectionInterval;
    return Math.max(limits.minDetectionInterval, Math.min(limits.maxDetectionInterval, num));
  },

  calculateGrowthRate: (value, envName) => {
    const limits = MEMORY_LEAK_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minGrowthRate;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minGrowthRate);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxGrowthRate);
    if (bytes < minBytes) return limits.minGrowthRate;
    if (bytes > maxBytes) return limits.maxGrowthRate;
    return value;
  },

  calculateSuspectObjects: (value, envName) => {
    const limits = MEMORY_LEAK_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minSuspectObjects;
    return Math.max(limits.minSuspectObjects, Math.min(limits.maxSuspectObjects, num));
  },

  calculateLeakSize: (value, envName) => {
    const limits = MEMORY_LEAK_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minLeakSize;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minLeakSize);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxLeakSize);
    if (bytes < minBytes) return limits.minLeakSize;
    if (bytes > maxBytes) return limits.maxLeakSize;
    return value;
  },

  calculateRetentionTime: (value, envName) => {
    const limits = MEMORY_LEAK_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minRetentionTime;
    return Math.max(limits.minRetentionTime, Math.min(limits.maxRetentionTime, num));
  },

  calculateStackTraceDepth: (value, envName) => {
    const limits = MEMORY_LEAK_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minStackTraceDepth;
    return Math.max(limits.minStackTraceDepth, Math.min(limits.maxStackTraceDepth, num));
  },

  calculateHistorySize: (value, envName) => {
    const limits = MEMORY_LEAK_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minHistorySize;
    return Math.max(limits.minHistorySize, Math.min(limits.maxHistorySize, num));
  },

  validateMemoryLeakConfig: (envVars, envName) => {
    const fixes = {};
    const limits = MEMORY_LEAK_LIMITS[envName];

    // Skip validation if memory leak detection is disabled
    if (envVars.MEMORY_LEAK_ENABLED === 'false') return fixes;

    // Adjust detection interval based on growth rate
    const growthRate = COMMON_FIXES.formatMemory(envVars.MEMORY_LEAK_GROWTH_RATE);
    const detectionInterval = parseInt(envVars.MEMORY_LEAK_DETECTION_INTERVAL);
    if (!isNaN(detectionInterval)) {
      const minInterval = Math.ceil(growthRate / (1024 * 1024) * 1000); // At least 1s per MB of growth
      if (detectionInterval < minInterval) {
        fixes.MEMORY_LEAK_DETECTION_INTERVAL = minInterval;
      }
    }

    // Adjust history size based on retention time
    const retentionTime = parseInt(envVars.MEMORY_LEAK_RETENTION_TIME);
    const historySize = parseInt(envVars.MEMORY_LEAK_HISTORY_SIZE);
    if (!isNaN(retentionTime) && !isNaN(historySize) && !isNaN(detectionInterval)) {
      const minHistory = Math.ceil(retentionTime / detectionInterval);
      if (historySize < minHistory) {
        fixes.MEMORY_LEAK_HISTORY_SIZE = minHistory;
      }
    }

    // Adjust stack trace depth based on suspect objects
    const suspectObjects = parseInt(envVars.MEMORY_LEAK_SUSPECT_OBJECTS);
    const stackTraceDepth = parseInt(envVars.MEMORY_LEAK_STACK_TRACE_DEPTH);
    if (!isNaN(suspectObjects) && !isNaN(stackTraceDepth)) {
      const maxDepth = Math.min(limits.maxStackTraceDepth, Math.ceil(10000 / suspectObjects));
      if (stackTraceDepth > maxDepth) {
        fixes.MEMORY_LEAK_STACK_TRACE_DEPTH = maxDepth;
      }
    }

    // Ensure leak size threshold is appropriate for growth rate
    const leakSize = COMMON_FIXES.formatMemory(envVars.MEMORY_LEAK_SIZE);
    if (leakSize < growthRate * 5) { // Leak size should be at least 5x growth rate
      fixes.MEMORY_LEAK_SIZE = `${Math.ceil(growthRate * 5 / (1024 * 1024))}M`;
    }

    return fixes;
  },
};

const MEMORY_PROFILING_FIXES = {
  calculateSamplingRate: (value, envName) => {
    const limits = MEMORY_PROFILING_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minSamplingRate;
    return Math.max(limits.minSamplingRate, Math.min(limits.maxSamplingRate, num));
  },

  calculateStackDepth: (value, envName) => {
    const limits = MEMORY_PROFILING_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minStackDepth;
    return Math.max(limits.minStackDepth, Math.min(limits.maxStackDepth, num));
  },

  calculateHeapSnapshotInterval: (value, envName) => {
    const limits = MEMORY_PROFILING_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minHeapSnapshotInterval;
    return Math.max(limits.minHeapSnapshotInterval, Math.min(limits.maxHeapSnapshotInterval, num));
  },

  calculateRetainedSize: (value, envName) => {
    const limits = MEMORY_PROFILING_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minRetainedSize;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minRetainedSize);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxRetainedSize);
    if (bytes < minBytes) return limits.minRetainedSize;
    if (bytes > maxBytes) return limits.maxRetainedSize;
    return value;
  },

  calculateLeakThreshold: (value, envName) => {
    const limits = MEMORY_PROFILING_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minLeakThreshold;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minLeakThreshold);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxLeakThreshold);
    if (bytes < minBytes) return limits.minLeakThreshold;
    if (bytes > maxBytes) return limits.maxLeakThreshold;
    return value;
  },

  calculateProfileBufferSize: (value, envName) => {
    const limits = MEMORY_PROFILING_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minProfileBufferSize;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minProfileBufferSize);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxProfileBufferSize);
    if (bytes < minBytes) return limits.minProfileBufferSize;
    if (bytes > maxBytes) return limits.maxProfileBufferSize;
    return value;
  },

  calculateCallGraphDepth: (value, envName) => {
    const limits = MEMORY_PROFILING_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minCallGraphDepth;
    return Math.max(limits.minCallGraphDepth, Math.min(limits.maxCallGraphDepth, num));
  },

  validateMemoryProfilingConfig: (envVars, envName) => {
    const fixes = {};
    const limits = MEMORY_PROFILING_LIMITS[envName];

    // Skip validation if memory profiling is disabled
    if (envVars.MEMORY_PROF_ENABLED === 'false') return fixes;

    // Adjust sampling rate based on heap snapshot interval
    const snapshotInterval = parseInt(envVars.MEMORY_PROF_HEAP_SNAPSHOT_INTERVAL);
    const samplingRate = parseInt(envVars.MEMORY_PROF_SAMPLING_RATE);
    if (!isNaN(snapshotInterval) && !isNaN(samplingRate)) {
      const maxSamples = snapshotInterval / 1000 * samplingRate;
      if (maxSamples > 1000000) { // Prevent excessive sampling
        fixes.MEMORY_PROF_SAMPLING_RATE = Math.floor(1000000 / (snapshotInterval / 1000));
      }
    }

    // Adjust buffer size based on sampling rate and stack depth
    const stackDepth = parseInt(envVars.MEMORY_PROF_STACK_DEPTH);
    const bufferSize = COMMON_FIXES.formatMemory(envVars.MEMORY_PROF_BUFFER_SIZE);
    if (!isNaN(stackDepth) && !isNaN(samplingRate)) {
      const estimatedSize = stackDepth * samplingRate * 100; // bytes per second
      const minBufferSize = estimatedSize * 60; // 1 minute buffer
      if (bufferSize < minBufferSize) {
        fixes.MEMORY_PROF_BUFFER_SIZE = `${Math.ceil(minBufferSize / (1024 * 1024))}M`;
      }
    }

    // Adjust leak threshold based on retained size
    const retainedSize = COMMON_FIXES.formatMemory(envVars.MEMORY_PROF_RETAINED_SIZE);
    const leakThreshold = COMMON_FIXES.formatMemory(envVars.MEMORY_PROF_LEAK_THRESHOLD);
    if (leakThreshold > retainedSize * 0.1) { // Leak threshold should not exceed 10% of retained size
      fixes.MEMORY_PROF_LEAK_THRESHOLD = `${Math.floor(retainedSize * 0.1 / (1024 * 1024))}M`;
    }

    // Adjust call graph depth based on stack depth
    if (!isNaN(stackDepth)) {
      const callGraphDepth = parseInt(envVars.MEMORY_PROF_CALL_GRAPH_DEPTH);
      if (!isNaN(callGraphDepth) && callGraphDepth > stackDepth) {
        fixes.MEMORY_PROF_CALL_GRAPH_DEPTH = stackDepth;
      }
    }

    return fixes;
  },
};

const MEMORY_ALLOCATION_FIXES = {
  calculateHeapAlloc: (value, envName) => {
    const limits = MEMORY_ALLOCATION_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minHeapAlloc;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minHeapAlloc);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxHeapAlloc);
    if (bytes < minBytes) return limits.minHeapAlloc;
    if (bytes > maxBytes) return limits.maxHeapAlloc;
    return value;
  },

  calculateStackAlloc: (value, envName) => {
    const limits = MEMORY_ALLOCATION_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minStackAlloc;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minStackAlloc);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxStackAlloc);
    if (bytes < minBytes) return limits.minStackAlloc;
    if (bytes > maxBytes) return limits.maxStackAlloc;
    return value;
  },

  calculatePageSize: (value, envName) => {
    const limits = MEMORY_ALLOCATION_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minPageSize;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minPageSize);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxPageSize);
    if (bytes < minBytes) return limits.minPageSize;
    if (bytes > maxBytes) return limits.maxPageSize;
    return value;
  },

  calculateFragmentation: (value, envName) => {
    const limits = MEMORY_ALLOCATION_LIMITS[envName];
    const num = parseFloat(value);
    if (isNaN(num)) return limits.minFragmentation;
    return Math.max(limits.minFragmentation, Math.min(limits.maxFragmentation, num));
  },

  calculateAllocationRate: (value, envName) => {
    const limits = MEMORY_ALLOCATION_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minAllocationRate;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minAllocationRate);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxAllocationRate);
    if (bytes < minBytes) return limits.minAllocationRate;
    if (bytes > maxBytes) return limits.maxAllocationRate;
    return value;
  },

  calculateDeallocationRate: (value, envName) => {
    const limits = MEMORY_ALLOCATION_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minDeallocationRate;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minDeallocationRate);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxDeallocationRate);
    if (bytes < minBytes) return limits.minDeallocationRate;
    if (bytes > maxBytes) return limits.maxDeallocationRate;
    return value;
  },

  calculatePoolSize: (value, envName) => {
    const limits = MEMORY_ALLOCATION_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minPoolSize;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minPoolSize);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxPoolSize);
    if (bytes < minBytes) return limits.minPoolSize;
    if (bytes > maxBytes) return limits.maxPoolSize;
    return value;
  },

  calculateGcPause: (value, envName) => {
    const limits = MEMORY_ALLOCATION_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minGcPause;
    return Math.max(limits.minGcPause, Math.min(limits.maxGcPause, num));
  },

  validateMemoryAllocationConfig: (envVars, envName) => {
    const fixes = {};
    const limits = MEMORY_ALLOCATION_LIMITS[envName];

    // Skip validation if memory allocation metrics are disabled
    if (envVars.MEMORY_ALLOC_ENABLED === 'false') return fixes;

    // Ensure deallocation rate doesn't exceed allocation rate
    const allocRate = COMMON_FIXES.formatMemory(envVars.MEMORY_ALLOC_RATE);
    const deallocRate = COMMON_FIXES.formatMemory(envVars.MEMORY_DEALLOC_RATE);
    if (deallocRate > allocRate) {
      fixes.MEMORY_DEALLOC_RATE = envVars.MEMORY_ALLOC_RATE;
    }

    // Adjust collection interval based on GC pause time
    const gcPause = parseInt(envVars.MEMORY_ALLOC_GC_PAUSE);
    const collectInterval = parseInt(envVars.MEMORY_ALLOC_COLLECT_INTERVAL);
    if (!isNaN(gcPause) && !isNaN(collectInterval)) {
      const minInterval = gcPause * 5; // Collection interval should be at least 5x GC pause
      if (collectInterval < minInterval) {
        fixes.MEMORY_ALLOC_COLLECT_INTERVAL = minInterval;
      }
    }

    // Adjust pool size based on heap allocation
    const heapAlloc = COMMON_FIXES.formatMemory(envVars.MEMORY_ALLOC_HEAP);
    const poolSize = COMMON_FIXES.formatMemory(envVars.MEMORY_ALLOC_POOL_SIZE);
    if (poolSize > heapAlloc * 0.5) { // Pool size should not exceed 50% of heap
      fixes.MEMORY_ALLOC_POOL_SIZE = `${Math.floor(heapAlloc * 0.5 / (1024 * 1024))}M`;
    }

    // Increase collection frequency if fragmentation is high
    const fragmentation = parseFloat(envVars.MEMORY_ALLOC_FRAGMENTATION);
    if (!isNaN(fragmentation) && !isNaN(collectInterval)) {
      if (fragmentation > 25) { // High fragmentation needs more frequent collection
        fixes.MEMORY_ALLOC_COLLECT_INTERVAL = Math.max(100, collectInterval / 2);
      }
    }

    return fixes;
  },
};

const CPU_METRICS_FIXES = {
  calculateUsage: (value, envName) => {
    const limits = CPU_METRICS_LIMITS[envName];
    const num = parseFloat(value);
    if (isNaN(num)) return limits.minUsage;
    return Math.max(limits.minUsage, Math.min(limits.maxUsage, num));
  },

  calculateLoadAvg: (value, period, envName) => {
    const limits = CPU_METRICS_LIMITS[envName];
    const num = parseFloat(value);
    if (isNaN(num)) {
      switch(period) {
        case 1: return limits.minLoadAvg1;
        case 5: return limits.minLoadAvg5;
        case 15: return limits.minLoadAvg15;
        default: return 0;
      }
    }
    switch(period) {
      case 1: return Math.max(limits.minLoadAvg1, Math.min(limits.maxLoadAvg1, num));
      case 5: return Math.max(limits.minLoadAvg5, Math.min(limits.maxLoadAvg5, num));
      case 15: return Math.max(limits.minLoadAvg15, Math.min(limits.maxLoadAvg15, num));
      default: return num;
    }
  },

  calculateThreads: (value, envName) => {
    const limits = CPU_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minThreads;
    return Math.max(limits.minThreads, Math.min(limits.maxThreads, num));
  },

  calculateProcesses: (value, envName) => {
    const limits = CPU_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minProcesses;
    return Math.max(limits.minProcesses, Math.min(limits.maxProcesses, num));
  },

  calculateContextSwitches: (value, envName) => {
    const limits = CPU_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minContextSwitches;
    return Math.max(limits.minContextSwitches, Math.min(limits.maxContextSwitches, num));
  },

  calculateInterrupts: (value, envName) => {
    const limits = CPU_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minInterrupts;
    return Math.max(limits.minInterrupts, Math.min(limits.maxInterrupts, num));
  },

  validateCpuMetricsConfig: (envVars, envName) => {
    const fixes = {};
    const limits = CPU_METRICS_LIMITS[envName];

    // Skip validation if CPU metrics are disabled
    if (envVars.CPU_METRICS_ENABLED === 'false') return fixes;

    // Ensure load averages follow a decreasing pattern (1m > 5m > 15m)
    const loadAvg1 = parseFloat(envVars.CPU_METRICS_LOAD_AVG_1);
    const loadAvg5 = parseFloat(envVars.CPU_METRICS_LOAD_AVG_5);
    const loadAvg15 = parseFloat(envVars.CPU_METRICS_LOAD_AVG_15);

    if (!isNaN(loadAvg1) && !isNaN(loadAvg5) && loadAvg5 > loadAvg1) {
      fixes.CPU_METRICS_LOAD_AVG_5 = Math.min(loadAvg5, loadAvg1 * 0.8);
    }
    if (!isNaN(loadAvg5) && !isNaN(loadAvg15) && loadAvg15 > loadAvg5) {
      fixes.CPU_METRICS_LOAD_AVG_15 = Math.min(loadAvg15, loadAvg5 * 0.8);
    }

    // Adjust collection interval based on CPU usage
    const usage = parseFloat(envVars.CPU_METRICS_USAGE);
    const collectInterval = parseInt(envVars.CPU_METRICS_COLLECT_INTERVAL);
    if (!isNaN(usage) && !isNaN(collectInterval)) {
      if (usage > 80) { // High CPU usage needs more frequent collection
        fixes.CPU_METRICS_COLLECT_INTERVAL = Math.max(100, collectInterval / 2);
      } else if (usage < 20) { // Low CPU usage can have less frequent collection
        fixes.CPU_METRICS_COLLECT_INTERVAL = Math.min(30000, collectInterval * 2);
      }
    }

    // Ensure process count is compatible with thread count
    const threads = parseInt(envVars.CPU_METRICS_THREADS);
    const processes = parseInt(envVars.CPU_METRICS_PROCESSES);
    if (!isNaN(threads) && !isNaN(processes)) {
      if (processes > threads) { // Can't have more processes than threads
        fixes.CPU_METRICS_PROCESSES = Math.floor(threads * 0.8);
      }
    }

    // Adjust context switches based on CPU usage and thread count
    const contextSwitches = parseInt(envVars.CPU_METRICS_CONTEXT_SWITCHES);
    if (!isNaN(contextSwitches) && !isNaN(threads) && !isNaN(usage)) {
      const maxSwitches = Math.floor(threads * 100 * (1 + usage / 100));
      if (contextSwitches > maxSwitches) {
        fixes.CPU_METRICS_CONTEXT_SWITCHES = maxSwitches;
      }
    }

    return fixes;
  },
};

const DISK_METRICS_FIXES = {
  calculateDiskSpace: (value, envName) => {
    const limits = DISK_METRICS_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMGTkgt]B?$/)) {
      return limits.minDiskSpace;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minDiskSpace);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxDiskSpace);
    if (bytes < minBytes) return limits.minDiskSpace;
    if (bytes > maxBytes) return limits.maxDiskSpace;
    return value;
  },

  calculateIopsRead: (value, envName) => {
    const limits = DISK_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minIopsRead;
    return Math.max(limits.minIopsRead, Math.min(limits.maxIopsRead, num));
  },

  calculateIopsWrite: (value, envName) => {
    const limits = DISK_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minIopsWrite;
    return Math.max(limits.minIopsWrite, Math.min(limits.maxIopsWrite, num));
  },

  calculateLatencyRead: (value, envName) => {
    const limits = DISK_METRICS_LIMITS[envName];
    const num = parseFloat(value);
    if (isNaN(num)) return limits.minLatencyRead;
    return Math.max(limits.minLatencyRead, Math.min(limits.maxLatencyRead, num));
  },

  calculateLatencyWrite: (value, envName) => {
    const limits = DISK_METRICS_LIMITS[envName];
    const num = parseFloat(value);
    if (isNaN(num)) return limits.minLatencyWrite;
    return Math.max(limits.minLatencyWrite, Math.min(limits.maxLatencyWrite, num));
  },

  calculateThroughputRead: (value, envName) => {
    const limits = DISK_METRICS_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMG]B?$/)) {
      return limits.minThroughputRead;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minThroughputRead);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxThroughputRead);
    if (bytes < minBytes) return limits.minThroughputRead;
    if (bytes > maxBytes) return limits.maxThroughputRead;
    return value;
  },

  calculateThroughputWrite: (value, envName) => {
    const limits = DISK_METRICS_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMG]B?$/)) {
      return limits.minThroughputWrite;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minThroughputWrite);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxThroughputWrite);
    if (bytes < minBytes) return limits.minThroughputWrite;
    if (bytes > maxBytes) return limits.maxThroughputWrite;
    return value;
  },

  calculateUtilization: (value, envName) => {
    const limits = DISK_METRICS_LIMITS[envName];
    const num = parseFloat(value);
    if (isNaN(num)) return limits.minUtilization;
    return Math.max(limits.minUtilization, Math.min(limits.maxUtilization, num));
  },

  validateDiskMetricsConfig: (envVars, envName) => {
    const fixes = {};
    const limits = DISK_METRICS_LIMITS[envName];

    // Skip validation if disk metrics are disabled
    if (envVars.DISK_METRICS_ENABLED === 'false') return fixes;

    // Ensure IOPS write doesn't exceed read capacity
    const iopsRead = parseInt(envVars.DISK_METRICS_IOPS_READ);
    const iopsWrite = parseInt(envVars.DISK_METRICS_IOPS_WRITE);
    if (!isNaN(iopsRead) && !isNaN(iopsWrite)) {
      if (iopsWrite > iopsRead * 0.8) { // Write IOPS should not exceed 80% of read IOPS
        fixes.DISK_METRICS_IOPS_WRITE = Math.floor(iopsRead * 0.8);
      }
    }

    // Ensure throughput write doesn't exceed read capacity
    const throughputRead = COMMON_FIXES.formatMemory(envVars.DISK_METRICS_THROUGHPUT_READ);
    const throughputWrite = COMMON_FIXES.formatMemory(envVars.DISK_METRICS_THROUGHPUT_WRITE);
    if (throughputWrite > throughputRead * 0.8) { // Write throughput should not exceed 80% of read throughput
      fixes.DISK_METRICS_THROUGHPUT_WRITE = `${Math.floor(throughputRead * 0.8 / (1024 * 1024))}M`;
    }

    // Ensure collection interval is compatible with latencies
    const latencyRead = parseFloat(envVars.DISK_METRICS_LATENCY_READ);
    const latencyWrite = parseFloat(envVars.DISK_METRICS_LATENCY_WRITE);
    const collectInterval = parseInt(envVars.DISK_METRICS_COLLECT_INTERVAL);
    if (!isNaN(latencyRead) && !isNaN(latencyWrite) && !isNaN(collectInterval)) {
      const minInterval = Math.max(latencyRead, latencyWrite) * 5; // Collection interval should be at least 5x max latency
      if (collectInterval < minInterval) {
        fixes.DISK_METRICS_COLLECT_INTERVAL = Math.ceil(minInterval);
      }
    }

    // Adjust collection frequency based on utilization
    const utilization = parseFloat(envVars.DISK_METRICS_UTILIZATION);
    if (!isNaN(utilization) && !isNaN(collectInterval)) {
      if (utilization > 80) { // High utilization needs more frequent collection
        const adjustedInterval = Math.max(1000, collectInterval / 2);
        fixes.DISK_METRICS_COLLECT_INTERVAL = adjustedInterval;
      }
    }

    return fixes;
  },
};

const NETWORK_METRICS_FIXES = {
  calculateBandwidth: (value, envName) => {
    const limits = NETWORK_METRICS_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMG]B?$/)) {
      return limits.minBandwidth;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minBandwidth);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxBandwidth);
    if (bytes < minBytes) return limits.minBandwidth;
    if (bytes > maxBytes) return limits.maxBandwidth;
    return value;
  },

  calculateLatency: (value, envName) => {
    const limits = NETWORK_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minLatency;
    return Math.max(limits.minLatency, Math.min(limits.maxLatency, num));
  },

  calculatePacketLoss: (value, envName) => {
    const limits = NETWORK_METRICS_LIMITS[envName];
    const num = parseFloat(value);
    if (isNaN(num)) return limits.minPacketLoss;
    return Math.max(limits.minPacketLoss, Math.min(limits.maxPacketLoss, num));
  },

  calculateConnections: (value, envName) => {
    const limits = NETWORK_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minConnections;
    return Math.max(limits.minConnections, Math.min(limits.maxConnections, num));
  },

  calculateRequestTimeout: (value, envName) => {
    const limits = NETWORK_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minRequestTimeout;
    return Math.max(limits.minRequestTimeout, Math.min(limits.maxRequestTimeout, num));
  },

  calculateRetryAttempts: (value, envName) => {
    const limits = NETWORK_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minRetryAttempts;
    return Math.max(limits.minRetryAttempts, Math.min(limits.maxRetryAttempts, num));
  },

  calculateKeepAlive: (value, envName) => {
    const limits = NETWORK_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minKeepAlive;
    return Math.max(limits.minKeepAlive, Math.min(limits.maxKeepAlive, num));
  },

  validateNetworkMetricsConfig: (envVars, envName) => {
    const fixes = {};
    const limits = NETWORK_METRICS_LIMITS[envName];

    // Skip validation if network metrics are disabled
    if (envVars.NETWORK_METRICS_ENABLED === 'false') return fixes;

    // Ensure request timeout is compatible with latency
    const latency = parseInt(envVars.NETWORK_METRICS_LATENCY);
    const requestTimeout = parseInt(envVars.NETWORK_METRICS_REQUEST_TIMEOUT);
    if (!isNaN(latency) && !isNaN(requestTimeout)) {
      const minTimeout = latency * 5; // Timeout should be at least 5x latency
      if (requestTimeout < minTimeout) {
        fixes.NETWORK_METRICS_REQUEST_TIMEOUT = minTimeout;
      }
    }

    // Ensure retry attempts are compatible with packet loss
    const packetLoss = parseFloat(envVars.NETWORK_METRICS_PACKET_LOSS);
    const retryAttempts = parseInt(envVars.NETWORK_METRICS_RETRY_ATTEMPTS);
    if (!isNaN(packetLoss) && !isNaN(retryAttempts)) {
      const minRetries = Math.ceil(packetLoss / 2); // More retries for higher packet loss
      if (retryAttempts < minRetries) {
        fixes.NETWORK_METRICS_RETRY_ATTEMPTS = minRetries;
      }
    }

    // Ensure keep-alive is compatible with request timeout
    const keepAlive = parseInt(envVars.NETWORK_METRICS_KEEP_ALIVE);
    if (!isNaN(requestTimeout) && !isNaN(keepAlive)) {
      if (keepAlive < requestTimeout * 3) { // Keep-alive should be at least 3x timeout
        fixes.NETWORK_METRICS_KEEP_ALIVE = requestTimeout * 3;
      }
    }

    // Ensure collection interval is compatible with latency
    const collectInterval = parseInt(envVars.NETWORK_METRICS_COLLECT_INTERVAL);
    if (!isNaN(latency) && !isNaN(collectInterval)) {
      if (collectInterval < latency * 2) { // Collection interval should be at least 2x latency
        fixes.NETWORK_METRICS_COLLECT_INTERVAL = latency * 2;
      }
    }

    return fixes;
  },
};

const MEMORY_METRICS_FIXES = {
  calculateHeapSize: (value, envName) => {
    const limits = MEMORY_METRICS_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMG]B?$/)) {
      return limits.minHeapSize;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minHeapSize);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxHeapSize);
    if (bytes < minBytes) return limits.minHeapSize;
    if (bytes > maxBytes) return limits.maxHeapSize;
    return value;
  },

  calculateStackSize: (value, envName) => {
    const limits = MEMORY_METRICS_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMG]B?$/)) {
      return limits.minStackSize;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minStackSize);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxStackSize);
    if (bytes < minBytes) return limits.minStackSize;
    if (bytes > maxBytes) return limits.maxStackSize;
    return value;
  },

  calculateGcInterval: (value, envName) => {
    const limits = MEMORY_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minGcInterval;
    return Math.max(limits.minGcInterval, Math.min(limits.maxGcInterval, num));
  },

  calculateMemoryLimit: (value, envName) => {
    const limits = MEMORY_METRICS_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMG]B?$/)) {
      return limits.minMemoryLimit;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minMemoryLimit);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxMemoryLimit);
    if (bytes < minBytes) return limits.minMemoryLimit;
    if (bytes > maxBytes) return limits.maxMemoryLimit;
    return value;
  },

  calculateBufferSize: (value, envName) => {
    const limits = MEMORY_METRICS_LIMITS[envName];
    if (!value || !value.match(/^\d+[KMG]B?$/)) {
      return limits.minBufferSize;
    }
    const bytes = COMMON_FIXES.formatMemory(value);
    const minBytes = COMMON_FIXES.formatMemory(limits.minBufferSize);
    const maxBytes = COMMON_FIXES.formatMemory(limits.maxBufferSize);
    if (bytes < minBytes) return limits.minBufferSize;
    if (bytes > maxBytes) return limits.maxBufferSize;
    return value;
  },

  calculateGcThreshold: (value, envName) => {
    const limits = MEMORY_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minGcThreshold;
    return Math.max(limits.minGcThreshold, Math.min(limits.maxGcThreshold, num));
  },

  validateMemoryMetricsConfig: (envVars, envName) => {
    const fixes = {};
    const limits = MEMORY_METRICS_LIMITS[envName];

    // Skip validation if memory metrics are disabled
    if (envVars.MEMORY_METRICS_ENABLED === 'false') return fixes;

    // Ensure heap size is compatible with memory limit
    const heapSize = COMMON_FIXES.formatMemory(envVars.MEMORY_METRICS_HEAP_SIZE);
    const memoryLimit = COMMON_FIXES.formatMemory(envVars.MEMORY_METRICS_MEMORY_LIMIT);
    if (heapSize > memoryLimit * 0.8) { // Heap should not exceed 80% of memory limit
      fixes.MEMORY_METRICS_HEAP_SIZE = `${Math.floor(memoryLimit * 0.8 / (1024 * 1024))}M`;
    }

    // Ensure stack size is compatible with heap size
    const stackSize = COMMON_FIXES.formatMemory(envVars.MEMORY_METRICS_STACK_SIZE);
    if (stackSize > heapSize * 0.1) { // Stack should not exceed 10% of heap
      fixes.MEMORY_METRICS_STACK_SIZE = `${Math.floor(heapSize * 0.1 / (1024 * 1024))}M`;
    }

    // Ensure buffer size is compatible with memory limit
    const bufferSize = COMMON_FIXES.formatMemory(envVars.MEMORY_METRICS_BUFFER_SIZE);
    if (bufferSize > memoryLimit * 0.2) { // Buffer should not exceed 20% of memory limit
      fixes.MEMORY_METRICS_BUFFER_SIZE = `${Math.floor(memoryLimit * 0.2 / (1024 * 1024))}M`;
    }

    // Ensure GC interval is compatible with collection interval
    const gcInterval = parseInt(envVars.MEMORY_METRICS_GC_INTERVAL);
    const collectInterval = parseInt(envVars.MEMORY_METRICS_COLLECT_INTERVAL);
    if (gcInterval < collectInterval * 10) { // GC interval should be at least 10x collection interval
      fixes.MEMORY_METRICS_GC_INTERVAL = collectInterval * 10;
    }

    return fixes;
  },
};

const TX_METRICS_FIXES = {
  calculatePoolSize: (value, envName) => {
    const limits = TX_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minTxPoolSize;
    return Math.max(limits.minTxPoolSize, Math.min(limits.maxTxPoolSize, num));
  },

  calculateConfirmTime: (value, envName) => {
    const limits = TX_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minTxConfirmTime;
    return Math.max(limits.minTxConfirmTime, Math.min(limits.maxTxConfirmTime, num));
  },

  calculateFeeRate: (value, envName) => {
    const limits = TX_METRICS_LIMITS[envName];
    const num = parseFloat(value);
    if (isNaN(num)) return limits.minTxFeeRate;
    return Math.max(limits.minTxFeeRate, Math.min(limits.maxTxFeeRate, num));
  },

  calculateThroughput: (value, envName) => {
    const limits = TX_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minTxThroughput;
    return Math.max(limits.minTxThroughput, Math.min(limits.maxTxThroughput, num));
  },

  calculatePendingLimit: (value, envName) => {
    const limits = TX_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minPendingTxLimit;
    return Math.max(limits.minPendingTxLimit, Math.min(limits.maxPendingTxLimit, num));
  },

  calculateRetryInterval: (value, envName) => {
    const limits = TX_METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minTxRetryInterval;
    return Math.max(limits.minTxRetryInterval, Math.min(limits.maxTxRetryInterval, num));
  },

  validateTxMetricsConfig: (envVars, envName) => {
    const fixes = {};
    const limits = TX_METRICS_LIMITS[envName];

    // Skip validation if tx metrics are disabled
    if (envVars.TX_METRICS_ENABLED === 'false') return fixes;

    // Ensure pool size is compatible with throughput
    const poolSize = parseInt(envVars.TX_METRICS_POOL_SIZE);
    const throughput = parseInt(envVars.TX_METRICS_THROUGHPUT);
    if (!isNaN(poolSize) && !isNaN(throughput)) {
      const minPoolSize = throughput * 5; // 5 seconds buffer
      if (poolSize < minPoolSize) {
        fixes.TX_METRICS_POOL_SIZE = minPoolSize;
      }
    }

    // Ensure confirm time is compatible with retry interval
    const confirmTime = parseInt(envVars.TX_METRICS_CONFIRM_TIME);
    const retryInterval = parseInt(envVars.TX_METRICS_RETRY_INTERVAL);
    if (!isNaN(confirmTime) && !isNaN(retryInterval)) {
      if (retryInterval <= confirmTime) {
        fixes.TX_METRICS_RETRY_INTERVAL = confirmTime * 2;
      }
    }

    // Ensure pending limit is compatible with pool size
    const pendingLimit = parseInt(envVars.TX_METRICS_PENDING_LIMIT);
    if (!isNaN(poolSize) && !isNaN(pendingLimit)) {
      if (pendingLimit > poolSize * 0.8) { // Max 80% of pool size
        fixes.TX_METRICS_PENDING_LIMIT = Math.floor(poolSize * 0.8);
      }
    }

    // Ensure collection interval is compatible with throughput
    const collectInterval = parseInt(envVars.TX_METRICS_COLLECT_INTERVAL);
    if (!isNaN(throughput) && !isNaN(collectInterval)) {
      const minInterval = Math.ceil(1000 / throughput); // Minimum time to collect 1 tx
      if (collectInterval < minInterval) {
        fixes.TX_METRICS_COLLECT_INTERVAL = minInterval;
      }
    }

    return fixes;
  },
};

const METRICS_FIXES = {
  calculateBlockTime: (value, envName) => {
    const limits = METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minBlockTime;
    return Math.max(limits.minBlockTime, Math.min(limits.maxBlockTime, num));
  },

  calculateTxPerBlock: (value, envName) => {
    const limits = METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minTxPerBlock;
    return Math.max(limits.minTxPerBlock, Math.min(limits.maxTxPerBlock, num));
  },

  calculateHashPower: (value, envName) => {
    const limits = METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minHashPower;
    return Math.max(limits.minHashPower, Math.min(limits.maxHashPower, num));
  },

  calculateSyncDelay: (value, envName) => {
    const limits = METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minSyncDelay;
    return Math.max(limits.minSyncDelay, Math.min(limits.maxSyncDelay, num));
  },

  calculatePeerCount: (value, envName) => {
    const limits = METRICS_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minPeerCount;
    return Math.max(limits.minPeerCount, Math.min(limits.maxPeerCount, num));
  },

  validateMetricsConfig: (envVars, envName) => {
    const fixes = {};
    const limits = METRICS_LIMITS[envName];

    // Skip validation if metrics are disabled
    if (envVars.METRICS_PROMETHEUS_ENABLED === 'false' && 
        envVars.METRICS_GRAFANA_ENABLED === 'false') return fixes;

    // Ensure collection interval is compatible with block time
    const blockTime = parseInt(envVars.METRICS_BLOCK_TIME);
    const collectInterval = parseInt(envVars.METRICS_COLLECT_INTERVAL);
    if (!isNaN(blockTime) && !isNaN(collectInterval)) {
      if (collectInterval < blockTime) {
        fixes.METRICS_COLLECT_INTERVAL = blockTime * 2;
      }
    }

    // Ensure aggregate interval is compatible with collection interval
    const aggregateInterval = parseInt(envVars.METRICS_AGGREGATE_INTERVAL);
    if (!isNaN(collectInterval) && !isNaN(aggregateInterval)) {
      if (aggregateInterval < collectInterval * 5) {
        fixes.METRICS_AGGREGATE_INTERVAL = collectInterval * 5;
      }
    }

    // Ensure hash power is compatible with tx per block
    const hashPower = parseInt(envVars.METRICS_HASH_POWER);
    const txPerBlock = parseInt(envVars.METRICS_TX_PER_BLOCK);
    if (!isNaN(hashPower) && !isNaN(txPerBlock)) {
      const minHashPowerNeeded = txPerBlock * 10; // Rough estimate
      if (hashPower < minHashPowerNeeded) {
        fixes.METRICS_HASH_POWER = minHashPowerNeeded;
      }
    }

    // Ensure peer count is sufficient for sync delay
    const peerCount = parseInt(envVars.METRICS_PEER_COUNT);
    const syncDelay = parseInt(envVars.METRICS_SYNC_DELAY);
    if (!isNaN(peerCount) && !isNaN(syncDelay)) {
      if (syncDelay < 500 && peerCount < 3) {
        fixes.METRICS_PEER_COUNT = 3; // Minimum peers for fast sync
      }
    }

    return fixes;
  },
};

const MONITORING_FIXES = {
  calculateMetricsInterval: (value, envName) => {
    const limits = MONITORING_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minMetricsInterval;
    return Math.max(limits.minMetricsInterval, Math.min(limits.maxMetricsInterval, num));
  },

  calculateAlertThreshold: (value, type, envName) => {
    const limits = MONITORING_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) {
      switch(type) {
        case 'cpu': return envName === 'production' ? 85 : 70;
        case 'memory': return envName === 'production' ? 90 : 80;
        case 'disk': return envName === 'production' ? 90 : 85;
        default: return limits.minAlertThreshold;
      }
    }
    return Math.max(limits.minAlertThreshold, Math.min(limits.maxAlertThreshold, num));
  },

  calculateRetentionDays: (value, envName) => {
    const limits = MONITORING_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minRetentionDays;
    return Math.max(limits.minRetentionDays, Math.min(limits.maxRetentionDays, num));
  },

  formatLogRotateSize: (value, envName) => {
    const limits = MONITORING_LIMITS[envName];
    const match = value.match(/^(\d+)([MG])$/);
    if (!match) return limits.minLogRotateSize;

    const size = parseInt(match[1]);
    const unit = match[2];

    if (unit === 'G') {
      return '1G'; // Cap at 1G
    }

    const minSize = parseInt(limits.minLogRotateSize);
    const maxSize = parseInt(limits.maxLogRotateSize);
    return `${Math.max(minSize, Math.min(maxSize, size))}M`;
  },

  validateMonitoringConfig: (envVars, envName) => {
    const fixes = {};
    const limits = MONITORING_LIMITS[envName];

    // Don't validate if metrics are disabled
    if (envVars.POOL_METRICS_ENABLED === 'false') return fixes;

    // Ensure healthcheck interval is compatible with metrics interval
    const metricsInterval = parseInt(envVars.POOL_METRICS_INTERVAL);
    const healthcheckInterval = parseInt(envVars.POOL_HEALTHCHECK_INTERVAL);
    if (!isNaN(metricsInterval) && !isNaN(healthcheckInterval)) {
      if (healthcheckInterval < metricsInterval) {
        fixes.POOL_HEALTHCHECK_INTERVAL = metricsInterval * 2;
      }
    }

    // Ensure alert thresholds are properly ordered
    const cpuThreshold = parseInt(envVars.POOL_ALERT_CPU_THRESHOLD);
    const memoryThreshold = parseInt(envVars.POOL_ALERT_MEMORY_THRESHOLD);
    const diskThreshold = parseInt(envVars.POOL_ALERT_DISK_THRESHOLD);

    if (!isNaN(cpuThreshold) && !isNaN(memoryThreshold) && !isNaN(diskThreshold)) {
      // Memory threshold should be higher than CPU
      if (memoryThreshold <= cpuThreshold) {
        fixes.POOL_ALERT_MEMORY_THRESHOLD = Math.min(cpuThreshold + 5, limits.maxAlertThreshold);
      }
      // Disk threshold should be highest
      if (diskThreshold <= memoryThreshold) {
        fixes.POOL_ALERT_DISK_THRESHOLD = Math.min(memoryThreshold + 5, limits.maxAlertThreshold);
      }
    }

    return fixes;
  },
};

const POOL_FIXES = {
  calculateWorkers: (value, envName) => {
    const limits = POOL_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minWorkers;
    return Math.max(limits.minWorkers, Math.min(limits.maxWorkers, num));
  },

  calculateHashRate: (value, envName) => {
    const limits = POOL_LIMITS[envName];
    const num = parseInt(value);
    if (isNaN(num)) return limits.minHashRate;
    return Math.max(limits.minHashRate, Math.min(limits.maxHashRate, num));
  },

  calculatePayout: (value, envName) => {
    const limits = POOL_LIMITS[envName];
    const num = parseFloat(value);
    if (isNaN(num)) return limits.minPayout;
    return Math.max(limits.minPayout, Math.min(limits.maxPayout, num));
  },

  calculateFeeRate: (value, envName) => {
    const limits = POOL_LIMITS[envName];
    const num = parseFloat(value);
    if (isNaN(num)) return limits.minFeeRate;
    return Math.max(limits.minFeeRate, Math.min(limits.maxFeeRate, num));
  },

  validatePoolConfig: (envVars, envName) => {
    const fixes = {};
    const limits = POOL_LIMITS[envName];

    // Don't validate if pool is disabled
    if (envVars.POOL_ENABLED === 'false') return fixes;

    // Ensure hash rate is compatible with workers
    const workers = parseInt(envVars.POOL_MAX_WORKERS);
    const hashRate = parseInt(envVars.POOL_TARGET_HASH_RATE);
    if (!isNaN(workers) && !isNaN(hashRate)) {
      const avgHashPerWorker = hashRate / workers;
      if (avgHashPerWorker < limits.minHashRate) {
        fixes.POOL_TARGET_HASH_RATE = workers * limits.minHashRate;
      } else if (avgHashPerWorker > limits.maxHashRate) {
        fixes.POOL_TARGET_HASH_RATE = workers * limits.maxHashRate;
      }
    }

    // Ensure payout and fee rate are compatible
    const payout = parseFloat(envVars.POOL_MIN_PAYOUT);
    const feeRate = parseFloat(envVars.POOL_FEE_RATE);
    if (!isNaN(payout) && !isNaN(feeRate)) {
      // Adjust minimum payout based on fee rate
      const minViablePayout = (feeRate / 100) * limits.maxPayout;
      if (payout < minViablePayout) {
        fixes.POOL_MIN_PAYOUT = Math.ceil(minViablePayout * 10) / 10;
      }
    }

    // Ensure update intervals are reasonable
    const updateInterval = parseInt(envVars.POOL_UPDATE_INTERVAL);
    const statsInterval = parseInt(envVars.POOL_STATS_INTERVAL);
    if (!isNaN(updateInterval) && !isNaN(statsInterval)) {
      if (statsInterval <= updateInterval) {
        fixes.POOL_STATS_INTERVAL = updateInterval * 2;
      }
    }

    return fixes;
  },
};

const BLOCKCHAIN_FIXES = {
  calculateDifficulty: (value, envName) => {
    // Convert to number and validate
    const num = parseInt(value);
    if (isNaN(num)) {
      return envName === 'production' ? 4 : envName === 'test' ? 1 : 2;
    }

    // Adjust based on environment
    switch (envName) {
      case 'production':
        // Production: 4-8 for security
        return Math.max(4, Math.min(8, num));
      case 'test':
        // Test: 1-2 for speed
        return Math.max(1, Math.min(2, num));
      default:
        // Development: 2-4 for balance
        return Math.max(2, Math.min(4, num));
    }
  },

  calculateMiningReward: (value, envName) => {
    const num = parseInt(value);
    if (isNaN(num)) return 50; // Default reward

    // Adjust based on environment
    switch (envName) {
      case 'production':
        // Production: 25-100 range
        return Math.max(25, Math.min(100, num));
      case 'test':
        // Test: Allow any positive value
        return Math.max(1, num);
      default:
        // Development: 10-200 range
        return Math.max(10, Math.min(200, num));
    }
  },

  validateBlockchainConfig: (envVars, envName) => {
    const fixes = {};

    // Ensure difficulty and reward are compatible
    const difficulty = parseInt(envVars.BLOCKCHAIN_DIFFICULTY);
    const reward = parseInt(envVars.MINING_REWARD);

    if (!isNaN(difficulty) && !isNaN(reward)) {
      // Adjust reward based on difficulty
      if (difficulty >= 6 && reward < 50) {
        fixes.MINING_REWARD = 50; // Higher reward for higher difficulty
      } else if (difficulty <= 2 && reward > 100) {
        fixes.MINING_REWARD = 100; // Cap reward for low difficulty
      }
    }

    return fixes;
  },

  generateTestWalletSeed: () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `test_${timestamp}_${random}`;
  }
};

// Common fixes for environment variables
const COMMON_FIXES = {
  formatMemory: (value) => {
    if (typeof value === 'number') return `${value}M`;
    const num = parseInt(value);
    if (!isNaN(num)) {
      if (num >= 1024) return `${Math.floor(num/1024)}G`;
      return `${num}M`;
    }
    return value;
  },
  formatBoolean: (value) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  },
  formatNumber: (value, min, max) => {
    const num = Number(value);
    if (isNaN(num)) return min || 1;
    if (min !== undefined && num < min) return min;
    if (max !== undefined && num > max) return max;
    return num;
  },
  formatUrl: (value) => {
    if (!value.startsWith('http')) {
      return `http://${value}`;
    }
    return value;
  },
};

// Validation rules for environment variables
const ENV_RULES = {
  // Heap Allocation Tracking Configuration
  HEAP_INITIAL_SIZE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  HEAP_GROWTH_SIZE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  HEAP_ALLOC_RATE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  HEAP_OBJECT_COUNT: {
    type: 'number',
    required: true,
    min: 1,
    max: 10000000,
  },
  HEAP_OBJECT_SIZE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  HEAP_GC_TRIGGER: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  HEAP_USAGE_RATIO: {
    type: 'number',
    required: true,
    min: 0,
    max: 1,
  },
  HEAP_TRACKING_ENABLED: {
    type: 'boolean',
    required: true,
  },
  HEAP_COLLECT_INTERVAL: {
    type: 'number',
    required: true,
    min: 100,
    max: 30000,
  },
  HEAP_AGGREGATE_INTERVAL: {
    type: 'number',
    required: true,
    min: 1000,
    max: 300000,
  },
  HEAP_RETENTION_DAYS: {
    type: 'number',
    required: true,
    min: 1,
    max: 90,
  },
  // Memory Fragmentation Metrics Configuration
  MEMORY_FRAG_RATIO: {
    type: 'number',
    required: true,
    min: 0,
    max: 1,
  },
  MEMORY_FRAG_SIZE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  MEMORY_FRAG_COUNT: {
    type: 'number',
    required: true,
    min: 1,
    max: 100000,
  },
  MEMORY_DEFRAG_INTERVAL: {
    type: 'number',
    required: true,
    min: 1000,
    max: 86400000,
  },
  MEMORY_COMPACT_THRESHOLD: {
    type: 'number',
    required: true,
    min: 0,
    max: 1,
  },
  MEMORY_FREE_BLOCK_RATIO: {
    type: 'number',
    required: true,
    min: 0,
    max: 1,
  },
  MEMORY_BLOCK_SIZE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  MEMORY_FRAG_ENABLED: {
    type: 'boolean',
    required: true,
  },
  MEMORY_FRAG_COLLECT_INTERVAL: {
    type: 'number',
    required: true,
    min: 100,
    max: 60000,
  },
  MEMORY_FRAG_AGGREGATE_INTERVAL: {
    type: 'number',
    required: true,
    min: 1000,
    max: 3600000,
  },
  MEMORY_FRAG_RETENTION_DAYS: {
    type: 'number',
    required: true,
    min: 1,
    max: 90,
  },
  // Memory Leak Detection Metrics Configuration
  MEMORY_LEAK_DETECTION_INTERVAL: {
    type: 'number',
    required: true,
    min: 1000,
    max: 86400000,
  },
  MEMORY_LEAK_GROWTH_RATE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  MEMORY_LEAK_SUSPECT_OBJECTS: {
    type: 'number',
    required: true,
    min: 1,
    max: 10000,
  },
  MEMORY_LEAK_SIZE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  MEMORY_LEAK_RETENTION_TIME: {
    type: 'number',
    required: true,
    min: 1000,
    max: 86400000,
  },
  MEMORY_LEAK_STACK_TRACE_DEPTH: {
    type: 'number',
    required: true,
    min: 1,
    max: 200,
  },
  MEMORY_LEAK_HISTORY_SIZE: {
    type: 'number',
    required: true,
    min: 1,
    max: 1000,
  },
  MEMORY_LEAK_ENABLED: {
    type: 'boolean',
    required: true,
  },
  MEMORY_LEAK_COLLECT_INTERVAL: {
    type: 'number',
    required: true,
    min: 100,
    max: 30000,
  },
  MEMORY_LEAK_AGGREGATE_INTERVAL: {
    type: 'number',
    required: true,
    min: 1000,
    max: 300000,
  },
  MEMORY_LEAK_RETENTION_DAYS: {
    type: 'number',
    required: true,
    min: 1,
    max: 90,
  },
  // Memory Profiling Metrics Configuration
  MEMORY_PROF_SAMPLING_RATE: {
    type: 'number',
    required: true,
    min: 1,
    max: 10000,
  },
  MEMORY_PROF_STACK_DEPTH: {
    type: 'number',
    required: true,
    min: 1,
    max: 200,
  },
  MEMORY_PROF_HEAP_SNAPSHOT_INTERVAL: {
    type: 'number',
    required: true,
    min: 1000,
    max: 86400000,
  },
  MEMORY_PROF_RETAINED_SIZE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  MEMORY_PROF_LEAK_THRESHOLD: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  MEMORY_PROF_BUFFER_SIZE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  MEMORY_PROF_CALL_GRAPH_DEPTH: {
    type: 'number',
    required: true,
    min: 1,
    max: 50,
  },
  MEMORY_PROF_ENABLED: {
    type: 'boolean',
    required: true,
  },
  MEMORY_PROF_COLLECT_INTERVAL: {
    type: 'number',
    required: true,
    min: 100,
    max: 30000,
  },
  MEMORY_PROF_AGGREGATE_INTERVAL: {
    type: 'number',
    required: true,
    min: 1000,
    max: 300000,
  },
  MEMORY_PROF_RETENTION_DAYS: {
    type: 'number',
    required: true,
    min: 1,
    max: 90,
  },
  // Memory Allocation Metrics Configuration
  MEMORY_ALLOC_HEAP: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  MEMORY_ALLOC_STACK: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  MEMORY_ALLOC_PAGE_SIZE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  MEMORY_ALLOC_FRAGMENTATION: {
    type: 'number',
    required: true,
    min: 0,
    max: 100,
  },
  MEMORY_ALLOC_RATE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  MEMORY_DEALLOC_RATE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  MEMORY_ALLOC_POOL_SIZE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  MEMORY_ALLOC_GC_PAUSE: {
    type: 'number',
    required: true,
    min: 1,
    max: 1000,
  },
  MEMORY_ALLOC_ENABLED: {
    type: 'boolean',
    required: true,
  },
  MEMORY_ALLOC_COLLECT_INTERVAL: {
    type: 'number',
    required: true,
    min: 100,
    max: 30000,
  },
  MEMORY_ALLOC_AGGREGATE_INTERVAL: {
    type: 'number',
    required: true,
    min: 1000,
    max: 300000,
  },
  MEMORY_ALLOC_RETENTION_DAYS: {
    type: 'number',
    required: true,
    min: 1,
    max: 90,
  },
  // CPU Metrics Configuration
  CPU_METRICS_USAGE: {
    type: 'number',
    required: true,
    min: 0,
    max: 100,
  },
  CPU_METRICS_LOAD_AVG_1: {
    type: 'number',
    required: true,
    min: 0,
    max: 10,
  },
  CPU_METRICS_LOAD_AVG_5: {
    type: 'number',
    required: true,
    min: 0,
    max: 8,
  },
  CPU_METRICS_LOAD_AVG_15: {
    type: 'number',
    required: true,
    min: 0,
    max: 6,
  },
  CPU_METRICS_THREADS: {
    type: 'number',
    required: true,
    min: 1,
    max: 1000,
  },
  CPU_METRICS_PROCESSES: {
    type: 'number',
    required: true,
    min: 1,
    max: 500,
  },
  CPU_METRICS_CONTEXT_SWITCHES: {
    type: 'number',
    required: true,
    min: 10,
    max: 100000,
  },
  CPU_METRICS_INTERRUPTS: {
    type: 'number',
    required: true,
    min: 10,
    max: 50000,
  },
  CPU_METRICS_ENABLED: {
    type: 'boolean',
    required: true,
  },
  CPU_METRICS_COLLECT_INTERVAL: {
    type: 'number',
    required: true,
    min: 100,
    max: 30000,
  },
  CPU_METRICS_AGGREGATE_INTERVAL: {
    type: 'number',
    required: true,
    min: 1000,
    max: 300000,
  },
  CPU_METRICS_RETENTION_DAYS: {
    type: 'number',
    required: true,
    min: 1,
    max: 90,
  },
  // Disk Metrics Configuration
  DISK_METRICS_SPACE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMGTkgt]B?$/,
  },
  DISK_METRICS_IOPS_READ: {
    type: 'number',
    required: true,
    min: 10,
    max: 10000,
  },
  DISK_METRICS_IOPS_WRITE: {
    type: 'number',
    required: true,
    min: 5,
    max: 5000,
  },
  DISK_METRICS_LATENCY_READ: {
    type: 'number',
    required: true,
    min: 0.1,
    max: 500,
  },
  DISK_METRICS_LATENCY_WRITE: {
    type: 'number',
    required: true,
    min: 1,
    max: 1000,
  },
  DISK_METRICS_THROUGHPUT_READ: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMG]B?$/,
  },
  DISK_METRICS_THROUGHPUT_WRITE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMG]B?$/,
  },
  DISK_METRICS_UTILIZATION: {
    type: 'number',
    required: true,
    min: 0,
    max: 95,
  },
  DISK_METRICS_ENABLED: {
    type: 'boolean',
    required: true,
  },
  DISK_METRICS_COLLECT_INTERVAL: {
    type: 'number',
    required: true,
    min: 1000,
    max: 60000,
  },
  DISK_METRICS_AGGREGATE_INTERVAL: {
    type: 'number',
    required: true,
    min: 10000,
    max: 600000,
  },
  DISK_METRICS_RETENTION_DAYS: {
    type: 'number',
    required: true,
    min: 1,
    max: 90,
  },
  // Network Metrics Configuration
  NETWORK_METRICS_BANDWIDTH: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMG]B?$/,
  },
  NETWORK_METRICS_LATENCY: {
    type: 'number',
    required: true,
    min: 1,
    max: 2000,
  },
  NETWORK_METRICS_PACKET_LOSS: {
    type: 'number',
    required: true,
    min: 0,
    max: 10,
  },
  NETWORK_METRICS_CONNECTIONS: {
    type: 'number',
    required: true,
    min: 1,
    max: 10000,
  },
  NETWORK_METRICS_REQUEST_TIMEOUT: {
    type: 'number',
    required: true,
    min: 500,
    max: 30000,
  },
  NETWORK_METRICS_RETRY_ATTEMPTS: {
    type: 'number',
    required: true,
    min: 1,
    max: 10,
  },
  NETWORK_METRICS_KEEP_ALIVE: {
    type: 'number',
    required: true,
    min: 5000,
    max: 600000,
  },
  NETWORK_METRICS_ENABLED: {
    type: 'boolean',
    required: true,
  },
  NETWORK_METRICS_COLLECT_INTERVAL: {
    type: 'number',
    required: true,
    min: 1000,
    max: 60000,
  },
  NETWORK_METRICS_AGGREGATE_INTERVAL: {
    type: 'number',
    required: true,
    min: 10000,
    max: 600000,
  },
  NETWORK_METRICS_RETENTION_DAYS: {
    type: 'number',
    required: true,
    min: 1,
    max: 90,
  },
  // Memory Metrics Configuration
  MEMORY_METRICS_HEAP_SIZE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMG]B?$/,
  },
  MEMORY_METRICS_STACK_SIZE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMG]B?$/,
  },
  MEMORY_METRICS_GC_INTERVAL: {
    type: 'number',
    required: true,
    min: 10000,
    max: 600000,
  },
  MEMORY_METRICS_MEMORY_LIMIT: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMG]B?$/,
  },
  MEMORY_METRICS_BUFFER_SIZE: {
    type: 'string',
    required: true,
    pattern: /^\d+[KMG]B?$/,
  },
  MEMORY_METRICS_GC_THRESHOLD: {
    type: 'number',
    required: true,
    min: 60,
    max: 95,
  },
  MEMORY_METRICS_ENABLED: {
    type: 'boolean',
    required: true,
  },
  MEMORY_METRICS_COLLECT_INTERVAL: {
    type: 'number',
    required: true,
    min: 1000,
    max: 60000,
  },
  MEMORY_METRICS_AGGREGATE_INTERVAL: {
    type: 'number',
    required: true,
    min: 10000,
    max: 600000,
  },
  MEMORY_METRICS_RETENTION_DAYS: {
    type: 'number',
    required: true,
    min: 1,
    max: 90,
  },
  // Transaction Metrics Configuration
  TX_METRICS_POOL_SIZE: {
    type: 'number',
    required: true,
    min: 10,
    max: 10000,
  },
  TX_METRICS_CONFIRM_TIME: {
    type: 'number',
    required: true,
    min: 100,
    max: 20000,
  },
  TX_METRICS_FEE_RATE: {
    type: 'number',
    required: true,
    min: 0.01,
    max: 10.0,
  },
  TX_METRICS_THROUGHPUT: {
    type: 'number',
    required: true,
    min: 1,
    max: 500,
  },
  TX_METRICS_PENDING_LIMIT: {
    type: 'number',
    required: true,
    min: 10,
    max: 2000,
  },
  TX_METRICS_RETRY_INTERVAL: {
    type: 'number',
    required: true,
    min: 500,
    max: 30000,
  },
  TX_METRICS_ENABLED: {
    type: 'boolean',
    required: true,
  },
  TX_METRICS_COLLECT_INTERVAL: {
    type: 'number',
    required: true,
    min: 500,
    max: 10000,
  },
  TX_METRICS_AGGREGATE_INTERVAL: {
    type: 'number',
    required: true,
    min: 5000,
    max: 300000,
  },
  TX_METRICS_RETENTION_DAYS: {
    type: 'number',
    required: true,
    min: 1,
    max: 90,
  },
  // Performance Metrics Configuration
  METRICS_BLOCK_TIME: {
    type: 'number',
    required: true,
    min: 100,
    max: 10000,
  },
  METRICS_TX_PER_BLOCK: {
    type: 'number',
    required: true,
    min: 1,
    max: 1000,
  },
  METRICS_HASH_POWER: {
    type: 'number',
    required: true,
    min: 10,
    max: 5000,
  },
  METRICS_SYNC_DELAY: {
    type: 'number',
    required: true,
    min: 50,
    max: 5000,
  },
  METRICS_PEER_COUNT: {
    type: 'number',
    required: true,
    min: 1,
    max: 50,
  },
  METRICS_PROMETHEUS_ENABLED: {
    type: 'boolean',
    required: true,
  },
  METRICS_GRAFANA_ENABLED: {
    type: 'boolean',
    required: true,
  },
  METRICS_DASHBOARD_PORT: {
    type: 'number',
    required: true,
    min: 3000,
    max: 3999,
  },
  METRICS_COLLECT_INTERVAL: {
    type: 'number',
    required: true,
    min: 1000,
    max: 60000,
  },
  METRICS_AGGREGATE_INTERVAL: {
    type: 'number',
    required: true,
    min: 5000,
    max: 300000,
  },
  // Pool Monitoring Configuration
  POOL_METRICS_ENABLED: {
    type: 'boolean',
    required: true,
  },
  POOL_METRICS_INTERVAL: {
    type: 'number',
    required: true,
    min: 1000,
    max: 60000,
  },
  POOL_METRICS_PORT: {
    type: 'number',
    required: true,
    min: 9090,
    max: 9099,
  },
  POOL_ALERT_CPU_THRESHOLD: {
    type: 'number',
    required: true,
    min: 30,
    max: 95,
  },
  POOL_ALERT_MEMORY_THRESHOLD: {
    type: 'number',
    required: true,
    min: 30,
    max: 95,
  },
  POOL_ALERT_DISK_THRESHOLD: {
    type: 'number',
    required: true,
    min: 30,
    max: 95,
  },
  POOL_METRICS_RETENTION_DAYS: {
    type: 'number',
    required: true,
    min: 1,
    max: 30,
  },
  POOL_LOG_ROTATE_SIZE: {
    type: 'string',
    required: true,
    pattern: '^\\d+[MG]$',
  },
  POOL_LOG_COMPRESS: {
    type: 'boolean',
    required: true,
  },
  POOL_HEALTHCHECK_ENABLED: {
    type: 'boolean',
    required: true,
  },
  POOL_HEALTHCHECK_INTERVAL: {
    type: 'number',
    required: true,
    min: 5000,
    max: 300000,
  },
  // Mining Pool Configuration
  POOL_ENABLED: {
    type: 'boolean',
    required: true,
  },
  POOL_MAX_WORKERS: {
    type: 'number',
    required: true,
    min: 1,
    max: 16,
  },
  POOL_TARGET_HASH_RATE: {
    type: 'number',
    required: true,
    min: 10,
    max: 5000,
  },
  POOL_MIN_PAYOUT: {
    type: 'number',
    required: true,
    min: 0.1,
  },
  POOL_FEE_RATE: {
    type: 'number',
    required: true,
    min: 0,
    max: 10,
  },
  POOL_SHARE_DIFFICULTY: {
    type: 'number',
    required: true,
    min: 1,
  },
  POOL_UPDATE_INTERVAL: {
    type: 'number',
    required: true,
    min: 1000,
    max: 60000,
  },
  POOL_STATS_INTERVAL: {
    type: 'number',
    required: true,
    min: 5000,
    max: 300000,
  },

  // Server Configuration
  PORT: {
    type: 'number',
    required: true,
    min: 1,
    max: 65535,
  },
  NODE_ENV: {
    type: 'string',
    required: true,
    enum: ['development', 'production', 'test'],
  },
  API_PREFIX: {
    type: 'string',
    required: true,
    pattern: /^\/[a-zA-Z0-9-_/]*$/,
  },

  // Security Configuration
  ALLOWED_ORIGINS: {
    type: 'array',
    required: true,
    itemPattern: /^https?:\/\/[a-zA-Z0-9-_.]+(?::\d+)?$/,
  },
  RATE_LIMIT_MAX: {
    type: 'number',
    required: true,
    min: 1,
  },

  // Blockchain Configuration
  BLOCKCHAIN_DIFFICULTY: {
    type: 'number',
    required: true,
    min: 1,
    max: 8,
  },
  MINING_REWARD: {
    type: 'number',
    required: true,
    min: 1,
  },

  // Logging Configuration
  LOG_LEVEL: {
    type: 'string',
    required: true,
    enum: ['error', 'warn', 'info', 'debug'],
  },
  LOG_DIR: {
    type: 'string',
    required: true,
  },

  // Docker Configuration
  DOCKER_NETWORK_NAME: {
    type: 'string',
    required: true,
    pattern: /^[a-zA-Z0-9][a-zA-Z0-9_.-]+$/,
  },
  DOCKER_CONTAINER_NAME: {
    type: 'string',
    required: true,
    pattern: /^[a-zA-Z0-9][a-zA-Z0-9_.-]+$/,
  },

  // Resource Limits
  MEMORY_LIMIT: {
    type: 'string',
    required: true,
    pattern: /^\d+[MGmg][Bb]?$/,
  },
  CPU_LIMIT: {
    type: 'number',
    required: true,
    min: 0.1,
  },
};

// Additional production-only rules
const PRODUCTION_RULES = {
  MEMORY_RESERVATION: {
    type: 'string',
    required: true,
    pattern: /^\d+[MGmg][Bb]?$/,
  },
  CPU_RESERVATION: {
    type: 'number',
    required: true,
    min: 0.1,
  },
  METRICS_PORT: {
    type: 'number',
    required: true,
    min: 1024,
    max: 65535,
  },
};

// Additional test-only rules
const TEST_RULES = {
  SKIP_BLOCKCHAIN_SYNC: {
    type: 'boolean',
    required: true,
  },
  ENABLE_MOCK_SERVICES: {
    type: 'boolean',
    required: true,
  },
  TEST_WALLET_SEED: {
    type: 'string',
    required: true,
  },
};

function applyHeapAllocationFixes(envVars, envName) {
  return HEAP_ALLOCATION_FIXES.validateHeapAllocationConfig(envVars, envName);
}

function applyMemoryFragmentationFixes(envVars, envName) {
  return MEMORY_FRAGMENTATION_FIXES.validateMemoryFragmentationConfig(envVars, envName);
}

function applyMemoryLeakFixes(envVars, envName) {
  return MEMORY_LEAK_FIXES.validateMemoryLeakConfig(envVars, envName);
}

function applyMemoryProfilingFixes(envVars, envName) {
  return MEMORY_PROFILING_FIXES.validateMemoryProfilingConfig(envVars, envName);
}

function applyMemoryAllocationFixes(envVars, envName) {
  return MEMORY_ALLOCATION_FIXES.validateMemoryAllocationConfig(envVars, envName);
}

function applyCpuMetricsFixes(envVars, envName) {
  return CPU_METRICS_FIXES.validateCpuMetricsConfig(envVars, envName);
}

function applyDiskMetricsFixes(envVars, envName) {
  return DISK_METRICS_FIXES.validateDiskMetricsConfig(envVars, envName);
}

function applyNetworkMetricsFixes(envVars, envName) {
  return NETWORK_METRICS_FIXES.validateNetworkMetricsConfig(envVars, envName);
}

function applyMemoryMetricsFixes(envVars, envName) {
  return MEMORY_METRICS_FIXES.validateMemoryMetricsConfig(envVars, envName);
}

function applyTxMetricsFixes(envVars, envName) {
  return TX_METRICS_FIXES.validateTxMetricsConfig(envVars, envName);
}

function applyMetricsFixes(envVars, envName) {
  return METRICS_FIXES.validateMetricsConfig(envVars, envName);
}

function applyMonitoringFixes(envVars, envName) {
  return MONITORING_FIXES.validateMonitoringConfig(envVars, envName);
}

function applyPoolFixes(envVars, envName) {
  return POOL_FIXES.validatePoolConfig(envVars, envName);
}

function applyBlockchainFixes(envVars, envName) {
  const fixes = BLOCKCHAIN_FIXES.validateBlockchainConfig(envVars, envName);
  return fixes;
}

function fixValue(value, rule, key, envName) {
  const defaults = DEFAULT_VALUES[envName] || {};
  const defaultValue = defaults[key];

  if (value === undefined || value === '') {
    return defaultValue;
  }

  try {
    // Special handling for heap allocation tracking metrics-specific variables
    switch (key) {
      case 'HEAP_INITIAL_SIZE':
        return HEAP_ALLOCATION_FIXES.calculateInitialHeap(value, envName);
      case 'HEAP_GROWTH_SIZE':
        return HEAP_ALLOCATION_FIXES.calculateHeapGrowth(value, envName);
      case 'HEAP_ALLOC_RATE':
        return HEAP_ALLOCATION_FIXES.calculateAllocationRate(value, envName);
      case 'HEAP_OBJECT_COUNT':
        return HEAP_ALLOCATION_FIXES.calculateObjectCount(value, envName);
      case 'HEAP_OBJECT_SIZE':
        return HEAP_ALLOCATION_FIXES.calculateObjectSize(value, envName);
      case 'HEAP_GC_TRIGGER':
        return HEAP_ALLOCATION_FIXES.calculateGcTrigger(value, envName);
      case 'HEAP_USAGE_RATIO':
        return HEAP_ALLOCATION_FIXES.calculateHeapUsage(value, envName);
    }

    // Special handling for memory fragmentation metrics-specific variables
    switch (key) {
      case 'MEMORY_FRAG_RATIO':
        return MEMORY_FRAGMENTATION_FIXES.calculateFragmentationRatio(value, envName);
      case 'MEMORY_FRAG_SIZE':
        return MEMORY_FRAGMENTATION_FIXES.calculateFragmentSize(value, envName);
      case 'MEMORY_FRAG_COUNT':
        return MEMORY_FRAGMENTATION_FIXES.calculateFragmentCount(value, envName);
      case 'MEMORY_DEFRAG_INTERVAL':
        return MEMORY_FRAGMENTATION_FIXES.calculateDefragInterval(value, envName);
      case 'MEMORY_COMPACT_THRESHOLD':
        return MEMORY_FRAGMENTATION_FIXES.calculateCompactionThreshold(value, envName);
      case 'MEMORY_FREE_BLOCK_RATIO':
        return MEMORY_FRAGMENTATION_FIXES.calculateFreeBlockRatio(value, envName);
      case 'MEMORY_BLOCK_SIZE':
        return MEMORY_FRAGMENTATION_FIXES.calculateBlockSize(value, envName);
    }

    // Special handling for memory leak detection metrics-specific variables
    switch (key) {
      case 'MEMORY_LEAK_DETECTION_INTERVAL':
        return MEMORY_LEAK_FIXES.calculateDetectionInterval(value, envName);
      case 'MEMORY_LEAK_GROWTH_RATE':
        return MEMORY_LEAK_FIXES.calculateGrowthRate(value, envName);
      case 'MEMORY_LEAK_SUSPECT_OBJECTS':
        return MEMORY_LEAK_FIXES.calculateSuspectObjects(value, envName);
      case 'MEMORY_LEAK_SIZE':
        return MEMORY_LEAK_FIXES.calculateLeakSize(value, envName);
      case 'MEMORY_LEAK_RETENTION_TIME':
        return MEMORY_LEAK_FIXES.calculateRetentionTime(value, envName);
      case 'MEMORY_LEAK_STACK_TRACE_DEPTH':
        return MEMORY_LEAK_FIXES.calculateStackTraceDepth(value, envName);
      case 'MEMORY_LEAK_HISTORY_SIZE':
        return MEMORY_LEAK_FIXES.calculateHistorySize(value, envName);
    }

    // Special handling for memory profiling metrics-specific variables
    switch (key) {
      case 'MEMORY_PROF_SAMPLING_RATE':
        return MEMORY_PROFILING_FIXES.calculateSamplingRate(value, envName);
      case 'MEMORY_PROF_STACK_DEPTH':
        return MEMORY_PROFILING_FIXES.calculateStackDepth(value, envName);
      case 'MEMORY_PROF_HEAP_SNAPSHOT_INTERVAL':
        return MEMORY_PROFILING_FIXES.calculateHeapSnapshotInterval(value, envName);
      case 'MEMORY_PROF_RETAINED_SIZE':
        return MEMORY_PROFILING_FIXES.calculateRetainedSize(value, envName);
      case 'MEMORY_PROF_LEAK_THRESHOLD':
        return MEMORY_PROFILING_FIXES.calculateLeakThreshold(value, envName);
      case 'MEMORY_PROF_BUFFER_SIZE':
        return MEMORY_PROFILING_FIXES.calculateProfileBufferSize(value, envName);
      case 'MEMORY_PROF_CALL_GRAPH_DEPTH':
        return MEMORY_PROFILING_FIXES.calculateCallGraphDepth(value, envName);
    }

    // Special handling for memory allocation metrics-specific variables
    switch (key) {
      case 'MEMORY_ALLOC_HEAP':
        return MEMORY_ALLOCATION_FIXES.calculateHeapAlloc(value, envName);
      case 'MEMORY_ALLOC_STACK':
        return MEMORY_ALLOCATION_FIXES.calculateStackAlloc(value, envName);
      case 'MEMORY_ALLOC_PAGE_SIZE':
        return MEMORY_ALLOCATION_FIXES.calculatePageSize(value, envName);
      case 'MEMORY_ALLOC_FRAGMENTATION':
        return MEMORY_ALLOCATION_FIXES.calculateFragmentation(value, envName);
      case 'MEMORY_ALLOC_RATE':
        return MEMORY_ALLOCATION_FIXES.calculateAllocationRate(value, envName);
      case 'MEMORY_DEALLOC_RATE':
        return MEMORY_ALLOCATION_FIXES.calculateDeallocationRate(value, envName);
      case 'MEMORY_ALLOC_POOL_SIZE':
        return MEMORY_ALLOCATION_FIXES.calculatePoolSize(value, envName);
      case 'MEMORY_ALLOC_GC_PAUSE':
        return MEMORY_ALLOCATION_FIXES.calculateGcPause(value, envName);
    }

    // Special handling for CPU metrics-specific variables
    switch (key) {
      case 'CPU_METRICS_USAGE':
        return CPU_METRICS_FIXES.calculateUsage(value, envName);
      case 'CPU_METRICS_LOAD_AVG_1':
        return CPU_METRICS_FIXES.calculateLoadAvg(value, 1, envName);
      case 'CPU_METRICS_LOAD_AVG_5':
        return CPU_METRICS_FIXES.calculateLoadAvg(value, 5, envName);
      case 'CPU_METRICS_LOAD_AVG_15':
        return CPU_METRICS_FIXES.calculateLoadAvg(value, 15, envName);
      case 'CPU_METRICS_THREADS':
        return CPU_METRICS_FIXES.calculateThreads(value, envName);
      case 'CPU_METRICS_PROCESSES':
        return CPU_METRICS_FIXES.calculateProcesses(value, envName);
      case 'CPU_METRICS_CONTEXT_SWITCHES':
        return CPU_METRICS_FIXES.calculateContextSwitches(value, envName);
      case 'CPU_METRICS_INTERRUPTS':
        return CPU_METRICS_FIXES.calculateInterrupts(value, envName);
    }

    // Special handling for disk metrics-specific variables
    switch (key) {
      case 'DISK_METRICS_SPACE':
        return DISK_METRICS_FIXES.calculateDiskSpace(value, envName);
      case 'DISK_METRICS_IOPS_READ':
        return DISK_METRICS_FIXES.calculateIopsRead(value, envName);
      case 'DISK_METRICS_IOPS_WRITE':
        return DISK_METRICS_FIXES.calculateIopsWrite(value, envName);
      case 'DISK_METRICS_LATENCY_READ':
        return DISK_METRICS_FIXES.calculateLatencyRead(value, envName);
      case 'DISK_METRICS_LATENCY_WRITE':
        return DISK_METRICS_FIXES.calculateLatencyWrite(value, envName);
      case 'DISK_METRICS_THROUGHPUT_READ':
        return DISK_METRICS_FIXES.calculateThroughputRead(value, envName);
      case 'DISK_METRICS_THROUGHPUT_WRITE':
        return DISK_METRICS_FIXES.calculateThroughputWrite(value, envName);
      case 'DISK_METRICS_UTILIZATION':
        return DISK_METRICS_FIXES.calculateUtilization(value, envName);
    }

    // Special handling for network metrics-specific variables
    switch (key) {
      case 'NETWORK_METRICS_BANDWIDTH':
        return NETWORK_METRICS_FIXES.calculateBandwidth(value, envName);
      case 'NETWORK_METRICS_LATENCY':
        return NETWORK_METRICS_FIXES.calculateLatency(value, envName);
      case 'NETWORK_METRICS_PACKET_LOSS':
        return NETWORK_METRICS_FIXES.calculatePacketLoss(value, envName);
      case 'NETWORK_METRICS_CONNECTIONS':
        return NETWORK_METRICS_FIXES.calculateConnections(value, envName);
      case 'NETWORK_METRICS_REQUEST_TIMEOUT':
        return NETWORK_METRICS_FIXES.calculateRequestTimeout(value, envName);
      case 'NETWORK_METRICS_RETRY_ATTEMPTS':
        return NETWORK_METRICS_FIXES.calculateRetryAttempts(value, envName);
      case 'NETWORK_METRICS_KEEP_ALIVE':
        return NETWORK_METRICS_FIXES.calculateKeepAlive(value, envName);
    }

    // Special handling for memory metrics-specific variables
    switch (key) {
      case 'MEMORY_METRICS_HEAP_SIZE':
        return MEMORY_METRICS_FIXES.calculateHeapSize(value, envName);
      case 'MEMORY_METRICS_STACK_SIZE':
        return MEMORY_METRICS_FIXES.calculateStackSize(value, envName);
      case 'MEMORY_METRICS_GC_INTERVAL':
        return MEMORY_METRICS_FIXES.calculateGcInterval(value, envName);
      case 'MEMORY_METRICS_MEMORY_LIMIT':
        return MEMORY_METRICS_FIXES.calculateMemoryLimit(value, envName);
      case 'MEMORY_METRICS_BUFFER_SIZE':
        return MEMORY_METRICS_FIXES.calculateBufferSize(value, envName);
      case 'MEMORY_METRICS_GC_THRESHOLD':
        return MEMORY_METRICS_FIXES.calculateGcThreshold(value, envName);
    }

    // Special handling for tx metrics-specific variables
    switch (key) {
      case 'TX_METRICS_POOL_SIZE':
        return TX_METRICS_FIXES.calculatePoolSize(value, envName);
      case 'TX_METRICS_CONFIRM_TIME':
        return TX_METRICS_FIXES.calculateConfirmTime(value, envName);
      case 'TX_METRICS_FEE_RATE':
        return TX_METRICS_FIXES.calculateFeeRate(value, envName);
      case 'TX_METRICS_THROUGHPUT':
        return TX_METRICS_FIXES.calculateThroughput(value, envName);
      case 'TX_METRICS_PENDING_LIMIT':
        return TX_METRICS_FIXES.calculatePendingLimit(value, envName);
      case 'TX_METRICS_RETRY_INTERVAL':
        return TX_METRICS_FIXES.calculateRetryInterval(value, envName);
    }

    // Special handling for metrics-specific variables
    switch (key) {
      case 'METRICS_BLOCK_TIME':
        return METRICS_FIXES.calculateBlockTime(value, envName);
      case 'METRICS_TX_PER_BLOCK':
        return METRICS_FIXES.calculateTxPerBlock(value, envName);
      case 'METRICS_HASH_POWER':
        return METRICS_FIXES.calculateHashPower(value, envName);
      case 'METRICS_SYNC_DELAY':
        return METRICS_FIXES.calculateSyncDelay(value, envName);
      case 'METRICS_PEER_COUNT':
        return METRICS_FIXES.calculatePeerCount(value, envName);
    }

    // Special handling for monitoring-specific variables
    switch (key) {
      case 'POOL_METRICS_INTERVAL':
        return MONITORING_FIXES.calculateMetricsInterval(value, envName);
      case 'POOL_ALERT_CPU_THRESHOLD':
        return MONITORING_FIXES.calculateAlertThreshold(value, 'cpu', envName);
      case 'POOL_ALERT_MEMORY_THRESHOLD':
        return MONITORING_FIXES.calculateAlertThreshold(value, 'memory', envName);
      case 'POOL_ALERT_DISK_THRESHOLD':
        return MONITORING_FIXES.calculateAlertThreshold(value, 'disk', envName);
      case 'POOL_METRICS_RETENTION_DAYS':
        return MONITORING_FIXES.calculateRetentionDays(value, envName);
      case 'POOL_LOG_ROTATE_SIZE':
        return MONITORING_FIXES.formatLogRotateSize(value, envName);
    }

    // Special handling for pool-specific variables
    switch (key) {
      case 'POOL_MAX_WORKERS':
        return POOL_FIXES.calculateWorkers(value, envName);
      case 'POOL_TARGET_HASH_RATE':
        return POOL_FIXES.calculateHashRate(value, envName);
      case 'POOL_MIN_PAYOUT':
        return POOL_FIXES.calculatePayout(value, envName);
      case 'POOL_FEE_RATE':
        return POOL_FIXES.calculateFeeRate(value, envName);
    }

    // Special handling for blockchain-specific variables
    switch (key) {
      case 'BLOCKCHAIN_DIFFICULTY':
        return BLOCKCHAIN_FIXES.calculateDifficulty(value, envName);
      case 'MINING_REWARD':
        return BLOCKCHAIN_FIXES.calculateMiningReward(value, envName);
      case 'TEST_WALLET_SEED':
        return value || BLOCKCHAIN_FIXES.generateTestWalletSeed();
    }

    switch (rule.type) {
      case 'number':
        return COMMON_FIXES.formatNumber(value, rule.min, rule.max);
      
      case 'string':
        if (rule.enum && !rule.enum.includes(value)) {
          return defaultValue || rule.enum[0];
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          return defaultValue;
        }
        return value;
      
      case 'boolean':
        return COMMON_FIXES.formatBoolean(value);
      
      case 'array':
        const items = value.split(',').map(item => item.trim());
        if (rule.itemPattern) {
          const validItems = items
            .map(item => rule.itemPattern.test(item) ? item : COMMON_FIXES.formatUrl(item))
            .filter(item => rule.itemPattern.test(item));
          return validItems.length ? validItems.join(',') : defaultValue;
        }
        return value;
    }
  } catch (error) {
    return defaultValue;
  }

  return value;
}

function validateValue(value, rule) {
  if (rule.required && (value === undefined || value === '')) {
    throw new Error('Required value is missing');
  }

  if (value === undefined || value === '') {
    return true;
  }

  switch (rule.type) {
    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error('Value must be a number');
      }
      if (rule.min !== undefined && num < rule.min) {
        throw new Error(`Value must be >= ${rule.min}`);
      }
      if (rule.max !== undefined && num > rule.max) {
        throw new Error(`Value must be <= ${rule.max}`);
      }
      break;

    case 'string':
      if (rule.enum && !rule.enum.includes(value)) {
        throw new Error(`Value must be one of: ${rule.enum.join(', ')}`);
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        throw new Error('Value does not match required pattern');
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean' && !['true', 'false'].includes(value.toLowerCase())) {
        throw new Error('Value must be a boolean');
      }
      break;

    case 'array':
      const items = value.split(',').map(item => item.trim());
      if (rule.itemPattern) {
        const invalidItems = items.filter(item => !rule.itemPattern.test(item));
        if (invalidItems.length > 0) {
          throw new Error(`Invalid items: ${invalidItems.join(', ')}`);
        }
      }
      break;
  }

  return true;
}

function validateEnvFile(filePath, envName, fix = false) {
  console.log(`\nValidating ${envName} environment file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Environment file not found: ${filePath}`);
    return false;
  }

  const envContent = fs.readFileSync(filePath, 'utf8');
  const envVars = {};

  // Parse environment file and preserve comments
  const lines = envContent.split('\n');
  const envLines = {};
  let currentComment = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('#')) {
      currentComment.push(line);
    } else if (trimmedLine) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        const trimmedKey = key.trim();
        envVars[trimmedKey] = value.replace(/["']/g, '');
        envLines[trimmedKey] = {
          index,
          line,
          comments: [...currentComment],
        };
        currentComment = [];
      }
    } else {
      currentComment.push(line);
    }
  });

  let isValid = true;
  let fixed = false;
  const rules = { ...ENV_RULES };
  const fixedEnvVars = { ...envVars };

  // Add environment-specific rules
  if (envName === 'production') {
    Object.assign(rules, PRODUCTION_RULES);
  } else if (envName === 'test') {
    Object.assign(rules, TEST_RULES);
  }

  // Validate each rule
  Object.entries(rules).forEach(([key, rule]) => {
    try {
      validateValue(envVars[key], rule);
      console.log(`✅ ${key}: Valid`);
    } catch (error) {
      console.error(`❌ ${key}: ${error.message}`);
      isValid = false;

      if (fix) {
        const fixedValue = fixValue(envVars[key], rule, key, envName);
        if (fixedValue !== undefined) {
          fixedEnvVars[key] = fixedValue;
          fixed = true;
          console.log(`🔧 ${key}: Fixed to '${fixedValue}'`);
        }
      }
    }
  });

  // Check for unknown variables
  const unknownVars = Object.keys(envVars).filter(key => !rules[key]);
  if (unknownVars.length > 0) {
    console.warn('\n⚠️  Unknown variables found:', unknownVars.join(', '));
  }

  // Apply heap allocation tracking metrics-specific fixes
  if (fix) {
    const heapAllocFixes = applyHeapAllocationFixes(fixedEnvVars, envName);
    if (Object.keys(heapAllocFixes).length > 0) {
      Object.entries(heapAllocFixes).forEach(([key, value]) => {
        fixedEnvVars[key] = value;
        fixed = true;
        console.log(`🔧 ${key}: Fixed to '${value}' (heap allocation optimization)`);
      });
    }
  }

  // Apply memory fragmentation metrics-specific fixes
  if (fix) {
    const memoryFragFixes = applyMemoryFragmentationFixes(fixedEnvVars, envName);
    if (Object.keys(memoryFragFixes).length > 0) {
      Object.entries(memoryFragFixes).forEach(([key, value]) => {
        fixedEnvVars[key] = value;
        fixed = true;
        console.log(`🔧 ${key}: Fixed to '${value}' (memory fragmentation optimization)`);
      });
    }
  }

  // Apply memory leak detection metrics-specific fixes
  if (fix) {
    const memoryLeakFixes = applyMemoryLeakFixes(fixedEnvVars, envName);
    if (Object.keys(memoryLeakFixes).length > 0) {
      Object.entries(memoryLeakFixes).forEach(([key, value]) => {
        fixedEnvVars[key] = value;
        fixed = true;
        console.log(`🔧 ${key}: Fixed to '${value}' (memory leak detection optimization)`);
      });
    }
  }

  // Apply memory profiling metrics-specific fixes
  if (fix) {
    const memoryProfilingFixes = applyMemoryProfilingFixes(fixedEnvVars, envName);
    if (Object.keys(memoryProfilingFixes).length > 0) {
      Object.entries(memoryProfilingFixes).forEach(([key, value]) => {
        fixedEnvVars[key] = value;
        fixed = true;
        console.log(`🔧 ${key}: Fixed to '${value}' (memory profiling optimization)`);
      });
    }
  }

  // Apply memory allocation metrics-specific fixes
  if (fix) {
    const memoryAllocationFixes = applyMemoryAllocationFixes(fixedEnvVars, envName);
    if (Object.keys(memoryAllocationFixes).length > 0) {
      Object.entries(memoryAllocationFixes).forEach(([key, value]) => {
        fixedEnvVars[key] = value;
        fixed = true;
        console.log(`🔧 ${key}: Fixed to '${value}' (memory allocation optimization)`);
      });
    }
  }

  // Apply CPU metrics-specific fixes
  if (fix) {
    const cpuMetricsFixes = applyCpuMetricsFixes(fixedEnvVars, envName);
    if (Object.keys(cpuMetricsFixes).length > 0) {
      Object.entries(cpuMetricsFixes).forEach(([key, value]) => {
        fixedEnvVars[key] = value;
        fixed = true;
        console.log(`🔧 ${key}: Fixed to '${value}' (CPU metrics optimization)`);
      });
    }
  }

  // Apply disk metrics-specific fixes
  if (fix) {
    const diskMetricsFixes = applyDiskMetricsFixes(fixedEnvVars, envName);
    if (Object.keys(diskMetricsFixes).length > 0) {
      Object.entries(diskMetricsFixes).forEach(([key, value]) => {
        fixedEnvVars[key] = value;
        fixed = true;
        console.log(`🔧 ${key}: Fixed to '${value}' (disk metrics optimization)`);
      });
    }
  }

  // Apply network metrics-specific fixes
  if (fix) {
    const networkMetricsFixes = applyNetworkMetricsFixes(fixedEnvVars, envName);
    if (Object.keys(networkMetricsFixes).length > 0) {
      Object.entries(networkMetricsFixes).forEach(([key, value]) => {
        fixedEnvVars[key] = value;
        fixed = true;
        console.log(`🔧 ${key}: Fixed to '${value}' (network metrics optimization)`);
      });
    }
  }

  // Apply memory metrics-specific fixes
  if (fix) {
    const memoryMetricsFixes = applyMemoryMetricsFixes(fixedEnvVars, envName);
    if (Object.keys(memoryMetricsFixes).length > 0) {
      Object.entries(memoryMetricsFixes).forEach(([key, value]) => {
        fixedEnvVars[key] = value;
        fixed = true;
        console.log(`🔧 ${key}: Fixed to '${value}' (memory metrics optimization)`);
      });
    }
  }

  // Apply tx metrics-specific fixes
  if (fix) {
    const txMetricsFixes = applyTxMetricsFixes(fixedEnvVars, envName);
    if (Object.keys(txMetricsFixes).length > 0) {
      Object.entries(txMetricsFixes).forEach(([key, value]) => {
        fixedEnvVars[key] = value;
        fixed = true;
        console.log(`🔧 ${key}: Fixed to '${value}' (tx metrics optimization)`);
      });
    }
  }

  // Apply metrics-specific fixes
  if (fix) {
    const metricsFixes = applyMetricsFixes(fixedEnvVars, envName);
    if (Object.keys(metricsFixes).length > 0) {
      Object.entries(metricsFixes).forEach(([key, value]) => {
        fixedEnvVars[key] = value;
        fixed = true;
        console.log(`🔧 ${key}: Fixed to '${value}' (metrics optimization)`);
      });
    }
  }

  // Apply monitoring-specific fixes
  if (fix) {
    const monitoringFixes = applyMonitoringFixes(fixedEnvVars, envName);
    if (Object.keys(monitoringFixes).length > 0) {
      Object.entries(monitoringFixes).forEach(([key, value]) => {
        fixedEnvVars[key] = value;
        fixed = true;
        console.log(`🔧 ${key}: Fixed to '${value}' (monitoring optimization)`);
      });
    }
  }

  // Apply pool-specific fixes
  if (fix) {
    const poolFixes = applyPoolFixes(fixedEnvVars, envName);
    if (Object.keys(poolFixes).length > 0) {
      Object.entries(poolFixes).forEach(([key, value]) => {
        fixedEnvVars[key] = value;
        fixed = true;
        console.log(`🔧 ${key}: Fixed to '${value}' (pool optimization)`);
      });
    }
  }

  // Apply blockchain-specific fixes
  if (fix) {
    const blockchainFixes = applyBlockchainFixes(fixedEnvVars, envName);
    if (Object.keys(blockchainFixes).length > 0) {
      Object.entries(blockchainFixes).forEach(([key, value]) => {
        fixedEnvVars[key] = value;
        fixed = true;
        console.log(`🔧 ${key}: Fixed to '${value}' (blockchain optimization)`);
      });
    }
  }

  // Save fixed environment file
  if (fix && fixed) {
    const newLines = [...lines];
    
    // Update existing variables
    Object.entries(fixedEnvVars).forEach(([key, value]) => {
      const lineInfo = envLines[key];
      if (lineInfo) {
        newLines[lineInfo.index] = `${key}=${value}`;
      } else {
        // Add new variables at the end
        if (newLines[newLines.length - 1] !== '') newLines.push('');
        newLines.push(`${key}=${value}`);
      }
    });

    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`\n📦 Created backup: ${backupPath}`);

    // Write fixed file
    fs.writeFileSync(filePath, newLines.join('\n'));
    console.log('💾 Saved fixed environment file');

    // Update permissions
    try {
      execSync(`chmod 600 ${filePath}`);
      console.log('🔒 Updated file permissions');
    } catch (error) {
      console.warn('⚠️  Could not update file permissions');
    }
  }

  return isValid || fixed;
}

function validateAllEnvFiles(fix = false) {
  const envDir = path.join(__dirname, '..', 'docker', 'env');
  const environments = ['development', 'production', 'test'];
  let allValid = true;

  environments.forEach(env => {
    const filePath = path.join(envDir, `.env.${env}`);
    const isValid = validateEnvFile(filePath, env, fix);
    allValid = allValid && isValid;
  });

  if (allValid) {
    console.log('\n✅ All environment files are valid!');
    process.exit(0);
  } else {
    console.error('\n❌ Some environment files are invalid. Please fix the errors and try again.');
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');

// Run validation
validateAllEnvFiles(shouldFix);

export default class HeapMonitor {
  constructor(config) {
    this.config = config;
    this.stats = {
      totalAllocations: 0,
      currentHeapUsed: 0,
      gcCalls: 0,
      lastGcTime: null
    };
  }

  async trackAllocation() {
    const memUsage = process.memoryUsage();
    this.stats.currentHeapUsed = memUsage.heapUsed;
    this.stats.totalAllocations++;

    // Convert heap max size from string (e.g., '512m') to bytes
    const maxBytes = parseInt(this.config.heapMaxSize.replace('m', '')) * 1024 * 1024;
    if (memUsage.heapUsed > maxBytes * this.config.gcTriggerRatio) {
      await this.triggerGc();
    }

    return this.stats;
  }

  async triggerGc() {
    if (typeof global.gc === 'function') {
      global.gc();
      this.stats.gcCalls++;
      this.stats.lastGcTime = Date.now();
    }
  }

  getStats() {
    return { ...this.stats };
  }
}

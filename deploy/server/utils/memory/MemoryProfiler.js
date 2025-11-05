export default class MemoryProfiler {
  constructor(config) {
    this.config = config;
    this.stats = {
      profiles: [],
      lastProfile: null
    };
  }

  async collectMetrics() {
    // Wait for sampling interval
    await new Promise(resolve => setTimeout(resolve, this.config.samplingInterval));

    const memUsage = process.memoryUsage();
    const metrics = {
      timestamp: Date.now(),
      heapStats: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers
      },
      gcStats: {
        lastRun: this.stats.lastProfile ? this.stats.lastProfile.timestamp : null,
        collections: 0  // This would be updated if we had access to V8's gc stats
      }
    };

    this.stats.profiles.push(metrics);
    this.stats.lastProfile = metrics;

    // Keep profiles bounded
    if (this.stats.profiles.length > 1000) {
      this.stats.profiles = this.stats.profiles.slice(-1000);
    }

    return metrics;
  }

  getStats() {
    return { ...this.stats };
  }
}

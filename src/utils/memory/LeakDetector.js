export default class LeakDetector {
  constructor(config) {
    this.config = config;
    this.stats = {
      measurements: [],
      suspectObjects: new Set(),
      lastAnalysis: null
    };
  }

  async analyze() {
    const currentUsage = process.memoryUsage();
    this.stats.measurements.push({
      timestamp: Date.now(),
      heapUsed: currentUsage.heapUsed
    });

    // Keep only recent measurements
    if (this.stats.measurements.length > 10) {
      this.stats.measurements.shift();
    }

    // Calculate growth rate
    const growthRate = this.calculateGrowthRate();
    const hasLeak = growthRate > this.config.memoryLeakThreshold;

    // Calculate leak size if detected
    const leakSize = hasLeak ? 
      this.stats.measurements[this.stats.measurements.length - 1].heapUsed - 
      this.stats.measurements[0].heapUsed : 0;

    this.stats.lastAnalysis = {
      timestamp: Date.now(),
      growthRate,
      hasLeak,
      leakSize
    };

    return {
      hasLeak,
      leakSize,
      suspectObjects: Array.from(this.stats.suspectObjects),
      growthRate
    };
  }

  calculateGrowthRate() {
    if (this.stats.measurements.length < 2) return 0;

    const first = this.stats.measurements[0];
    const last = this.stats.measurements[this.stats.measurements.length - 1];
    const timeSpan = last.timestamp - first.timestamp;
    const memoryGrowth = last.heapUsed - first.heapUsed;

    return timeSpan > 0 ? memoryGrowth / timeSpan : 0;
  }

  getStats() {
    return { ...this.stats };
  }
}

export default class FragmentationAnalyzer {
  constructor(config) {
    this.config = config;
    this.stats = {
      lastAnalysis: null,
      fragmentationHistory: []
    };
  }

  async analyzeFragmentation() {
    const memUsage = process.memoryUsage();
    const fragmentationRatio = this.calculateFragmentationRatio(memUsage);

    this.stats.fragmentationHistory.push({
      timestamp: Date.now(),
      ratio: fragmentationRatio,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed
    });

    // Keep history bounded
    if (this.stats.fragmentationHistory.length > 100) {
      this.stats.fragmentationHistory.shift();
    }

    this.stats.lastAnalysis = {
      timestamp: Date.now(),
      ratio: fragmentationRatio,
      needsDefragmentation: fragmentationRatio > this.config.fragmentationThreshold
    };

    return fragmentationRatio;
  }

  calculateFragmentationRatio(memUsage) {
    // Calculate fragmentation as the ratio of unused heap space to total heap
    const unusedHeap = memUsage.heapTotal - memUsage.heapUsed;
    return unusedHeap / memUsage.heapTotal;
  }

  async defragmentHeap() {
    if (typeof global.gc === 'function') {
      // Force garbage collection to compact memory
      global.gc();
      return true;
    }
    return false;
  }

  getStats() {
    return { ...this.stats };
  }
}

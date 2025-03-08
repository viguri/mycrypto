import { jest } from '@jest/globals';
import HeapMonitor from '../../../src/utils/memory/HeapMonitor.js';
import LeakDetector from '../../../src/utils/memory/LeakDetector.js';
import FragmentationAnalyzer from '../../../src/utils/memory/FragmentationAnalyzer.js';
import MemoryProfiler from '../../../src/utils/memory/MemoryProfiler.js';

// Mock memory usage data
const mockMemoryUsage = {
  heapTotal: 50 * 1024 * 1024,    // 50MB total heap
  heapUsed: 30 * 1024 * 1024,     // 30MB used heap
  external: 10 * 1024 * 1024,     // 10MB external
  arrayBuffers: 5 * 1024 * 1024,  // 5MB array buffers
  rss: 100 * 1024 * 1024         // 100MB resident set size
};

describe('Memory Management', () => {
  let heapMonitor;
  let leakDetector;
  let fragmentationAnalyzer;
  let memoryProfiler;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    process.memoryUsage.mockReturnValue(mockMemoryUsage);
    global.gc.mockClear();

    heapMonitor = new HeapMonitor(global.__MEMORY_CONFIG__);
    leakDetector = new LeakDetector(global.__MEMORY_CONFIG__);
    fragmentationAnalyzer = new FragmentationAnalyzer(global.__MEMORY_CONFIG__);
    memoryProfiler = new MemoryProfiler(global.__MEMORY_CONFIG__);
  });

  describe('HeapMonitor', () => {
    it('should track heap allocations correctly', async () => {
      const initialHeapUsed = process.memoryUsage().heapUsed;
      await heapMonitor.trackAllocation();
      
      expect(process.memoryUsage).toHaveBeenCalled();
      expect(heapMonitor.getStats().totalAllocations).toBeGreaterThan(0);
      expect(heapMonitor.getStats().currentHeapUsed).toBe(initialHeapUsed);
    });

    it('should trigger GC when heap usage exceeds threshold', async () => {
      // Mock heap usage above threshold
      const heapMaxBytes = parseInt(global.__MEMORY_CONFIG__.heapMaxSize.replace('m', '')) * 1024 * 1024;
      process.memoryUsage.mockReturnValueOnce({
        ...mockMemoryUsage,
        heapUsed: heapMaxBytes * global.__MEMORY_CONFIG__.gcTriggerRatio + 1
      });

      await heapMonitor.trackAllocation();
      expect(global.gc).toHaveBeenCalled();
    });
  });

  describe('LeakDetector', () => {
    it('should detect memory leaks', async () => {
      const result = await leakDetector.analyze();
      expect(result).toHaveProperty('hasLeak');
      expect(result).toHaveProperty('leakSize');
      expect(result).toHaveProperty('suspectObjects');
    });

    it('should identify leak patterns', async () => {
      // Simulate rapidly growing memory usage
      const baseHeapUsed = mockMemoryUsage.heapUsed;
      const measurements = 5;
      const threshold = global.__MEMORY_CONFIG__.memoryLeakThreshold;
      
      // Create a growth pattern that exceeds the leak threshold
      for (let i = 0; i < measurements; i++) {
        const growthRate = threshold * 2; // Double the threshold to ensure detection
        process.memoryUsage.mockReturnValueOnce({
          ...mockMemoryUsage,
          heapUsed: baseHeapUsed * (1 + (growthRate * (i + 1)))
        });
        await leakDetector.analyze();
      }

      // Final measurement with continued growth
      process.memoryUsage.mockReturnValueOnce({
        ...mockMemoryUsage,
        heapUsed: baseHeapUsed * (1 + (threshold * 2 * (measurements + 1)))
      });

      // Final analysis should detect the leak
      const result = await leakDetector.analyze();
      expect(result.hasLeak).toBe(true);
      expect(result.leakSize).toBeGreaterThan(0);
    });
  });

  describe('FragmentationAnalyzer', () => {
    it('should calculate fragmentation ratio', async () => {
      const ratio = await fragmentationAnalyzer.analyzeFragmentation();
      expect(ratio).toBeGreaterThanOrEqual(0);
      expect(ratio).toBeLessThanOrEqual(1);
    });

    it('should recommend defragmentation when needed', async () => {
      // Mock high fragmentation
      process.memoryUsage.mockReturnValueOnce({
        ...mockMemoryUsage,
        heapTotal: 100 * 1024 * 1024,
        heapUsed: 20 * 1024 * 1024  // Very fragmented state
      });

      const result = await fragmentationAnalyzer.analyzeFragmentation();
      expect(result).toBeGreaterThan(global.__MEMORY_CONFIG__.fragmentationThreshold);
    });
  });

  describe('MemoryProfiler', () => {
    it('should collect memory metrics', async () => {
      const metrics = await memoryProfiler.collectMetrics();
      
      expect(metrics).toHaveProperty('heapStats');
      expect(metrics).toHaveProperty('gcStats');
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics.heapStats).toHaveProperty('used');
      expect(metrics.heapStats).toHaveProperty('total');
      expect(metrics.heapStats).toHaveProperty('external');
    });

    it('should respect sampling interval', async () => {
      const start = Date.now();
      await memoryProfiler.collectMetrics();
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(global.__MEMORY_CONFIG__.samplingInterval);
    });
  });
});

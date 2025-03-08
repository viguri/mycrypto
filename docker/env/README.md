# Docker Environment Configuration

This directory contains environment configuration templates for different Docker environments.

## Available Templates

- `development.env.example`: Development environment settings
  - Relaxed security settings
  - Debug logging enabled
  - Hot-reloading support
  - Increased rate limits

- `production.env.example`: Production environment settings
  - Strict security measures
  - Resource limits and reservations
  - Health check configuration
  - Metrics enabled

- `test.env.example`: Test environment settings
  - Different port (3001) to avoid conflicts
  - Mock services enabled
  - Maximum rate limits
  - Test-specific configurations

## Usage

1. Copy the appropriate template to create your environment file:
   ```bash
   # For development
   cp development.env.example .env.development

   # For production
   cp production.env.example .env.production

   # For testing
   cp test.env.example .env.test
   ```

2. Edit the created file with your specific settings

3. Run Docker Compose with the environment file:
   ```bash
   # Development
   docker compose --env-file docker/env/.env.development up

   # Production
   docker compose -f docker-compose.cli.yml --env-file docker/env/.env.production up

   # Testing
   docker compose --env-file docker/env/.env.test up
   ```

## Environment Variables

### Common Variables
- `PORT`: Server port (default varies by environment)
- `NODE_ENV`: Environment mode (development/production/test)
- `API_PREFIX`: API endpoint prefix
- `LOG_LEVEL`: Logging verbosity
- `LOG_DIR`: Log file directory

### Security Variables
- `ALLOWED_ORIGINS`: Comma-separated list of CORS origins
- `RATE_LIMIT_MAX`: Maximum requests per time window

### Resource Limits
- `MEMORY_LIMIT`: Container memory limit
- `CPU_LIMIT`: Container CPU limit
- `MEMORY_RESERVATION`: Memory reservation (production only)
- `CPU_RESERVATION`: CPU reservation (production only)

### Memory Metrics

#### Heap Allocation Tracking
- `HEAP_INITIAL_SIZE`: Initial heap size (e.g., '128M')
- `HEAP_GROWTH_SIZE`: Heap growth increment (e.g., '32M')
- `HEAP_ALLOC_RATE`: Expected allocation rate (e.g., '10M')
- `HEAP_OBJECT_COUNT`: Maximum tracked objects
- `HEAP_OBJECT_SIZE`: Average object size (e.g., '64K')
- `HEAP_GC_TRIGGER`: GC trigger threshold (e.g., '64M')
- `HEAP_USAGE_RATIO`: Target heap usage ratio (0-1)
- `HEAP_TRACKING_ENABLED`: Enable heap tracking
- `HEAP_COLLECT_INTERVAL`: Data collection interval (ms)
- `HEAP_AGGREGATE_INTERVAL`: Data aggregation interval (ms)
- `HEAP_RETENTION_DAYS`: Data retention period (days)

#### Memory Fragmentation
- `MEMORY_FRAG_RATIO`: Memory fragmentation ratio (0-1)
- `MEMORY_FRAG_SIZE`: Fragment size threshold
- `MEMORY_FRAG_COUNT`: Maximum fragment count
- `MEMORY_DEFRAG_INTERVAL`: Defragmentation interval (ms)
- `MEMORY_COMPACT_THRESHOLD`: Compaction trigger threshold
- `MEMORY_FREE_BLOCK_RATIO`: Target free block ratio
- `MEMORY_BLOCK_SIZE`: Memory block size

#### Memory Leak Detection
- `MEMORY_LEAK_DETECTION_INTERVAL`: Detection scan interval (ms)
- `MEMORY_LEAK_GROWTH_RATE`: Growth rate threshold
- `MEMORY_LEAK_SUSPECT_OBJECTS`: Suspect object threshold
- `MEMORY_LEAK_SIZE`: Minimum leak size
- `MEMORY_LEAK_RETENTION_TIME`: Object retention threshold (ms)
- `MEMORY_LEAK_STACK_TRACE_DEPTH`: Stack trace depth
- `MEMORY_LEAK_HISTORY_SIZE`: History snapshot count

#### Memory Profiling
- `MEMORY_PROF_SAMPLING_RATE`: Sampling rate (samples/s)
- `MEMORY_PROF_STACK_DEPTH`: Stack trace depth
- `MEMORY_PROF_HEAP_SNAPSHOT_INTERVAL`: Snapshot interval (ms)
- `MEMORY_PROF_RETAINED_SIZE`: Retained size threshold
- `MEMORY_PROF_LEAK_THRESHOLD`: Leak detection threshold
- `MEMORY_PROF_BUFFER_SIZE`: Profiling buffer size
- `MEMORY_PROF_CALL_GRAPH_DEPTH`: Call graph depth

### Blockchain Configuration
- `BLOCKCHAIN_DIFFICULTY`: Mining difficulty level
- `MINING_REWARD`: Reward for mining blocks

### Testing Configuration
- `SKIP_BLOCKCHAIN_SYNC`: Skip blockchain synchronization in tests
- `ENABLE_MOCK_SERVICES`: Enable mock services for testing
- `TEST_WALLET_SEED`: Seed for generating test wallets

## Environment-Specific Defaults

### Development Environment
- Relaxed memory limits for debugging
- Higher sampling rates for profiling
- Shorter intervals for metrics collection
- More detailed stack traces

### Production Environment
- Optimized memory allocation limits
- Conservative GC trigger thresholds
- Longer retention periods for metrics
- Balanced profiling overhead

### Test Environment
- Minimal memory reservations
- Aggressive leak detection
- Maximum debugging information
- Frequent metrics collection

## Notes

- Never commit actual environment files (*.env)
- Only example templates (*.env.example) should be version controlled
- Each environment has specific defaults suitable for its purpose
- Production environment requires additional security measures
- Memory metrics are automatically validated and optimized
- Heap tracking can be disabled in performance-critical scenarios

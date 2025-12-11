/**
 * =============================================================================
 * NODE.JS CLUSTERING - Multi-Process Architecture
 * =============================================================================
 * 
 * PURPOSE:
 * Demonstrates how to utilize all CPU cores by spawning multiple Node.js
 * processes. This is essential for production deployments to maximize
 * server throughput.
 * 
 * WHY CLUSTERING?
 * - Node.js is single-threaded (runs on one CPU core by default)
 * - Modern servers have multiple CPU cores
 * - Clustering spawns multiple processes to use all cores
 * - Each worker handles requests independently
 * 
 * ARCHITECTURE:
 * 
 *                    ┌─────────────────┐
 *                    │  Master Process │
 *                    │  (Manages all)  │
 *                    └────────┬────────┘
 *                             │
 *          ┌──────────────────┼──────────────────┐
 *          │                  │                  │
 *    ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
 *    │  Worker 1 │     │  Worker 2 │     │  Worker 3 │
 *    │  (CPU 1)  │     │  (CPU 2)  │     │  (CPU 3)  │
 *    └───────────┘     └───────────┘     └───────────┘
 * 
 * INTERVIEW TOPICS:
 * - Difference between clustering and worker threads
 * - Load balancing strategies (round-robin vs OS-based)
 * - Inter-process communication (IPC)
 * - Sticky sessions for WebSocket connections
 */

const cluster = require('cluster');
const os = require('os');
const logger = require('./utils/logger');

/**
 * CHECK IF CURRENT PROCESS IS MASTER
 * 
 * cluster.isMaster (deprecated) / cluster.isPrimary (Node 16+)
 * 
 * The master process is responsible for:
 * 1. Spawning worker processes
 * 2. Monitoring worker health
 * 3. Restarting failed workers
 * 4. Distributing incoming connections
 */
if (cluster.isMaster) {
  /**
   * GET NUMBER OF CPU CORES
   * 
   * os.cpus() returns an array of CPU core information
   * We spawn one worker per core for optimal utilization
   * 
   * Interview Tip: You might not always want workers = CPUs
   * - Leave 1-2 cores for OS and other processes
   * - Consider memory constraints
   * - For I/O-bound apps, you might use fewer workers
   */
  const numCPUs = os.cpus().length;
  
  logger.info(`Master ${process.pid} is running`);
  logger.info(`Forking ${numCPUs} workers`);

  /**
   * FORK WORKER PROCESSES
   * 
   * cluster.fork() creates a new worker process
   * 
   * Each worker:
   * - Is a separate Node.js process
   * - Has its own memory space
   * - Can handle requests independently
   * - Shares the same server port (OS handles distribution)
   */
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  /**
   * WORKER EXIT HANDLER
   * 
   * Purpose: Automatically restart workers that crash
   * 
   * Parameters:
   * - worker: The worker that exited
   * - code: Exit code (0 = normal, non-zero = error)
   * - signal: Signal that caused exit (SIGTERM, SIGKILL, etc.)
   * 
   * Best Practices:
   * - Log the failure for debugging
   * - Implement exponential backoff for repeated failures
   * - Set a maximum restart count to prevent infinite loops
   * - Alert operations team for repeated failures
   * 
   * Interview Tip: Discuss "crash loop" prevention strategies
   */
  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    logger.info('Starting a new worker');
    
    // Automatically spawn a replacement worker
    // In production, add delay and max restart logic
    cluster.fork();
  });

  /**
   * GRACEFUL SHUTDOWN FOR MASTER
   * 
   * Purpose: Properly shut down all workers when master receives SIGTERM
   * 
   * Process:
   * 1. Master receives SIGTERM
   * 2. Master sends kill signal to all workers
   * 3. Workers finish current requests and exit
   * 4. Master exits after all workers are done
   * 
   * Interview Tip: Discuss rolling deployments and zero-downtime updates
   */
  process.on('SIGTERM', () => {
    logger.info('Master received SIGTERM, shutting down workers');
    
    // Send kill signal to all workers
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  });

} else {
  /**
   * WORKER PROCESS
   * 
   * Each worker runs the actual server code
   * 
   * How load balancing works:
   * - All workers listen on the same port
   * - OS distributes connections (or Node uses round-robin)
   * - Each worker handles requests independently
   * 
   * Shared State Considerations:
   * - Workers don't share memory
   * - Use Redis/database for shared state
   * - Session data must be stored externally
   * - Consider sticky sessions for WebSocket
   */
  require('./server');
  logger.info(`Worker ${process.pid} started`);
}

/**
 * =============================================================================
 * CLUSTERING VS WORKER THREADS (Common Interview Question)
 * =============================================================================
 * 
 * CLUSTERING (cluster module):
 * - Spawns separate processes
 * - Each process has its own memory
 * - Good for: HTTP servers, CPU-bound tasks across requests
 * - Communication: IPC (Inter-Process Communication)
 * 
 * WORKER THREADS (worker_threads module):
 * - Spawns threads within the same process
 * - Can share memory (SharedArrayBuffer)
 * - Good for: CPU-intensive tasks within a single request
 * - Communication: Message passing, shared memory
 * 
 * When to use which:
 * - Clustering: Scale HTTP servers across CPU cores
 * - Worker Threads: Offload heavy computation (image processing, crypto)
 * 
 * =============================================================================
 * LOAD BALANCING STRATEGIES
 * =============================================================================
 * 
 * 1. Round-Robin (Node.js default on non-Windows):
 *    - Master distributes connections in order
 *    - Simple and fair distribution
 * 
 * 2. OS-Based (Windows default):
 *    - OS kernel handles distribution
 *    - Can be less fair but lower overhead
 * 
 * 3. External Load Balancer (Production):
 *    - Nginx, HAProxy, AWS ALB
 *    - More control over distribution
 *    - Health checks and failover
 */
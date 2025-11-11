import {type Plugin} from 'vite';
import {exec} from 'child_process';
import {promisify} from 'util';

const execAsync = promisify(exec);

interface GenerateApiPluginOptions {
  /**
   * Command to run for API generation
   * @default 'pnpm generate:api'
   */
  command?: string;
  /**
   * Whether to run on server start
   * @default true
   */
  runOnStart?: boolean;
  /**
   * Whether to run on file changes (hot reload)
   * @default false
   */
  runOnChange?: boolean;
  /**
   * Files to watch for changes (only used if runOnChange is true)
   * @default []
   */
  watchFiles?: string[];
  /**
   * Number of retry attempts if the backend is not ready
   * @default 3
   */
  retries?: number;
  /**
   * Delay between retries in milliseconds
   * @default 2000
   */
  retryDelay?: number;
}

export function generateApiPlugin(
  options: GenerateApiPluginOptions = {},
): Plugin {
  const {
    command = 'pnpm generate:api',
    runOnStart = true,
    runOnChange = false,
    watchFiles = [],
    retries = 3,
    retryDelay = 2000,
  } = options;

  let hasRun = false;
  let isRunning = false;

  const sleep = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

  const runCommand = async (attempt = 1): Promise<void> => {
    // Prevent concurrent runs
    if (isRunning) {
      console.log('⏳ API generation already in progress, skipping...');
      return;
    }

    isRunning = true;

    try {
      if (attempt > 1) {
        console.log(`🔄 Generating API types (attempt ${attempt}/${retries + 1})...`);
      } else {
        console.log('🔄 Generating API types...');
      }
      
      const {stdout, stderr} = await execAsync(command, {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        // Don't kill on non-zero exit codes
        timeout: 60000, // 60 second timeout
      });

      if (stdout) {
        console.log(stdout);
      }

      // stderr might contain warnings but not errors
      if (stderr && !stderr.includes('Error')) {
        console.warn(stderr);
      }

      console.log('✅ API types generated successfully');
    } catch (error: any) {
      // Check if we should retry
      const isConnectionError =
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        (error.stderr &&
          (error.stderr.includes('ECONNREFUSED') ||
            error.stderr.includes('fetch failed') ||
            error.stderr.includes('internalConnectMultiple')));

      if (isConnectionError && attempt <= retries) {
        console.log(
          `⏳ Backend not ready yet, retrying in ${retryDelay / 1000}s... (${attempt}/${retries})`,
        );
        isRunning = false;
        await sleep(retryDelay);
        return runCommand(attempt + 1);
      }

      // Handle different error types gracefully
      if (error.code === 'ENOENT') {
        console.warn(
          '⚠️  API generation command not found. Make sure the backend is running and swagger-typescript-api is installed.',
        );
      } else if (isConnectionError) {
        console.warn(
          '⚠️  Could not connect to API server after multiple attempts. Make sure the backend is running at http://localhost:3001',
        );
      } else if (error.signal === 'SIGTERM') {
        console.warn(
          '⚠️  API generation was terminated. This is usually fine.',
        );
      } else {
        console.warn(
          '⚠️  Failed to generate API types:',
          error.message || String(error),
        );
        // Log stderr if available (but truncate if too long)
        if (error.stderr) {
          const stderrLines = error.stderr.split('\n');
          if (stderrLines.length > 10) {
            console.warn(
              'Error details:',
              stderrLines.slice(0, 5).join('\n'),
              '\n... (truncated)',
              '\n',
              stderrLines.slice(-3).join('\n'),
            );
          } else {
            console.warn('Error details:', error.stderr);
          }
        }
      }

      console.log(
        'ℹ️  Dev server will continue. You can manually run "pnpm generate:api" when the backend is ready.',
      );
    } finally {
      isRunning = false;
    }
  };

  return {
    name: 'generate-api',
    enforce: 'pre',
    buildStart() {
      if (runOnStart && !hasRun) {
        hasRun = true;
        // Run asynchronously without blocking - don't await
        runCommand().catch(() => {
          // Errors are already handled in runCommand
          // This catch is just to prevent unhandled promise rejections
        });
      }
    },
    configureServer(server) {
      if (runOnChange && watchFiles.length > 0) {
        server.watcher.on('change', file => {
          if (watchFiles.some(pattern => file.includes(pattern))) {
            // Run asynchronously without blocking - don't await
            runCommand().catch(() => {
              // Errors are already handled in runCommand
              // This catch is just to prevent unhandled promise rejections
            });
          }
        });
      }
    },
  };
}

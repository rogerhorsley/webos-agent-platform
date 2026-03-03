/**
 * PM2 Ecosystem Config — NexusOS Production
 *
 * Start:   pm2 start ecosystem.config.cjs
 * Reload:  pm2 reload nexusos-api
 * Stop:    pm2 stop all
 * Logs:    pm2 logs nexusos-api
 * Monitor: pm2 monit
 * Save:    pm2 save && pm2 startup  (auto-start on reboot)
 */
module.exports = {
  apps: [
    {
      name: 'nexusos-api',
      script: './apps/api/dist/index.js',
      cwd: './apps/api',
      instances: 1,            // increase to 'max' for multi-core (note: SQLite WAL needed)
      exec_mode: 'fork',       // use 'cluster' if instances > 1 (requires stateless code)
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_file: '.env',        // load root .env
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
    },
  ],
}

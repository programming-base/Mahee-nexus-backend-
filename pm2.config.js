module.exports = {
  apps: [
    {
      name: 'mahee-nexus-api',
      script: 'server.js',
      instances: 'max',       // one process per CPU core
      exec_mode: 'cluster',   // load-balance across instances
      watch: false,           // never watch in production
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Restart automatically if memory exceeds 500MB
      max_memory_restart: '500M',
      // Log file locations
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};

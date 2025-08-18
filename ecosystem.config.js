module.exports = {
  apps: [
    {
      name: 'linkzup-app',
      script: 'npm',
      args: 'start',
      cwd: './',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'auto-poster',
      script: './scripts/simple-auto-poster.js',
      cwd: './',
      env: {
        NODE_ENV: 'production'
      },
      log_file: './logs/auto-poster.log',
      out_file: './logs/auto-poster-out.log',
      error_file: './logs/auto-poster-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
}

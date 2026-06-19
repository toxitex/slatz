module.exports = {
  apps: [
    {
      name: "synx-api",
      script: "index.js",
      cwd: "/var/www/synx-server",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        SYNCX_JWT_SECRET: "827a67df575d0e455c3d12f1631d82cb519cbf42535342a3191bdff1381d68f7",
        VITE_ADMIN_ACCESS_CODE: "666666",
      },
      autorestart: true,
      max_restarts: 10,
    },
  ],
};

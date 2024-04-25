module.exports = {
  apps: [
    {
      name: "arbitrage-bsc",
      script: "npm",
      args: "run start:arbitrage:bsc",
      watch: false,
      restart: true,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "arbitrage-eth",
      script: "npm",
      args: "run start:arbitrage:eth",
      watch: false,
      restart: true,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

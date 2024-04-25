module.exports = {
  apps: [
    {
      name: "arbitrage-bsc",
      script: "ts-node",
      args: "src/bot-arbitrage-bsc.ts",
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
      script: "ts-node",
      args: "src/bot-arbitrage-eth.ts",
      watch: false,
      restart: true,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "arbitrage-polygon",
      script: "ts-node",
      args: "src/bot-arbitrage-polygon.ts",
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

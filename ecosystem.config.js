module.exports = {
  apps: [{
    name: "bibimotora",
    script: "npm",
    args: "start",
    env: {
      NODE_ENV: "production",
      PORT: 9002
    }
  }]
};


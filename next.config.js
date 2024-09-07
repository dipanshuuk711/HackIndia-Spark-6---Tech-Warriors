// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        module: false,  // Exclude 'module' from client-side bundle
        net: false,
        tls: false,
        child_process: false,
        fs: false,
        path: false,
        os: false,
        // Add other Node.js modules if necessary
      };
    }
    return config;
  },
};

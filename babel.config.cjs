module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current',
        esmodules: true
      },
      modules: 'commonjs' // Use CommonJS modules for better compatibility
    }],
    ['@babel/preset-react', {
      runtime: 'automatic'
    }]
  ],
  // Apply security-focused transformations
  plugins: [
    // Remove console.log in production
    process.env.NODE_ENV === 'production' ? 'transform-remove-console' : null,
    // Prevent prototype pollution
    '@babel/plugin-transform-proto-to-assign'
  ].filter(Boolean)
};

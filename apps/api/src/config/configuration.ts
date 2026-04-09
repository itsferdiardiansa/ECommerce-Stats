export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  cors: {
    origin:
      process.env.CORS_ORIGIN === 'true'
        ? true
        : process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  throttle: {
    global: {
      ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '60', 10),
    },
    auth: {
      ttl: parseInt(process.env.THROTTLE_AUTH_TTL || '60000', 10),
      limit: parseInt(process.env.THROTTLE_AUTH_LIMIT || '5', 10),
    },
  },
})

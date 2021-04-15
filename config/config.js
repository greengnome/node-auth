const config = {
  production: {
    SECRET: process.env.SECRET,
    DATABASE: process.env.MONGODB_URI,
  },
  default: {
    SECRET: 'myprivatekey',
    DATABASE: 'mongodb://localhost:27017/authnode',
  },
};

exports.get = function get(env) {
  return config[env] || config.default;
};

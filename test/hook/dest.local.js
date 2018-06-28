module.exports = {
  test: (req, uid) => {
    return uid == 'test1@gmail.com' ? {
      ip: "127.0.0.1",
      port: 3000
    } : {
      ip: "127.0.0.1",
      port: 3001
    };
  },
  test2: [
    {
      ip : "127.0.0.1",
      ports : [3002, 3003]
    }
  ],
  buitInServer: [
    {
      ip : "127.0.0.1",
      ports : [4000]
    }
  ],
  default: [
    {
      ip : "127.0.0.1",
      ports : [3000]
    }
  ],
};

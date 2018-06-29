module.exports = {
  test: (req, uid) => {
    return {
      ip: "127.0.0.1",
      port: 4000
    };
  },
  default: [
    {
      ip : "127.0.0.1",
      ports : [4000, 4001]
    }
  ]
};

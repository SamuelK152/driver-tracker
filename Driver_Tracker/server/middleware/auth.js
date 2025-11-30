const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Auth failed" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = decoded;
    next();
  } catch (error) {
    console.log("Auth Middleware Error:", error.message);
    return res.status(401).json({ message: "Auth failed" });
  }
};

module.exports = auth;

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: Token not provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Guardar el usuario decodificado en el request
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid Token' });
  }
};

module.exports = verifyToken;

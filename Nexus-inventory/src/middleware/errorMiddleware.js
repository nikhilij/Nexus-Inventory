const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);
  
  // If error has a status, use it
  const status = err.status || err.statusCode || 500;
  
  // If error has a message, use it
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorMiddleware;


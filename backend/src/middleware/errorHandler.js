const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(`Error [${req.method}] ${req.originalUrl}: ${err.message}`, { stack: err.stack });

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    error.message = err.errors.map(e => e.message).join(', ');
    error.statusCode = 400;
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'field';
    error.message = `Duplicate value for field: ${field}`;
    error.statusCode = 400;
  }

  // Sequelize foreign key / not-null errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error.message = 'Referenced record does not exist or cannot be deleted';
    error.statusCode = 400;
  }
  if (err.name === 'SequelizeDatabaseError') {
    error.message = 'Database query failed';
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

module.exports = { errorHandler, notFound };
function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  res.status(status).json({
    message: status === 500 ? 'Erreur serveur' : error.message
  });
}

module.exports = { errorHandler };

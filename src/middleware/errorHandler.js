// Global error handler (FR10)
const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.stack}`);

    const statusCode = err.statusCode || 500;
    const message = err.message || "An unexpected internal server error occurred.";

    res.status(statusCode).json({
        status: "error",
        message
    });
};

module.exports = errorHandler;

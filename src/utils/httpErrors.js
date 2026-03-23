class HttpError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'HttpError';
    }
}

class BadRequestError extends HttpError {
    constructor(message = 'Petición inválida') {
        super(400, message);
        this.name = 'BadRequestError';
    }
}

class NotFoundError extends HttpError {
    constructor(message = 'Recurso no encontrado') {
        super(404, message);
        this.name = 'NotFoundError';
    }
}

class ForbiddenError extends HttpError {
    constructor(message = 'Acceso denegado') {
        super(403, message);
        this.name = 'ForbiddenError';
    }
}

module.exports = {
    HttpError,
    BadRequestError,
    NotFoundError,
    ForbiddenError
};

import type { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction) {
    const statusCode = err.statusCode ?? 500;
    const code = err.code ?? "INTERNAL_ERROR";

    console.error(`[Error] ${code}: ${err.message}`);

    if (process.env["NODE_ENV"] !== "production") {
        console.error(err.stack);
    }

    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message: statusCode === 500 && process.env["NODE_ENV"] === "production" ? "An unexpected error ocurred" : err.message
        }
    });
}

export function notFoundHandler(_req: Request, res: Response) {
    res.status(400).json({
        success: false,
        error: {
            code: "NOT_FOUND",
            message: "The requested resource was not found"
        }
    });
}
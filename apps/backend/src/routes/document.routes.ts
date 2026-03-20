import { Router } from "express";
import { documentController } from "@/controllers/document.controller.js";
import { requireAuth } from "@/middleware/auth.middleware.js";
import { documentEmitter, type DocumentStatusEvent } from "@/events/document.emitter.js";
import { verifyToken } from "@/services/auth.service.js";

const router = Router();

router.post("/generate-doc", (req, res, next) => {
    documentController.generateDoc(req, res, next);
});

router.get("/documents", requireAuth, (req, res, next) => {
    documentController.listDocuments(req, res, next);
});

router.get("/documents/:id", requireAuth, (req, res, next) => {
    documentController.getDocumentById(req, res, next);
});

router.delete("/documents/:id", requireAuth, (req, res, next) => {
    documentController.deleteDocument(req, res, next);
});

router.post("/documents/:id/regenerate", requireAuth, (req, res, next) => {
    documentController.regenerateDocument(req, res, next);
});

router.get("/documents/:documentId/status", (req, res, next) => {
    documentController.getDocumentStatus(req, res, next);
});

router.get("/events", (req, res) => {
    const token = req.query["token"] as string | undefined;
    if (!token || !verifyToken(token)) {
        res.status(401).end();
        return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const heartbeat = setInterval(() => res.write(":ping\n\n"), 25000);

    const handler = (event: DocumentStatusEvent) => {
        res.write(`data: ${JSON.stringify({ type: "document:status", ...event })}\n\n`);
    };

    documentEmitter.on("document:status", handler);

    req.on("close", () => {
        clearInterval(heartbeat);
        documentEmitter.off("document:status", handler);
    });
});

export default router;
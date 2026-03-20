import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app.js';
import type { Express } from 'express';

// Mock heavy dependencies for integration tests
vi.mock('@/services/document.service.js', () => ({
    documentService: {
        generateDocument: vi.fn().mockResolvedValue({
            jobId: 'mock-job-id',
            documentId: 'mock-doc-id',
            status: 'queued',
            message: 'Queued',
        }),
        getDocumentStatus: vi.fn().mockResolvedValue({
            documentId: 'mock-doc-id',
            status: 'completed',
            fileUrl: '/generated/mock-doc-id.pdf',
        }),
    },
}));

let app: Express;

beforeAll(() => {
    app = createApp();
});

describe('POST /api/generate-doc', () => {
    it('returns 202 with jobId for valid request', async () => {
        const payload = {
            formId: 'legal-document-request',
            userId: '550e8400-e29b-41d4-a716-446655440000',
            formData: {
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane@test.com',
                documentType: 'contract',
            },
            outputFormat: 'pdf',
        };

        const response = await request(app)
            .post('/api/generate-doc')
            .send(payload)
            .set('Content-Type', 'application/json');

        expect(response.status).toBe(202);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
            jobId: expect.any(String),
            documentId: expect.any(String),
            status: 'queued',
        });
    });

    it('returns 400 for missing required fields', async () => {
        const response = await request(app)
            .post('/api/generate-doc')
            .send({ formId: 'test' }) // Missing userId and formData
            .set('Content-Type', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for invalid UUID in userId', async () => {
        const response = await request(app)
            .post('/api/generate-doc')
            .send({
                formId: 'test',
                userId: 'not-a-uuid',
                formData: {},
                outputFormat: 'pdf',
            });

        expect(response.status).toBe(400);
    });
});

describe('GET /api/documents/:documentId/status', () => {
    it('returns document status', async () => {
        const response = await request(app).get('/api/documents/mock-doc-id/status');

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('completed');
    });
});
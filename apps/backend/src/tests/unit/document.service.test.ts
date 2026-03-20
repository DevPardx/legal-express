import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentService } from '@/services/document.service.js';

const { mockUpsert, mockJobCreate, mockDocCreate, mockTransaction, mockQueueAdd } = vi.hoisted(() => ({
    mockUpsert: vi.fn(),
    mockJobCreate: vi.fn(),
    mockDocCreate: vi.fn(),
    mockTransaction: vi.fn(),
    mockQueueAdd: vi.fn(),
}));

vi.mock('@/config/database.config.js', () => ({
    prisma: {
        user: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000' }) },
        job: { create: mockJobCreate, update: vi.fn() },
        document: { create: mockDocCreate, findUnique: vi.fn() },
        matter: { create: vi.fn() },
        $transaction: mockTransaction,
    },
}));

vi.mock('@/queues/pdf.queue.js', () => ({
    pdfQueue: { add: mockQueueAdd },
}));

describe('DocumentService', () => {
    let service: DocumentService;

    beforeEach(() => {
        service = new DocumentService();
        vi.clearAllMocks();
    });

    it('creates a job and document, then enqueues a BullMQ job', async () => {
        const mockJob = { id: 'job-uuid-123' };
        const mockDocument = { id: 'doc-uuid-456' };

        mockUpsert.mockResolvedValue({});
        mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
            return fn({
                job: { create: vi.fn().mockResolvedValue(mockJob) },
                matter: { create: vi.fn().mockResolvedValue({ id: 'matter-uuid-789' }) },
                document: { create: vi.fn().mockResolvedValue(mockDocument) },
            });
        });
        mockQueueAdd.mockResolvedValue({ id: 'bull-job-1' });

        const result = await service.generateDocument({
            formId: 'test-form',
            userId: '550e8400-e29b-41d4-a716-446655440000',
            formData: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@test.com',
                documentType: 'contract',
            },
            outputFormat: 'pdf',
        });

        expect(result.status).toBe('queued');
        expect(result.jobId).toBe(mockJob.id);
        expect(result.documentId).toBe(mockDocument.id);
        expect(mockQueueAdd).toHaveBeenCalledOnce();
    });
});

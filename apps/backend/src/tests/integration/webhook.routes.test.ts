import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "@/app.js";
import type { Express } from "express";

const { mockFindFirst } = vi.hoisted(() => ({
    mockFindFirst: vi.fn().mockResolvedValue({
        id: "doc-uuid",
        jobId: "job-uuid-test",
        matter: { id: "matter-uuid", userId: "user-uuid" },
    }),
}));

vi.mock("@/config/database.config.js", () => ({
    prisma: {
        document: { findFirst: mockFindFirst },
        job: { update: vi.fn() },
        invoice: { upsert: vi.fn() },
        $transaction: vi.fn().mockImplementation(async (fn) => {
            return fn({
                job: { update: vi.fn() },
                invoice: { upsert: vi.fn() },
            });
        }),
    },
}));

let app: Express;
beforeAll(() => { app = createApp(); });

describe("POST /api/webhook/payment", () => {
    const validPayload = {
        jobId: "550e8400-e29b-41d4-a716-446655440000",
        paymentStatus: "paid",
        amount: 150.00,
        currency: "USD",
        transactionId: "txn_test_001",
        timestamp: new Date().toISOString(),
    };

    it("returns 200 for valid payment webhook", async () => {
        const response = await request(app)
            .post("/api/webhook/payment")
            .send(validPayload);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    it("returns 400 for invalid paymentStatus", async () => {
        const response = await request(app)
            .post("/api/webhook/payment")
            .send({ ...validPayload, paymentStatus: "invalid" });

        expect(response.status).toBe(400);
    });

    it("returns 400 for negative amount", async () => {
        const response = await request(app)
            .post("/api/webhook/payment")
            .send({ ...validPayload, amount: -50 });

        expect(response.status).toBe(400);
    });

    it("handles unknown jobId gracefully (returns 200 to avoid retries)", async () => {
        mockFindFirst.mockResolvedValueOnce(null);

        const response = await request(app)
            .post("/api/webhook/payment")
            .send(validPayload);

        expect(response.status).toBe(200);
    });
});

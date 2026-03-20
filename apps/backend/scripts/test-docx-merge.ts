/**
 * Standalone test for the DOCX template merge + PDF bundle pipeline.
 * Run with: npx tsx scripts/test-docx-merge.ts
 *
 * Tests:
 *  1. Merges data into document.docx template
 *  2. Merges two PDFs into a single bundle (simulates attachment bundling)
 */
import { mergeDocxTemplate } from "../src/services/docx.service.js";
import { mergePdfs } from "../src/services/bundle.service.js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GENERATED = join(__dirname, "../generated");

// ── Helper: create a minimal sample PDF in memory ────────────────────────────
async function createSamplePdf(title: string): Promise<string> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([595, 842]); // A4
    page.drawText(title, {
        x: 50,
        y: 780,
        size: 18,
        font,
        color: rgb(0.12, 0.23, 0.54),
    });
    page.drawText(
        `This is a sample attachment generated at ${new Date().toISOString()}`,
        { x: 50, y: 750, size: 11, font, color: rgb(0.1, 0.1, 0.1) }
    );
    page.drawText("Legal Express — Confidential", {
        x: 50,
        y: 50,
        size: 9,
        font,
        color: rgb(0.58, 0.64, 0.72),
    });

    await mkdir(GENERATED, { recursive: true });
    const bytes = await doc.save();
    const path = join(GENERATED, `${title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    await writeFile(path, bytes);
    return path;
}

async function main() {
    const docId = `test-${Date.now()}`;

    // ── Step 1: DOCX merge ───────────────────────────────────────────────────
    const docxPath = await mergeDocxTemplate({
        templateName: "document",
        outputFileName: `${docId}-merged`,
        data: {
            firstName: "Diego",
            lastName: "Pardo",
            email: "engineer.pardo@gmail.com",
            documentType: "INVOICE",
            documentId: docId,
            generatedAt: new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            }),
            year: new Date().getFullYear(),
            referenceNumber: Math.random().toString(36).substring(2, 8).toUpperCase(),
            description: "Invoice for legal consulting services — Q1 2026.",
        },
    });
    console.log(`DOCX merged: ${docxPath}`);

    // ── Step 2: Create sample attachment PDFs ────────────────────────────────
    const attachment1 = await createSamplePdf("Attachment-1-Terms");
    const attachment2 = await createSamplePdf("Attachment-2-Proof-of-Payment");
    console.log(`Sample attachments created`);

    // ── Step 3: Bundle PDFs (main + attachments) ─────────────────────────────
    // Note: to bundle with the main document PDF it must already exist.
    // Here we bundle the two attachments as a demo.
    const bundlePath = await mergePdfs(
        [attachment1, attachment2],
        `${docId}-bundle`
    );
    console.log(`PDF bundle created: ${bundlePath}`);

    // Final output line (read by test-doc-generation.sh)
    console.log(bundlePath);
}

main().catch(err => {
    console.error("Error:", err.message);
    process.exit(1);
});

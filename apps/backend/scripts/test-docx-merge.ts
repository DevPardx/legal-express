import { mergeDocxTemplate } from "../src/services/docx.service.js";
import { mergePdfs } from "../src/services/bundle.service.js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GENERATED = join(__dirname, "../generated");

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

    const attachment1 = await createSamplePdf("Attachment-1-Terms");
    const attachment2 = await createSamplePdf("Attachment-2-Proof-of-Payment");
    console.log("Sample attachments created");

    const bundlePath = await mergePdfs(
        [attachment1, attachment2],
        `${docId}-bundle`
    );
    console.log(`PDF bundle created: ${bundlePath}`);

    console.log(bundlePath);
}

main().catch(err => {
    console.error("Error:", err.message);
    process.exit(1);
});

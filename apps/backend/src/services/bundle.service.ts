import { PDFDocument } from "pdf-lib";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "../../generated");

/**
 * Merges multiple PDF files into a single PDF bundle.
 * @param pdfPaths  Ordered list of PDF file paths to merge.
 * @param outputFileName  Output filename (without extension).
 * @returns Absolute path to the merged PDF.
 */
export async function mergePdfs(pdfPaths: string[], outputFileName: string): Promise<string> {
    if (pdfPaths.length === 0) throw new Error("No PDF paths provided");

    const merged = await PDFDocument.create();

    for (const pdfPath of pdfPaths) {
        if (!existsSync(pdfPath)) {
            console.warn(`[BundleService] Skipping missing file: ${pdfPath}`);
            continue;
        }
        const bytes = await readFile(pdfPath);
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(page => merged.addPage(page));
    }

    const mergedBytes = await merged.save();
    await mkdir(OUTPUT_DIR, { recursive: true });

    const outputPath = join(OUTPUT_DIR, `${outputFileName}.pdf`);
    await writeFile(outputPath, mergedBytes);

    return outputPath;
}

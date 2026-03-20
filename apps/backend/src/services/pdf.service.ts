import puppeteer from "puppeteer";
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { env } from "@/config/env.config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export class PdfService {
    private readonly outputDir: string;

    constructor() {
        this.outputDir = join(__dirname, "../../", env.PDF_STORAGE_DIR);
    }

    async generatePdf (html: string, fileName: string) {
        // Ensure output directory exists
        await mkdir(this.outputDir, { recursive: true });

        const outputPath = join(this.outputDir, `${fileName}.pdf`);

        const browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage"
            ]
        });

        try {
            const page = await browser.newPage();

            await page.setContent(html, {
                waitUntil: "networkidle0"
            });

            await page.pdf({
                path: outputPath,
                format: "A4",
                margin: { top: "0", right: "0", bottom: "0", left: "0" },
                printBackground: true
            });
        } finally {
            await browser.close();
        }

        return `/generated/${fileName}.pdf`;
    }

    async saveHtml (html: string, fileName: string) {
        await mkdir(this.outputDir, { recursive: true });
        const outputPath = join(this.outputDir, `${fileName}.html`);
        await writeFile(outputPath, html, "utf-8");
        return `/generated/${fileName}.html`;
    }
}

export const pdfService = new PdfService();
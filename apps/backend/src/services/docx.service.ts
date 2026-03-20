import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "../templates/docx");
const OUTPUT_DIR = join(__dirname, "../../generated");

interface DocxMergeOptions {
    templateName: string;
    data: Record<string, unknown>;
    outputFileName: string;
}

/**
 * Merges data into a DOCX template and writes the result to disk.
 * Templates live in src/templates/docx/<templateName>.docx
 * Placeholders use docxtemplater syntax: {fieldName}
 *
 * @returns Absolute path to the generated .docx file.
 */
export async function mergeDocxTemplate(options: DocxMergeOptions): Promise<string> {
    const { templateName, data, outputFileName } = options;

    const templatePath = join(TEMPLATES_DIR, `${templateName}.docx`);
    const content = await readFile(templatePath);

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        errorLogging: false
    });

    doc.render(data);

    const buffer = doc.getZip().generate({ type: "nodebuffer" });

    await mkdir(OUTPUT_DIR, { recursive: true });
    const outputPath = join(OUTPUT_DIR, `${outputFileName}.docx`);
    await writeFile(outputPath, buffer);

    return outputPath;
}

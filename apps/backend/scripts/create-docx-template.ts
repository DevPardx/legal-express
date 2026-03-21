import PizZip from "pizzip";
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "../src/templates/docx/document.docx");

const DOCUMENT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>

    <!-- Header -->
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>LEGAL EXPRESS</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:color w:val="64748B"/></w:rPr>
        <w:t>Fast &amp; Reliable Legal Documents</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>

    <!-- Document title -->
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
        <w:t>{documentType} DOCUMENT</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:color w:val="64748B"/></w:rPr>
        <w:t>Reference: LE-{year}-{referenceNumber}</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>

    <!-- Client Information -->
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E3A8A"/></w:rPr>
        <w:t>CLIENT INFORMATION</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">Full Name:  </w:t></w:r>
      <w:r><w:t>{firstName} {lastName}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">Email:  </w:t></w:r>
      <w:r><w:t>{email}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>

    <!-- Document Details -->
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E3A8A"/></w:rPr>
        <w:t>DOCUMENT DETAILS</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">Type:  </w:t></w:r>
      <w:r><w:t>{documentType}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">Generated:  </w:t></w:r>
      <w:r><w:t>{generatedAt}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">Document ID:  </w:t></w:r>
      <w:r><w:t>{documentId}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>

    <!-- Description -->
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E3A8A"/></w:rPr>
        <w:t>DESCRIPTION</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r><w:t>{description}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>

    <!-- Signature block -->
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="1E3A8A"/></w:rPr>
        <w:t>SIGNATURES</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t>_______________________________     _______________________________</w:t></w:r></w:p>
    <w:p><w:r><w:t>Client Signature &amp; Date            Authorized Representative &amp; Date</w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>

    <!-- Footer -->
    <w:p>
      <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="16"/></w:rPr>
        <w:t>Legal Express © {year} — Confidential Document</w:t>
      </w:r>
    </w:p>

    <w:sectPr/>
  </w:body>
</w:document>`;

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml"
    ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="word/document.xml"/>
</Relationships>`;

const WORD_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

async function createTemplate() {
    const zip = new PizZip();

    zip.file("[Content_Types].xml", CONTENT_TYPES);
    zip.file("_rels/.rels", RELS);
    zip.file("word/document.xml", DOCUMENT_XML);
    zip.file("word/_rels/document.xml.rels", WORD_RELS);

    const buffer = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });

    await mkdir(dirname(OUTPUT), { recursive: true });
    await writeFile(OUTPUT, buffer);

    console.log(`DOCX template created: ${OUTPUT}`);
    console.log("Placeholders: {firstName} {lastName} {email} {documentType}");
    console.log("              {documentId} {generatedAt} {year} {referenceNumber} {description}");
}

createTemplate().catch(err => {
    console.error("Failed to create template:", err);
    process.exit(1);
});

# Redis Job Queue — BullMQ Pseudocode

## Enqueue a PDF generation job
```typescript
// Producer (DocumentService)
await pdfQueue.add('generate-pdf', {
  documentId: 'uuid-...',
  jobId: 'uuid-...',
  templateId: 'document',
  formData: { firstName: 'Jane', documentType: 'contract' },
  outputFormat: 'pdf',
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 }
});
// Redis key: bull:pdf-generation:waiting → [jobId1, jobId2, ...]
```

## Dequeue and process (Worker)
```typescript
// Consumer (PdfWorker)
const worker = new Worker('pdf-generation', async (job) => {
  // job.data = { documentId, jobId, templateId, ... }
  const html = await renderTemplate(job.data);
  const pdfPath = await generatePdf(html);
  return { fileUrl: pdfPath };
}, { concurrency: 3 });
```

## Key Redis data structures used by BullMQ

| Key Pattern                       | Type    | Purpose                     |
|-----------------------------------|---------|-----------------------------|
| `bull:pdf-generation:waiting`     | List    | Jobs waiting to be processed |
| `bull:pdf-generation:active`      | Set     | Jobs currently processing   |
| `bull:pdf-generation:completed`   | ZSet    | Completed jobs (TTL applied)|
| `bull:pdf-generation:failed`      | ZSet    | Failed jobs for inspection  |
| `bull:pdf-generation:delayed`     | ZSet    | Retry-delayed jobs          |
| `bull:pdf-generation:{id}`        | Hash    | Job data + metadata         |
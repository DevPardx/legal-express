-- ============================================================
-- SAMPLE QUERIES — Legal Express
-- ============================================================

-- 1. Fetch all OPEN invoices for a specific user
SELECT
    i.id,
    i.amount,
    i.status,
    i.due_date,
    m.title AS matter_title
FROM invoices i
JOIN matters m ON m.id = i.matter_id
WHERE i.user_id = $1       -- UUID parameter
  AND i.status = 'PENDING'
ORDER BY i.due_date ASC;

-- 2. Fetch user's matters with document count (open matters only)
SELECT
    m.id,
    m.title,
    m.status,
    m.created_at,
    COUNT(d.id) FILTER (WHERE d.status = 'COMPLETED') AS completed_docs,
    COUNT(d.id) AS total_docs
FROM matters m
LEFT JOIN documents d ON d.matter_id = m.id
WHERE m.user_id = $1
  AND m.status = 'OPEN'
GROUP BY m.id, m.title, m.status, m.created_at
ORDER BY m.created_at DESC;

-- 3. Get document generation status with job info
SELECT
    d.id AS document_id,
    d.title,
    d.type,
    d.status AS document_status,
    d.file_url,
    j.status AS job_status,
    j.error AS job_error,
    j.attempts,
    j.created_at AS queued_at,
    j.updated_at AS last_updated
FROM documents d
LEFT JOIN jobs j ON j.id = d.job_id
WHERE d.id = $1;

-- 4. Dashboard: overdue invoices report
SELECT
    u.email,
    u.first_name || ' ' || u.last_name AS full_name,
    SUM(i.amount) AS total_overdue,
    COUNT(i.id) AS invoice_count
FROM invoices i
JOIN users u ON u.id = i.user_id
WHERE i.status = 'PENDING'
  AND i.due_date < NOW()
GROUP BY u.id, u.email, u.first_name, u.last_name
ORDER BY total_overdue DESC;

-- 5. Mark overdue invoices (scheduled job)
UPDATE invoices
SET status = 'OVERDUE'
WHERE status = 'PENDING'
  AND due_date < NOW()
RETURNING id, user_id, amount;
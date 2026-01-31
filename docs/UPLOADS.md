# Upload & Parse (PDF reports)

A PDF / image upload endpoint was added to accept medical reports and extract lab values and vitals.

- **POST** `/api/reports/upload` (multipart/form-data)
  - fields: `file` (PDF or image), `memberId` (required), optional `title`, `type`, `date`, `notes`
  - response: created `MedicalReport` object (includes `parsedData` and `originalText`)

Example (use a valid auth token):

```sh
curl -X POST "http://localhost:5000/api/reports/upload" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "memberId=<MEMBER_ID>" \
  -F "file=@path/to/report.pdf"
```

Notes:
- The server attempts text extraction via `pdf-parse` and falls back to OCR using `tesseract.js` if necessary.
- Parsed lab values are converted into `VitalReading` entries when possible (BP, glucose, weight, Hb, creatinine, BMI).

Testing:
- A small Jest test `backend/test/reportParser.test.js` validates the extraction regexes for common labs.

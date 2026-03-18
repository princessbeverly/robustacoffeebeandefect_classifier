// utils/reportHtml.js
// Generates HTML for the Robusta Defect Classifier report.
// Accepts a report object matching the SavedReport shape from reportStorage.ts.

function formatReportId(id, savedAt) {
  if (!id || !savedAt) return 'RDC-0000-000000';
  const date = new Date(savedAt);
  const year = date.getFullYear();
  const shortId = id.replace(/\D/g, '').slice(-6).padStart(6, '0');
  return `RDC-${year}-${shortId}`;
}

function formatReportDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
}

function getIntegrityColor(batchIntegrity) {
  const integrity = Number(batchIntegrity); // ← remove || 0
  if (!Number.isFinite(integrity)) return '#000';
  if (integrity >= 88) return '#14AE5C';       
  else if (integrity >= 75 && integrity <= 87) return '#8D8905';  
  else return '#A71E22';                        
}

/**
 * @param {object} report - SavedReport-shaped object (id, title, savedAt, batchCount, result)
 * @param {object} [opts] - Optional: captureName, origin, producer, weightG
 */
export function generateReportHTML(report, opts = {}) {

  const LOGO_BASE64 = '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'; // Placeholder for base64-encoded logo image
  const r = report?.result || {};
  const reportId = formatReportId(report?.id, report?.savedAt);
  const reportDate = formatReportDate(report?.savedAt);
  const score = r.batchIntegrity != null ? Math.round(r.batchIntegrity) : '—';
  const scoreColor = getIntegrityColor(r.batchIntegrity);
  const batchLabel = report?.title || 'Batch 01';
  const captureName = opts.captureName ?? '—';
  const origin = opts.origin ?? '—';
  const producer = opts.producer ?? '—';
  const weight = opts.weightG != null ? `${opts.weightG}g` : '—';

  const beansAnalyzed = r.beansDetected ?? 0;
  const catOne = r.categoryOne ?? 0;
  const catTwo = r.categoryTwo ?? 0;
  const totalDefectScore = r.totalDefectScore ?? 0;
  const statusTitle = r.statusTitle ?? '—';
  
  const cat1Defects = [
    { label: 'Full Black', count: r.fullBlack ?? 0 },
    { label: 'Full Sour', count: r.fullSour ?? 0 },
    { label: 'Dried Cherry/Pod', count: r.driedCherryPod ?? 0 },
    { label: 'Fungus Damage', count: r.fungusDamage ?? 0 },
    { label: 'Severe Insect Damage', count: r.severeInsectDamage ?? 0 },
    { label: 'Foreign Matter', count: r.foreignMatter ?? 0 },
  ];
  const cat2Defects = [
    { label: 'Partial Black', count: r.partialBlack ?? 0 },
    { label: 'Partial Sour', count: r.partialSour ?? 0 },
    { label: 'Parchment/Pergamino', count: r.parchmentPergamino ?? 0 },
    { label: 'Slight Insect Damage', count: r.slightInsectDamage ?? 0 },
    { label: 'Floater', count: r.floater ?? 0 },
    { label: 'Immature/Unripe', count: r.immatureUnripe ?? 0 },
    { label: 'Withered', count: r.withered ?? 0 },
    { label: 'Shell', count: r.shell ?? 0 },
    { label: 'Broken/Chipped/Cut', count: r.brokenChippedCut ?? 0 },
    { label: 'Hull/Husk', count: r.hullHusk ?? 0 },
  ];

  const photoPath = r.photoPath || '';
  const imgSrc = photoPath ? `file://${photoPath}` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    @page {
      margin: 0;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: white;
    }

    body {
      font-family: Poppins, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      color: #1a1a1a;
      min-height: 100vh;
    }
    .page {
      width: 100%;
      margin: 0;
    }
    .header {
      background: #2e1d0b;
      color: #fff;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .one-line-logo{
      width: 45%;
      height: auto;
      display: block;
      transform: translateY(3px);
    }
    .header-meta {
      font-size: 13px;
      color: rgba(255,255,255,0.9);
      text-align: right;
      white-space: nowrap;
    }
    .content { padding: 28px 24px; }
    .analysis-summary {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e8e8e8;
    }
    .analysis-summary h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #2e1d0b;
      
    }
    .analysis-summary .subtitle {
      font-size: 14px;
      color: #6b6b6b;
      margin: 4px 0 0 0;
    }
    .score-block {
      text-align: right;
    }
    .score-value {
      font-size: 36px;
      font-weight: 700;
    }
    .score-date { font-size: 13px; color: #6b6b6b; }
    .batch-section {
      display: flex;
      gap: 20px;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .batch-thumb {
      width: 120px;
      height: 120px;
      background: #e8e8e8;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .batch-info { flex: 1; min-width: 200px; }
    .batch-info h2 { margin: 0 0 6px 0; font-size: 20px; color: #2e1d0b; }
    .batch-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px 20px;
      font-size: 14px;
      color: #6b6b6b;
    }

    .batch-grid span:nth-child(3),
    .batch-grid span:nth-child(4) {
      margin-top: 10px;
    }
    .sca-box {
      background: #2e1d0b;
      color: rgba(255,255,255,0.95);
      padding: 20px 24px;
      border-radius: 8px;
      margin-bottom: 24px;
      text-align: center;
    }
    .sca-box .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: rgba(255,255,255,0.7);
      margin-bottom: 6px;
    }
    .sca-box .value {
      font-size: 18px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .sca-box .note {
      font-size: 11px;
      color: rgba(255,255,255,0.6);
      margin-top: 8px;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    @media (max-width: 520px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
    .stat-card {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-card .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #6b6b6b;
      margin-bottom: 6px;
    }
    .stat-card .value {
      font-size: 28px;
      font-weight: 700;
      color: #2e1d0b;
    }
    .defect-section h3 {
      font-size: 15px;
      font-weight: 700;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .defect-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    @media (max-width: 560px) {
      .defect-cols { grid-template-columns: 1fr; }
    }
    .defect-list { margin-bottom: 20px; }
    .defect-list h4 {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin: 0 0 10px 0;
    }
    .defect-list.cat1 h4 { color: #a81717; }
    .defect-list.cat2 h4 { color: #8d8905; }
    .defect-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
      color: #4a4a4a;
      border-bottom: 1px solid #eee;
    }
    .defect-row:last-child { border-bottom: none; }

    .disclaimer {
      font-size: 10px;
      color: #6b6b6b;
      text-align: center;
      padding: 12px 24px;
      margin-top: auto;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="header">
      <div class="brand">
       <img class="one-line-logo" src="data:image/png;base64,${LOGO_BASE64}" alt="Robusta logo" />
      </div>
      <div class="header-meta">
        ${reportId}<br>${reportDate}
      </div>
    </header>

    <div class="content">
      <section class="analysis-summary">
        <div>
          <h1>Analysis Report</h1>
          <p class="subtitle">Robusta Coffee Bean Defect Analysis</p>
        </div>
        <div class="score-block">
          <div class="score-value" style="color: ${scoreColor};">${score}%</div>
          <div class="score-date">${reportDate}</div>
        </div>
      </section>

      <section class="batch-section">
        ${imgSrc ? `<img class="batch-thumb" src="${imgSrc}" alt="Batch" />` : '<div class="batch-thumb"></div>'}
        <div class="batch-info">
          <h2>${escapeHtml(batchLabel)}</h2>
          <div class="batch-grid">
            <span>Captured by <strong>${escapeHtml(captureName)}</strong></span>
            <span>${reportDate}</span>

            <span>Origin: <strong>${escapeHtml(origin)}</strong></span>
            <span>Producer: <strong>${escapeHtml(producer)}</strong></span>

            <span>Weight: <strong>${escapeHtml(weight)}</strong></span>
          </div>
        </div>
      </section>

      <section class="sca-box">
        <div class="label">INITIAL GRADE RESULT</div>
        <div class="value">${escapeHtml(statusTitle)}</div>
        <div class="note">Based on visible sample</div>
      </section>

      <section class="stats-row">
        <div class="stat-card">
          <div class="label">Beans Analyzed</div>
          <div class="value">${beansAnalyzed}</div>
        </div>
        <div class="stat-card">
          <div class="label">CAT I</div>
          <div class="value">${catOne}</div>
        </div>
        <div class="stat-card">
          <div class="label">CAT II</div>
          <div class="value">${catTwo}</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Defect Score</div>
          <div class="value">${totalDefectScore}</div>
        </div>
      </section>

      <section class="defect-section">
        <h3>Defect Breakdown</h3>
        <div class="defect-cols">
          <div class="defect-list cat1">
            <h4>Category I Defects</h4>
            ${cat1Defects.map((d) => `<div class="defect-row"><span>${escapeHtml(d.label)}</span><span>${d.count}</span></div>`).join('')}
          </div>
          <div class="defect-list cat2">
            <h4>Category II Defects</h4>
            ${cat2Defects.map((d) => `<div class="defect-row"><span>${escapeHtml(d.label)}</span><span>${d.count}</span></div>`).join('')}
          </div>
        </div>
      </section>
    </div>
    <div class="disclaimer">
      This AI-generated report is not an official SCA certification. Consult a certified Q Grader for formal grading.
    </div>

  </div>
</body>
</html>`;
}

function escapeHtml(text) {
  if (text == null) return '—';
  const s = String(text);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

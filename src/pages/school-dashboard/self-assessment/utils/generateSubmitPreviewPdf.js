import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ensureReportFontsLoaded } from "../../report-generation/utils/generateReportPdf";
import { formatKakshaLabel } from "../../../../utils/assessmentMeta";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPreviewHtml({ previewData, academicYear, round, totalAnswered, title }) {
  const periodParts = [];
  if (academicYear) periodParts.push(`શૈક્ષણિક વર્ષ ${academicYear}`);
  if (round != null && round !== "") periodParts.push(`રાઉન્ડ ${round}`);
  const period = periodParts.join(" · ");
  const domainsHtml = (previewData || [])
    .map((domain) => {
      const subdomainsHtml = (domain.subdomains || [])
        .map(
          (subdomain) => `
            <div class="sp-sub">
              <h3>${escapeHtml(domain.domainIndex)}.${escapeHtml(subdomain.subdomainIndex)} ${escapeHtml(subdomain.subdomainName)}</h3>
              ${(subdomain.questions || [])
                .map((question) => {
                  const kaksha = formatKakshaLabel(question.kakshaLevel);
                  return `
                    <div class="sp-q">
                      <div class="sp-q-meta">
                        ${kaksha ? `<span class="sp-kaksha">${escapeHtml(kaksha)}</span>` : ""}
                        ${question.context ? `<span class="sp-chip">${escapeHtml(question.context)}</span>` : ""}
                      </div>
                      <p class="sp-q-text">${escapeHtml(question.questionText)}</p>
                      ${kaksha ? `<p class="sp-q-kaksha">પસંદ કરેલી કક્ષા: ${escapeHtml(kaksha)}</p>` : ""}
                      <p class="sp-q-answer">${escapeHtml(question.answerLabel)}</p>
                    </div>
                  `;
                })
                .join("")}
            </div>
          `,
        )
        .join("");

      return `
        <section class="sp-domain">
          <h2>${escapeHtml(domain.domainIndex)}. ${escapeHtml(domain.domainName)}</h2>
          ${subdomainsHtml}
        </section>
      `;
    })
    .join("");

  return `
    <div class="sp-doc">
      <header class="sp-header">
        <p class="sp-org">ગુજરાત શૈક્ષણિક સંશોધન અને તાલીમ પરિષદ · GSQAC</p>
        <h1>${escapeHtml(title || "Self-assessment preview")}</h1>
        ${period ? `<p class="sp-period">${escapeHtml(period)}</p>` : ""}
        ${
          typeof totalAnswered === "number"
            ? `<p class="sp-count">${totalAnswered} responses</p>`
            : ""
        }
      </header>
      ${domainsHtml}
    </div>
  `;
}

function applyPreviewStyles(container) {
  const style = document.createElement("style");
  style.textContent = `
    .sp-doc {
      width: ${A4_WIDTH_PX}px;
      box-sizing: border-box;
      padding: 36px 40px 48px;
      background: #ffffff;
      color: #0f172a;
      font-family: "Noto Sans Gujarati", "Noto Sans", sans-serif;
    }
    .sp-header { margin-bottom: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 16px; }
    .sp-org { margin: 0 0 6px; font-size: 12px; color: #475569; font-weight: 600; }
    .sp-header h1 { margin: 0; font-size: 22px; line-height: 1.3; }
    .sp-period, .sp-count { margin: 6px 0 0; font-size: 13px; font-weight: 700; color: #1e3a8a; }
    .sp-domain { margin: 18px 0 8px; page-break-inside: avoid; }
    .sp-domain h2 {
      margin: 0 0 10px;
      font-size: 15px;
      background: #eff6ff;
      color: #1d4ed8;
      padding: 8px 12px;
      border-radius: 8px;
    }
    .sp-sub { margin-bottom: 12px; }
    .sp-sub h3 { margin: 0 0 8px; font-size: 13px; }
    .sp-q {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 8px;
      background: #f8fafc;
    }
    .sp-q-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
    .sp-chip, .sp-kaksha {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .sp-chip { background: #fff7ed; color: #c2410c; }
    .sp-kaksha { background: #1d4ed8; color: #ffffff; }
    .sp-q-text { margin: 0 0 6px; font-size: 12px; line-height: 1.45; }
    .sp-q-kaksha { margin: 0 0 4px; font-size: 12px; font-weight: 800; color: #1e3a8a; }
    .sp-q-answer { margin: 0; font-size: 12px; font-weight: 700; color: #1d4ed8; }
  `;
  container.appendChild(style);
}

export async function generateSubmitPreviewPdf({
  previewData,
  academicYear,
  round,
  totalAnswered,
  title,
  fileName = "self-assessment-preview.pdf",
}) {
  await ensureReportFontsLoaded();

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-12000px";
  host.style.top = "0";
  host.style.width = `${A4_WIDTH_PX}px`;
  host.style.background = "#ffffff";
  host.style.zIndex = "-1";
  applyPreviewStyles(host);
  host.insertAdjacentHTML(
    "beforeend",
    buildPreviewHtml({ previewData, academicYear, round, totalAnswered, title }),
  );
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(host, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: A4_WIDTH_PX,
      windowWidth: A4_WIDTH_PX,
      logging: false,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });
    const pageWidthMm = pdf.internal.pageSize.getWidth();
    const pageHeightMm = pdf.internal.pageSize.getHeight();
    const pageHeightPx = A4_HEIGHT_PX * 2;
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    let offsetY = 0;
    let pageIndex = 0;
    while (offsetY < imgHeight) {
      const sliceHeight = Math.min(pageHeightPx, imgHeight - offsetY);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = imgWidth;
      pageCanvas.height = pageHeightPx;
      const ctx = pageCanvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        offsetY,
        imgWidth,
        sliceHeight,
        0,
        0,
        imgWidth,
        sliceHeight,
      );

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(
        pageCanvas.toDataURL("image/png", 1.0),
        "PNG",
        0,
        0,
        pageWidthMm,
        pageHeightMm,
        undefined,
        "FAST",
      );
      offsetY += pageHeightPx;
      pageIndex += 1;
    }

    pdf.save(fileName);
  } finally {
    document.body.removeChild(host);
  }
}

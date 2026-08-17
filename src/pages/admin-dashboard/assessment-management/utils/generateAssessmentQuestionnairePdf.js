import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ensureReportFontsLoaded } from "../../../school-dashboard/report-generation/utils/generateReportPdf";
import { formatKakshaLabel } from "../../../../utils/assessmentMeta";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const CAPTURE_SCALE = 2;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildQuestionHtml(question, t) {
  const optionsHtml = (question.options || [])
    .map((option) => {
      const kaksha = formatKakshaLabel(option.kakshaLevel, t);
      return `
        <li class="aq-opt">
          ${kaksha ? `<span class="aq-kaksha"><span class="aq-kaksha-text">${escapeHtml(kaksha)}</span></span>` : ""}
          <span class="aq-opt-text">${escapeHtml(option.optionText)}</span>
        </li>
      `;
    })
    .join("");

  return `
    <div class="aq-q">
      <p class="aq-q-text">
        <span class="aq-q-num">${escapeHtml(question.questionNumber)}</span>
        ${escapeHtml(question.questionText)}
      </p>
      ${
        optionsHtml
          ? `<ol class="aq-opts">${optionsHtml}</ol>`
          : `<p class="aq-open">${escapeHtml(
              t("assessment.management.downloadPdfOpenResponse", {
                defaultValue: "Open response / marks",
              }),
            )}</p>`
      }
    </div>
  `;
}

function buildQuestionnaireHtml({
  assessments,
  academicYear,
  round,
  title,
  managementLabel,
  t,
}) {
  const periodParts = [];
  if (academicYear) {
    periodParts.push(
      t("common.academicYearValue", {
        year: academicYear,
        defaultValue: `Academic Year ${academicYear}`,
      }),
    );
  }
  if (round != null && round !== "") {
    periodParts.push(
      t("common.roundValue", {
        round,
        defaultValue: `Round ${round}`,
      }),
    );
  }
  const period = periodParts.join(" · ");

  const assessmentsHtml = (assessments || [])
    .map((assessment, assessmentIndex) => {
      const domainsHtml = (assessment.domains || [])
        .map((domain) => {
          const subdomainsHtml = (domain.subdomains || [])
            .map(
              (subdomain) => `
                <div class="aq-sub">
                  <h3>${escapeHtml(domain.domainIndex)}.${escapeHtml(subdomain.subdomainIndex)} ${escapeHtml(subdomain.subdomainName)}</h3>
                  ${(subdomain.questions || [])
                    .map((question) => buildQuestionHtml(question, t))
                    .join("")}
                </div>
              `,
            )
            .join("");

          return `
            <section class="aq-domain">
              <h2>${escapeHtml(domain.domainIndex)}. ${escapeHtml(domain.domainName)}</h2>
              ${subdomainsHtml}
            </section>
          `;
        })
        .join("");

      const typeLabel = assessment.schoolTypeLabel
        ? ` · ${assessment.schoolTypeLabel}`
        : "";

      return `
        <article class="aq-assessment ${assessmentIndex === 0 ? "aq-assessment--first" : ""}">
          <h1 class="aq-assessment-title">${escapeHtml(assessment.assessmentName)}${escapeHtml(typeLabel)}</h1>
          ${domainsHtml}
        </article>
      `;
    })
    .join("");

  return `
    <div class="aq-doc">
      <header class="aq-header">
        <p class="aq-org">ગુજરાત શૈક્ષણિક સંશોધન અને તાલીમ પરિષદ · GSQAC</p>
        <h1>${escapeHtml(title || "Assessments")}</h1>
        ${managementLabel ? `<p class="aq-role">${escapeHtml(managementLabel)}</p>` : ""}
        ${period ? `<p class="aq-period">${escapeHtml(period)}</p>` : ""}
      </header>
      ${assessmentsHtml}
    </div>
  `;
}

const QUESTIONNAIRE_STYLES = `
  .aq-doc {
    width: ${A4_WIDTH_PX}px;
    box-sizing: border-box;
    padding: 36px 40px 48px;
    background: #ffffff;
    color: #0f172a;
    font-family: "Noto Sans Gujarati", "Noto Sans", sans-serif;
  }
  .aq-header { margin-bottom: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 16px; }
  .aq-org { margin: 0 0 6px; font-size: 12px; color: #475569; font-weight: 600; }
  .aq-header h1 { margin: 0; font-size: 22px; line-height: 1.3; }
  .aq-role, .aq-period { margin: 6px 0 0; font-size: 13px; font-weight: 700; color: #1e3a8a; }
  .aq-assessment { margin-top: 28px; padding-top: 8px; }
  .aq-assessment--first { margin-top: 0; }
  .aq-assessment-title {
    margin: 0 0 14px;
    font-size: 18px;
    color: #1e3a8a;
    padding: 10px 12px;
    background: #fff7ed;
    border-left: 4px solid #f97316;
    border-radius: 6px;
  }
  .aq-domain { margin: 18px 0 8px; }
  .aq-domain h2 {
    margin: 0 0 10px;
    font-size: 15px;
    background: #eff6ff;
    color: #1d4ed8;
    padding: 8px 12px;
    border-radius: 8px;
  }
  .aq-sub { margin-bottom: 12px; }
  .aq-sub h3 { margin: 0 0 8px; font-size: 13px; }
  .aq-q {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 8px;
    background: #f8fafc;
  }
  .aq-q-text { margin: 0 0 8px; font-size: 12px; line-height: 1.45; }
  .aq-q-num { font-weight: 800; color: #1e3a8a; margin-right: 6px; }
  .aq-opts { margin: 0; padding: 0; list-style: none; }
  .aq-opt {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 12px;
    line-height: 1.4;
  }
  .aq-kaksha {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    height: 20px;
    min-height: 20px;
    max-height: 20px;
    padding: 0 10px;
    margin-top: 1px;
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    border-radius: 999px;
    background: #1d4ed8;
    color: #ffffff;
    vertical-align: middle;
  }
  .aq-kaksha-text {
    display: block;
    line-height: 1;
    font-size: 11px;
    font-weight: 800;
    padding-top: 2px;
  }
  .aq-opt-text { color: #0f172a; }
  .aq-open { margin: 0; font-size: 12px; font-weight: 700; color: #c2410c; }
`;

function waitForNextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

export async function generateAssessmentQuestionnairePdf({
  assessments,
  academicYear,
  round,
  title,
  managementLabel,
  t,
  fileName = "assessments.pdf",
}) {
  await ensureReportFontsLoaded();

  const style = document.createElement("style");
  style.setAttribute("data-aq-pdf-style", "true");
  style.textContent = QUESTIONNAIRE_STYLES;
  document.head.appendChild(style);

  const viewport = document.createElement("div");
  viewport.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${A4_WIDTH_PX}px`,
    `height:${A4_HEIGHT_PX}px`,
    "overflow:hidden",
    "clip-path:inset(0)",
    "background:#ffffff",
    "pointer-events:none",
    "z-index:0",
  ].join(";");

  const host = document.createElement("div");
  host.style.cssText = [
    `width:${A4_WIDTH_PX}px`,
    "background:#ffffff",
    "margin:0",
    "padding:0",
  ].join(";");
  host.insertAdjacentHTML(
    "beforeend",
    buildQuestionnaireHtml({
      assessments,
      academicYear,
      round,
      title,
      managementLabel,
      t,
    }),
  );
  viewport.appendChild(host);
  document.body.appendChild(viewport);

  try {
    await waitForNextPaint();

    const totalHeight = Math.max(host.scrollHeight, host.offsetHeight, A4_HEIGHT_PX);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });
    const pageWidthMm = pdf.internal.pageSize.getWidth();
    const pageHeightMm = pdf.internal.pageSize.getHeight();

    let offsetY = 0;
    let pageIndex = 0;
    while (offsetY < totalHeight) {
      host.style.marginTop = `-${offsetY}px`;
      await waitForNextPaint();

      const canvas = await html2canvas(viewport, {
        scale: CAPTURE_SCALE,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        windowWidth: A4_WIDTH_PX,
        windowHeight: A4_HEIGHT_PX,
        scrollX: 0,
        scrollY: 0,
        logging: false,
      });

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(
        canvas.toDataURL("image/png", 1.0),
        "PNG",
        0,
        0,
        pageWidthMm,
        pageHeightMm,
        undefined,
        "FAST",
      );
      offsetY += A4_HEIGHT_PX;
      pageIndex += 1;
    }

    pdf.save(fileName);
  } finally {
    document.body.removeChild(viewport);
    style.remove();
  }
}

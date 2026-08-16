import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "../../school-dashboard/report-generation/utils/reportPageUtils";
import { ensureReportFontsLoaded } from "../../school-dashboard/report-generation/utils/generateReportPdf";

const HARDCOPY_NOTE =
  "આપની રજૂઆત માટે સૌ પ્રથમ હાર્ડકોપીમાં ફોર્મ ડાઉનલોડ કરી અને ભરી ને રાખશો. જેથી ઓનલાઇન ભરતી વખતે સરળતા રહે";

function writeLines(count) {
  return Array.from({ length: count }, () => `<div class="gf-write-line"></div>`).join("");
}

function fieldBox(label, extraClass = "") {
  return `
    <div class="gf-box ${extraClass}">
      <span class="gf-label">${label}</span>
      <div class="gf-input"></div>
    </div>
  `;
}

function buildFormHtml() {
  return `
    <div class="gf-doc">
      <header class="gf-header">
        <p class="gf-org">ગુજરાત શૈક્ષણિક સંશોધન અને તાલીમ પરિષદ (GCERT)</p>
        <p class="gf-council">Gujarat School Quality Assurance Council (GSQAC)</p>
        <h1>રજૂઆત / ફીડબેક ફોર્મ</h1>
      </header>

      <div class="gf-note">${HARDCOPY_NOTE}</div>

      <div class="gf-grid">
        ${fieldBox("પૂરું નામ *")}
        ${fieldBox("મોબાઇલ નંબર * (10 અંક)")}
        ${fieldBox("જિલ્લો *")}
        ${fieldBox("તાલુકો / બ્લોક *")}
        ${fieldBox("શાળાનું નામ *", "gf-box--full")}
        ${fieldBox("ડાયસ (UDISE) — 11 અંક")}
        ${fieldBox("ઇમેઇલ")}
        ${fieldBox("વિભાગ (વૈકલ્પિક)")}
        ${fieldBox("મુખ્યક્ષેત્ર (વૈકલ્પિક)")}
        ${fieldBox("પેટાક્ષેત્ર (વૈકલ્પિક)", "gf-box--full")}
        ${fieldBox("માપદંડ / પ્રશ્ન (વૈકલ્પિક)", "gf-box--full")}
      </div>

      <div class="gf-details">
        <span class="gf-label">રજૂઆતની વિગતો *</span>
        <div class="gf-details-lines">${writeLines(8)}</div>
      </div>

      <div class="gf-sign-row">
        <div class="gf-sign">
          <div class="gf-sign-line"></div>
          <span>સહી</span>
        </div>
        <div class="gf-sign">
          <div class="gf-sign-line"></div>
          <span>તારીખ</span>
        </div>
      </div>

      <p class="gf-footer">આ હાર્ડકોપી ફોર્મ ઓનલાઇન રજૂઆત ભરતી વખતે સહાય માટે છે. સત્તાવાર સબમિટ GSQAC પોર્ટલ પર જ કરવું.</p>
    </div>
  `;
}

function applyFormStyles(container) {
  const style = document.createElement("style");
  style.textContent = `
    .gf-doc {
      width: ${A4_WIDTH_PX}px;
      min-height: ${A4_HEIGHT_PX}px;
      box-sizing: border-box;
      padding: 28px 36px 32px;
      background: #ffffff;
      color: #0f172a;
      font-family: "Noto Sans Gujarati", "Noto Sans", sans-serif;
    }
    .gf-header {
      text-align: center;
      border-bottom: 2.5px solid #1e3a8a;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .gf-org { margin: 0; font-size: 13px; font-weight: 800; color: #1e3a8a; }
    .gf-council { margin: 3px 0 8px; font-size: 11px; font-weight: 600; color: #475569; }
    .gf-header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; }
    .gf-note {
      margin: 0 0 14px;
      padding: 10px 12px;
      background: #fff7ed;
      border: 1px solid #fdba74;
      border-left: 4px solid #f97316;
      border-radius: 6px;
      font-size: 12.5px;
      font-weight: 700;
      line-height: 1.55;
      color: #9a3412;
    }
    .gf-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 12px;
    }
    .gf-box {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .gf-box--full { grid-column: 1 / -1; }
    .gf-label {
      font-size: 11px;
      font-weight: 800;
      color: #1e3a8a;
    }
    .gf-input {
      min-height: 28px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      background: #f8fafc;
    }
    .gf-details { margin-top: 14px; }
    .gf-details-lines { margin-top: 6px; }
    .gf-write-line {
      height: 28px;
      border-bottom: 1px solid #cbd5e1;
    }
    .gf-sign-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 28px;
    }
    .gf-sign {
      text-align: center;
    }
    .gf-sign-line {
      border-bottom: 1px solid #334155;
      height: 36px;
      margin-bottom: 6px;
    }
    .gf-sign span {
      font-size: 12px;
      font-weight: 700;
      color: #334155;
    }
    .gf-footer {
      margin: 22px 0 0;
      font-size: 10px;
      color: #64748b;
      text-align: center;
      line-height: 1.5;
    }
  `;
  container.appendChild(style);
}

export async function generateGrievanceFormPdf({
  fileName = "GSQAC-grievance-form.pdf",
} = {}) {
  await ensureReportFontsLoaded();

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-12000px";
  host.style.top = "0";
  host.style.width = `${A4_WIDTH_PX}px`;
  host.style.background = "#ffffff";
  host.style.zIndex = "-1";
  applyFormStyles(host);
  host.insertAdjacentHTML("beforeend", buildFormHtml());
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

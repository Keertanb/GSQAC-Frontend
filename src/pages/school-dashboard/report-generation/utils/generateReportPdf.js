import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { A4_WIDTH_PX, A4_HEIGHT_PX } from "./reportPageUtils";

const REPORT_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;500;600;700;800&family=Noto+Sans:wght@400;600;700&display=swap";

let fontsLoadPromise = null;

export async function ensureReportFontsLoaded() {
  if (!fontsLoadPromise) {
    fontsLoadPromise = (async () => {
      if (!document.querySelector('link[data-report-font="true"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = REPORT_FONT_HREF;
        link.setAttribute("data-report-font", "true");
        document.head.appendChild(link);
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      if (document.fonts?.load) {
        await Promise.all([
          document.fonts.load('400 12px "Noto Sans Gujarati"'),
          document.fonts.load('600 12px "Noto Sans Gujarati"'),
          document.fonts.load('700 12px "Noto Sans Gujarati"'),
          document.fonts.load('800 12px "Noto Sans Gujarati"'),
        ]).catch(() => undefined);
      }

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    })();
  }

  return fontsLoadPromise;
}

async function waitForImages(element) {
  const tasks = [...element.querySelectorAll("img")].map(
    (img) =>
      new Promise((resolve) => {
        if (img.complete) {
          resolve();
          return;
        }
        img.onload = resolve;
        img.onerror = resolve;
      }),
  );

  const hero = element.querySelector(".rpt-hero__bg");
  if (hero) {
    const bg = hero.style.backgroundImage || getComputedStyle(hero).backgroundImage;
    const match = bg?.match(/url\(["']?(.+?)["']?\)/);
    if (match?.[1]) {
      tasks.push(
        new Promise((resolve) => {
          const image = new Image();
          image.crossOrigin = "anonymous";
          image.onload = resolve;
          image.onerror = resolve;
          image.src = match[1];
        }),
      );
    }
  }

  await Promise.all(tasks);
}

function applyCaptureCloneStyles(clonedElement) {
  clonedElement.style.width = `${A4_WIDTH_PX}px`;
  clonedElement.style.height = `${A4_HEIGHT_PX}px`;
  clonedElement.style.margin = "0";
  clonedElement.style.boxShadow = "none";
  clonedElement.style.transform = "none";

  const page = clonedElement.querySelector(".rpt-page");
  if (page) {
    page.style.width = `${A4_WIDTH_PX}px`;
    page.style.height = `${A4_HEIGHT_PX}px`;
  }

  const hero = clonedElement.querySelector(".rpt-hero__bg");
  if (hero) {
    hero.style.backgroundSize = "cover";
    hero.style.backgroundPosition = "center center";
    hero.style.backgroundRepeat = "no-repeat";
  }

  clonedElement.querySelectorAll(".rpt-cover-score-band__value").forEach((el) => {
    el.style.display = "block";
    el.style.visibility = "visible";
    el.style.lineHeight = "1";
  });

  clonedElement.querySelectorAll(".rpt-cover-score-band__label").forEach((el) => {
    el.style.display = "block";
    el.style.visibility = "visible";
  });

  clonedElement.querySelectorAll(".rpt-page-header__title, .rpt-page-header__subtitle").forEach((el) => {
    el.style.display = "block";
    el.style.visibility = "visible";
  });
}

async function capturePageFrame(pageNode) {
  await waitForImages(pageNode);

  return html2canvas(pageNode, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 15000,
    width: A4_WIDTH_PX,
    height: A4_HEIGHT_PX,
    scrollX: 0,
    scrollY: 0,
    windowWidth: A4_WIDTH_PX,
    windowHeight: A4_HEIGHT_PX,
    onclone: (_clonedDoc, clonedElement) => {
      applyCaptureCloneStyles(clonedElement);
    },
  });
}

export async function waitForPdfCapturePages(pageRefs, expectedCount, timeoutMs = 5000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const pages = pageRefs.current.filter(Boolean);
    if (pages.length >= expectedCount) {
      return pages;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const pages = pageRefs.current.filter(Boolean);
  if (!pages.length) {
    throw new Error("PDF capture layout did not render in time.");
  }

  return pages;
}

export async function generateReportPdf(pageElements, fileName = "school-assessment-report.pdf") {
  const pages = pageElements.filter(Boolean);
  if (!pages.length) {
    throw new Error("No report pages to export");
  }

  await ensureReportFontsLoaded();

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidthMm = pdf.internal.pageSize.getWidth();
  const pageHeightMm = pdf.internal.pageSize.getHeight();

  for (let index = 0; index < pages.length; index += 1) {
    const pageNode = pages[index].classList?.contains("rpt-frame")
      ? pages[index]
      : pages[index].querySelector(".rpt-frame") || pages[index];

    const canvas = await capturePageFrame(pageNode);
    const imgData = canvas.toDataURL("image/png", 1.0);

    if (index > 0) {
      pdf.addPage();
    }

    pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, pageHeightMm, undefined, "SLOW");
  }

  pdf.save(fileName);
}

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
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      if (document.fonts?.load) {
        await Promise.all([
          document.fonts.load('400 16px "Noto Sans Gujarati"'),
          document.fonts.load('600 16px "Noto Sans Gujarati"'),
          document.fonts.load('700 16px "Noto Sans Gujarati"'),
          document.fonts.load('800 16px "Noto Sans Gujarati"'),
        ]).catch(() => undefined);
      }

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    })();
  }

  return fontsLoadPromise;
}

async function preloadImage(url) {
  if (!url) return;
  await new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = resolve;
    image.onerror = resolve;
    image.src = url;
  });
}

async function waitForElementImages(element) {
  const waits = [...element.querySelectorAll("img")].map(
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

  const banner = element.querySelector(".report-cover-banner");
  if (banner) {
    const bgImage = banner.style.backgroundImage;
    const match = bgImage?.match(/url\(["']?(.+?)["']?\)/);
    if (match?.[1]) {
      waits.push(preloadImage(match[1]));
    }
  }

  await Promise.all(waits);
}

function applyPdfCloneStyles(clonedRoot) {
  clonedRoot.classList.add("report-document--pdf-capture");

  clonedRoot.querySelectorAll(".report-page-frame").forEach((frame) => {
    frame.style.width = `${A4_WIDTH_PX}px`;
    frame.style.height = `${A4_HEIGHT_PX}px`;
    frame.style.margin = "0";
    frame.style.boxShadow = "none";
    frame.style.overflow = "hidden";
  });

  clonedRoot.querySelectorAll(".report-cover-banner").forEach((banner) => {
    banner.style.backgroundSize = "cover";
    banner.style.backgroundPosition = "center center";
    banner.style.backgroundRepeat = "no-repeat";
  });

  clonedRoot.querySelectorAll(".report-progress__label").forEach((label) => {
    label.style.transform = "none";
    label.style.top = "auto";
    label.style.position = "relative";
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.height = "100%";
    label.style.lineHeight = "1";
  });

  clonedRoot.querySelectorAll("td, th, p, span, h1, h2, h3, h4, strong").forEach((node) => {
    node.style.fontFamily = '"Noto Sans Gujarati", "Noto Sans", sans-serif';
    node.style.webkitFontSmoothing = "antialiased";
  });
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
    const element = pages[index];
    const pageNode = element.classList?.contains("report-page-frame")
      ? element
      : element.querySelector(".report-page-frame") || element;

    element.scrollIntoView({ block: "start", inline: "nearest" });
    await new Promise((resolve) => setTimeout(resolve, 80));

    await waitForElementImages(pageNode);

    const canvas = await html2canvas(pageNode, {
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 0,
      removeContainer: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: A4_WIDTH_PX,
      windowHeight: A4_HEIGHT_PX,
      onclone: (clonedDoc) => {
        const clonedRoot =
          clonedDoc.querySelector(".report-document") ||
          clonedDoc.querySelector(".report-page-frame")?.parentElement;

        if (clonedRoot) {
          applyPdfCloneStyles(clonedRoot);
        }
      },
    });

    const imgData = canvas.toDataURL("image/png");

    if (index > 0) {
      pdf.addPage();
    }

    pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, pageHeightMm, undefined, "FAST");
  }

  pdf.save(fileName);
}

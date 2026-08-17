const express = require("express");
const path = require("path");
const PDFDocument = require("pdfkit");
const db = require("../db");
const { requireAuth } = require("../auth");
const { decrypt } = require("../crypto");
const asyncRoute = require("../asyncRoute");

const router = express.Router();
router.use(requireAuth);

const FONT_DIR = path.join(__dirname, "..", "fonts");
function registerFonts(doc) {
  doc.registerFont("Plex", path.join(FONT_DIR, "IBMPlexSans-Regular.ttf"));
  doc.registerFont("PlexMedium", path.join(FONT_DIR, "IBMPlexSans-Medium.ttf"));
  doc.registerFont("PlexSemiBold", path.join(FONT_DIR, "IBMPlexSans-SemiBold.ttf"));
  doc.registerFont("PlexBold", path.join(FONT_DIR, "IBMPlexSans-Bold.ttf"));
  doc.registerFont("PlexItalic", path.join(FONT_DIR, "IBMPlexSans-Italic.ttf"));
}

const TEXT_COLOR = "#000000";
const BORDER = "#dadce0";

const LOGO_PATH = path.join(__dirname, "..", "..", "client", "public", "logo.png");

const WEBSITE_LABEL = "enspirefx.com";
const WEBSITE_URL = "https://enspirefx.com";

const COMPANY = {
  tagline: "EnspireFX Websites — Best Web Designer in Ghana",
  accra: "Accra Office: Soursop St GS-0750-8619, Iron City-Amanfrom, Ga South, Accra – Ghana",
  tema: "Tema Office: DPS International School Road, Off Afao Road, Community 25, Tema, Ghana",
  phone: "+233 55 091 9202",
  email: "contact@enspirefx.com",
};

function drawFooter(doc, pageNum, pageCount) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const width = right - left;
  let y = doc.page.height - doc.page.margins.bottom + 14;

  // Text placed below `page.height - margins.bottom` would otherwise trip
  // pdfkit's automatic page-break-on-overflow, even with an explicit y — so
  // drop the bottom margin to 0 for the duration of the footer draw.
  const savedBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;

  doc.strokeColor(BORDER).lineWidth(1).moveTo(left, y).lineTo(right, y).stroke();
  y += 10;

  doc.fillColor(TEXT_COLOR).font("PlexSemiBold").fontSize(8.5).text(COMPANY.tagline, left, y, { lineBreak: false });
  y += 12;
  doc.fillColor(TEXT_COLOR).font("Plex").fontSize(7).text(COMPANY.accra, left, y, { width, lineBreak: false });
  y += 10;
  doc.fillColor(TEXT_COLOR).font("Plex").fontSize(7).text(COMPANY.tema, left, y, { width, lineBreak: false });
  y += 11;

  const contactLine = `${COMPANY.phone}   ·   ${COMPANY.email}   ·   ${WEBSITE_LABEL}`;
  doc.fillColor(TEXT_COLOR).font("PlexMedium").fontSize(7.5).text(contactLine, left, y, { lineBreak: false });
  doc
    .fillColor(TEXT_COLOR)
    .font("Plex")
    .fontSize(7.5)
    .text(`Page ${pageNum} of ${pageCount}`, left, y, { width, align: "right", lineBreak: false });

  // Make just the "enspirefx.com" part of the line clickable.
  const prefixWidth = doc.font("PlexMedium").fontSize(7.5).widthOfString(contactLine.slice(0, contactLine.lastIndexOf(WEBSITE_LABEL)));
  const linkWidth = doc.font("PlexMedium").fontSize(7.5).widthOfString(WEBSITE_LABEL);
  doc.link(left + prefixWidth, y, linkWidth, 10, WEBSITE_URL);
  y += 11;

  doc
    .fillColor(TEXT_COLOR)
    .font("PlexItalic")
    .fontSize(6.5)
    .text("Confidential — for internal EnspireFX use only. Do not forward without authorization.", left, y, {
      width,
      lineBreak: false,
    });

  doc.page.margins.bottom = savedBottom;
}

const TYPE_LABELS = {
  cpanel: "cPanel",
  wordpress: "WordPress",
  webmail: "Webmail",
  hosting: "Hosting",
  domain: "Domain Registrar",
  email: "Email",
  ftp: "FTP",
  database: "Database",
  social: "Social Media",
  other: "Other",
};

router.get(
  "/clients/:clientId/pdf",
  asyncRoute(async (req, res) => {
    const client = await db.get("SELECT * FROM clients WHERE id = ?", [req.params.clientId]);
    if (!client) return res.status(404).json({ error: "Client not found" });

    const platforms = await db.all(
      "SELECT * FROM platforms WHERE client_id = ? ORDER BY sort_order ASC, created_at ASC",
      [client.id]
    );

    const doc = new PDFDocument({
    size: "A4",
    margins: { top: 48, bottom: 112, left: 48, right: 48 },
    bufferPages: true,
  });
  const filename = `${client.name.replace(/[^a-z0-9\-_ ]/gi, "").trim() || "client"}-credentials.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  doc.pipe(res);
  registerFonts(doc);

  // Header — just the mark, no app-name label
  const headerTop = doc.y;
  try {
    doc.image(LOGO_PATH, doc.page.margins.left, headerTop, { width: 28, height: 28 });
  } catch {
    /* logo optional */
  }

  doc.x = doc.page.margins.left;
  doc.y = headerTop + 28;
  doc.moveDown(1.2);
  doc
    .fillColor(TEXT_COLOR)
    .font("PlexBold")
    .fontSize(22)
    .text(client.name);

  if (client.website) {
    doc.moveDown(0.1);
    doc.fillColor(TEXT_COLOR).font("Plex").fontSize(11).text(client.website);
  }

  doc.moveDown(0.2);
  doc
    .fillColor(TEXT_COLOR)
    .font("Plex")
    .fontSize(9)
    .text(`Generated ${new Date().toLocaleString()}`);

  doc.moveDown(0.6);
  doc
    .strokeColor(BORDER)
    .lineWidth(1)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(1);

  if (client.notes) {
    doc.fillColor(TEXT_COLOR).font("PlexItalic").fontSize(10).text(client.notes);
    doc.moveDown(1);
  }

  if (platforms.length === 0) {
    doc.fillColor(TEXT_COLOR).font("Plex").fontSize(11).text("No platforms have been added for this client yet.");
  }

  platforms.forEach((p, idx) => {
    if (doc.y > doc.page.height - doc.page.margins.bottom - 130) {
      doc.addPage();
    }

    const typeLabel = TYPE_LABELS[p.platform_type] || p.platform_type || "Other";

    doc.fillColor(TEXT_COLOR).font("PlexSemiBold").fontSize(13).text(p.label);
    doc.fillColor(TEXT_COLOR).font("Plex").fontSize(9).text(typeLabel.toUpperCase(), { characterSpacing: 0.4 });
    doc.moveDown(0.35);

    const rows = [];
    if (p.url) rows.push(["URL", p.url]);
    if (p.username) rows.push(["Username", p.username]);
    if (p.password_enc) rows.push(["Password", decrypt(p.password_enc)]);
    if (p.notes) rows.push(["Notes", p.notes]);

    const labelWidth = 80;
    rows.forEach(([label, value]) => {
      const startY = doc.y;
      doc
        .fillColor(TEXT_COLOR)
        .font("PlexMedium")
        .fontSize(10)
        .text(label, doc.page.margins.left, startY, { width: labelWidth, continued: false });
      doc
        .fillColor(TEXT_COLOR)
        .font("Plex")
        .fontSize(10)
        .text(value, doc.page.margins.left + labelWidth, startY, {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right - labelWidth,
          characterSpacing: label === "Password" ? 0.3 : 0,
        });
      doc.moveDown(0.15);
    });

    doc.moveDown(0.5);
    if (idx < platforms.length - 1) {
      doc
        .strokeColor(BORDER)
        .lineWidth(0.5)
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke();
      doc.moveDown(0.6);
    }
  });

  const pageRange = doc.bufferedPageRange();
  for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc, i - pageRange.start + 1, pageRange.count);
  }

    doc.end();
  })
);

module.exports = router;

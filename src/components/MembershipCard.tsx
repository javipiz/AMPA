"use client";

import React, { useState } from "react";
import { Family, Role } from "../types";
import { Button } from "./Button";
import { Printer, Mail, ShieldCheck, Download, Loader2 } from "lucide-react";
import QRCode from "react-qr-code";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";

interface MembershipCardProps {
  family: Family;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({ family }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const schoolYear = `${currentYear}-${nextYear}`;

  const socioNumber = family.membershipNumber || family.id;

  const qrValidationText = `AMPA AGUSTINOS
Socio: ${socioNumber}
${family.familyName}
Curso: ${schoolYear}`;

  const parents = family.members.filter(
    (m) =>
      m.role === Role.FATHER ||
      m.role === Role.MOTHER ||
      m.role === Role.TUTOR
  );

  const children = family.members.filter((m) => m.role === Role.CHILD);

  // ---------------- IMPRIMIR (usa HTML + Tailwind en una ventana nueva) --------
  const handlePrint = () => {
    const cardContent =
      document.getElementById("membership-card-visual")?.innerHTML;
    if (!cardContent) return;

    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Carnet de Socio - ${family.familyName}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
              @page { size: A4; margin: 0; }
              body {
                font-family: 'Montserrat', sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                padding-top: 20mm;
                background-color: white;
                margin: 0;
              }
              .id-card-wrapper {
                width: 85.6mm;
                height: 53.98mm;
                container-type: inline-size;
                position: relative;
                margin-bottom: 20px;
                outline: 1px dashed #cbd5e1;
              }
              .card-visual {
                width: 100%;
                height: 100%;
                border-radius: 3mm;
                overflow: hidden;
                position: relative;
                background: linear-gradient(to bottom right, #b91c1c, #dc2626, #991b1b);
                color: white;
              }
              .instructions {
                font-size: 10px;
                color: #64748b;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <h2 class="text-xl font-bold mb-4">AMPA Agustinos Granada</h2>
            <div class="id-card-wrapper">
              <div class="card-visual relative select-none">
                ${cardContent}
              </div>
            </div>
            <div class="instructions">
              <p>Recortar por la línea punteada.</p>
            </div>
            <script>
              setTimeout(() => { window.print(); window.close(); }, 800);
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
    }
  };

  // ---------------- PDF + EMAIL (usa versión OCULTA sin Tailwind) --------------
  const handleEmail = async (provider: "default" | "gmail") => {
    setIsGenerating(true);
    try {
      const element = document.getElementById("membership-card-export");
      if (!element) throw new Error("Element not found");

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const cardWidth = 85.6;
      const cardHeight = 54;
      const x = (210 - cardWidth) / 2;
      const y = 30;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("AMPA AGUSTINOS GRANADA", 105, 20, { align: "center" });

      pdf.addImage(imgData, "PNG", x, y, cardWidth, cardHeight);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(
        "Carnet digital de socio válido para el curso escolar " + schoolYear,
        105,
        y + cardHeight + 10,
        { align: "center" }
      );

      const fileName = `Carnet_AMPA_${socioNumber}.pdf`;
      const pdfBlob = pdf.output("blob");
      saveAs(pdfBlob, fileName);

      const membersList = family.members
        .map((m) => `• ${m.firstName} ${m.lastName} (${m.role})`)
        .join("\n");

      const subject = `Carnet Digital AMPA - Curso ${schoolYear} - Familia ${family.familyName}`;
      const body = `Estimada ${family.familyName},\n\nAdjuntamos su carnet de socio.\n\nINTEGRANTES:\n${membersList}\n\n* IMPORTANTE: Se ha descargado el archivo "${fileName}". Por favor, adjúntalo.`;

      setTimeout(() => {
        if (provider === "gmail") {
          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
            family.email
          )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.open(gmailUrl, "_blank");
        } else {
          window.location.href = `mailto:${family.email}?subject=${encodeURIComponent(
            subject
          )}&body=${encodeURIComponent(body)}`;
        }

        alert(
          `PDF generado y descargado.\n\nAdjunta el archivo "${fileName}" en tu correo.`
        );
        setIsGenerating(false);
      }, 800);
    } catch (error) {
      console.error(error);
      alert("Error generando el PDF.");
      setIsGenerating(false);
    }
  };

  // ---------------- JPG MÓVIL (usa versión OCULTA simple) ----------------------
  const handleDownloadMobileCard = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById("mobile-card-export");
      if (!element) throw new Error("Element not found");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0f172a",
        height: element.scrollHeight,
        windowHeight: element.scrollHeight,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );

      if (blob) {
        saveAs(blob, `Carnet_Movil_Socio_${socioNumber}.jpg`);
      }
    } catch (error) {
      console.error(error);
      alert("Error al generar la imagen para móvil.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ---------------- UI VISIBLE (Tailwind, lo que ves tú) ----------------------
  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="text-red-600" />
          <h3 className="text-lg font-bold text-slate-800">Carnet de Socio</h3>
        </div>

        {/* CARD VISUAL PRINCIPAL (para la vista, no para html2canvas) */}
        <div style={{ containerType: "inline-size" }} className="w-full mb-6">
          <div
            id="membership-card-visual"
            className="relative w-full aspect-[1.586/1] rounded-[3cqw] overflow-hidden shadow-lg text-white select-none"
            style={{
              fontFamily: "'Montserrat', sans-serif",
              background:
                "linear-gradient(to bottom right, #b91c1c, #dc2626, #991b1b)",
            }}
          >
            <div className="relative z-10 w-full h-full flex px-[3cqw] py-[2.5cqw] gap-[3cqw]">
              {/* Columna izquierda: datos */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[2cqw] font-semibold tracking-[0.25em] uppercase text-red-100/80">
                    AMPA AGUSTINOS
                  </p>
                  <h2 className="mt-[0.8cqw] text-[4.8cqw] font-extrabold leading-tight drop-shadow-sm">
                    {family.familyName}
                  </h2>

                  <p className="mt-[0.8cqw] text-[2.6cqw] text-red-100/90">
                    Nº Socio{" "}
                    <span className="font-mono text-white text-[3cqw]">
                      #{socioNumber}
                    </span>
                  </p>

                  <p className="mt-[0.5cqw] text-[2.2cqw] text-red-100/85">
                    Curso escolar{" "}
                    <span className="font-semibold text-red-50">
                      {schoolYear}
                    </span>
                  </p>
                </div>

                <div className="mt-[1.6cqw] space-y-[0.5cqw] text-red-100/90">
                  {parents.length > 0 && (
                    <div>
                      <p className="uppercase text-[1.7cqw] tracking-[0.18em] text-red-200/90 mb-[0.2cqw]">
                        TITULARES
                      </p>
                      <p className="font-semibold text-[2.5cqw]">
                        {parents
                          .map((m) => `${m.firstName} ${m.lastName}`)
                          .join(" · ")}
                      </p>
                    </div>
                  )}

                  {children.length > 0 && (
                    <div>
                      <p className="uppercase text-[1.7cqw] tracking-[0.18em] text-red-200/90 mb-[0.2cqw]">
                        HIJOS/AS
                      </p>
                      <p className="text-[2.3cqw]">
                        {children
                          .map((m) => `${m.firstName} ${m.lastName}`)
                          .join(" · ")}
                      </p>
                    </div>
                  )}
                </div>

                <p className="mt-[1cqw] text-[1.7cqw] text-red-100/80">
                  Carnet válido para actividades organizadas por el AMPA
                  Agustinos Granada.
                </p>
              </div>

              {/* Columna derecha: QR */}
              <div className="flex flex-col items-center justify-between w-[32%]">
                <div className="bg-white/15 rounded-2xl p-[1.4cqw] shadow-inner">
                  <QRCode
                    value={qrValidationText}
                    style={{ width: "100%", height: "auto" }}
                  />
                </div>

                <div className="text-center mt-[1cqw]">
                  <p className="text-[1.8cqw] font-semibold tracking-[0.2em] uppercase text-red-100/90">
                    VALIDADO
                  </p>
                  <p className="text-[1.6cqw] text-red-100/80">
                    Junta Directiva AMPA
                  </p>
                </div>

                <div className="flex flex-col items-center gap-[0.4cqw]">
                  <span className="text-[1.6cqw] uppercase tracking-[0.4em] text-red-200">
                    GRANADA
                  </span>
                  <span className="w-[60%] h-[0.25cqw] bg-red-200/60 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTONES */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={handlePrint}
              icon={<Printer size={16} />}
            >
              Imprimir
            </Button>

            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                onClick={() => handleEmail("default")}
                icon={<Mail size={16} />}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Email (App)"
                )}
              </Button>

              <Button
                variant="secondary"
                onClick={() => handleEmail("gmail")}
                icon={<Mail size={16} />}
                disabled={isGenerating}
                className="text-[11px] bg-red-50 text-red-700 border-red-100"
              >
                Gmail Web
              </Button>
            </div>
          </div>

          <Button
            variant="primary"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white border-transparent"
            icon={<Download size={18} />}
            onClick={handleDownloadMobileCard}
            disabled={isGenerating}
          >
            {isGenerating ? "Generando..." : "Descargar JPG (Móvil)"}
          </Button>
        </div>
      </div>

      {/* ---------- ZONA OCULTA SOLO PARA EXPORTAR (sin Tailwind, solo inline) ---------- */}
      <div
        style={{
          position: "absolute",
          left: "-99999px",
          top: 0,
          pointerEvents: "none",
          opacity: 0,
        }}
      >
        {/* Versión export PDF (mismo formato tarjeta física) */}
        <div
          id="membership-card-export"
          style={{
            width: "340px",
            height: "214px",
            borderRadius: "12px",
            background:
              "linear-gradient(to bottom right, #b91c1c, #dc2626, #991b1b)",
            color: "#ffffff",
            padding: "14px 18px",
            fontFamily: "Montserrat, system-ui, sans-serif",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "stretch",
            boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
          }}
        >
          {/* Columna izquierda */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              marginRight: "10px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "#fee2e2",
                }}
              >
                AMPA AGUSTINOS
              </p>
              <h2
                style={{
                  marginTop: "4px",
                  fontSize: "18px",
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                {family.familyName}
              </h2>

              <p
                style={{
                  marginTop: "4px",
                  fontSize: "11px",
                  color: "#ffedea",
                }}
              >
                Nº Socio{" "}
                <span
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  #{socioNumber}
                </span>
              </p>

              <p
                style={{
                  marginTop: "2px",
                  fontSize: "10px",
                  color: "#fee2e2",
                }}
              >
                Curso escolar{" "}
                <span style={{ fontWeight: 600, color: "#fef2f2" }}>
                  {schoolYear}
                </span>
              </p>
            </div>

            <div style={{ marginTop: "8px" }}>
              {parents.length > 0 && (
                <div style={{ marginBottom: "4px" }}>
                  <p
                    style={{
                      fontSize: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "#fee2e2",
                      marginBottom: "2px",
                    }}
                  >
                    Titulares
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {parents
                      .map((m) => `${m.firstName} ${m.lastName}`)
                      .join(" · ")}
                  </p>
                </div>
              )}

              {children.length > 0 && (
                <div>
                  <p
                    style={{
                      fontSize: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "#fee2e2",
                      marginBottom: "2px",
                    }}
                  >
                    Hijos/as
                  </p>
                  <p
                    style={{
                      fontSize: "10px",
                    }}
                  >
                    {children
                      .map((m) => `${m.firstName} ${m.lastName}`)
                      .join(" · ")}
                  </p>
                </div>
              )}
            </div>

            <p
              style={{
                marginTop: "6px",
                fontSize: "8px",
                color: "#fee2e2",
              }}
            >
              Carnet válido para actividades organizadas por el AMPA Agustinos
              Granada.
            </p>
          </div>

          {/* Columna derecha */}
          <div
            style={{
              width: "105px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.14)",
                borderRadius: "12px",
                padding: "8px",
                boxShadow: "inset 0 0 0 1px rgba(248,250,252,0.2)",
                width: "100%",
              }}
            >
              <QRCode
                value={qrValidationText}
                style={{ width: "100%", height: "auto" }}
              />
            </div>

            <div style={{ textAlign: "center", marginTop: "6px" }}>
              <p
                style={{
                  fontSize: "8px",
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#fee2e2",
                }}
              >
                Validado
              </p>
              <p
                style={{
                  fontSize: "8px",
                  color: "#fee2e2",
                  marginTop: "2px",
                }}
              >
                Junta Directiva AMPA
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.3em",
                  color: "#fecaca",
                }}
              >
                Granada
              </span>
              <span
                style={{
                  marginTop: "2px",
                  width: "60%",
                  height: "2px",
                  borderRadius: "9999px",
                  backgroundColor: "#fecaca",
                }}
              />
            </div>
          </div>
        </div>

        {/* Versión móvil export (JPG para móvil) */}
        <div
          id="mobile-card-export"
          style={{
            width: "420px",
            borderRadius: "16px",
            background:
              "linear-gradient(to bottom right, #020617, #0f172a, #1e293b)",
            color: "#e5e7eb",
            padding: "20px",
            fontFamily: "Montserrat, system-ui, sans-serif",
            boxSizing: "border-box",
            boxShadow: "0 18px 40px rgba(15,23,42,0.8)",
            marginTop: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "10px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "#7dd3fc",
                  fontWeight: 600,
                }}
              >
                AMPA Agustinos
              </p>
              <h2
                style={{
                  marginTop: "4px",
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#f9fafb",
                }}
              >
                {family.familyName}
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  marginTop: "4px",
                  color: "#e0f2fe",
                }}
              >
                Nº Socio{" "}
                <span
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular",
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  #{socioNumber}
                </span>
              </p>
              <p
                style={{
                  fontSize: "11px",
                  marginTop: "2px",
                  color: "#bae6fd",
                }}
              >
                Curso {schoolYear}
              </p>
            </div>

            <div
              style={{
                backgroundColor: "rgba(15,23,42,0.8)",
                borderRadius: "12px",
                padding: "6px",
                boxShadow: "0 0 0 1px rgba(148,163,184,0.4)",
              }}
            >
              <QRCode value={qrValidationText} size={80} />
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(148,163,184,0.5)",
              paddingTop: "8px",
              marginTop: "6px",
              fontSize: "13px",
            }}
          >
            {parents.length > 0 && (
              <div style={{ marginBottom: "6px" }}>
                <p
                  style={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "#7dd3fc",
                    marginBottom: "2px",
                  }}
                >
                  Titulares
                </p>
                <ul style={{ margin: 0, paddingLeft: "12px" }}>
                  {parents.map((m) => (
                    <li key={`${m.firstName}-${m.lastName}`}>
                      • {m.firstName} {m.lastName}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {children.length > 0 && (
              <div>
                <p
                  style={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "#7dd3fc",
                    marginBottom: "2px",
                  }}
                >
                  Hijos/as
                </p>
                <ul style={{ margin: 0, paddingLeft: "12px" }}>
                  {children.map((m) => (
                    <li key={`${m.firstName}-${m.lastName}`}>
                      • {m.firstName} {m.lastName}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <p
            style={{
              marginTop: "10px",
              fontSize: "11px",
              color: "#cbd5f5",
            }}
          >
            Presentando este carnet podrás identificarte como socio/a del AMPA
            Agustinos Granada durante el curso {schoolYear}.
          </p>
        </div>
      </div>
    </>
  );
};

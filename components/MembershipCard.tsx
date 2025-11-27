import React, { useState } from 'react';
import { Family, Role } from '../types';
import { Button } from './Button';
import { Printer, Mail, ShieldCheck, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import FileSaver from 'file-saver';

interface MembershipCardProps {
  family: Family;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({ family }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const schoolYear = `${currentYear}-${nextYear}`;

  // Validation text for the QR Code
  const qrValidationText = `AMPA AGUSTINOS
Socio: ${family.membershipNumber}
${family.familyName}
Curso: ${schoolYear}`;

  const handlePrint = () => {
    const cardContent = document.getElementById('membership-card-visual')?.innerHTML;
    if (!cardContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Carnet de Socio - ${family.familyName}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
              @page {
                size: A4;
                margin: 0;
              }
              body { 
                font-family: 'Montserrat', sans-serif; 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
                display: flex; 
                flex-direction: column;
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                background-color: #ffffff; 
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
                font-family: sans-serif;
              }
            </style>
          </head>
          <body>
            <div class="id-card-wrapper">
               <div class="card-visual relative select-none">
                  ${cardContent}
               </div>
            </div>
            <div class="instructions">
              <p>Tamaño Estándar Tarjeta (85.6mm x 54mm)</p>
              <p>Recortar por la línea punteada.</p>
            </div>
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 800);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleEmail = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('membership-card-visual');
      if (!element) {
        alert("No se encuentra el elemento visual del carnet.");
        setIsGenerating(false);
        return;
      }

      // 1. Generate PDF
      const canvas = await html2canvas(element, {
        scale: 4,
        useCORS: true,
        backgroundColor: null,
        letterRendering: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98]
      });

      doc.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98);
      
      // Download the PDF (Browsers cannot attach files to mailto automatically)
      doc.save(`Carnet_AMPA_${family.membershipNumber}.pdf`);

      // 2. Prepare the Email Body
      const membersList = family.members
        .map(m => `• ${m.firstName} ${m.lastName} (${m.role})`)
        .join('\n');

      const subject = `Carnet Digital AMPA - Curso ${schoolYear} - Familia ${family.familyName}`;
      const body = `Estimada ${family.familyName},

Adjuntamos su carnet de socio en formato digital para el curso ${schoolYear}.

DATOS DEL SOCIO:
Nº Socio: ${family.membershipNumber}
Familia: ${family.familyName}

INTEGRANTES INCLUIDOS:
${membersList}

Por favor, guarde el archivo PDF adjunto (se ha descargado en su dispositivo).

Saludos cordiales,
AMPA Agustinos Granada`;

      // 3. Open Mail Client
      setTimeout(() => {
          window.location.href = `mailto:${family.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          setIsGenerating(false);
      }, 800);

    } catch (error) {
      console.error(error);
      alert("Error generando el proceso de email.");
      setIsGenerating(false);
    }
  };

  const handleDownloadMobileCard = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('mobile-card-export');
      if (!element) {
        alert("No se pudo generar el carnet móvil.");
        setIsGenerating(false);
        return;
      }
      
      const canvas = await html2canvas(element, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#f8fafc'
      });
      
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if(blob) {
         (FileSaver as any).saveAs(blob, `Carnet_Movil_Socio_${family.membershipNumber}.jpg`);
      } else {
        alert("Error al crear el archivo de imagen.");
      }

    } catch (error) {
      console.error(error);
      alert("Error generando el Carnet Móvil.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="text-red-600" />
          <h3 className="text-lg font-bold text-slate-800">Carnet de Socio</h3>
        </div>

        {/* STANDARD CARD (Landscape) - Visual for Print/Email */}
        {/* Adjusted Font Sizes and Spacing for HTML2Canvas consistency */}
        <div style={{ containerType: 'inline-size' }} className="w-full mb-6">
          <div 
            id="membership-card-visual" 
            className="relative w-full aspect-[1.586/1] rounded-[3cqw] overflow-hidden shadow-lg bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-white select-none"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <div className="absolute top-0 right-0 w-[25cqw] h-[25cqw] bg-white opacity-5 rounded-bl-full translate-x-[5cqw] -translate-y-[5cqw]"></div>
            <div className="absolute bottom-0 left-0 w-[20cqw] h-[20cqw] bg-black opacity-10 rounded-tr-full -translate-x-[4cqw] translate-y-[4cqw]"></div>
            
            <div className="relative z-10 h-full flex flex-col" style={{ padding: '4.5cqw' }}>
              {/* Header */}
              <div className="flex justify-between items-start mb-[1cqw]">
                <div className="flex items-center" style={{ gap: '2cqw' }}>
                  <div id="logo-source" className="bg-white/95 rounded-[1.5cqw] shadow-md flex items-center justify-center" style={{ padding: '1cqw', height: '11cqw', width: '11cqw' }}>
                     <img 
                       src="/logo.png" 
                       alt="Logo" 
                       className="w-full h-full object-contain" 
                       onError={(e) => {
                         e.currentTarget.style.display = 'none';
                         e.currentTarget.parentElement!.innerHTML = `<div style="font-size: 3cqw; font-weight: 900; color: #b91c1c;">AG</div>`;
                       }}
                     />
                  </div>
                  <div>
                    <h4 className="font-bold tracking-wide leading-none shadow-sm" style={{ fontSize: '3.5cqw', marginBottom: '0.5cqw' }}>AMPA AGUSTINOS</h4>
                    <p className="text-white uppercase tracking-widest font-bold" style={{ fontSize: '2cqw' }}>Granada</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-white uppercase tracking-widest font-bold" style={{ fontSize: '1.8cqw' }}>Curso Escolar</span>
                  <span className="block font-black text-yellow-400 leading-none drop-shadow-sm" style={{ fontSize: '4.5cqw', marginTop: '0.5cqw' }}>{schoolYear}</span>
                </div>
              </div>

              <div className="flex flex-col flex-1 justify-center" style={{ gap: '1.2cqw' }}>
                <div style={{ marginBottom: '0.5cqw' }}>
                   <p className="text-white uppercase tracking-widest font-bold" style={{ fontSize: '1.8cqw', marginBottom: '0.5cqw' }}>Familia</p>
                   {/* Reduced size slightly to prevent wrapping on long names */}
                   <h2 className="font-bold tracking-tight leading-normal drop-shadow-sm pb-[0.5cqw]" style={{ fontSize: '4.8cqw' }}>{family.familyName}</h2>
                </div>
                
                <div className="flex items-center justify-between" style={{ gap: '1.5cqw' }}>
                   <div className="flex items-center flex-1 min-w-0" style={{ gap: '2cqw' }}>
                      {/* Membership Number Box */}
                      <div className="flex flex-col bg-white/10 backdrop-blur-md border border-white/30 shadow-inner shrink-0 text-center justify-center" style={{ padding: '1cqw 1.5cqw', borderRadius: '1.5cqw', height: '14cqw' }}>
                          <p className="text-white uppercase tracking-widest font-bold" style={{ fontSize: '1.5cqw', marginBottom: '0.5cqw' }}>Nº Socio</p>
                          {/* Force line-height 1 to fix centering */}
                          <h2 className="font-black tracking-tighter text-white drop-shadow-md flex items-center justify-center" style={{ fontSize: '5cqw', lineHeight: '1', margin: 0 }}>{family.membershipNumber}</h2>
                      </div>
                      
                      {/* Members List */}
                      <div className="flex flex-col min-w-0 border-l border-white/30" style={{ paddingLeft: '2cqw', height: '100%', justifyContent: 'center' }}>
                        <p className="text-white uppercase tracking-widest font-bold" style={{ fontSize: '1.5cqw', marginBottom: '0.8cqw' }}>Integrantes</p>
                        <div className="flex flex-col" style={{ gap: '0.4cqw' }}>
                          {family.members.slice(0, 6).map((m, i) => (
                            // Reduced font size, removed truncate, changed to bold instead of black for better PDF rendering
                            <div key={i} className="text-white flex items-baseline gap-[0.5cqw] whitespace-nowrap overflow-hidden" style={{ fontSize: '2.7cqw', lineHeight: '1.1' }}>
                               <span className="font-bold">{m.firstName}</span> <span className="font-medium opacity-90">{m.lastName}</span>
                            </div>
                          ))}
                          {family.members.length > 6 && (
                             <div className="text-white italic opacity-80" style={{ fontSize: '2cqw' }}>... y {family.members.length - 6} más</div>
                          )}
                        </div>
                      </div>
                   </div>
                   
                   {/* QR Code */}
                   <div className="bg-white shadow-xl shrink-0 flex items-center justify-center" style={{ padding: '1cqw', borderRadius: '1.5cqw', width: '22cqw', height: '22cqw' }}>
                        <div style={{ height: "100%", width: "100%" }}>
                          <QRCode 
                            id={`qr-code-${family.id}`}
                            size={256} 
                            style={{ height: "100%", width: "100%" }} 
                            value={qrValidationText} 
                            viewBox={`0 0 256 256`}
                            level="M"
                            fgColor="#000000"
                            bgColor="#FFFFFF"
                          />
                        </div>
                   </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500" style={{ height: '1.5cqw' }}></div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" size="sm" onClick={handlePrint} icon={<Printer size={16}/>}>Imprimir</Button>
            <Button variant="secondary" size="sm" onClick={handleEmail} icon={<Mail size={16}/>} disabled={isGenerating}>
                {isGenerating ? 'Generando...' : 'Email PDF'}
            </Button>
          </div>
          
          <Button 
            variant="primary" 
            size="sm"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white border-transparent"
            icon={<Download size={18}/>}
            onClick={handleDownloadMobileCard}
          >
              Descargar JPG (Móvil)
          </Button>
          
          <p className="text-[10px] text-slate-400 text-center mt-2 px-2 leading-tight">
            * El botón "Email PDF" descargará el archivo y abrirá su gestor de correo para que pueda adjuntarlo.
          </p>
        </div>
      </div>

      {/* 
        HIDDEN MOBILE CARD FOR EXPORT (VERTICAL DESIGN)
        Dimensions: 540x960 (9:16 Aspect Ratio)
      */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div id="mobile-card-export" className="w-[540px] h-[960px] bg-slate-50 relative overflow-hidden flex flex-col font-[Montserrat]">
             
             {/* Header Background */}
             <div className="absolute top-0 left-0 w-full h-[340px] bg-gradient-to-b from-red-700 to-red-600 rounded-b-[50px] shadow-lg z-0"></div>
             
             {/* Pattern Overlay */}
             <div className="absolute top-0 left-0 w-full h-[340px] opacity-20 z-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

             <div className="relative z-10 flex flex-col h-full items-center pt-10 px-6 pb-8">
                 
                 {/* Top Logo & Title */}
                 <div className="flex flex-col items-center mb-6 w-full">
                     <div className="bg-white p-3 rounded-2xl shadow-xl mb-4 transform rotate-3">
                        {/* Fallback visual for Logo */}
                        <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center text-white font-black text-3xl">AG</div>
                     </div>
                     <h1 className="text-white font-black text-3xl tracking-tight drop-shadow-md">AMPA AGUSTINOS</h1>
                     <p className="text-red-100 font-bold tracking-[0.3em] uppercase text-xs mt-1">Carnet Digital</p>
                 </div>

                 {/* Main Info Card */}
                 <div className="w-full bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col items-center text-center relative mb-6">
                    <div className="absolute -top-3 bg-yellow-400 text-yellow-900 text-xs font-black uppercase px-4 py-1.5 rounded-full shadow-md tracking-wider">
                       Curso {schoolYear}
                    </div>

                    <div className="mt-4 mb-5 w-full">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Familia Socio</p>
                       <h2 className="text-2xl font-black text-slate-800 leading-tight break-words">{family.familyName}</h2>
                    </div>

                    {/* QR & ID Row */}
                    <div className="flex items-center gap-6 w-full justify-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                             <QRCode 
                               size={120} 
                               value={qrValidationText} 
                               level="M" 
                               fgColor="#000000"
                               bgColor="#FFFFFF"
                             />
                        </div>
                        <div className="flex flex-col items-start">
                             <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Nº de Socio</p>
                             <p className="text-5xl font-black text-red-600 tracking-tighter">#{family.membershipNumber}</p>
                             <div className="h-1 w-12 bg-red-200 rounded-full mt-2"></div>
                        </div>
                    </div>
                 </div>

                 {/* Members List */}
                 <div className="w-full flex-1 bg-white rounded-3xl shadow-xl border border-slate-100 p-6 relative overflow-hidden flex flex-col">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500"></div>
                     
                     <div className="flex items-center gap-2 mb-4 justify-center shrink-0">
                        <div className="h-px w-8 bg-slate-200"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Integrantes</p>
                        <div className="h-px w-8 bg-slate-200"></div>
                     </div>

                     <div className="space-y-3 overflow-y-auto pr-1">
                        {family.members.map((m) => (
                          <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-sm shrink-0 ${m.role === Role.CHILD ? 'bg-orange-100 text-orange-600' : 'bg-slate-800 text-white'}`}>
                                  {m.firstName.charAt(0)}
                               </div>
                               <div className="min-w-0 text-left">
                                  {/* Allow names to wrap and show fully */}
                                  <p className="text-sm font-bold text-slate-800 leading-snug">{m.firstName} {m.lastName}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">{m.role}</p>
                               </div>
                          </div>
                        ))}
                     </div>
                 </div>

                 {/* Footer */}
                 <div className="mt-6 text-center opacity-60">
                     <p className="text-[10px] font-bold text-slate-400">AMPA Agustinos Granada</p>
                 </div>
             </div>
        </div>
      </div>
    </>
  );
};
import React, { useState } from 'react';
import { Family, Role } from '../types';
import { Button } from './Button';
import { Printer, Mail, ShieldCheck, Download, Loader2 } from 'lucide-react';
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
              @page { size: A4; margin: 0; }
              body { font-family: 'Montserrat', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 20mm; background-color: white; margin: 0; }
              .id-card-wrapper { width: 85.6mm; height: 53.98mm; container-type: inline-size; position: relative; margin-bottom: 20px; outline: 1px dashed #cbd5e1; }
              .card-visual { width: 100%; height: 100%; border-radius: 3mm; overflow: hidden; position: relative; background: linear-gradient(to bottom right, #b91c1c, #dc2626, #991b1b); color: white; }
              .instructions { font-size: 10px; color: #64748b; text-align: center; }
            </style>
          </head>
          <body>
            <h2 class="text-xl font-bold mb-4">AMPA Agustinos Granada</h2>
            <div class="id-card-wrapper">
               <div class="card-visual relative select-none">${cardContent}</div>
            </div>
            <div class="instructions"><p>Recortar por la línea punteada.</p></div>
            <script>setTimeout(() => { window.print(); window.close(); }, 800);</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleEmail = async (provider: 'default' | 'gmail') => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('membership-card-visual');
      if (!element) throw new Error("Element not found");

      // Capturar carnet en alta resolución
      const canvas = await html2canvas(element, { scale: 4, useCORS: true, backgroundColor: null, logging: false });
      const imgData = canvas.toDataURL('image/png');

      // Crear PDF A4 (210 x 297 mm)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      // Dimensiones carnet
      const cardWidth = 85.6;
      const cardHeight = 53.98;
      
      // Centrar en A4
      const x = (210 - cardWidth) / 2;
      const y = 30; // Margen superior

      // Cabecera texto
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text("AMPA AGUSTINOS GRANADA", 105, 20, { align: 'center' });
      
      // Insertar Imagen Carnet
      pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);
      
      // Pie de texto
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text("Carnet digital de socio válido para el curso escolar " + schoolYear, 105, y + cardHeight + 10, { align: 'center' });

      const fileName = `Carnet_AMPA_${family.membershipNumber}.pdf`;
      const pdfBlob = pdf.output('blob');
      (FileSaver as any).saveAs(pdfBlob, fileName);

      // Preparar Email
      const membersList = family.members.map(m => `• ${m.firstName} ${m.lastName} (${m.role})`).join('\n');
      const subject = `Carnet Digital AMPA - Curso ${schoolYear} - Familia ${family.familyName}`;
      const body = `Estimada ${family.familyName},\n\nAdjuntamos su carnet de socio.\n\nINTEGRANTES:\n${membersList}\n\n* IMPORTANTE: Se ha descargado el archivo "${fileName}". Por favor, adjúntelo.`;

      setTimeout(() => {
          if (provider === 'gmail') {
             const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(family.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
             window.open(gmailUrl, '_blank');
          } else {
             window.location.href = `mailto:${family.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          }
          alert(`✅ PDF A4 generado y descargado.\n\nRecuerde adjuntar el archivo "${fileName}" en su correo.`);
          setIsGenerating(false);
      }, 800);

    } catch (error) {
      console.error(error);
      alert("Error generando el PDF.");
      setIsGenerating(false);
    }
  };

  const handleDownloadMobileCard = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('mobile-card-export');
      if (!element) throw new Error("Element not found");
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#f8fafc', height: element.scrollHeight, windowHeight: element.scrollHeight });
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if(blob) (FileSaver as any).saveAs(blob, `Carnet_Movil_Socio_${family.membershipNumber}.jpg`);
    } catch (error) { console.error(error); alert("Error"); } finally { setIsGenerating(false); }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4"><ShieldCheck className="text-red-600" /><h3 className="text-lg font-bold text-slate-800">Carnet de Socio</h3></div>
        <div style={{ containerType: 'inline-size' }} className="w-full mb-6">
          <div id="membership-card-visual" className="relative w-full aspect-[1.586/1] rounded-[3cqw] overflow-hidden shadow-lg bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-white select-none" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <div className="absolute top-0 right-0 w-[25cqw] h-[25cqw] bg-white opacity-5 rounded-bl-full translate-x-[5cqw] -translate-y-[5cqw]"></div>
            <div className="absolute bottom-0 left-0 w-[20cqw] h-[20cqw] bg-black opacity-10 rounded-tr-full -translate-x-[4cqw] translate-y-[4cqw]"></div>
            <div className="relative z-10 h-full flex flex-col" style={{ padding: '4.5cqw' }}>
              <div className="flex justify-between items-start mb-[1cqw]">
                <div className="flex items-center" style={{ gap: '2cqw' }}>
                  <div id="logo-source" className="bg-white/95 rounded-[1.5cqw] shadow-md flex items-center justify-center" style={{ padding: '1cqw', height: '11cqw', width: '11cqw' }}>
                     <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = `<div style="font-size: 3cqw; font-weight: 900; color: #b91c1c;">AG</div>`; }} />
                  </div>
                  <div><h4 className="font-bold tracking-wide leading-none shadow-sm" style={{ fontSize: '3.5cqw', marginBottom: '0.5cqw' }}>AMPA AGUSTINOS</h4><p className="text-white uppercase tracking-widest font-bold" style={{ fontSize: '2cqw' }}>Granada</p></div>
                </div>
                <div className="text-right"><span className="block text-white uppercase tracking-widest font-bold" style={{ fontSize: '1.8cqw' }}>Curso Escolar</span><span className="block font-black text-yellow-400 leading-none drop-shadow-sm" style={{ fontSize: '4.5cqw', marginTop: '0.5cqw' }}>{schoolYear}</span></div>
              </div>
              <div className="flex flex-col flex-1 justify-center" style={{ gap: '1.2cqw' }}>
                <div style={{ marginBottom: '0.5cqw' }}><p className="text-white uppercase tracking-widest font-bold" style={{ fontSize: '1.8cqw', marginBottom: '0.5cqw' }}>Familia</p><h2 className="font-bold tracking-tight leading-normal drop-shadow-sm pb-[0.5cqw]" style={{ fontSize: '4.8cqw' }}>{family.familyName}</h2></div>
                <div className="flex items-center justify-between" style={{ gap: '1.5cqw' }}>
                   <div className="flex items-center flex-1 min-w-0" style={{ gap: '2cqw' }}>
                      <div className="flex flex-col bg-white/10 backdrop-blur-md border border-white/30 shadow-inner shrink-0 text-center justify-center" style={{ padding: '1cqw 1.5cqw', borderRadius: '1.5cqw', height: '14cqw' }}>
                          <p className="text-white uppercase tracking-widest font-bold" style={{ fontSize: '1.5cqw', marginBottom: '0.5cqw' }}>Nº Socio</p><h2 className="font-black tracking-tighter text-white drop-shadow-md flex items-center justify-center" style={{ fontSize: '5cqw', lineHeight: '1', margin: 0 }}>{family.membershipNumber}</h2>
                      </div>
                      <div className="flex flex-col min-w-0 border-l border-white/30" style={{ paddingLeft: '2cqw', height: '100%', justifyContent: 'center' }}>
                        <p className="text-white uppercase tracking-widest font-bold" style={{ fontSize: '1.5cqw', marginBottom: '0.8cqw' }}>Integrantes</p>
                        <div className="flex flex-col" style={{ gap: '0.4cqw' }}>
                          {family.members.slice(0, 6).map((m, i) => (<div key={i} className="text-white flex items-baseline gap-[0.5cqw] whitespace-nowrap overflow-hidden" style={{ fontSize: '2.7cqw', lineHeight: '1.1' }}><span className="font-bold">{m.firstName}</span> <span className="font-medium opacity-90">{m.lastName}</span></div>))}
                          {family.members.length > 6 && (<div className="text-white italic opacity-80" style={{ fontSize: '2cqw' }}>... y {family.members.length - 6} más</div>)}
                        </div>
                      </div>
                   </div>
                   <div className="bg-white shadow-xl shrink-0 flex items-center justify-center" style={{ padding: '1cqw', borderRadius: '1.5cqw', width: '23cqw', height: '23cqw' }}><div style={{ height: "100%", width: "100%" }}><QRCode id={`qr-code-${family.id}`} size={256} style={{ height: "100%", width: "100%" }} value={qrValidationText} viewBox={`0 0 256 256`} level="M" fgColor="#000000" bgColor="#FFFFFF" /></div></div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500" style={{ height: '1.5cqw' }}></div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" size="sm" onClick={handlePrint} icon={<Printer size={16}/>}>Imprimir</Button>
            <div className="flex flex-col gap-2">
               <Button variant="secondary" size="sm" onClick={() => handleEmail('default')} icon={<Mail size={16}/>} disabled={isGenerating}>{isGenerating ? <Loader2 className="animate-spin" size={16}/> : 'Email (App)'}</Button>
               <Button variant="danger" size="sm" onClick={() => handleEmail('gmail')} icon={<Mail size={16}/>} disabled={isGenerating} className="text-[10px] bg-red-50 text-red-700 border-red-100">Gmail Web</Button>
            </div>
          </div>
          <Button variant="primary" size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white border-transparent" icon={<Download size={18}/>} onClick={handleDownloadMobileCard}>Descargar JPG (Móvil)</Button>
        </div>
      </div>
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div id="mobile-card-export" className="w-[540px] h-auto bg-slate-50 relative flex flex-col font-[Montserrat] pb-10">
             <div className="absolute top-0 left-0 w-full h-[340px] bg-gradient-to-b from-red-700 to-red-600 rounded-b-[50px] shadow-lg z-0"></div>
             <div className="absolute top-0 left-0 w-full h-[340px] opacity-20 z-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             <div className="relative z-10 flex flex-col h-full items-center pt-10 px-6">
                 <div className="flex flex-col items-center mb-6 w-full">
                     <div className="bg-white p-3 rounded-2xl shadow-xl mb-4 transform rotate-3"><div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center text-white font-black text-3xl">AG</div></div>
                     <h1 className="text-white font-black text-3xl tracking-tight drop-shadow-md">AMPA AGUSTINOS</h1>
                     <p className="text-red-100 font-bold tracking-[0.3em] uppercase text-xs mt-1">Carnet Digital</p>
                 </div>
                 <div className="w-full bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col items-center text-center relative mb-6 shrink-0">
                    <div className="absolute -top-3 bg-yellow-400 text-yellow-900 text-xs font-black uppercase px-4 py-1.5 rounded-full shadow-md tracking-wider">Curso {schoolYear}</div>
                    <div className="mt-4 mb-5 w-full"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Familia Socio</p><h2 className="text-2xl font-black text-slate-800 leading-tight break-words">{family.familyName}</h2></div>
                    <div className="flex items-center gap-6 w-full justify-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200"><QRCode size={120} value={qrValidationText} level="M" fgColor="#000000" bgColor="#FFFFFF"/></div>
                        <div className="flex flex-col items-start"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Nº de Socio</p><p className="text-5xl font-black text-red-600 tracking-tighter">#{family.membershipNumber}</p></div>
                    </div>
                 </div>
                 <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 relative flex flex-col">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500"></div>
                     <div className="flex items-center gap-2 mb-4 justify-center shrink-0"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Integrantes</p></div>
                     <div className="grid grid-cols-2 gap-3 w-full">
                        {family.members.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm shrink-0 ${m.role === Role.CHILD ? 'bg-orange-100 text-orange-600' : 'bg-slate-800 text-white'}`}>{m.firstName.charAt(0)}</div>
                               <div className="min-w-0 text-left"><p className="text-xs font-bold text-slate-800 leading-tight break-words">{m.firstName}</p><p className="text-[10px] text-slate-500 font-bold uppercase break-words">{m.lastName}</p></div>
                          </div>
                        ))}
                     </div>
                 </div>
                 <div className="mt-6 opacity-50"><p className="text-[10px] font-bold text-slate-400">AMPA Agustinos Granada</p></div>
             </div>
        </div>
      </div>
    </>
  );
};
import React from 'react';
import { Family } from '../types';
import { Button } from './Button';
import { Printer, Mail, ShieldCheck } from 'lucide-react';
import QRCode from 'react-qr-code';

interface MembershipCardProps {
  family: Family;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({ family }) => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const schoolYear = `${currentYear}-${nextYear}`;

  // Validation text for the QR Code
  const qrValidationText = `ESTE ES UN CARNET VÁLIDO DE LA ASOCIACIÓN AMPA AGUSTINOS GRANADA
Nº Socio: ${family.membershipNumber}
Familia: ${family.familyName}
Integrantes: ${family.members.map(m => `${m.firstName} ${m.lastName}`).join(', ')}`;

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
              
              /* Estándar ISO 7810 ID-1: 85.60 x 53.98 mm */
              .id-card-wrapper {
                width: 85.6mm;
                height: 53.98mm;
                container-type: inline-size; /* CRUCIAL para que las unidades cqw funcionen */
                position: relative;
                margin-bottom: 20px;
                
                /* Línea de corte sutil */
                outline: 1px dashed #cbd5e1;
              }

              .card-visual {
                width: 100%;
                height: 100%;
                border-radius: 3mm; /* Ajustado para impresión */
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

  const handleEmail = () => {
    const subject = encodeURIComponent(`Carnet Digital de Socio AMPA - Curso ${schoolYear}`);
    const body = encodeURIComponent(`Estimada ${family.familyName},\n\nAdjuntamos los datos de su carnet de socio para el curso ${schoolYear}.\n\nNº de Socio: ${family.membershipNumber}\n\nGracias por formar parte de la asociación.\n\nUn cordial saludo,\nAMPA Agustinos Granada`);
    window.location.href = `mailto:${family.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="text-red-600" />
        <h3 className="text-lg font-bold text-slate-800">Carnet de Socio</h3>
      </div>

      {/* 
        CONTAINER QUERY WRAPPER 
        We set container-type: inline-size on this wrapper.
        All children elements will use 'cqw' units (Container Query Width) 
        to scale perfectly relative to this container, not the viewport.
      */}
      <div style={{ containerType: 'inline-size' }} className="w-full mb-6">
        
        <div 
          id="membership-card-visual" 
          className="relative w-full aspect-[1.586/1] rounded-[3cqw] overflow-hidden shadow-lg bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-white select-none"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          
          {/* Decorative Background Elements using cqw for fluid positioning/sizing */}
          <div className="absolute top-0 right-0 w-[25cqw] h-[25cqw] bg-white opacity-5 rounded-bl-full translate-x-[5cqw] -translate-y-[5cqw]"></div>
          <div className="absolute bottom-0 left-0 w-[20cqw] h-[20cqw] bg-black opacity-10 rounded-tr-full -translate-x-[4cqw] translate-y-[4cqw]"></div>
          
          {/* Main Content Container with fluid padding */}
          <div className="relative z-10 h-full flex flex-col" style={{ padding: '4.5cqw' }}>
            
            {/* Header: Logo & School Year */}
            <div className="flex justify-between items-start mb-[1cqw]">
              <div className="flex items-center" style={{ gap: '2cqw' }}>
                <div className="bg-white/95 rounded-[1.5cqw] shadow-md flex items-center justify-center" style={{ padding: '1cqw', height: '11cqw', width: '11cqw' }}>
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

            {/* Body Section: Family Info, Members & QR */}
            <div className="flex flex-col flex-1 justify-center" style={{ gap: '1.5cqw' }}>
              
              {/* Family Name */}
              <div style={{ marginBottom: '0.5cqw' }}>
                 <p className="text-white uppercase tracking-widest font-bold" style={{ fontSize: '1.8cqw', marginBottom: '0.5cqw' }}>Familia</p>
                 {/* Added leading-normal and pb-1 to avoid text cutting */}
                 <h2 className="font-bold tracking-tight leading-normal drop-shadow-sm pb-[0.5cqw]" style={{ fontSize: '5.2cqw' }}>{family.familyName}</h2>
              </div>

              {/* Data Row: Number | Members | QR */}
              <div className="flex items-center justify-between" style={{ gap: '1.5cqw' }}>
                 
                 {/* Left Group: Number & List */}
                 <div className="flex items-center flex-1 min-w-0" style={{ gap: '2cqw' }}>
                    
                    {/* Number Box */}
                    <div className="flex flex-col bg-white/10 backdrop-blur-md border border-white/30 shadow-inner shrink-0 text-center" style={{ padding: '1.5cqw 2cqw', borderRadius: '1.5cqw' }}>
                        {/* Pure White Text for print readability */}
                        <p className="text-white uppercase tracking-widest font-bold" style={{ fontSize: '1.5cqw' }}>Nº Socio</p>
                        <h2 className="font-black tracking-tighter leading-none text-white drop-shadow-md" style={{ fontSize: '6.5cqw' }}>{family.membershipNumber}</h2>
                    </div>

                    {/* Members List - Vertical Divider */}
                    <div className="flex flex-col min-w-0 border-l border-white/30" style={{ paddingLeft: '2cqw', height: '100%', justifyContent: 'center' }}>
                      <p className="text-white uppercase tracking-widest font-bold" style={{ fontSize: '1.5cqw', marginBottom: '0.5cqw' }}>Integrantes</p>
                      <div className="flex flex-col" style={{ gap: '0.3cqw' }}>
                        {family.members.slice(0, 5).map((m, i) => (
                          <div key={i} className="text-white leading-none truncate flex items-baseline gap-[0.5cqw]" style={{ fontSize: '3.8cqw' }}>
                             {/* INCREASED FONT SIZE significantly for readability */}
                             <span className="font-black">{m.firstName}</span> <span className="font-semibold">{m.lastName}</span>
                          </div>
                        ))}
                        {family.members.length > 5 && <span className="font-bold text-white" style={{ fontSize: '2.5cqw' }}>+ {family.members.length - 5} más...</span>}
                      </div>
                    </div>
                 </div>

                 {/* QR Code - Scaled 1.25x (from 21cqw to ~26cqw) */}
                 <div className="bg-white shadow-xl shrink-0 flex items-center justify-center" style={{ padding: '1cqw', borderRadius: '1.5cqw', width: '26cqw', height: '26cqw' }}>
                      <div style={{ height: "100%", width: "100%" }}>
                        <QRCode
                          size={256}
                          style={{ height: "100%", width: "100%" }}
                          value={qrValidationText}
                          viewBox={`0 0 256 256`}
                          level="L"
                          fgColor="#000000"
                          bgColor="#FFFFFF"
                        />
                      </div>
                 </div>
              </div>
            </div>

            {/* Bottom Stripe */}
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500" style={{ height: '1.5cqw' }}></div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full" 
          icon={<Printer size={16}/>}
          onClick={handlePrint}
        >
          Imprimir / PDF
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full" 
          icon={<Mail size={16}/>}
          onClick={handleEmail}
        >
          Enviar Email
        </Button>
      </div>
    </div>
  );
};
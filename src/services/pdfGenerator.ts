
import { MessageData, BookSettings } from '@/types/message';
import QRCode from 'qrcode';

export class PDFGenerator {
  async generatePDF(messages: MessageData[], bookSettings: BookSettings): Promise<Blob> {
    const htmlContent = await this.generateHTMLContent(messages, bookSettings);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return blob;
  }

  private async convertImageToBase64(url: string): Promise<string> {
    try {
      // Déjà en data URL
      if (url.startsWith('data:')) return url;
      const response = await fetch(url, { cache: 'no-store' });
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Erreur conversion image en base64:', error);
      return '';
    }
  }

  private async generateQRCode(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'M',
        width: 120,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Erreur génération QR code:', error);
      return '';
    }
  }
  
  private async generateHTMLContent(messages: MessageData[], bookSettings: BookSettings): Promise<string> {
    const getFontFamily = () => {
      switch (bookSettings.fontFamily) {
        case 'serif': return 'Georgia, serif';
        case 'script': return 'Dancing Script, cursive';
        default: return 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      }
    };
    
    const getTextSize = () => {
      switch (bookSettings.textSize) {
        case 'small': return '14px';
        case 'large': return '18px';
        default: return '16px';
      }
    };

    // Get all unique senders to determine who is the "current user"
    const senderCounts = messages.reduce((counts, message) => {
      counts[message.sender] = (counts[message.sender] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const currentUser = Object.entries(senderCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    // Statistiques des médias
    const mediaStats = messages.reduce((stats, message) => {
      if (message.type === 'image') stats.photos++;
      if (message.type === 'video') stats.videos++;
      if (message.type === 'audio') stats.audios++;
      return stats;
    }, { photos: 0, videos: 0, audios: 0 });
    
    // Convertir toutes les images en base64 (préférence aux data URLs déjà disponibles) et générer des QR codes pour les vidéos
    const imagePromises = messages
      .filter(msg => msg.type === 'image' && (msg.mediaDataUrl || msg.mediaUrl))
      .map(async msg => {
        if (msg.mediaDataUrl) {
          return { id: msg.id, base64: msg.mediaDataUrl };
        }
        const base64 = await this.convertImageToBase64(msg.mediaUrl!);
        return { id: msg.id, base64 };
      });
    
    const qrCodePromises = messages
      .filter(msg => msg.type === 'video' && msg.mediaUrl)
      .map(async msg => {
        const qrCode = await this.generateQRCode(msg.mediaUrl!);
        return { originalUrl: msg.mediaUrl!, qrCode };
      });
    
    const imageMap = new Map<string, string>();
    const qrCodeMap = new Map<string, string>();
    
    if (imagePromises.length > 0) {
      const imageResults = await Promise.all(imagePromises);
      imageResults.forEach(result => {
        if (result.base64) {
          imageMap.set(result.id, result.base64);
        }
      });
    }
    
    if (qrCodePromises.length > 0) {
      const qrCodeResults = await Promise.all(qrCodePromises);
      qrCodeResults.forEach(result => {
        if (result.qrCode) {
          qrCodeMap.set(result.originalUrl, result.qrCode);
        }
      });
    }

    const messagesHTML = messages.map((message) => {
      const isCurrentUser = message.sender === currentUser;
      
      // Date et heure pour chaque message
      const dateTimeHTML = `
        <div style="text-align: center; margin-bottom: 12px;">
          <span style="font-size: 11px; color: #6b7280; background: rgba(255,255,255,0.9); padding: 4px 12px; border-radius: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-weight: 500; display: inline-block;">
            ${message.timestamp.toLocaleDateString('fr-FR', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })} à ${message.timestamp.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      `;

      let mediaHTML = '';
      
      // Affichage des images avec preview directe
      if (message.type === 'image') {
        const hasImage = imageMap.get(message.id) || message.mediaUrl;
        if (hasImage) {
          const base64Image = imageMap.get(message.id);
          const imageSrc = base64Image || message.mediaUrl;
          
          mediaHTML = `
            <div style="margin-top: 12px;">
              <div style="border-radius: 12px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.15); background: #f8fafc; position: relative; max-width: 280px;">
                <img src="${imageSrc}" 
                     style="width: 100%; height: auto; max-height: 300px; object-fit: cover; display: block; border-radius: 12px;" 
                     alt="Photo partagée" />
              </div>
              ${message.mediaFileName ? `
                <p style="font-size: 10px; color: ${isCurrentUser ? 'rgba(255,255,255,0.8)' : '#6b7280'}; margin: 6px 0 0 0; text-align: center; font-weight: 500;">
                  📎 ${message.mediaFileName}
                </p>
              ` : ''}
            </div>
          `;
        } else {
          mediaHTML = `
            <div style="margin-top: 12px; padding: 16px; background: ${isCurrentUser ? 'rgba(255,255,255,0.15)' : '#f8fafc'}; border: 2px dashed ${isCurrentUser ? 'rgba(255,255,255,0.3)' : '#cbd5e1'}; border-radius: 12px; display: flex; align-items: center; gap: 12px;">
              <div style="background: ${isCurrentUser ? 'rgba(255,255,255,0.2)' : '#e2e8f0'}; padding: 8px; border-radius: 50%; flex-shrink: 0;">
                <span style="font-size: 20px;">🖼️</span>
              </div>
              <div style="flex: 1;">
                <p style="font-size: 13px; font-weight: 600; margin: 0 0 4px 0; color: ${isCurrentUser ? 'white' : '#1f2937'};">Photo</p>
                <p style="font-size: 11px; color: ${isCurrentUser ? 'rgba(255,255,255,0.7)' : '#94a3b8'}; margin: 0;">Photo non disponible</p>
              </div>
            </div>
          `;
        }
      }
      
      // Affichage pour vidéos avec QR code 
      if (message.type === 'video') {
        const qrCodeImage = message.mediaUrl ? qrCodeMap.get(message.mediaUrl) : null;
        
        mediaHTML = `
          <div style="margin-top: 12px; padding: 16px; background: ${isCurrentUser ? 'rgba(255,255,255,0.15)' : '#fef3f2'}; border: 2px solid ${isCurrentUser ? 'rgba(255,255,255,0.3)' : '#fed7d3'}; border-radius: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <div style="background: ${isCurrentUser ? 'rgba(255,255,255,0.2)' : '#fecaca'}; padding: 8px; border-radius: 50%; flex-shrink: 0;">
                  <span style="font-size: 18px;">🎥</span>
                </div>
                <div style="flex: 1;">
                  <p style="font-size: 13px; font-weight: 700; margin: 0 0 4px 0; color: ${isCurrentUser ? 'white' : '#1f2937'};">Vidéo</p>
                  ${message.mediaFileName ? `<p style="font-size: 10px; color: ${isCurrentUser ? 'rgba(255,255,255,0.8)' : '#6b7280'}; margin: 0 0 6px 0;">📎 ${message.mediaFileName}</p>` : ''}
                  <p style="font-size: 10px; color: ${isCurrentUser ? 'rgba(255,255,255,0.8)' : '#6b7280'}; margin: 0;">Scanner le QR code pour accéder à la vidéo</p>
                </div>
              </div>
              ${qrCodeImage ? `
                <div style="text-align: center; flex-shrink: 0;">
                  <div style="background: white; padding: 6px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                    <img src="${qrCodeImage}" style="width: 80px; height: 80px; display: block;" alt="QR Code vidéo" />
                  </div>
                  <p style="font-size: 9px; color: #dc2626; margin: 4px 0 0 0; font-weight: 600;">📱 Scanner</p>
                </div>
              ` : `
                <div style="text-align: center; flex-shrink: 0; background: #f3f4f6; padding: 12px; border-radius: 8px;">
                  <p style="font-size: 10px; color: #6b7280; margin: 0;">QR code indisponible</p>
                </div>
              `}
            </div>
          </div>
        `;
      }
      
      // Affichage pour audio avec lien cliquable
      if (message.type === 'audio') {
        mediaHTML = `
          <div style="margin-top: 12px; padding: 16px; background: ${isCurrentUser ? 'rgba(255,255,255,0.15)' : '#f0f9ff'}; border: 2px solid ${isCurrentUser ? 'rgba(255,255,255,0.3)' : '#bae6fd'}; border-radius: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="background: ${isCurrentUser ? 'rgba(255,255,255,0.2)' : '#bfdbfe'}; padding: 8px; border-radius: 50%; flex-shrink: 0;">
                <span style="font-size: 18px;">🎵</span>
              </div>
              <div style="flex: 1;">
                <p style="font-size: 13px; font-weight: 700; margin: 0 0 4px 0; color: ${isCurrentUser ? 'white' : '#1f2937'};">Note vocale</p>
                ${message.mediaFileName ? `<p style="font-size: 10px; color: ${isCurrentUser ? 'rgba(255,255,255,0.8)' : '#6b7280'}; margin: 0 0 8px 0;">📎 ${message.mediaFileName}</p>` : ''}
                ${message.mediaUrl ? `
                  <a href="${message.mediaUrl}" target="_blank" rel="noopener noreferrer" 
                     style="background: #2563eb; color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);">
                    🔊 Écouter l'audio
                  </a>
                ` : `
                  <a href="https://fr.wikipedia.org/wiki/Fichier_audio" target="_blank" rel="noopener noreferrer" 
                     style="background: #6b7280; color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(107, 114, 128, 0.3);">
                    🔊 Audio non disponible
                  </a>
                `}
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div style="margin-bottom: 24px; page-break-inside: avoid;">
          ${dateTimeHTML}
          <div style="display: flex; ${isCurrentUser ? 'justify-content: flex-end' : 'justify-content: flex-start'}; margin-bottom: 16px;">
            <div style="max-width: 70%; min-width: 180px;">
              ${!isCurrentUser ? `
                <div style="font-size: 12px; color: #7c3aed; font-weight: 700; margin-bottom: 6px; margin-left: 12px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                  ${message.sender}
                </div>
              ` : ''}
              <div style="
                border-radius: 24px;
                padding: 16px 20px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                position: relative;
                background: ${isCurrentUser 
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' 
                  : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'};
                color: ${isCurrentUser ? 'white' : '#1f2937'};
                border: ${isCurrentUser ? 'none' : '1px solid #e2e8f0'};
                ${isCurrentUser 
                  ? 'border-bottom-right-radius: 8px;' 
                  : 'border-bottom-left-radius: 8px;'}
                word-wrap: break-word;
                overflow-wrap: break-word;
              ">
                ${message.content && message.content.trim() && message.content !== 'Photo partagée' && message.content !== 'Vidéo partagée' && message.content !== 'Note vocale' ? `
                  <div style="font-size: ${getTextSize()}; line-height: 1.6; margin-bottom: ${mediaHTML ? '12px' : '0'}; font-weight: 500; word-wrap: break-word;">
                    ${message.content}
                  </div>
                ` : ''}
                ${mediaHTML}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${bookSettings.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
          
          * {
            box-sizing: border-box;
          }
          
          body {
            font-family: ${getFontFamily()};
            font-size: ${getTextSize()};
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #1f2937;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          
          .cover {
            background: ${bookSettings.coverColor};
            color: white;
            text-align: center;
            padding: 80px 40px;
            margin-bottom: 40px;
            border-radius: 20px;
            page-break-after: always;
            box-shadow: 0 20px 40px rgba(0,0,0,0.25);
            position: relative;
            overflow: hidden;
          }
          
          .cover::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(0,0,0,0.1), rgba(255,255,255,0.05));
            z-index: 1;
          }
          
          .cover > * {
            position: relative;
            z-index: 2;
          }
          
          .cover h1 {
            font-size: 48px;
            margin-bottom: 24px;
            font-weight: 700;
            text-shadow: 0 4px 8px rgba(0,0,0,0.3);
            letter-spacing: -0.02em;
          }
          
          .cover .author {
            font-size: 24px;
            opacity: 0.95;
            margin-bottom: 32px;
            font-weight: 400;
          }
          
          .cover .stats {
            font-size: 18px;
            opacity: 0.85;
            margin-top: 40px;
            line-height: 1.8;
          }
          
          .preface, .dedication {
            margin-bottom: 40px;
            padding: 40px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 20px;
            page-break-after: always;
            box-shadow: 0 12px 28px rgba(0,0,0,0.1);
          }
          
          .preface h2, .dedication h2 {
            color: #7c3aed;
            margin-bottom: 24px;
            font-size: 32px;
            text-align: center;
            font-weight: 700;
          }
          
          .messages-section {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 20px;
            padding: 40px;
            margin-top: 40px;
            box-shadow: 0 12px 28px rgba(0,0,0,0.1);
          }
          
          .messages-section h2 {
            color: #7c3aed;
            margin-bottom: 40px;
            font-size: 32px;
            text-align: center;
            font-weight: 700;
          }
          
          .conversation-container {
            background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
            border-radius: 16px;
            padding: 32px;
            min-height: 600px;
          }
          
          a {
            transition: all 0.3s ease;
          }
          
          a:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
          
          img {
            max-width: 100%;
            height: auto;
          }
          
          @media print {
            body { 
              background: white; 
              padding: 10px;
            }
            .cover, .preface, .dedication {
              page-break-after: always;
            }
            a {
              color: inherit;
              text-decoration: underline;
            }
          }
          
          @media screen and (max-width: 768px) {
            body {
              padding: 10px;
            }
            .cover {
              padding: 40px 20px;
            }
            .cover h1 {
              font-size: 32px;
            }
            .messages-section {
              padding: 20px;
            }
            .conversation-container {
              padding: 16px;
            }
          }
        </style>
      </head>
      <body>
        <!-- Page de couverture -->
        <div class="cover">
          <h1>${bookSettings.title}</h1>
          ${bookSettings.authors ? `<div class="author">par ${bookSettings.authors}</div>` : ''}
          <div class="stats">
            ${messages.length} messages<br>
            ${mediaStats.photos} photos • ${mediaStats.videos} vidéos • ${mediaStats.audios} audios<br>
            ${new Date().getFullYear()}
          </div>
        </div>
        
        <!-- Préface -->
        ${bookSettings.preface ? `
          <div class="preface">
            <h2>Préface</h2>
            ${bookSettings.preface.split('\n').map(p => `<p style="margin-bottom: 20px; text-align: justify; line-height: 1.8; font-size: 16px;">${p}</p>`).join('')}
          </div>
        ` : ''}
        
        <!-- Dédicace -->
        ${bookSettings.dedication ? `
          <div class="dedication">
            <h2>Dédicace</h2>
            <p style="font-style: italic; text-align: center; font-size: 22px; line-height: 1.7; color: #7c3aed; font-weight: 400;">${bookSettings.dedication}</p>
          </div>
        ` : ''}
        
        <!-- Messages -->
        <div class="messages-section">
          <h2>Nos Conversations</h2>
          <div class="conversation-container">
            ${messagesHTML}
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const pdfGenerator = new PDFGenerator();

import JSZip from 'jszip';
import QRCode from 'qrcode';
import { MessageData } from '@/types/message';

interface ParsedMessage {
  timestamp: Date;
  sender: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio';
  mediaFilename?: string;
}

export class WhatsAppParser {
  private shouldSkipMessage(content: string): boolean {
    const skipPatterns = [
      /^‎You created group/,
      /^‎Messages and calls are end-to-end encrypted/,
      /^‎.*joined using this group's invite link/,
      /^‎.*left/,
      /^‎.*was added/,
      /^‎.*was removed/,
      /^‎.*changed the group description/,
      /^‎.*changed this group's icon/,
      /^‎.*changed the subject/,
      /^‎Security code changed/,
      /^‎This message was deleted/,
    ];
    
    return skipPatterns.some(pattern => pattern.test(content));
  }

  private async parseTextFile(content: string): Promise<ParsedMessage[]> {
    const messages: ParsedMessage[] = [];
    const lines = content.split('\n');
    
    // Pattern pour capturer les messages avec différents formats de date
    const messagePatterns = [
      /^\[(\d{2}\/\d{2}\/\d{4}),?\s(\d{2}:\d{2}:\d{2})\]\s(.+?):\s(.*)$/,
      /^(\d{2}\/\d{2}\/\d{4}),?\s(\d{2}:\d{2}:\d{2})\s-\s(.+?):\s(.*)$/,
      /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s(\d{1,2}:\d{2})\s-\s(.+?):\s(.*)$/
    ];
    
    const mediaPattern = /<Media omitted>|<Média omis>|image omitted|média omis/i;
    const filePattern = /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|3gp|opus|aac|m4a|mp3|wav|pdf|doc|docx)$/i;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      let match = null;
      for (const pattern of messagePatterns) {
        match = line.match(pattern);
        if (match) break;
      }
      
      if (match) {
        const [, date, time, sender, content] = match;
        
        // Skip system messages
        if (this.shouldSkipMessage(content)) {
          console.log('Skipping system message:', content.substring(0, 50));
          continue;
        }
        
        // Parse date more flexibly
        let timestamp: Date;
        try {
          const dateParts = date.split('/');
          let day, month, year;
          
          if (dateParts[2].length === 2) {
            // Format: dd/mm/yy
            day = dateParts[0].padStart(2, '0');
            month = dateParts[1].padStart(2, '0');
            year = '20' + dateParts[2];
          } else {
            // Format: dd/mm/yyyy
            day = dateParts[0].padStart(2, '0');
            month = dateParts[1].padStart(2, '0');
            year = dateParts[2];
          }
          
          const timeParts = time.split(':');
          const hour = timeParts[0].padStart(2, '0');
          const minute = timeParts[1].padStart(2, '0');
          const second = timeParts[2] ? timeParts[2].padStart(2, '0') : '00';
          
          timestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
        } catch (error) {
          console.error('Error parsing date:', date, time);
          timestamp = new Date();
        }
        
        // Déterminer le type de message et extraire le contenu
        let type: 'text' | 'image' | 'video' | 'audio' = 'text';
        let mediaFilename: string | undefined;
        let messageContent = content;
        
        // Check for media references or file extensions
        if (mediaPattern.test(content) || filePattern.test(content)) {
          const fileMatch = content.match(/([^\s]+\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|3gp|opus|aac|m4a|mp3|wav|pdf|doc|docx))/i);
          
          if (fileMatch) {
            mediaFilename = fileMatch[1];
            const extension = fileMatch[2].toLowerCase();
            
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
              type = 'image';
              messageContent = content.replace(fileMatch[0], '').trim() || 'Photo partagée';
            } else if (['mp4', 'mov', 'avi', '3gp'].includes(extension)) {
              type = 'video';
              messageContent = content.replace(fileMatch[0], '').trim() || 'Vidéo partagée';
            } else if (['opus', 'aac', 'm4a', 'mp3', 'wav'].includes(extension)) {
              type = 'audio';
              messageContent = content.replace(fileMatch[0], '').trim() || 'Note vocale';
            }
          } else if (mediaPattern.test(content)) {
            // Generic media omitted
            type = 'image'; // Default to image for generic media
            messageContent = 'Média partagé';
          }
        }
        
        messages.push({
          timestamp,
          sender: sender.trim(),
          content: messageContent,
          type,
          mediaFilename
        });
      }
    }
    
    console.log('Messages parsed before filtering:', messages.length);
    return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  private async generateQRCode(url: string, filename: string): Promise<string> {
    try {
      const qrData = `Fichier: ${filename}\nTéléchargement direct: ${url}`;
      return await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#7c3aed',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  }
  
  async parseWhatsAppZip(file: File): Promise<MessageData[]> {
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      let textContent = '';
      const mediaFiles = new Map<string, File>();
      
      console.log('📦 Processing ZIP file with', Object.keys(zipContent.files).length, 'files');
      
      // Process all files in the ZIP
      for (const [filename, fileData] of Object.entries(zipContent.files)) {
        if (fileData.dir) continue;
        
        console.log('📁 Processing file:', filename);
        
        if (filename.endsWith('.txt')) {
          textContent = await fileData.async('text');
          console.log('📄 Text file found:', filename, 'Length:', textContent.length);
        } else if (filename.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|3gp|opus|aac|m4a|mp3|wav|pdf|doc|docx)$/i)) {
          const blob = await fileData.async('blob');
          const cleanFilename = filename.split('/').pop() || filename;
          const fileExt = cleanFilename.split('.').pop()?.toLowerCase() || '';
          const contentType = this.getContentType(fileExt);
          
          // Créer le File avec le bon type MIME
          const mediaFile = new File([blob], cleanFilename, { type: contentType });
          mediaFiles.set(cleanFilename, mediaFile);
          console.log('🎬 Media file found:', cleanFilename, 'Size:', blob.size, 'bytes', 'Type:', contentType);
        }
      }
      
      if (!textContent) {
        throw new Error('Aucun fichier texte trouvé dans le ZIP');
      }
      
      // Parse messages from text file
      const parsedMessages = await this.parseTextFile(textContent);
      console.log('✅ Messages parsés:', parsedMessages.length);
      console.log('🎬 Fichiers média trouvés:', mediaFiles.size);
      
      const messages: MessageData[] = [];
      
      // Préparer les data URLs pour les images (stockage local)
      const imageDataUrlMap = new Map<string, string>();
      for (const [filename, file] of mediaFiles.entries()) {
        if (file.type.startsWith('image/')) {
          try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            imageDataUrlMap.set(filename.toLowerCase(), dataUrl);
            // Ajouter une variante sans préfixe pour faciliter la correspondance
            const withoutPrefix = filename.replace(/^\d+-[A-Z]+-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-/, '');
            if (withoutPrefix !== filename) {
              imageDataUrlMap.set(withoutPrefix.toLowerCase(), dataUrl);
            }
          } catch (e) {
            console.error('❌ Erreur conversion image en data URL:', filename, e);
          }
        }
      }
      
      // Queue des images non utilisées pour appariement séquentiel
      const unusedImageEntries = Array.from(imageDataUrlMap.entries());
      
      // Process each message and match with available media
      for (const parsedMsg of parsedMessages) {
        let mediaDataUrl: string | undefined;
        let qrCode: string | undefined;
        let assignedImageFilename: string | undefined;
        
        // Handle media files
        if (parsedMsg.type !== 'text') {
          // Try to resolve image data URL first
          if (parsedMsg.type === 'image' && parsedMsg.mediaFilename) {
            const key = parsedMsg.mediaFilename.toLowerCase();
            mediaDataUrl = imageDataUrlMap.get(key);
            if (!mediaDataUrl) {
              for (const [mapKey, dataUrl] of imageDataUrlMap.entries()) {
                if (mapKey.includes(key) || key.includes(mapKey)) {
                  mediaDataUrl = dataUrl;
                  assignedImageFilename = mapKey;
                  console.log('🖼️ Matched image data URL:', parsedMsg.mediaFilename, '->', mapKey);
                  break;
                }
              }
            }
          }

          // If still no image match, assign next unused image sequentially
          if (parsedMsg.type === 'image' && !mediaDataUrl && unusedImageEntries.length > 0) {
            const [pickedFilename, pickedDataUrl] = unusedImageEntries.shift()!;
            mediaDataUrl = pickedDataUrl;
            assignedImageFilename = pickedFilename;
            console.log('🖼️ Fallback assigned image by order:', pickedFilename, 'to message at', parsedMsg.timestamp.toISOString());
          }
          
          // For video/audio, generate QR code with placeholder URL (no cloud storage)
          if (parsedMsg.type === 'video' || parsedMsg.type === 'audio') {
            const placeholderUrl = `#${parsedMsg.type}-${parsedMsg.mediaFilename || 'file'}`;
            qrCode = await this.generateQRCode(placeholderUrl, parsedMsg.mediaFilename || `${parsedMsg.type}_file`);
            console.log(`🔳 QR Code generated for ${parsedMsg.type} (placeholder)`);
          }
        }
        
        // Create message data
        messages.push({
          id: `${Date.now()}-${messages.length}`,
          timestamp: parsedMsg.timestamp,
          sender: parsedMsg.sender,
          content: parsedMsg.content,
          type: parsedMsg.type,
          mediaDataUrl: mediaDataUrl,
          mediaFileName: assignedImageFilename || parsedMsg.mediaFilename,
          qrCode: qrCode
        });
      }
      
      console.log('✅ Processed', messages.length, 'messages with', imageDataUrlMap.size, 'images');
      return messages;
      
    } catch (error) {
      console.error('❌ Error parsing WhatsApp ZIP:', error);
      throw error;
    }
  }
  
  private getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      '3gp': 'video/3gpp',
      'opus': 'audio/opus',
      'aac': 'audio/aac',
      'm4a': 'audio/mp4',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return contentTypes[extension] || 'application/octet-stream';
  }
}

// Export instance
export const whatsappParser = new WhatsAppParser();
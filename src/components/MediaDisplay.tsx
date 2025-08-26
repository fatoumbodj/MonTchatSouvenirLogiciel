
import React, { useEffect, useState } from 'react';
import { Image, Video, Music, FileText, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QRCodeLib from 'qrcode';

interface MediaDisplayProps {
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  fileName?: string;
  qrCode?: string;
  className?: string;
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  mediaUrl,
  mediaType,
  fileName,
  qrCode,
  className = ""
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(mediaUrl);
  const [triedBlobFallback, setTriedBlobFallback] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(qrCode || null);

  useEffect(() => {
    setImageSrc(mediaUrl);
    setTriedBlobFallback(false);
    setImageError(false);
  }, [mediaUrl]);

  useEffect(() => {
    if (mediaType === 'video' && mediaUrl) {
      QRCodeLib.toDataURL(mediaUrl)
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(qrCode || null);
    }
  }, [mediaType, mediaUrl, qrCode]);

  const generateInstructionQR = (name: string, type: string) => {
    const instruction = `Fichier: ${name}\nType: ${type}\nScannez pour voir/télécharger ce média.`;
    const encodedText = encodeURIComponent(instruction);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}&bgcolor=ffffff&color=000000`;
  };

  console.log('🖼️ MediaDisplay rendering:', { 
    mediaType, 
    fileName, 
    mediaUrl: mediaUrl ? 'available' : 'missing',
    hasQrCode: !!qrCode
  });

  const handleDownload = async () => {
    if (!mediaUrl) return;
    
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName || `media_file.${mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'mp3'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const renderMedia = () => {
    switch (mediaType) {
      case 'image':
        if (mediaUrl && !imageError) {
          return (
            <div className={`relative max-w-sm ${className}`}>
              <img 
                src={imageSrc}
                alt={fileName || 'Image'}
                className="w-full h-auto max-h-64 object-cover rounded-lg shadow-md border border-gray-200"
                onError={async () => {
                  console.log('❌ Image loading error:', mediaUrl);
                  if (!triedBlobFallback && mediaUrl) {
                    try {
                      const resp = await fetch(mediaUrl);
                      const blob = await resp.blob();
                      const url = URL.createObjectURL(blob);
                      setImageSrc(url);
                      setTriedBlobFallback(true);
                    } catch (e) {
                      console.log('❌ Image blob fallback failed:', e);
                      setImageError(true);
                    }
                  } else {
                    setImageError(true);
                  }
                }}
                onLoad={() => console.log('✅ Image loaded successfully:', fileName)}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                📷 {fileName ? (fileName.length > 15 ? fileName.substring(0, 12) + '...' : fileName) : 'Photo'}
              </div>
              <Button
                onClick={handleDownload}
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 bg-black bg-opacity-70 hover:bg-opacity-90"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          );
        } else {
          return (
            <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 max-w-sm ${className}`}>
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Image className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">📷 Image</p>
                  <p className="text-sm text-blue-700 break-all">{fileName || 'image.jpg'}</p>
                  <p className="text-xs text-blue-600 mt-1">Image non disponible</p>
                  {mediaUrl && (
                    <p className="text-xs text-red-600 mt-1">URL: {mediaUrl}</p>
                  )}
                </div>
              </div>
              {qrCode && (
                <div className="mt-3 flex items-center gap-3 bg-white p-3 rounded-lg">
                  <img 
                    src={qrCode} 
                    alt="QR Code"
                    className="w-16 h-16 border border-gray-200 rounded"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium">QR Code disponible</p>
                    <p className="text-xs text-gray-600">Scannez pour accéder au fichier</p>
                  </div>
                </div>
              )}
            </div>
          );
        }
      
      case 'video':
        return (
          <div className={`rounded-lg p-4 border max-w-sm ${className} bg-white border-gray-200`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-100">
                <Video className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Vidéo</p>
                <p className="text-sm text-gray-600 break-all">{fileName || 'video.mp4'}</p>
              </div>
            </div>
          </div>
        );
      
      case 'audio':
        return (
          <div className={`rounded-lg p-4 border max-w-sm ${className} bg-white border-gray-200`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-100">
                <Music className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Audio</p>
                <p className="text-sm text-gray-600 break-all">{fileName || 'audio.mp3'}</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 max-w-sm ${className}`}>
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-gray-500 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">📄 Document</p>
                <p className="text-sm text-gray-700 break-all">{fileName || 'document'}</p>
              </div>
            </div>
            
            {mediaUrl ? (
              <>
                <a 
                  href={mediaUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white p-3 rounded-lg hover:bg-gray-50 transition-colors mb-3"
                >
                  <ExternalLink className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Ouvrir le document</p>
                    <p className="text-xs text-gray-600">Cliquez pour télécharger</p>
                  </div>
                </a>

                {qrCode && (
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                    <img 
                      src={qrCode} 
                      alt="QR Code document"
                      className="w-16 h-16 border border-gray-200 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium">QR Code disponible</p>
                      <p className="text-xs text-gray-600">Accès direct au document</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm font-medium">Document non disponible</p>
                <p className="text-xs text-gray-600">Fichier non extrait</p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="my-2">
      {renderMedia()}
    </div>
  );
};

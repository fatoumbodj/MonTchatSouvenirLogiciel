
import React from 'react';
import { MessageData } from '@/types/message';
import { MediaDisplay } from './MediaDisplay';

interface MessageBubbleProps {
  message: MessageData;
  isCurrentUser: boolean;
  textSizeClass: string;
  fontFamilyClass: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  textSizeClass,
  fontFamilyClass,
}) => {
  // Nettoyer et traiter l'URL des médias
  const getCleanMediaUrl = (mediaUrl: any): string | null => {
    console.log('🔍 Processing mediaUrl:', mediaUrl, typeof mediaUrl);
    
    if (!mediaUrl) return null;
    
    // Si c'est un objet avec _type et value
    if (typeof mediaUrl === 'object' && mediaUrl.value) {
      if (mediaUrl.value === 'undefined' || mediaUrl.value === undefined || 
          mediaUrl.value === null || mediaUrl.value === 'null') {
        return null;
      }
      return mediaUrl.value;
    }
    
    // Si c'est directement une string
    if (typeof mediaUrl === 'string') {
      if (mediaUrl === 'undefined' || mediaUrl === '' || mediaUrl === 'null' || mediaUrl === null) {
        return null;
      }
      return mediaUrl;
    }
    
    return null;
  };

  const cleanMediaUrl = getCleanMediaUrl(message.mediaUrl);
  const cleanFileName = message.mediaFileName && typeof message.mediaFileName === 'object' 
    ? (message.mediaFileName as any).value 
    : message.mediaFileName;

  // Debug log for media processing
  if (message.type !== 'text') {
    console.log('🎬 Media message processing:', {
      id: message.id,
      type: message.type,
      content: message.content?.substring(0, 50),
      originalMediaUrl: message.mediaUrl,
      cleanMediaUrl,
      mediaFileName: cleanFileName,
      hasValidMediaUrl: !!cleanMediaUrl,
      hasQrCode: !!message.qrCode
    });
  }

  return (
    <div className="mb-4">

      <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className="max-w-xs lg:max-w-md xl:max-w-lg">
          {/* Nom de l'expéditeur pour les non-utilisateurs actuels */}
          {!isCurrentUser && (
            <div className="text-sm text-purple-600 font-bold mb-2 ml-3">
              {message.sender}
            </div>
          )}
          
          {/* Bulle de message avec fond coloré */}
          <div
            className={`rounded-3xl px-4 py-3 shadow-lg relative max-w-full ${
              isCurrentUser
                ? 'text-white rounded-br-md'
                : 'border border-gray-200 text-gray-800 rounded-bl-md'
            }`}
            style={isCurrentUser 
              ? { backgroundColor: 'var(--bubble-user)' }
              : { backgroundColor: 'var(--bubble-other)' }}
          >
            {/* Contenu texte pour messages texte */}
            {message.content && message.type === 'text' && (
              <div className={`${textSizeClass} ${fontFamilyClass} leading-relaxed break-words`}>
                {message.content}
              </div>
            )}
            
            {/* Affichage des médias */}
            {message.type !== 'text' && (
              <div className="space-y-2">
                {/* Affichage du contenu texte s'il existe et n'est pas générique */}
                {message.content && 
                 message.content !== 'Photo partagée' && 
                 message.content !== 'Vidéo partagée' &&
                 message.content !== 'Note vocale' &&
                 message.content !== 'Média partagé' &&
                 message.content !== '<Media omitted>' && 
                 message.content !== '<Média omis>' && 
                 !message.content.includes('image omitted') && (
                  <div className={`${textSizeClass} ${fontFamilyClass} leading-relaxed mb-2 break-words`}>
                    {message.content}
                  </div>
                )}
                
                {/* Composant MediaDisplay avec gestion des types corrects */}
                <MediaDisplay
                  mediaUrl={(message.mediaDataUrl || cleanMediaUrl || undefined)}
                  mediaType={message.type as 'image' | 'video' | 'audio' | 'document'}
                  fileName={cleanFileName}
                  qrCode={message.qrCode}
                  className="w-full"
                />
              </div>
            )}

            {/* Heure du message */}
            <div className={`mt-2 text-[11px] ${isCurrentUser ? 'text-white/70' : 'text-gray-500'} text-right`}>
              {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

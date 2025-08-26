
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, QrCode } from 'lucide-react';
import { MessageData, BookSettings } from '@/types/message';
import { toast } from 'sonner';
import { pdfGenerator } from '@/services/pdfGenerator';
import { ConversationView } from './ConversationView';

interface BookPreviewProps {
  messages: MessageData[];
  bookSettings: BookSettings;
  onBack: () => void;
}

export const BookPreview: React.FC<BookPreviewProps> = ({
  messages,
  bookSettings,
  onBack,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    
    try {
      const pdfBlob = await pdfGenerator.generatePDF(messages, bookSettings);
      
      // Créer un lien de téléchargement
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${bookSettings.title || 'Mon Livre WhatsApp'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Livre téléchargé avec succès !');
      
    } catch (error) {
      toast.error('Erreur lors de la génération du livre');
      console.error('PDF generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getTextSizeClass = () => {
    switch (bookSettings.textSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getFontFamilyClass = () => {
    switch (bookSettings.fontFamily) {
      case 'serif': return 'font-serif';
      case 'script': return 'font-script';
      default: return 'font-sans';
    }
  };

  // Statistiques des médias - correction du calcul
  const mediaStats = messages.reduce((stats, message) => {
    console.log('Message type:', message.type, 'Content:', message.content, 'MediaUrl:', message.mediaUrl);
    if (message.type === 'image') {
      stats.photos++;
    } else if (message.type === 'video') {
      stats.videos++;
    } else if (message.type === 'audio') {
      stats.audios++;
    }
    return stats;
  }, { photos: 0, videos: 0, audios: 0 });

  console.log('Media stats calculated:', mediaStats);
  console.log('Total messages:', messages.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="bg-white/80 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'éditeur
        </Button>
        
        <Button 
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          size="lg"
        >
          <Download className="w-5 h-5 mr-2" />
          {isGenerating ? 'Génération...' : 'Télécharger le Livre'}
        </Button>
      </div>

      {/* Book Preview */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Cover Page */}
        <Card className="bg-white shadow-2xl">
          <CardContent className="p-0">
            <div 
              className="p-12 text-center text-white relative overflow-hidden min-h-[600px] flex flex-col justify-center"
              style={{ backgroundColor: bookSettings.coverColor }}
            >
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <h1 className={`text-4xl md:text-6xl font-bold mb-4 ${getFontFamilyClass()}`}>
                  {bookSettings.title}
                </h1>
                {bookSettings.authors && (
                  <p className="text-xl md:text-2xl opacity-90 mb-6">
                    {bookSettings.authors}
                  </p>
                )}

                {/* Image centrale comme sur la couverture d'exemple */}
                {bookSettings.coverImageDataUrl && (
                  <div className="mx-auto w-full max-w-md bg-white/95 rounded-lg p-2 shadow-xl border border-black/10">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-md">
                      <img
                        src={bookSettings.coverImageDataUrl}
                        alt="Image de couverture"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-10 text-lg opacity-80">
                  {messages.length} messages • {mediaStats.photos} photos • {mediaStats.videos} vidéos • {mediaStats.audios} audios
                </div>
                <div className="text-base opacity-70 mt-2">
                  {new Date().getFullYear()}
                </div>
              </div>
              <div className="absolute bottom-4 right-4 opacity-20">
                <QrCode className="w-16 h-16" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preface Page */}
        {bookSettings.preface && (
          <Card className="bg-white shadow-2xl">
            <CardContent className="p-0">
              <div className="p-12 min-h-[600px] flex flex-col">
                <h2 className="text-3xl font-bold mb-8 text-purple-800 text-center">Préface</h2>
                <div className={`${getTextSizeClass()} ${getFontFamilyClass()} leading-relaxed text-gray-700 flex-1 flex flex-col justify-center`}>
                  {bookSettings.preface.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-6 text-justify">{paragraph}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dedication Page */}
        {bookSettings.dedication && (
          <Card className="bg-white shadow-2xl">
            <CardContent className="p-0">
              <div className="p-12 bg-purple-50 min-h-[600px] flex flex-col justify-center">
                <h2 className="text-3xl font-bold mb-8 text-purple-800 text-center">Dédicace</h2>
                <div className={`${getTextSizeClass()} ${getFontFamilyClass()} italic text-center text-gray-700 text-xl leading-relaxed`}>
                  {bookSettings.dedication}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversations Page */}
        <Card className="bg-white shadow-2xl">
          <CardContent className="p-0">
            <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
              <h2 className="text-3xl font-bold mb-8 text-purple-800 text-center">Nos Conversations</h2>
              
              <div className="max-w-2xl mx-auto">
                <ConversationView 
                  messages={messages}
                  textSizeClass={getTextSizeClass()}
                  fontFamilyClass={getFontFamilyClass()}
                  bubbleColorUser={bookSettings.bubbleColorUser}
                  bubbleColorOther={bookSettings.bubbleColorOther}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

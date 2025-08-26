
import React, { useState } from 'react';
import { Upload, FileText, Image, Video, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { MessageData } from '@/types/message';
import { whatsappParser } from '@/services/whatsappParser';


interface FileUploadProps {
  onMessagesExtracted: (messages: MessageData[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onMessagesExtracted }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const zip = fileArray.find((f) => f.name.endsWith('.zip'));
    if (zip) {
      await handleFile(zip);
      return;
    }

    const imageFiles = fileArray.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length) {
      const newMessages: MessageData[] = [];
      for (const file of imageFiles) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newMessages.push({
          id: `${Date.now()}-${file.name}`,
          timestamp: new Date(),
          sender: 'Moi',
          content: '',
          type: 'image',
          mediaDataUrl: dataUrl,
          mediaFileName: file.name,
        });
      }
      toast.success(`${imageFiles.length} image(s) ajoutée(s).`);
      onMessagesExtracted(newMessages);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // If a ZIP is provided, prioritize it
    const zip = Array.from(files).find((f) => f.name.endsWith('.zip'));
    if (zip) {
      await handleFile(zip);
      return;
    }

    // Otherwise handle images
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length) {
      const newMessages: MessageData[] = [];
      for (const file of imageFiles) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newMessages.push({
          id: `${Date.now()}-${file.name}`,
          timestamp: new Date(),
          sender: 'Moi',
          content: '',
          type: 'image',
          mediaDataUrl: dataUrl,
          mediaFileName: file.name,
        });
      }
      toast.success(`${imageFiles.length} image(s) ajoutée(s).`);
      onMessagesExtracted(newMessages);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      toast.error('Veuillez sélectionner un fichier ZIP contenant l\'export WhatsApp');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Update progress
      setUploadProgress(20);
      
      // Parse the WhatsApp ZIP file
      const messages = await whatsappParser.parseWhatsAppZip(file);
      
      setUploadProgress(100);
      
      toast.success(`Fichier traité avec succès ! ${messages.length} messages extraits.`);
      onMessagesExtracted(messages);
      
    } catch (error) {
      toast.error('Erreur lors du traitement du fichier: ' + (error as Error).message);
      console.error('File processing error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-purple-200 bg-white/50 backdrop-blur-sm">
      <CardContent className="p-8">
        <div
          className={`relative rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'bg-purple-100 border-purple-300' 
              : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
          } border-2 border-dashed`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!isUploading ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                  <Upload className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Importez un export WhatsApp ou des images
              </h3>
              
              <p className="text-gray-600 mb-6">
                Glissez-déposez un ZIP ou des images, ou cliquez pour sélectionner
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
                  <FileText className="w-6 h-6 text-purple-500 mb-2" />
                  <span className="text-sm text-gray-600">Messages</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
                  <Image className="w-6 h-6 text-pink-500 mb-2" />
                  <span className="text-sm text-gray-600">Photos</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
                  <Video className="w-6 h-6 text-purple-500 mb-2" />
                  <span className="text-sm text-gray-600">Vidéos</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
                  <Music className="w-6 h-6 text-pink-500 mb-2" />
                  <span className="text-sm text-gray-600">Audio</span>
                </div>
              </div>

              <input
                type="file"
                accept=".zip,image/*"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              
              <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <label htmlFor="file-upload" className="cursor-pointer">
                  Sélectionner des fichiers
                </label>
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                  <Upload className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800">
                Traitement en cours...
              </h3>
              
              <div className="max-w-xs mx-auto">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-gray-600 mt-2">
                  {uploadProgress < 50 ? 'Extraction et analyse des fichiers...' : 
                   'Sauvegarde et finalisation...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

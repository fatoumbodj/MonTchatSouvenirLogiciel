
import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { BookEditor } from '@/components/BookEditor';
import { BookPreview } from '@/components/BookPreview';
import { Header } from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageData, BookSettings } from '@/types/message';


const Index = () => {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [bookSettings, setBookSettings] = useState<BookSettings>({
    title: 'Notre Histoire',
    authors: '',
    preface: '',
    dedication: '',
    coverColor: '#8B5CF6',
    textSize: 'medium' as const,
    fontFamily: 'serif' as const,
    bubbleColorUser: '#8B5CF6',
    bubbleColorOther: '#ffffff'
  });
  const [currentStep, setCurrentStep] = useState<'upload' | 'edit' | 'preview'>('upload');
  

  const handleMessagesExtracted = (extractedMessages: MessageData[]) => {
    setMessages(extractedMessages);
    setCurrentStep('edit');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {currentStep === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                ChatBook Maker
              </h1>
              <p className="text-lg text-gray-600">
                Transformez vos conversations WhatsApp en un livre personnalisé unique
              </p>
            </div>
            <FileUpload onMessagesExtracted={handleMessagesExtracted} />
          </div>
        )}

        {currentStep === 'edit' && (
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="editor">Éditeur de Livre</TabsTrigger>
              <TabsTrigger value="preview" onClick={() => setCurrentStep('preview')}>
                Aperçu du Livre
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor">
              <BookEditor 
                messages={messages}
                bookSettings={bookSettings}
                onSettingsChange={setBookSettings}
                onAddMessages={(newMsgs) => setMessages((prev) => [...prev, ...newMsgs])}
                onPreview={() => setCurrentStep('preview')}
              />
            </TabsContent>
          </Tabs>
        )}

        {currentStep === 'preview' && (
          <BookPreview 
            messages={messages}
            bookSettings={bookSettings}
            onBack={() => setCurrentStep('edit')}
          />
        )}
      </div>
    </div>
  );
};

export default Index;

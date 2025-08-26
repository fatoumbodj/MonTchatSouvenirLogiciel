
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Palette, Type, Eye } from 'lucide-react';
import { MessageData, BookSettings } from '@/types/message';

interface BookEditorProps {
  messages: MessageData[];
  bookSettings: BookSettings;
  onSettingsChange: (settings: BookSettings) => void;
  onAddMessages: (newMessages: MessageData[]) => void;
  onPreview: () => void;
}

export const BookEditor: React.FC<BookEditorProps> = ({
  messages,
  bookSettings,
  onSettingsChange,
  onAddMessages,
  onPreview,
}) => {
  const handleSettingChange = (key: keyof BookSettings, value: string) => {
    onSettingsChange({
      ...bookSettings,
      [key]: value,
    });
  };

  const coverColors = [
    { name: 'Violet Royal', value: '#8B5CF6' },
    { name: 'Rose Passion', value: '#EC4899' },
    { name: 'Bleu Océan', value: '#3B82F6' },
    { name: 'Vert Émeraude', value: '#10B981' },
    { name: 'Rouge Rubis', value: '#EF4444' },
    { name: 'Or Antique', value: '#F59E0B' },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Settings Panel */}
      <div className="space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5 text-purple-600" />
              Informations du Livre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Titre du livre</Label>
              <Input
                id="title"
                value={bookSettings.title}
                onChange={(e) => handleSettingChange('title', e.target.value)}
                placeholder="Notre Histoire"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="authors">Auteurs</Label>
              <Input
                id="authors"
                value={bookSettings.authors}
                onChange={(e) => handleSettingChange('authors', e.target.value)}
                placeholder="Rachel & Matt"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="preface">Préface</Label>
              <Textarea
                id="preface"
                value={bookSettings.preface}
                onChange={(e) => handleSettingChange('preface', e.target.value)}
                placeholder="Écrivez une belle préface pour votre livre..."
                className="mt-1 min-h-[100px]"
              />
            </div>
            
            <div>
              <Label htmlFor="dedication">Dédicace</Label>
              <Textarea
                id="dedication"
                value={bookSettings.dedication}
                onChange={(e) => handleSettingChange('dedication', e.target.value)}
                placeholder="À tous ceux qui croient en l'amour..."
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-600" />
              Personnalisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Couleur de couverture</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {coverColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleSettingChange('coverColor', color.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      bookSettings.coverColor === color.value
                        ? 'border-gray-800 scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                  >
                    <div className="text-white text-xs font-medium">
                      {color.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Image de couverture */}
            <div className="mt-4">
              <Label>Image de couverture (optionnelle)</Label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const dataUrl = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                      });
                      onSettingsChange({ ...bookSettings, coverImageDataUrl: dataUrl });
                    }}
                    className="w-full"
                  />
                </div>
                {bookSettings.coverImageDataUrl && (
                  <div className="justify-self-end">
                    <img
                      src={bookSettings.coverImageDataUrl}
                      alt="Aperçu image de couverture"
                      className="w-28 h-28 object-cover rounded-md border border-gray-200 shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="textSize">Taille du texte</Label>
                <Select value={bookSettings.textSize} onValueChange={(value: 'small' | 'medium' | 'large') => handleSettingChange('textSize', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Petit</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="large">Grand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="fontFamily">Police de caractère</Label>
                <Select value={bookSettings.fontFamily} onValueChange={(value: 'serif' | 'sans-serif' | 'script') => handleSettingChange('fontFamily', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serif">Serif (Classique)</SelectItem>
                    <SelectItem value="sans-serif">Sans-serif (Moderne)</SelectItem>
                    <SelectItem value="script">Script (Élégant)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Couleur bulle (moi)</Label>
                <input
                  type="color"
                  value={bookSettings.bubbleColorUser || '#8B5CF6'}
                  onChange={(e) => handleSettingChange('bubbleColorUser', e.target.value)}
                  className="mt-2 h-10 w-full rounded border border-gray-200"
                />
              </div>
              <div>
                <Label>Couleur bulle (autre)</Label>
                <input
                  type="color"
                  value={bookSettings.bubbleColorOther || '#ffffff'}
                  onChange={(e) => handleSettingChange('bubbleColorOther', e.target.value)}
                  className="mt-2 h-10 w-full rounded border border-gray-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-purple-100">
          <CardHeader>
            <CardTitle>Ajouter des images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                const newMessages: MessageData[] = [];
                for (const file of files) {
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
                onAddMessages(newMessages);
              }}
              className="w-full"
            />
            <p className="text-xs text-gray-500">Les images sont intégrées directement (aucun stockage nécessaire).</p>
          </CardContent>
        </Card>

        <Button 
          onClick={onPreview}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          size="lg"
        >
          <Eye className="w-5 h-5 mr-2" />
          Prévisualiser le livre
        </Button>
      </div>

      {/* Messages Preview */}
      <Card className="bg-white/80 backdrop-blur-sm border-purple-100">
        <CardHeader>
          <CardTitle>Aperçu des Messages ({messages.length} messages)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {messages.slice(0, 10).map((message) => (
              <div key={message.id} className="border-l-4 border-purple-200 pl-4 py-2">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-purple-700">{message.sender}</span>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">{message.content}</p>
                {message.type !== 'text' && (
                  <div className="mt-2 text-xs text-purple-600 font-medium">
                    📎 {message.type === 'image' ? 'Photo' : 
                        message.type === 'video' ? 'Vidéo' : 'Audio'}
                  </div>
                )}
              </div>
            ))}
            {messages.length > 10 && (
              <div className="text-center text-gray-500 text-sm py-4">
                ... et {messages.length - 10} autres messages
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

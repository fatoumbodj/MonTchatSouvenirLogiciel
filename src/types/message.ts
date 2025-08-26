
export interface MessageData {
  id: string;
  timestamp: Date;
  sender: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio';
  mediaUrl?: string;
  mediaFileName?: string;
  mediaDataUrl?: string;
  qrCode?: string;
}

export interface BookSettings {
  title: string;
  authors: string;
  preface: string;
  dedication: string;
  coverColor: string;
  coverImageDataUrl?: string;
  textSize: 'small' | 'medium' | 'large';
  fontFamily: 'serif' | 'sans-serif' | 'script';
  bubbleColorUser?: string;
  bubbleColorOther?: string;
}

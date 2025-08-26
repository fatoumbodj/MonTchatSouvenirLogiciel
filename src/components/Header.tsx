
import React from 'react';
import { Book, Heart } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Book className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">ChatBook Maker</h1>
              <p className="text-sm text-gray-500">Créateur de livres personnalisés</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-purple-600">
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">Fait avec amour</span>
          </div>
        </div>
      </div>
    </header>
  );
};


import React from 'react';
import { MessageData } from '@/types/message';
import { MessageBubble } from './MessageBubble';

interface ConversationViewProps {
  messages: MessageData[];
  textSizeClass: string;
  fontFamilyClass: string;
  bubbleColorUser?: string;
  bubbleColorOther?: string;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  messages,
  textSizeClass,
  fontFamilyClass,
  bubbleColorUser,
  bubbleColorOther,
}) => {
  // Get all unique senders to determine who is the "current user" (most active sender)
  const senderCounts = messages.reduce((counts, message) => {
    counts[message.sender] = (counts[message.sender] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  const currentUser = Object.entries(senderCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

  return (
    <div
      className="space-y-1"
      style={{ ['--bubble-user' as any]: bubbleColorUser || '#8B5CF6', ['--bubble-other' as any]: bubbleColorOther || '#ffffff' }}
    >
      {(() => {
        const elements: JSX.Element[] = [];
        let lastDateKey = '';

        const formatLongDate = (d: Date) =>
          d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        for (const message of messages) {
          const dateKey = message.timestamp.toDateString();
          if (dateKey !== lastDateKey) {
            lastDateKey = dateKey;
            elements.push(
              <div key={`sep-${dateKey}`} className="my-6 text-center">
                <span className="inline-block bg-white text-gray-700 text-sm px-4 py-1 rounded-full shadow-sm border border-gray-200">
                  {formatLongDate(message.timestamp)}
                </span>
              </div>
            );
          }

          elements.push(
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.sender === currentUser}
              textSizeClass={textSizeClass}
              fontFamilyClass={fontFamilyClass}
            />
          );
        }

        return elements;
      })()}
    </div>
  );
};

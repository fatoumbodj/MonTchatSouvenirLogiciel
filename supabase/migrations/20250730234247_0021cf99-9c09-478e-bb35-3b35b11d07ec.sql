
-- -- Create table for storing WhatsApp conversations/books
-- CREATE TABLE public.whatsapp_books (
--   id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id UUID REFERENCES auth.users,
--   title TEXT NOT NULL,
--   authors TEXT,
--   preface TEXT,
--   dedication TEXT,
--   cover_color TEXT DEFAULT '#8B5CF6',
--   text_size TEXT DEFAULT 'medium',
--   font_family TEXT DEFAULT 'serif',
--   created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
--   updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
-- );

-- -- Create table for storing WhatsApp messages
-- CREATE TABLE public.whatsapp_messages (
--   id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
--   book_id UUID REFERENCES public.whatsapp_books(id) ON DELETE CASCADE,
--   original_id TEXT, -- Original message ID from WhatsApp
--   timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
--   sender TEXT NOT NULL,
--   content TEXT,
--   message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'video', 'audio'
--   media_url TEXT, -- URL to media file in Supabase storage
--   media_filename TEXT,
--   qr_code TEXT, -- QR code data for media access
--   created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
-- );

-- -- Enable RLS on both tables
-- ALTER TABLE public.whatsapp_books ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- -- RLS policies for whatsapp_books
-- CREATE POLICY "Users can view their own books" 
--   ON public.whatsapp_books 
--   FOR SELECT 
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Users can create their own books" 
--   ON public.whatsapp_books 
--   FOR INSERT 
--   WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update their own books" 
--   ON public.whatsapp_books 
--   FOR UPDATE 
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Users can delete their own books" 
--   ON public.whatsapp_books 
--   FOR DELETE 
--   USING (auth.uid() = user_id);

-- -- RLS policies for whatsapp_messages
-- CREATE POLICY "Users can view messages from their books" 
--   ON public.whatsapp_messages 
--   FOR SELECT 
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.whatsapp_books 
--       WHERE id = book_id AND user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can create messages for their books" 
--   ON public.whatsapp_messages 
--   FOR INSERT 
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM public.whatsapp_books 
--       WHERE id = book_id AND user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can update messages from their books" 
--   ON public.whatsapp_messages 
--   FOR UPDATE 
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.whatsapp_books 
--       WHERE id = book_id AND user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can delete messages from their books" 
--   ON public.whatsapp_messages 
--   FOR DELETE 
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.whatsapp_books 
--       WHERE id = book_id AND user_id = auth.uid()
--     )
--   );

-- -- Create storage bucket for WhatsApp media files
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('whatsapp-media', 'whatsapp-media', true);

-- -- Create storage policy for media files
-- CREATE POLICY "Users can upload their media files" 
--   ON storage.objects 
--   FOR INSERT 
--   WITH CHECK (bucket_id = 'whatsapp-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view their media files" 
--   ON storage.objects 
--   FOR SELECT 
--   USING (bucket_id = 'whatsapp-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Public can view media files" 
--   ON storage.objects 
--   FOR SELECT 
--   USING (bucket_id = 'whatsapp-media');

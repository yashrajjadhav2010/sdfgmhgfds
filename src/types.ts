export type PageId = 'home' | 'lectures' | 'notes' | 'mindmaps' | 'about' | 'contact' | 'privacy';

export interface VideoItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    thumbnails: {
      high: {
        url: string;
      };
    };
  };
}

export interface DriveFile {
  id: string;
  name: string;
  thumbnailLink?: string;
}

export interface NoteItem {
  id: string;
  title: string;
  board: string;
  subject: string;
  icon: string;
}

export interface MindMapItem {
  id: string;
  title: string;
  thumbUrl: string;
}

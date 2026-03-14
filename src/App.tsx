import { useState, useEffect, useCallback } from 'react';
import { 
  Tv, 
  FileSignature, 
  Network, 
  Info, 
  Moon, 
  Sun, 
  Youtube, 
  Search, 
  Play, 
  FlaskConical, 
  Calculator, 
  Castle, 
  FileText,
  X,
  Download,
  Bolt,
  Flame,
  GraduationCap,
  Mail,
  Home as HomeIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, VideoItem, NoteItem, MindMapItem } from './types';
import { 
  YOUTUBE_API_KEY, 
  CHANNEL_ID, 
  DRIVE_API_KEY, 
  NOTES_FOLDER_ID, 
  MAPS_FOLDER_ID 
} from './constants';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('home');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('bt_theme') === 'dark');
  const [isSubscribed, setIsSubscribed] = useState(() => localStorage.getItem('bt_verified') === 'true');
  const [showSubModal, setShowSubModal] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ id: string; title: string } | null>(null);
  
  // Data states
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [mindMaps, setMindMaps] = useState<MindMapItem[]>([]);
  const [subCount, setSubCount] = useState<string>('---');
  const [loading, setLoading] = useState({ videos: false, notes: false, mindMaps: false });
  
  // Filters
  const [lectureSearch, setLectureSearch] = useState('');
  const [noteSearch, setNoteSearch] = useState('');
  const [mindMapSearch, setMindMapSearch] = useState('');
  const [boardFilter, setBoardFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('bt_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    setIsDark(!isDark);
  };

  const navigateTo = (page: PageId) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchVideos = useCallback(async () => {
    if (videos.length > 0) return;
    setLoading(prev => ({ ...prev, videos: true }));
    try {
      const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${CHANNEL_ID}&part=id&order=date&maxResults=20&type=video`);
      const searchData = await searchRes.json();
      
      if (searchData.items?.length > 0) {
        const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
        const videoRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=snippet,contentDetails`);
        const videoData = await videoRes.json();
        
        const filteredVideos = videoData.items
          .filter((video: any) => {
            const duration = video.contentDetails.duration;
            return !(!duration.includes('H') && !duration.includes('M') || duration === 'PT1M');
          })
          .map((video: any) => ({ id: { videoId: video.id }, snippet: video.snippet }));
        
        setVideos(filteredVideos);
      }
    } catch (e) {
      console.error('Failed to load videos', e);
    } finally {
      setLoading(prev => ({ ...prev, videos: false }));
    }
  }, [videos.length]);

  const fetchNotes = useCallback(async () => {
    if (notes.length > 0) return;
    setLoading(prev => ({ ...prev, notes: true }));
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q='${NOTES_FOLDER_ID}'+in+parents+and+trashed=false&key=${DRIVE_API_KEY}&fields=files(id,name)`);
      const data = await res.json();
      
      if (data.files?.length > 0) {
        const formattedNotes = data.files.map((file: any) => {
          let board = "General";
          let subject = "General";
          let title = file.name.replace(/\.[^/.]+$/, "");
          
          if (title.includes('-')) {
            const parts = title.split('-');
            if (parts.length >= 3) {
              board = parts[0].trim();
              subject = parts[1].trim();
              title = parts.slice(2).join('-').trim();
            } else {
              subject = parts[0].trim();
              title = parts.slice(1).join('-').trim();
            }
          }

          let icon = "FileText";
          const s = subject.toLowerCase();
          if (s.includes('sci')) icon = "FlaskConical";
          if (s.includes('math')) icon = "Calculator";
          if (s.includes('hist')) icon = "Castle";

          return { id: file.id, title, board, subject, icon };
        });
        setNotes(formattedNotes);
      }
    } catch (e) {
      console.error('Failed to load notes', e);
    } finally {
      setLoading(prev => ({ ...prev, notes: false }));
    }
  }, [notes.length]);

  const fetchMindMaps = useCallback(async () => {
    if (mindMaps.length > 0) return;
    setLoading(prev => ({ ...prev, mindMaps: true }));
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q='${MAPS_FOLDER_ID}'+in+parents+and+trashed=false&key=${DRIVE_API_KEY}&fields=files(id,name,thumbnailLink)`);
      const data = await res.json();
      
      if (data.files?.length > 0) {
        const formattedMaps = data.files.map((file: any) => ({
          id: file.id,
          title: file.name.replace(/\.[^/.]+$/, ""),
          thumbUrl: file.thumbnailLink ? file.thumbnailLink.replace('=s220', '=s600') : 'https://picsum.photos/seed/map/400/225'
        }));
        setMindMaps(formattedMaps);
      }
    } catch (e) {
      console.error('Failed to load mind maps', e);
    } finally {
      setLoading(prev => ({ ...prev, mindMaps: false }));
    }
  }, [mindMaps.length]);

  const fetchSubCount = useCallback(async () => {
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      
      if (data.items?.[0]?.statistics) {
        const stats = data.items[0].statistics;
        if (stats.hiddenSubscriberCount) {
          setSubCount('Hidden');
        } else if (stats.subscriberCount) {
          const count = parseInt(stats.subscriberCount);
          if (count >= 1000000) {
            setSubCount((count / 1000000).toFixed(1) + 'M');
          } else if (count >= 1000) {
            setSubCount((count / 1000).toFixed(1) + 'K');
          } else {
            setSubCount(count.toString());
          }
        } else {
          setSubCount('20+'); // Fallback if stats exist but no count
        }
      } else {
        setSubCount('20+'); // Fallback if no items
      }
    } catch (e) {
      console.error('Failed to fetch sub count', e);
      setSubCount('20+'); // Fallback on error
    }
  }, []);

  useEffect(() => {
    fetchSubCount();
    // Refresh every 5 minutes
    const interval = setInterval(fetchSubCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSubCount]);

  useEffect(() => {
    if (activePage === 'lectures') fetchVideos();
    if (activePage === 'notes') fetchNotes();
    if (activePage === 'mindmaps') fetchMindMaps();
  }, [activePage, fetchVideos, fetchNotes, fetchMindMaps]);

  const handleAction = (id: string, title: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setPendingFile({ id, title });
    if (isSubscribed) {
      setShowViewer(true);
    } else {
      setShowSubModal(true);
    }
  };

  const verifySub = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    if (localStorage.getItem('bt_clicked_sub') === 'true') {
      setIsSubscribed(true);
      localStorage.setItem('bt_verified', 'true');
      setShowSubModal(false);
      setShowViewer(true);
    } else {
      alert("Please click Subscribe Now first!");
    }
  };

  const filteredVideos = videos.filter(v => v.snippet.title.toLowerCase().includes(lectureSearch.toLowerCase()));
  const filteredNotes = notes.filter(n => {
    const boardMatch = boardFilter === 'all' || n.board.toLowerCase() === boardFilter.toLowerCase();
    const subjectMatch = subjectFilter === 'all' || n.subject.toLowerCase() === subjectFilter.toLowerCase();
    const searchMatch = n.title.toLowerCase().includes(noteSearch.toLowerCase());
    return boardMatch && subjectMatch && searchMatch;
  });
  const filteredMindMaps = mindMaps.filter(m => m.title.toLowerCase().includes(mindMapSearch.toLowerCase()));

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'FlaskConical': return <FlaskConical className="w-6 h-6" />;
      case 'Calculator': return <Calculator className="w-6 h-6" />;
      case 'Castle': return <Castle className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[var(--nav-bg)] backdrop-blur-xl fixed w-full top-0 z-50 border-b border-[var(--border-color)] transition-all duration-300">
        <div className="container mx-auto px-6">
          <nav className="flex justify-between items-center h-20">
            <button onClick={() => navigateTo('home')} className="flex items-center gap-2 text-xl font-extrabold text-primary tracking-tight">
              <Flame className="w-6 h-6" />
              BOARD TAPASYA
            </button>
            <ul className="hidden md:flex gap-8">
              {(['home', 'lectures', 'notes', 'mindmaps', 'about'] as PageId[]).map((page) => (
                <li key={page}>
                  <button 
                    onClick={() => navigateTo(page)}
                    className={`font-medium text-sm transition-colors ${activePage === page ? 'text-primary' : 'text-[var(--text-muted)] hover:text-primary'}`}
                  >
                    {page.charAt(0).toUpperCase() + page.slice(1).replace('mindmaps', 'Mind Maps')}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </button>
              <a 
                href="https://youtube.com/@boardtapasya?sub_confirmation=1" 
                target="_blank" 
                rel="noreferrer"
                className="hidden md:flex btn btn-primary text-sm py-2 px-5"
              >
                Subscribe <Youtube className="w-4 h-4" />
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[var(--nav-bg)] backdrop-blur-xl border-t border-[var(--border-color)] z-50 flex justify-around pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        {[
          { id: 'home', icon: HomeIcon, label: 'Home' },
          { id: 'lectures', icon: Tv, label: 'Lectures' },
          { id: 'notes', icon: FileSignature, label: 'Notes' },
          { id: 'mindmaps', icon: Network, label: 'Maps' },
          { id: 'about', icon: Info, label: 'About' }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => navigateTo(item.id as PageId)}
            className={`flex flex-col items-center justify-center flex-1 py-3 gap-1 transition-all ${activePage === item.id ? 'text-primary font-bold' : 'text-[var(--text-muted)]'}`}
          >
            <item.icon className={`w-5 h-5 ${activePage === item.id ? '-translate-y-0.5' : ''}`} />
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-20 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          {activePage === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="page active"
            >
              <section className="relative py-20 md:py-40 text-center overflow-hidden">
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-radial from-indigo-500/15 to-transparent rounded-full pointer-events-none" />
                <div className="container mx-auto px-6 relative z-10 max-w-4xl">
                  <div className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-full font-semibold text-xs mb-8 shadow-sm">
                    <Bolt className="w-4 h-4 text-accent" /> Updated for 2026-27 Board Syllabus
                  </div>
                  <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight">
                    Master Your Exams.<br />
                    <span className="bg-linear-to-r from-primary to-purple-500 bg-clip-text text-transparent">Unlock Your Potential.</span>
                  </h1>
                  <p className="text-lg md:text-xl text-[var(--text-muted)] mb-10 max-w-2xl mx-auto">
                    The ultimate learning destination for Board students. Master complex concepts with animated videos, perfectly structured notes, and expert guidance.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <button onClick={() => navigateTo('lectures')} className="btn btn-primary px-8 py-4 text-lg">Start Learning Now</button>
                    <button onClick={() => navigateTo('notes')} className="btn btn-outline px-8 py-4 text-lg">Browse Notes</button>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-5 mt-16">
                    {[
                      { val: subCount, label: 'Subscribers' },
                      { val: '100%', label: 'Free Content' },
                      { val: '4.9/5', label: 'Student Rating' }
                    ].map((stat, i) => (
                      <div key={i} className="stat-card">
                        <h4 className="text-3xl md:text-4xl font-extrabold text-primary mb-1">{stat.val}</h4>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="py-20 bg-black/5 dark:bg-white/5">
                <div className="container mx-auto px-6">
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold mb-3">Why Board Tapasya?</h2>
                    <p className="text-[var(--text-muted)]">Designed specifically to help you score 90%+ in the State Board exams.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { icon: Tv, color: 'text-primary', bg: 'bg-indigo-500/10', title: 'Visual Learning', desc: 'Animated videos that make complex Science & Maths concepts crystal clear and memorable.' },
                      { icon: FileSignature, color: 'text-success', bg: 'bg-emerald-500/10', title: 'Quality Notes', desc: 'Concise, point-wise notes designed exactly how examiners want you to write your answers.' },
                      { icon: Network, color: 'text-accent', bg: 'bg-amber-500/10', title: 'Smart Revision', desc: 'One-page visual mind maps for rapid, last-minute revision during the exam season.' }
                    ].map((feat, i) => (
                      <div key={i} className="feature-card">
                        <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${feat.bg} ${feat.color}`}>
                          <feat.icon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed">{feat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activePage === 'lectures' && (
            <motion.div 
              key="lectures"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="container mx-auto px-6 py-12"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold mb-3">Video Lectures</h2>
                <p className="text-[var(--text-muted)]">Our latest animated sessions automatically updated from YouTube.</p>
              </div>
              <div className="max-w-2xl mx-auto mb-10 relative">
                <input 
                  type="text" 
                  placeholder="Search lectures..." 
                  value={lectureSearch}
                  onChange={(e) => setLectureSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-5 h-5" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading.videos ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="video-card border-none shadow-none">
                      <div className="aspect-video skeleton rounded-t-2xl" />
                      <div className="p-6">
                        <div className="h-5 skeleton w-11/12 mb-3" />
                        <div className="h-5 skeleton w-2/3" />
                      </div>
                    </div>
                  ))
                ) : filteredVideos.length > 0 ? (
                  filteredVideos.map((video) => (
                    <a 
                      key={video.id.videoId}
                      href={`https://www.youtube.com/watch?v=${video.id.videoId}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="video-card group"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img 
                          src={video.snippet.thumbnails.high.url} 
                          alt={video.snippet.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-14 h-14 bg-white text-primary rounded-full flex items-center justify-center shadow-lg">
                            <Play className="w-6 h-6 fill-current" />
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold line-clamp-2 h-12 leading-tight group-hover:text-primary transition-colors">{video.snippet.title}</h3>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 text-[var(--text-muted)]">No lectures found matching your search.</div>
                )}
              </div>
            </motion.div>
          )}

          {activePage === 'notes' && (
            <motion.div 
              key="notes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="container mx-auto px-6 py-12"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold mb-3">Study Notes Repository</h2>
                <p className="text-[var(--text-muted)]">Chapter-wise PDF notes directly synced from Google Drive.</p>
              </div>

              <div className="max-w-2xl mx-auto mb-8 relative">
                <input 
                  type="text" 
                  placeholder="Search notes (e.g., Gravitation)..." 
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-5 h-5" />
              </div>

              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {['all', 'SSC', 'CBSE', 'ICSE'].map(board => (
                  <button 
                    key={board}
                    onClick={() => setBoardFilter(board)}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${boardFilter === board ? 'bg-primary text-white' : 'bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-primary'}`}
                  >
                    {board === 'all' ? 'All Boards' : board}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-3 mb-12">
                {['all', 'Science', 'Maths', 'Computer', 'English', 'Marathi', 'Hindi', 'SST'].map(subject => (
                  <button 
                    key={subject}
                    onClick={() => setSubjectFilter(subject)}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${subjectFilter === subject ? 'bg-primary text-white' : 'bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-primary'}`}
                  >
                    {subject === 'all' ? 'All Subjects' : subject}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading.notes ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="note-card pointer-events-none">
                      <div className="w-14 h-14 rounded-xl skeleton flex-shrink-0" />
                      <div className="flex-grow">
                        <div className="h-4 skeleton w-1/3 mb-2" />
                        <div className="h-6 skeleton w-3/4 mb-4" />
                        <div className="h-10 skeleton w-full rounded-xl" />
                      </div>
                    </div>
                  ))
                ) : filteredNotes.length > 0 ? (
                  filteredNotes.map((note) => (
                    <div key={note.id} className="note-card group">
                      <div className="w-14 h-14 bg-indigo-500/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        {renderIcon(note.icon)}
                      </div>
                      <div className="flex-grow">
                        <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">{note.board} | {note.subject}</span>
                        <h4 className="text-lg font-bold mb-4 line-clamp-1">{note.title}</h4>
                        <button 
                          onClick={() => handleAction(note.id, note.title)}
                          className="btn btn-primary w-full text-sm py-2.5"
                        >
                          View Notes
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 text-[var(--text-muted)]">No notes found matching your filters.</div>
                )}
              </div>
            </motion.div>
          )}

          {activePage === 'mindmaps' && (
            <motion.div 
              key="mindmaps"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="container mx-auto px-6 py-12"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold mb-3">Visual Mind Maps</h2>
                <p className="text-[var(--text-muted)]">High-quality images for rapid chapter revision synced from Google Drive.</p>
              </div>
              <div className="max-w-2xl mx-auto mb-10 relative">
                <input 
                  type="text" 
                  placeholder="Search mind maps..." 
                  value={mindMapSearch}
                  onChange={(e) => setMindMapSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-5 h-5" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading.mindMaps ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="video-card border-none shadow-none">
                      <div className="aspect-video skeleton rounded-t-2xl" />
                      <div className="p-6">
                        <div className="h-5 skeleton w-11/12 mb-3" />
                        <div className="h-10 skeleton w-full rounded-xl" />
                      </div>
                    </div>
                  ))
                ) : filteredMindMaps.length > 0 ? (
                  filteredMindMaps.map((map) => (
                    <div key={map.id} className="video-card group">
                      <div className="aspect-video relative overflow-hidden">
                        <img 
                          src={map.thumbUrl} 
                          alt={map.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold mb-4 line-clamp-1">{map.title}</h3>
                        <button 
                          onClick={() => handleAction(map.id, map.title)}
                          className="btn btn-primary w-full text-sm py-2.5"
                        >
                          View Full Image
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 text-[var(--text-muted)]">No mind maps found matching your search.</div>
                )}
              </div>
            </motion.div>
          )}

          {activePage === 'about' && (
            <motion.div 
              key="about"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="container mx-auto px-6 py-20 max-w-3xl"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold mb-3">About Us</h2>
                <p className="text-[var(--text-muted)]">The story behind Board Tapasya</p>
              </div>
              <div className="bg-[var(--card-bg)] p-10 md:p-14 rounded-3xl border border-[var(--border-color)] shadow-xl text-center">
                <div className="w-20 h-20 bg-indigo-500/10 text-primary rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                  <GraduationCap className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-[var(--text-muted)] text-lg leading-relaxed mb-10">
                  Board Tapasya was created with a single vision: to make high-quality board exam preparation accessible to every student for free. We believe that top-tier education shouldn't be locked behind expensive paywalls.
                </p>
                
                <h3 className="text-2xl font-bold mb-4">Who We Are</h3>
                <p className="text-[var(--text-muted)] text-lg leading-relaxed">
                  Founded by a fellow student who understands the exact challenges and pressures of board exams. We combine visual learning, point-wise notes, and smart revision maps to help you score 90%+ with confidence. Welcome to your ultimate study hub!
                </p>
              </div>
            </motion.div>
          )}

          {activePage === 'contact' && (
            <motion.div 
              key="contact"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="container mx-auto px-6 py-20 max-w-3xl"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold mb-3">Contact Us</h2>
                <p className="text-[var(--text-muted)]">We'd love to hear from you!</p>
              </div>
              <div className="bg-[var(--card-bg)] p-10 md:p-14 rounded-3xl border border-[var(--border-color)] shadow-xl text-center">
                <div className="w-20 h-20 bg-indigo-500/10 text-primary rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                  <Mail className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Get in Touch</h3>
                <p className="text-[var(--text-muted)] text-lg leading-relaxed mb-10">
                  For any business inquiries, suggestions, or support regarding our study materials, please reach out to us directly.
                </p>
                
                <a href="mailto:boardtapasya@gmail.com" className="btn btn-primary px-10 py-4 text-lg">
                  <Mail className="w-5 h-5" /> Email Us
                </a>
                <p className="mt-6 font-bold text-[var(--text-muted)]">boardtapasya@gmail.com</p>
              </div>
            </motion.div>
          )}

          {activePage === 'privacy' && (
            <motion.div 
              key="privacy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="container mx-auto px-6 py-20 max-w-3xl"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold mb-3">Privacy Policy</h2>
                <p className="text-[var(--text-muted)]">Last updated: March 2026</p>
              </div>
              <div className="bg-[var(--card-bg)] p-10 md:p-14 rounded-3xl border border-[var(--border-color)] shadow-xl space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-2">1. Introduction</h3>
                  <p className="text-[var(--text-muted)] leading-relaxed">Welcome to Board Tapasya. We respect your privacy and are committed to protecting your personal data while you use our educational platform.</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-2">2. Google AdSense & Cookies</h3>
                  <p className="text-[var(--text-muted)] leading-relaxed">We use Google AdSense to display advertisements. Google, as a third-party vendor, uses cookies to serve ads based on your prior visits to our website. You can opt out of personalized advertising by visiting Google's Ads Settings.</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-2">3. Third-Party Services</h3>
                  <p className="text-[var(--text-muted)] leading-relaxed">Our website utilizes third-party services such as Google Drive (for PDF notes) and YouTube (for video lectures). These services have their own privacy policies, and we do not hold responsibility for their data collection practices.</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2">4. Information Collection</h3>
                  <p className="text-[var(--text-muted)] leading-relaxed">We do not collect personal identification information unless voluntarily submitted. We may collect non-personal identification information such as browser type and technical connection details to improve user experience.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-20 border-t border-slate-900">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="text-2xl font-extrabold text-white mb-6">BOARD TAPASYA</div>
              <p className="leading-relaxed">Dedicated educational platform helping students master the All Board curriculum.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Navigate</h4>
              <ul className="space-y-3">
                <li><button onClick={() => navigateTo('home')} className="hover:text-white transition-colors">Home</button></li>
                <li><button onClick={() => navigateTo('lectures')} className="hover:text-white transition-colors">Lectures</button></li>
                <li><button onClick={() => navigateTo('notes')} className="hover:text-white transition-colors">Notes</button></li>
                <li><button onClick={() => navigateTo('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Support</h4>
              <ul className="space-y-3">
                <li><button onClick={() => navigateTo('contact')} className="hover:text-white transition-colors">Contact Us</button></li>
                <li><a href="https://youtube.com/@boardtapasya?sub_confirmation=1" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Join YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-900 text-center text-sm">
            &copy; 2026 Board Tapasya. All Rights Reserved.
          </div>
        </div>
      </footer>

      {/* Subscription Modal */}
      <AnimatePresence>
        {showSubModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[var(--card-bg)] p-10 rounded-[40px] max-w-md w-full text-center shadow-2xl border border-[var(--border-color)]"
            >
              <Youtube className="w-20 h-20 text-red-600 mx-auto mb-6" />
              <h2 className="text-3xl font-extrabold mb-2">Subscribe to Unlock</h2>
              <p className="text-[var(--text-muted)] mb-8">Please subscribe to <span className="font-bold text-[var(--text-main)]">Board Tapasya</span> on YouTube to unlock these premium resources.</p>
              <div className="flex flex-col gap-4">
                <a 
                  href="https://youtube.com/@boardtapasya?sub_confirmation=1" 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={() => {
                    localStorage.setItem('bt_clicked_sub', 'true');
                    if (navigator.vibrate) navigator.vibrate(50);
                  }}
                  className="btn bg-red-600 hover:bg-red-700 text-white py-4 text-lg"
                >
                  1. Subscribe Now
                </a>
                <button 
                  onClick={verifySub}
                  className="btn btn-outline py-4 text-lg"
                >
                  2. I have Subscribed
                </button>
                <button 
                  onClick={() => setShowSubModal(false)}
                  className="text-[var(--text-muted)] font-medium hover:text-[var(--text-main)] transition-colors mt-2"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {showViewer && pendingFile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowViewer(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="relative bg-[var(--card-bg)] w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border-color)]">
                <h3 className="font-bold text-lg truncate max-w-[80%]">{pendingFile.title}</h3>
                <button 
                  onClick={() => setShowViewer(false)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-grow bg-black">
                <iframe 
                  src={`https://drive.google.com/file/d/${pendingFile.id}/preview`} 
                  className="w-full h-full border-none"
                  title="Document Viewer"
                />
              </div>
              <div className="p-5 flex gap-4 border-t border-[var(--border-color)]">
                <a 
                  href={`https://drive.google.com/uc?export=download&id=${pendingFile.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary flex-grow py-3"
                >
                  <Download className="w-5 h-5" /> Download File
                </a>
                <button 
                  onClick={() => setShowViewer(false)}
                  className="btn btn-outline px-8"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

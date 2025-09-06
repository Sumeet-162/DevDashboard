import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  StickyNote, 
  Plus, 
  Search, 
  Tag,
  Edit3,
  Trash2,
  Star,
  Calendar,
  Filter,
  Archive,
  FileText,
  Hash,
  Eye
} from "lucide-react";
import { NotesService, Note } from "@/lib/productivityService";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const QuickNotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; noteId?: string }>({ show: false });
  
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'personal',
    tags: '',
    is_favorite: false
  });

  const [stats, setStats] = useState({
    totalNotes: 0,
    favoriteNotes: 0,
    archivedNotes: 0
  });

  const categories = [
    { value: 'personal', label: 'Personal', icon: '👤' },
    { value: 'work', label: 'Work', icon: '💼' },
    { value: 'ideas', label: 'Ideas', icon: '💡' },
    { value: 'learning', label: 'Learning', icon: '📚' },
    { value: 'projects', label: 'Projects', icon: '🚀' },
    { value: 'meetings', label: 'Meetings', icon: '🤝' },
    { value: 'misc', label: 'Miscellaneous', icon: '📝' }
  ];

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery, selectedCategory, selectedTag, showArchived]);

  const loadNotes = async () => {
    try {
      console.log('Loading notes...');
      
      // Load both archived and non-archived notes
      const [activeNotes, archivedNotes] = await Promise.all([
        NotesService.getNotes({ archived: false }),
        NotesService.getNotes({ archived: true })
      ]);
      
      const allNotes = [...activeNotes, ...archivedNotes];
      console.log('Loaded active notes:', activeNotes.length);
      console.log('Loaded archived notes:', archivedNotes.length);
      console.log('Total notes:', allNotes.length);
      
      setNotes(allNotes);
      
      // Calculate stats
      const stats = {
        totalNotes: allNotes.length,
        favoriteNotes: allNotes.filter(n => n.is_favorite && !n.is_archived).length,
        archivedNotes: allNotes.filter(n => n.is_archived).length
      };
      console.log('Calculated stats:', stats);
      setStats(stats);
    } catch (error) {
      console.error('Error loading notes:', error);
      
      // Show more detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  };

  const filterNotes = () => {
    let filtered = notes;
    
    // Filter by archived status
    if (showArchived) {
      filtered = filtered.filter(note => note.is_archived);
    } else {
      filtered = filtered.filter(note => !note.is_archived);
    }
    
    // Apply other filters
    filtered = filtered.filter(note => {
      const matchesSearch = !searchQuery || 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
      const matchesTag = selectedTag === 'all' || note.tags.includes(selectedTag);
      
      return matchesSearch && matchesCategory && matchesTag;
    });

    // Sort by favorites first, then by created date
    filtered.sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    console.log(`Filtered notes: ${filtered.length} (showArchived: ${showArchived})`);
    setFilteredNotes(filtered);
  };

  const getAllTags = () => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  const handleCreateNote = async () => {
    if (!newNote.title.trim()) return;
    
    try {
      const tags = newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      console.log('Creating note with data:', {
        title: newNote.title,
        content: newNote.content,
        category: newNote.category,
        tags,
        is_favorite: newNote.is_favorite
      });
      
      await NotesService.createNote({
        title: newNote.title,
        content: newNote.content,
        category: newNote.category,
        tags,
        is_favorite: newNote.is_favorite,
        is_archived: false
      });
      
      console.log('Note created successfully, reloading notes...');
      
      setNewNote({
        title: '',
        content: '',
        category: 'personal',
        tags: '',
        is_favorite: false
      });
      setShowNewNoteForm(false);
      
      // Force reload the notes
      await loadNotes();
      
      console.log('Notes reloaded successfully');
    } catch (error) {
      console.error('Error creating note:', error);
      
      // Show more detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.title.trim()) return;
    
    try {
      await NotesService.updateNote(editingNote.id, {
        title: editingNote.title,
        content: editingNote.content,
        category: editingNote.category,
        tags: editingNote.tags,
        is_favorite: editingNote.is_favorite
      });
      
      setEditingNote(null);
      loadNotes();
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await NotesService.deleteNote(noteId);
      setDeleteConfirm({ show: false });
      loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleToggleFavorite = async (note: Note) => {
    try {
      await NotesService.updateNote(note.id, {
        ...note,
        is_favorite: !note.is_favorite
      });
      loadNotes();
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleToggleArchive = async (note: Note) => {
    try {
      await NotesService.updateNote(note.id, {
        ...note,
        is_archived: !note.is_archived
      });
      loadNotes();
    } catch (error) {
      console.error('Error updating archive status:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : '📝';
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const groupedNotes = filteredNotes.reduce((groups, note) => {
    const category = note.category;
    if (!groups[category]) groups[category] = [];
    groups[category].push(note);
    return groups;
  }, {} as Record<string, Note[]>);

  return (
    <Layout>
      <div className="p-0 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-card-foreground">Quick Notes</h1>
            <p className="text-muted-foreground mt-1 text-base">Capture and organize your thoughts</p>
          </div>
          <Button onClick={() => setShowNewNoteForm(true)} size="lg" className="font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-3 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          <span className="flex items-center gap-2">
                            {category.icon} {category.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-card-foreground mb-3 block">Tag</label>
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {getAllTags().map(tag => (
                        <SelectItem key={tag} value={tag}>
                          <span className="flex items-center gap-2">
                            <Hash className="h-3 w-3" />
                            {tag}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-2 border-t border-border/50">
                  <Button
                    variant={showArchived ? "default" : "outline"}
                    onClick={() => setShowArchived(!showArchived)}
                    className="w-full justify-center text-sm font-semibold"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    {showArchived ? "Show Active Notes" : "Show Archived Notes"}
                  </Button>
                  
                  {(showArchived && stats.archivedNotes > 0) || (!showArchived && stats.totalNotes > 0) ? (
                    <div className="text-center">
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {showArchived ? stats.archivedNotes : stats.totalNotes - stats.archivedNotes} notes
                      </Badge>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* New Note Form - Enhanced */}
            {showNewNoteForm && (
              <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 font-bold text-card-foreground">
                      <Plus className="h-5 w-5 text-primary" />
                      Create New Note
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowNewNoteForm(false)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Input
                      placeholder="What's the title of your note?"
                      value={newNote.title}
                      onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                      className="text-lg font-medium"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Select value={newNote.category} onValueChange={(value) => setNewNote(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Choose category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.value} value={category.value}>
                              <div className="flex items-center gap-2">
                                <span>{category.icon}</span>
                                <span>{category.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={() => setNewNote(prev => ({ ...prev, is_favorite: !prev.is_favorite }))}
                        className={`${newNote.is_favorite ? "text-yellow-600 border-yellow-300 bg-yellow-50" : ""} whitespace-nowrap`}
                        title={newNote.is_favorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star className={`h-4 w-4 ${newNote.is_favorite ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                  </div>
                  
                  <Textarea
                    placeholder="Write your thoughts, ideas, or reminders here..."
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.ctrlKey && e.key === 'Enter') {
                        e.preventDefault();
                        if (newNote.title.trim()) {
                          handleCreateNote();
                        }
                      }
                    }}
                    rows={6}
                    className="resize-none"
                  />
                  
                  <div className="space-y-4">
                    <Input
                      placeholder="Add tags separated by commas (e.g., important, work, idea)..."
                      value={newNote.tags}
                      onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full"
                    />
                    
                    {newNote.tags && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-muted-foreground">Preview tags:</span>
                        {newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Hash className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between pt-4 border-t border-border/30">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">Tip: Use Ctrl+Enter to save quickly</span>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setShowNewNoteForm(false)} className="font-medium">
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateNote} 
                        disabled={!newNote.title.trim()}
                        className="px-6 font-semibold"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Note
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes Display */}
            {filteredNotes.length === 0 ? (
              <Card className="border-2 border-dashed border-border/60">
                <CardContent className="text-center py-16">
                  <FileText className="h-20 w-20 mx-auto text-muted-foreground mb-6" />
                  <h3 className="text-xl font-bold mb-3 text-card-foreground">
                    {showArchived ? "No archived notes" : "No notes found"}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                    {showArchived 
                      ? "You don't have any archived notes yet. Archive notes to keep them organized but out of your main view."
                      : searchQuery 
                        ? "No notes match your current search criteria. Try adjusting your search terms or filters."
                        : "Ready to capture your thoughts? Create your first note and start organizing your ideas!"
                    }
                  </p>
                  {!showArchived && !searchQuery && (
                    <Button onClick={() => setShowNewNoteForm(true)} size="lg" className="font-semibold">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Note
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedNotes).map(([category, categoryNotes]) => (
                  <div key={category}>
                    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
                      <span className="text-2xl">{getCategoryIcon(category)}</span>
                      <h3 className="text-xl font-bold text-card-foreground">{getCategoryLabel(category)}</h3>
                      <Badge variant="outline" className="text-sm px-3 py-1 font-medium bg-background/50">
                        {categoryNotes.length} {categoryNotes.length === 1 ? 'note' : 'notes'}
                      </Badge>
                      {showArchived && (
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-slate-100 text-slate-700">
                          <Archive className="h-3 w-3 mr-1" />
                          Archived
                        </Badge>
                      )}
                    </div>
                    
                    {/* Redesigned Notes Grid - Consistent Design */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {categoryNotes.map((note) => (
                        <Card 
                          key={note.id} 
                          className={`group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 ${
                            note.is_favorite 
                              ? 'border-2 border-yellow-300/50 bg-gradient-to-br from-yellow-50 to-amber-50/70 hover:shadow-yellow-200/20 dark:from-yellow-900/20 dark:to-amber-900/10 dark:border-yellow-600/30' 
                              : 'border border-border/60 bg-card hover:bg-accent/20'
                          } ${
                            note.is_archived 
                              ? 'border-slate-300/60 bg-gradient-to-br from-slate-50 to-gray-100/70 dark:from-slate-900/30 dark:to-slate-800/20 dark:border-slate-600/40' 
                              : ''
                          }`}
                        >
                          {/* Card Header with Title and Meta Info */}
                          <CardHeader className="pb-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0 space-y-2">
                                <h4 className="text-lg font-bold leading-snug text-card-foreground line-clamp-2">
                                  {note.title}
                                </h4>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    <span className="font-medium">
                                      {new Date(note.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-lg">{getCategoryIcon(note.category)}</span>
                                    <span className="font-medium text-xs">{getCategoryLabel(note.category)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Status Indicators */}
                              <div className="flex items-center gap-2">
                                {note.is_favorite && (
                                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                                )}
                                {note.is_archived && (
                                  <Badge variant="secondary" className="text-xs px-2 py-1 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                    <Archive className="h-3 w-3 mr-1" />
                                    Archived
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          
                          {/* Card Content */}
                          <CardContent className="pt-0 pb-4 space-y-4">
                            {/* Note Content Preview */}
                            <div className="relative">
                              <div className="h-20 overflow-hidden">
                                <p className="text-sm leading-relaxed text-card-foreground/80">
                                  {note.content ? (
                                    note.content.length > 150 ? 
                                      note.content.substring(0, 150) + "..." : 
                                      note.content
                                  ) : (
                                    <span className="text-muted-foreground italic">No content added yet...</span>
                                  )}
                                </p>
                              </div>
                              {/* Theme-adaptive fade overlay for content that might overflow */}
                              {note.content && note.content.length > 80 && (
                                <div className={`absolute bottom-0 left-0 right-0 h-6 pointer-events-none ${
                                  note.is_favorite 
                                    ? 'bg-gradient-to-t from-yellow-50 via-yellow-50/70 to-transparent dark:from-yellow-50/90 dark:via-yellow-50/50'
                                    : note.is_archived
                                      ? 'bg-gradient-to-t from-slate-50 via-slate-50/70 to-transparent dark:from-slate-800 dark:via-slate-800/70'
                                      : 'bg-gradient-to-t from-card via-card/70 to-transparent dark:from-card dark:via-card/70'
                                }`} />
                              )}
                            </div>
                            
                            {/* Tags Section */}
                            <div className="space-y-2">
                              {note.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {note.tags.slice(0, 4).map((tag, index) => (
                                    <Badge 
                                      key={index} 
                                      variant="outline" 
                                      className="text-xs px-2 py-1 hover:bg-primary/10 cursor-pointer transition-colors"
                                      onClick={() => setSelectedTag(tag)}
                                    >
                                      <Hash className="h-3 w-3 mr-1" />
                                      {tag}
                                    </Badge>
                                  ))}
                                  {note.tags.length > 4 && (
                                    <Badge 
                                      variant="secondary" 
                                      className="text-xs px-2 py-1"
                                      title={`Additional tags: ${note.tags.slice(4).join(', ')}`}
                                    >
                                      +{note.tags.length - 4}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <div className="h-6" />
                              )}
                            </div>
                          </CardContent>
                          
                          {/* Action Buttons Footer */}
                          <div className="border-t bg-muted/30 dark:bg-muted/20 px-6 py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleFavorite(note)}
                                  className={`h-8 w-8 p-0 ${note.is_favorite ? 'text-yellow-600 hover:text-yellow-700' : 'hover:text-yellow-600'}`}
                                  title={note.is_favorite ? "Remove from favorites" : "Add to favorites"}
                                >
                                  <Star className={`h-4 w-4 ${note.is_favorite ? 'fill-current' : ''}`} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleArchive(note)}
                                  className="h-8 w-8 p-0 hover:text-slate-600"
                                  title={note.is_archived ? "Unarchive note" : "Archive note"}
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirm({ show: true, noteId: note.id })}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                  title="Delete note"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewingNote(note)}
                                  className="text-xs px-3 py-1 h-7 font-medium hover:bg-green-50 hover:text-green-700 hover:border-green-300 dark:hover:bg-green-950 dark:hover:text-green-400 dark:hover:border-green-700"
                                >
                                  <Eye className="h-3 w-3 mr-1.5" />
                                  View
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => setEditingNote(note)}
                                  className="text-xs px-3 py-1 h-7 font-medium"
                                >
                                  <Edit3 className="h-3 w-3 mr-1.5" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View Note Modal - Full Content Display */}
        {viewingNote && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-xl">{viewingNote.title}</CardTitle>
                    </div>
                    {viewingNote.is_favorite && (
                      <Star className="h-5 w-5 text-yellow-600 fill-current" />
                    )}
                    {viewingNote.is_archived && (
                      <Badge variant="secondary" className="text-sm">
                        <Archive className="h-3 w-3 mr-1" />
                        Archived
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setViewingNote(null);
                        setEditingNote(viewingNote);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setViewingNote(null)}
                      className="h-8 w-8 p-0"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-6 py-4">
                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-4 border-b">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {new Date(viewingNote.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    {viewingNote.updated_at !== viewingNote.created_at && (
                      <div className="flex items-center gap-2">
                        <span>•</span>
                        <span>Updated: {new Date(viewingNote.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span>•</span>
                      <span className="capitalize flex items-center gap-1">
                        <span>{getCategoryIcon(viewingNote.category)}</span>
                        {getCategoryLabel(viewingNote.category)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Full Content */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Content</h3>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap text-base">
                        {viewingNote.content || (
                          <span className="text-muted-foreground italic">This note has no content yet.</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {viewingNote.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingNote.tags.map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="text-sm px-3 py-1 hover:bg-secondary/80 cursor-pointer"
                            onClick={() => {
                              setSelectedTag(tag);
                              setViewingNote(null);
                            }}
                          >
                            <Hash className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Word Count */}
                  {viewingNote.content && (
                    <div className="pt-4 border-t text-xs text-muted-foreground">
                      <span>{viewingNote.content.split(' ').filter(word => word.trim()).length} words</span>
                      <span className="mx-2">•</span>
                      <span>{viewingNote.content.length} characters</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Note Modal - Enhanced */}
        {editingNote && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[85vh] overflow-y-auto border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5" />
                    Edit Note
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    onClick={() => setEditingNote(null)}
                    className="h-8 w-8 p-0"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Input
                    placeholder="Note title..."
                    value={editingNote.title}
                    onChange={(e) => setEditingNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="text-lg font-medium"
                  />
                  <div className="flex gap-2">
                    <Select 
                      value={editingNote.category} 
                      onValueChange={(value) => setEditingNote(prev => prev ? { ...prev, category: value } : null)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              <span>{category.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => setEditingNote(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null)}
                      className={`${editingNote.is_favorite ? "text-yellow-600 border-yellow-300 bg-yellow-50" : ""} whitespace-nowrap`}
                      title={editingNote.is_favorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star className={`h-4 w-4 ${editingNote.is_favorite ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </div>
                
                <Textarea
                  placeholder="Write your thoughts, ideas, or reminders here..."
                  value={editingNote.content}
                  onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === 'Enter') {
                      e.preventDefault();
                      if (editingNote.title.trim()) {
                        handleUpdateNote();
                      }
                    }
                  }}
                  rows={8}
                  className="resize-none"
                />
                
                <div className="space-y-4">
                  <Input
                    placeholder="Add tags separated by commas..."
                    value={editingNote.tags.join(', ')}
                    onChange={(e) => setEditingNote(prev => prev ? { 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    } : null)}
                    className="w-full"
                  />
                  
                  {editingNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground">Current tags:</span>
                      {editingNote.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Hash className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => handleToggleArchive(editingNote)}
                      className="flex items-center gap-2"
                    >
                      <Archive className="h-4 w-4" />
                      {editingNote.is_archived ? "Unarchive" : "Archive"}
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(editingNote.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setEditingNote(null)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdateNote}
                      disabled={!editingNote.title.trim()}
                      className="px-6"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Update Note
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={deleteConfirm.show}
          onClose={() => setDeleteConfirm({ show: false })}
          onConfirm={() => deleteConfirm.noteId && handleDeleteNote(deleteConfirm.noteId)}
          title="Delete Note"
          description="Are you sure you want to delete this note? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </Layout>
  );
};

export default QuickNotesPage;

'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Music, 
  Clock, 
  User,
  Calendar,
  Plus,
  Minus,
  ListMusic,
  Shuffle,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';
import { Hymn } from './HymnLibrary';

interface HymnSelectorProps {
  availableHymns: Hymn[];
  selectedHymns: Hymn[];
  onSelectionChange: (hymns: Hymn[]) => void;
  maxSelection?: number;
  showPlaylistCreation?: boolean;
  onCreatePlaylist?: (hymns: Hymn[]) => void;
}

interface SortOption {
  value: string;
  label: string;
  sortFn: (a: Hymn, b: Hymn) => number;
}

const sortOptions: SortOption[] = [
  {
    value: 'title',
    label: 'Title A-Z',
    sortFn: (a, b) => a.title.localeCompare(b.title)
  },
  {
    value: 'title-desc',
    label: 'Title Z-A',
    sortFn: (a, b) => b.title.localeCompare(a.title)
  },
  {
    value: 'author',
    label: 'Author A-Z',
    sortFn: (a, b) => a.author.localeCompare(b.author)
  },
  {
    value: 'year',
    label: 'Year (Newest)',
    sortFn: (a, b) => (b.year || 0) - (a.year || 0)
  },
  {
    value: 'year-asc',
    label: 'Year (Oldest)',
    sortFn: (a, b) => (a.year || 0) - (b.year || 0)
  },
  {
    value: 'recently-added',
    label: 'Recently Added',
    sortFn: (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  }
];

export function HymnSelector({
  availableHymns,
  selectedHymns,
  onSelectionChange,
  maxSelection = 25,
  showPlaylistCreation = true,
  onCreatePlaylist
}: HymnSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // Get unique categories, themes, and languages
  const categories = useMemo(() => {
    const cats = new Set<string>();
    availableHymns.forEach(hymn => {
      hymn.categories.forEach(cat => cats.add(cat));
    });
    return Array.from(cats).sort();
  }, [availableHymns]);

  const themes = useMemo(() => {
    const themes = new Set<string>();
    availableHymns.forEach(hymn => {
      hymn.themes.forEach(theme => themes.add(theme));
    });
    return Array.from(themes).sort();
  }, [availableHymns]);

  const languages = useMemo(() => {
    const langs = new Set<string>();
    availableHymns.forEach(hymn => {
      hymn.languages.forEach(lang => langs.add(lang));
    });
    return Array.from(langs).sort();
  }, [availableHymns]);

  // Filter and sort hymns
  const filteredAndSortedHymns = useMemo(() => {
    let filtered = availableHymns;

    // Apply filters
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(hymn =>
        hymn.title.toLowerCase().includes(searchLower) ||
        hymn.author.toLowerCase().includes(searchLower) ||
        hymn.categories.some(cat => cat.toLowerCase().includes(searchLower)) ||
        hymn.themes.some(theme => theme.toLowerCase().includes(searchLower))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(hymn => hymn.categories.includes(selectedCategory));
    }

    if (selectedTheme !== 'all') {
      filtered = filtered.filter(hymn => hymn.themes.includes(selectedTheme));
    }

    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(hymn => hymn.languages.includes(selectedLanguage));
    }

    if (showSelectedOnly) {
      filtered = filtered.filter(hymn => selectedHymns.some(s => s.id === hymn.id));
    }

    // Apply sorting
    const sortOption = sortOptions.find(opt => opt.value === sortBy);
    if (sortOption) {
      filtered = [...filtered].sort(sortOption.sortFn);
    }

    return filtered;
  }, [availableHymns, searchTerm, selectedCategory, selectedTheme, selectedLanguage, showSelectedOnly, sortBy, selectedHymns]);

  const isSelected = (hymn: Hymn) => selectedHymns.some(s => s.id === hymn.id);

  const handleToggleSelection = (hymn: Hymn) => {
    if (isSelected(hymn)) {
      onSelectionChange(selectedHymns.filter(s => s.id !== hymn.id));
    } else {
      if (selectedHymns.length >= maxSelection) {
        return; // Don't add if at max
      }
      onSelectionChange([...selectedHymns, hymn]);
    }
  };

  const handleSelectAll = () => {
    const availableToSelect = filteredAndSortedHymns.filter(hymn => !isSelected(hymn));
    const canSelect = Math.min(availableToSelect.length, maxSelection - selectedHymns.length);
    const toAdd = availableToSelect.slice(0, canSelect);
    onSelectionChange([...selectedHymns, ...toAdd]);
  };

  const handleDeselectAll = () => {
    const filtered = selectedHymns.filter(hymn => 
      !filteredAndSortedHymns.some(f => f.id === hymn.id)
    );
    onSelectionChange(filtered);
  };

  const moveHymnInSelection = (index: number, direction: 'up' | 'down') => {
    const newSelection = [...selectedHymns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newSelection.length) {
      [newSelection[index], newSelection[targetIndex]] = [newSelection[targetIndex], newSelection[index]];
      onSelectionChange(newSelection);
    }
  };

  const removeFromSelection = (hymnId: string) => {
    onSelectionChange(selectedHymns.filter(hymn => hymn.id !== hymnId));
  };

  const shuffleSelection = () => {
    const shuffled = [...selectedHymns];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    onSelectionChange(shuffled);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedTheme('all');
    setSelectedLanguage('all');
    setShowSelectedOnly(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Hymn Library */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Hymn Library
            </CardTitle>
            <CardDescription>
              Select hymns to add to your playlist ({selectedHymns.length}/{maxSelection})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search hymns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Themes</SelectItem>
                    {themes.map(theme => (
                      <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {languages.map(language => (
                      <SelectItem key={language} value={language}>{language}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-selected"
                      checked={showSelectedOnly}
                      onCheckedChange={setShowSelectedOnly}
                    />
                    <label htmlFor="show-selected" className="text-sm">
                      Show selected only
                    </label>
                  </div>
                  
                  {(searchTerm || selectedCategory !== 'all' || selectedTheme !== 'all' || selectedLanguage !== 'all') && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={selectedHymns.length >= maxSelection}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
            </div>

            {/* Hymn List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredAndSortedHymns.map((hymn) => (
                <div
                  key={hymn.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected(hymn)
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted border-border'
                  }`}
                  onClick={() => handleToggleSelection(hymn)}
                >
                  <Checkbox
                    checked={isSelected(hymn)}
                    disabled={!isSelected(hymn) && selectedHymns.length >= maxSelection}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{hymn.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {hymn.author}
                      </span>
                      {hymn.year && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {hymn.year}
                        </span>
                      )}
                      {hymn.audioFiles && hymn.audioFiles.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Music className="h-3 w-3" />
                          Audio
                        </span>
                      )}
                    </div>
                    {hymn.categories.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {hymn.categories.slice(0, 3).map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelection(hymn);
                    }}
                  >
                    {isSelected(hymn) ? (
                      <Minus className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}

              {filteredAndSortedHymns.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-8 w-8 mx-auto mb-2" />
                  <p>No hymns found matching your criteria</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Hymns */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ListMusic className="h-5 w-5" />
                Selected Hymns
              </span>
              {selectedHymns.length > 1 && (
                <Button variant="outline" size="sm" onClick={shuffleSelection}>
                  <Shuffle className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {selectedHymns.length} of {maxSelection} hymns selected
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedHymns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ListMusic className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No hymns selected yet</p>
                <p className="text-xs">Click hymns from the library to add them</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedHymns.map((hymn, index) => (
                  <div
                    key={hymn.id}
                    className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveHymnInSelection(index, 'up')}
                        disabled={index === 0}
                        className="h-4 w-4 p-0"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveHymnInSelection(index, 'down')}
                        disabled={index === selectedHymns.length - 1}
                        className="h-4 w-4 p-0"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {index + 1}. {hymn.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {hymn.author}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromSelection(hymn.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {showPlaylistCreation && selectedHymns.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  onClick={() => onCreatePlaylist?.(selectedHymns)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Playlist ({selectedHymns.length} hymns)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selection Stats */}
        {selectedHymns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selection Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total hymns:</span>
                <span>{selectedHymns.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated duration:</span>
                <span>
                  {Math.round(selectedHymns.length * 3)} minutes
                </span>
              </div>
              <div className="flex justify-between">
                <span>With audio:</span>
                <span>
                  {selectedHymns.filter(h => h.audioFiles && h.audioFiles.length > 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Languages:</span>
                <span>
                  {new Set(selectedHymns.flatMap(h => h.languages)).size}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
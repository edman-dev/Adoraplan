'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, Music, Globe, FileText, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AudioUpload } from './AudioUploadSimple';

interface HymnCreationFormProps {
  onSuccess?: (hymn: any) => void;
  onCancel?: () => void;
  organizationId: string;
}

interface HymnFormData {
  title: string;
  author: string;
  composer: string;
  year: number | null;
  copyright: string;
  hymnType: 'user_created' | 'public';
  isPublic: boolean;
  categories: string[];
  themes: string[];
  doctrines: string[];
  languages: string[];
  lyrics: Record<string, any>;
}

const predefinedCategories = [
  'Praise', 'Worship', 'Prayer', 'Christmas', 'Easter', 'Communion', 
  'Baptism', 'Traditional', 'Contemporary', 'Gospel', 'Hymnal'
];

const predefinedThemes = [
  'Love of God', 'Grace', 'Salvation', 'Hope', 'Faith', 'Peace', 
  'Joy', 'Thanksgiving', 'Forgiveness', 'Eternal Life', 'Trinity'
];

const predefinedDoctrines = [
  'Trinity', 'Salvation by Grace', 'Biblical Authority', 'Resurrection',
  'Second Coming', 'Atonement', 'Sanctification', 'Baptism', 'Communion'
];

const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ja', name: 'Japanese' }
];

export function HymnCreationForm({ onSuccess, onCancel, organizationId }: HymnCreationFormProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [createdHymnId, setCreatedHymnId] = useState<string | null>(null);

  const [formData, setFormData] = useState<HymnFormData>({
    title: '',
    author: '',
    composer: '',
    year: null,
    copyright: '',
    hymnType: 'user_created',
    isPublic: false,
    categories: [],
    themes: [],
    doctrines: [],
    languages: ['en'],
    lyrics: { en: '' }
  });

  const [newCategory, setNewCategory] = useState('');
  const [newTheme, setNewTheme] = useState('');
  const [newDoctrine, setNewDoctrine] = useState('');

  const handleInputChange = (field: keyof HymnFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = (field: 'categories' | 'themes' | 'doctrines', value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeTag = (field: 'categories' | 'themes' | 'doctrines', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }));
  };

  const addLanguage = (languageCode: string) => {
    if (!formData.languages.includes(languageCode)) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, languageCode],
        lyrics: {
          ...prev.lyrics,
          [languageCode]: ''
        }
      }));
    }
  };

  const removeLanguage = (languageCode: string) => {
    if (formData.languages.length > 1) {
      setFormData(prev => {
        const newLyrics = { ...prev.lyrics };
        delete newLyrics[languageCode];
        return {
          ...prev,
          languages: prev.languages.filter(lang => lang !== languageCode),
          lyrics: newLyrics
        };
      });
    }
  };

  const handleLyricsChange = (languageCode: string, content: string) => {
    setFormData(prev => ({
      ...prev,
      lyrics: {
        ...prev.lyrics,
        [languageCode]: content
      }
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.author.trim()) {
      toast({
        title: "Validation Error", 
        description: "Author is required",
        variant: "destructive"
      });
      return false;
    }

    if (formData.languages.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one language is required",
        variant: "destructive"
      });
      return false;
    }

    const hasLyrics = formData.languages.some(lang => formData.lyrics[lang]?.trim());
    if (!hasLyrics) {
      toast({
        title: "Validation Error",
        description: "Lyrics are required for at least one language",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/worship/hymns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          ...formData,
          createdBy: user?.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create hymn');
      }

      const result = await response.json();
      const newHymn = result.data;
      
      // Set the created hymn ID to enable audio upload
      setCreatedHymnId(newHymn.id);
      
      toast({
        title: "Success",
        description: "Hymn created successfully. You can now add audio files.",
      });

      // Switch to audio tab if this is the first time creating
      if (!createdHymnId) {
        setActiveTab('audio');
      }

      onSuccess?.(newHymn);
    } catch (error) {
      console.error('Error creating hymn:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create hymn",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLanguageName = (code: string) => {
    return supportedLanguages.find(lang => lang.code === code)?.name || code;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Create New Hymn</h2>
          <p className="text-muted-foreground">Add a new hymn to your library with lyrics and metadata</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="classification" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Classification
          </TabsTrigger>
          <TabsTrigger value="lyrics" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Lyrics
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center gap-2" disabled={!createdHymnId}>
            <Music className="h-4 w-4" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details about the hymn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Amazing Grace"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    placeholder="John Newton"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="composer">Composer</Label>
                  <Input
                    id="composer"
                    value={formData.composer}
                    onChange={(e) => handleInputChange('composer', e.target.value)}
                    placeholder="William Walker"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => handleInputChange('year', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="1779"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="copyright">Copyright Information</Label>
                <Textarea
                  id="copyright"
                  value={formData.copyright}
                  onChange={(e) => handleInputChange('copyright', e.target.value)}
                  placeholder="Public Domain or copyright details"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classification" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
                <CardDescription>Select or add categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Select onValueChange={(value) => addTag('categories', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {predefinedCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Add custom category"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addTag('categories', newCategory);
                          setNewCategory('');
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        addTag('categories', newCategory);
                        setNewCategory('');
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="flex items-center gap-1">
                      {category}
                      <button
                        type="button"
                        onClick={() => removeTag('categories', category)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Themes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Themes</CardTitle>
                <CardDescription>Select or add themes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Select onValueChange={(value) => addTag('themes', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {predefinedThemes.map((theme) => (
                        <SelectItem key={theme} value={theme}>
                          {theme}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-2">
                    <Input
                      value={newTheme}
                      onChange={(e) => setNewTheme(e.target.value)}
                      placeholder="Add custom theme"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addTag('themes', newTheme);
                          setNewTheme('');
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        addTag('themes', newTheme);
                        setNewTheme('');
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.themes.map((theme) => (
                    <Badge key={theme} variant="secondary" className="flex items-center gap-1">
                      {theme}
                      <button
                        type="button"
                        onClick={() => removeTag('themes', theme)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Doctrines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Doctrines</CardTitle>
                <CardDescription>Select or add doctrines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Select onValueChange={(value) => addTag('doctrines', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctrine" />
                    </SelectTrigger>
                    <SelectContent>
                      {predefinedDoctrines.map((doctrine) => (
                        <SelectItem key={doctrine} value={doctrine}>
                          {doctrine}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-2">
                    <Input
                      value={newDoctrine}
                      onChange={(e) => setNewDoctrine(e.target.value)}
                      placeholder="Add custom doctrine"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addTag('doctrines', newDoctrine);
                          setNewDoctrine('');
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        addTag('doctrines', newDoctrine);
                        setNewDoctrine('');
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.doctrines.map((doctrine) => (
                    <Badge key={doctrine} variant="secondary" className="flex items-center gap-1">
                      {doctrine}
                      <button
                        type="button"
                        onClick={() => removeTag('doctrines', doctrine)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lyrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Language Lyrics</CardTitle>
              <CardDescription>
                Add lyrics in different languages. You can add more languages in the Settings tab.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.languages.map((languageCode) => (
                <div key={languageCode} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`lyrics-${languageCode}`}>
                      Lyrics ({getLanguageName(languageCode)})
                    </Label>
                    {formData.languages.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLanguage(languageCode)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id={`lyrics-${languageCode}`}
                    value={formData.lyrics[languageCode] || ''}
                    onChange={(e) => handleLyricsChange(languageCode, e.target.value)}
                    placeholder={`Enter lyrics in ${getLanguageName(languageCode)}...`}
                    rows={15}
                    className="font-mono"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audio Files</CardTitle>
              <CardDescription>
                Upload audio recordings for this hymn. Supports multiple formats and languages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {createdHymnId ? (
                <AudioUpload
                  hymnId={createdHymnId}
                  onAudioUploaded={(audioData) => {
                    toast({
                      title: "Audio uploaded",
                      description: "Audio file has been successfully uploaded and processed"
                    });
                  }}
                  onAudioDeleted={(audioId) => {
                    toast({
                      title: "Audio deleted",
                      description: "Audio file has been removed"
                    });
                  }}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Create the hymn first</p>
                  <p className="text-sm">
                    Complete the basic information and create the hymn before uploading audio files
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Language Settings</CardTitle>
                <CardDescription>
                  Manage available languages for this hymn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Add Language</Label>
                  <Select onValueChange={addLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLanguages
                        .filter(lang => !formData.languages.includes(lang.code))
                        .map((language) => (
                          <SelectItem key={language.code} value={language.code}>
                            {language.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Current Languages</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.languages.map((languageCode) => (
                      <Badge key={languageCode} variant="outline" className="flex items-center gap-1">
                        {getLanguageName(languageCode)}
                        {formData.languages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLanguage(languageCode)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visibility Settings</CardTitle>
                <CardDescription>
                  Control who can access this hymn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hymnType">Hymn Type</Label>
                  <Select
                    value={formData.hymnType}
                    onValueChange={(value: 'user_created' | 'public') => {
                      handleInputChange('hymnType', value);
                      handleInputChange('isPublic', value === 'public');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user_created">Organization Only</SelectItem>
                      <SelectItem value="public">Public (Shareable)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {formData.hymnType === 'user_created' 
                      ? 'Only members of your organization can access this hymn'
                      : 'This hymn will be available to other organizations (subject to review)'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Hymn'}
        </Button>
      </div>
    </div>
  );
}
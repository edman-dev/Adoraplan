'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Share2, 
  Lock, 
  Globe, 
  Users, 
  Copy, 
  Check,
  Mail,
  Link,
  Download,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Hymn } from './HymnLibrary';

interface HymnSharingDialogProps {
  hymn: Hymn;
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  currentUserId: string;
  userRole: string;
}

interface SharingSettings {
  visibility: 'private' | 'organization' | 'public';
  allowDownload: boolean;
  allowCopy: boolean;
  allowPrint: boolean;
  requireLogin: boolean;
  expirationDate?: string;
  password?: string;
  sharedWith: string[];
  message?: string;
}

interface ShareLink {
  url: string;
  shortCode: string;
  created: Date;
  expires?: Date;
  accessCount: number;
}

export function HymnSharingDialog({
  hymn,
  isOpen,
  onClose,
  organizationId,
  currentUserId,
  userRole
}: HymnSharingDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('link');
  const [settings, setSettings] = useState<SharingSettings>({
    visibility: hymn.isPublic ? 'public' : 'organization',
    allowDownload: true,
    allowCopy: true,
    allowPrint: true,
    requireLogin: false,
    sharedWith: [],
  });
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check if user has permission to share
  const canShare = userRole === 'admin' || userRole === 'worship_leader' || hymn.createdBy === currentUserId;
  const canMakePublic = userRole === 'admin' || userRole === 'worship_leader';

  useEffect(() => {
    if (isOpen && hymn.id) {
      fetchExistingShareLink();
    }
  }, [isOpen, hymn.id]);

  const fetchExistingShareLink = async () => {
    try {
      const response = await fetch(`/api/worship/hymns/${hymn.id}/share`);
      if (response.ok) {
        const data = await response.json();
        if (data.shareLink) {
          setShareLink(data.shareLink);
          setSettings(data.settings || settings);
        }
      }
    } catch (error) {
      console.error('Error fetching share link:', error);
    }
  };

  const generateShareLink = async () => {
    if (!canShare) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to share this hymn",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingLink(true);
    try {
      const response = await fetch(`/api/worship/hymns/${hymn.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          settings
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const data = await response.json();
      setShareLink(data.shareLink);
      
      toast({
        title: "Share Link Generated",
        description: "Your hymn sharing link is ready to use",
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: "Error",
        description: "Failed to generate share link",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const updateShareSettings = async () => {
    if (!shareLink) return;

    try {
      const response = await fetch(`/api/worship/hymns/${hymn.id}/share`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareId: shareLink.shortCode,
          settings
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update share settings');
      }

      toast({
        title: "Settings Updated",
        description: "Share settings have been updated successfully",
      });
    } catch (error) {
      console.error('Error updating share settings:', error);
      toast({
        title: "Error",
        description: "Failed to update share settings",
        variant: "destructive"
      });
    }
  };

  const revokeShareLink = async () => {
    if (!shareLink) return;

    try {
      const response = await fetch(`/api/worship/hymns/${hymn.id}/share/${shareLink.shortCode}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke share link');
      }

      setShareLink(null);
      toast({
        title: "Link Revoked",
        description: "The share link has been revoked",
      });
    } catch (error) {
      console.error('Error revoking share link:', error);
      toast({
        title: "Error",
        description: "Failed to revoke share link",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
      
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const sendEmailInvites = async () => {
    const recipients = emailRecipients.split(',').map(email => email.trim()).filter(email => email);
    
    if (recipients.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please enter at least one email address",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/worship/hymns/${hymn.id}/share/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          shareLink: shareLink?.url,
          message: settings.message,
          hymnTitle: hymn.title
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email invites');
      }

      toast({
        title: "Invites Sent",
        description: `Email invites sent to ${recipients.length} recipient(s)`,
      });
      
      setEmailRecipients('');
    } catch (error) {
      console.error('Error sending email invites:', error);
      toast({
        title: "Error",
        description: "Failed to send email invites",
        variant: "destructive"
      });
    }
  };

  const exportHymn = async (format: 'pdf' | 'docx' | 'pptx') => {
    try {
      const response = await fetch(`/api/worship/hymns/${hymn.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          includeAudio: settings.allowDownload
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export hymn');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${hymn.title.replace(/\s+/g, '-')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `Hymn exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error exporting hymn:', error);
      toast({
        title: "Error",
        description: `Failed to export hymn as ${format.toUpperCase()}`,
        variant: "destructive"
      });
    }
  };

  if (!canShare) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permission Required</DialogTitle>
            <DialogDescription>
              You don't have permission to share this hymn. Only the hymn creator, worship leaders, and administrators can share hymns.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share "{hymn.title}"
          </DialogTitle>
          <DialogDescription>
            Configure sharing options and generate links to share this hymn
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Share Link</TabsTrigger>
            <TabsTrigger value="email">Email Invite</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            {/* Visibility Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Visibility Settings</CardTitle>
                <CardDescription>
                  Control who can access this hymn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Access Level</Label>
                  <Select 
                    value={settings.visibility} 
                    onValueChange={(value: SharingSettings['visibility']) => 
                      setSettings(prev => ({ ...prev, visibility: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Private (Only selected users)
                        </div>
                      </SelectItem>
                      <SelectItem value="organization">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Organization Members Only
                        </div>
                      </SelectItem>
                      {canMakePublic && (
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Public (Anyone with link)
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Password Protection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password Protection</Label>
                    <Switch
                      checked={!!settings.password}
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          setSettings(prev => ({ ...prev, password: undefined }));
                        }
                      }}
                    />
                  </div>
                  {settings.password !== undefined && (
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={settings.password}
                        onChange={(e) => setSettings(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Expiration Date */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="expiration">Expiration Date</Label>
                    <Switch
                      checked={!!settings.expirationDate}
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          setSettings(prev => ({ ...prev, expirationDate: undefined }));
                        }
                      }}
                    />
                  </div>
                  {settings.expirationDate !== undefined && (
                    <Input
                      id="expiration"
                      type="datetime-local"
                      value={settings.expirationDate}
                      onChange={(e) => setSettings(prev => ({ ...prev, expirationDate: e.target.value }))}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Permissions</CardTitle>
                <CardDescription>
                  Control what recipients can do with this hymn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <Label htmlFor="allow-download">Allow Download</Label>
                  </div>
                  <Switch
                    id="allow-download"
                    checked={settings.allowDownload}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, allowDownload: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    <Label htmlFor="allow-copy">Allow Copy Text</Label>
                  </div>
                  <Switch
                    id="allow-copy"
                    checked={settings.allowCopy}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, allowCopy: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <Label htmlFor="require-login">Require Login</Label>
                  </div>
                  <Switch
                    id="require-login"
                    checked={settings.requireLogin}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, requireLogin: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Share Link */}
            {shareLink ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Share Link</span>
                    <Badge variant="secondary">
                      {shareLink.accessCount} views
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input 
                      value={shareLink.url} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(shareLink.url)}
                    >
                      {copiedToClipboard ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {shareLink.expires && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      Expires: {new Date(shareLink.expires).toLocaleDateString()}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={updateShareSettings}
                    >
                      Update Settings
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={revokeShareLink}
                    >
                      Revoke Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8">
                <Button 
                  onClick={generateShareLink}
                  disabled={isGeneratingLink}
                >
                  <Link className="h-4 w-4 mr-2" />
                  {isGeneratingLink ? 'Generating...' : 'Generate Share Link'}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Invitation</CardTitle>
                <CardDescription>
                  Send this hymn directly to email recipients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipients">Recipients</Label>
                  <Textarea
                    id="recipients"
                    placeholder="Enter email addresses separated by commas"
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Personal Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Add a personal message to your invitation"
                    value={settings.message || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={sendEmailInvites}
                  disabled={!shareLink || !emailRecipients.trim()}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email Invitations
                </Button>

                {!shareLink && (
                  <p className="text-sm text-muted-foreground text-center">
                    Generate a share link first before sending email invitations
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Export Options</CardTitle>
                <CardDescription>
                  Download this hymn in various formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => exportHymn('pdf')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF
                  <Badge variant="secondary" className="ml-auto">
                    Best for printing
                  </Badge>
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => exportHymn('docx')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as Word Document
                  <Badge variant="secondary" className="ml-auto">
                    Editable
                  </Badge>
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => exportHymn('pptx')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as PowerPoint
                  <Badge variant="secondary" className="ml-auto">
                    For projection
                  </Badge>
                </Button>
              </CardContent>
            </Card>

            {hymn.audioFiles && hymn.audioFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Audio Export</CardTitle>
                  <CardDescription>
                    Include audio files with export
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-audio">Include Audio Files</Label>
                    <Switch
                      id="include-audio"
                      checked={settings.allowDownload}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, allowDownload: checked }))
                      }
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Audio files will be included as links in the exported document
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
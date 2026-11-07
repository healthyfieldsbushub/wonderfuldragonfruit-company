import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Loader2, Plus, Edit, Trash2, Eye, FileText, ImagePlus, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { RichTextEditor, type RichTextEditorHandle } from '@/components/admin/RichTextEditor';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  author_name: string | null;
  category: string;
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  read_time_minutes: number;
  view_count: number;
  created_at: string;
}

export default function AdminBlogPosts() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isInsertingImage, setIsInsertingImage] = useState(false);
  const contentRef = useRef<RichTextEditorHandle>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    author_name: '',
    category: 'general',
    tags: '',
    is_published: false,
    is_featured: false,
    meta_title: '',
    meta_description: '',
    read_time_minutes: 5,
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-blog-posts', search],
    queryFn: async () => {
      let query = appClient
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await appClient.from('blog_posts').insert({
        ...data,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        published_at: data.is_published ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success('Blog post created!');
      resetForm();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await appClient
        .from('blog_posts')
        .update({
          ...data,
          tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
          published_at: data.is_published && !editingPost?.published_at
            ? new Date().toISOString()
            : editingPost?.published_at,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success('Blog post updated!');
      resetForm();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await appClient.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success('Blog post deleted!');
    },
    onError: (error: any) => toast.error(error.message),
  });

  const resetForm = () => {
    setFormData({
      title: '', slug: '', excerpt: '', content: '', featured_image_url: '',
      author_name: '', category: 'general', tags: '', is_published: false,
      is_featured: false, meta_title: '', meta_description: '', read_time_minutes: 5,
    });
    setEditingPost(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title, slug: post.slug, excerpt: post.excerpt || '',
      content: post.content, featured_image_url: post.featured_image_url || '',
      author_name: post.author_name || '', category: post.category,
      tags: post.tags?.join(', ') || '', is_published: post.is_published,
      is_featured: post.is_featured, meta_title: post.meta_title || '',
      meta_description: post.meta_description || '', read_time_minutes: post.read_time_minutes,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const dataWithSlug = { ...formData, slug };

    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: dataWithSlug });
    } else {
      createMutation.mutate(dataWithSlug);
    }
  };

  const handleInsertInlineImage = (url: string) => {
    const imgTag = `<img src="${url}" alt="" style="max-width:480px; width:100%; border-radius:12px; margin:24px auto; display:block" />`;
    if (contentRef.current) {
      contentRef.current.insertAtCursor(imgTag);
    } else {
      setFormData({ ...formData, content: formData.content + '\n' + imgTag });
    }
    setIsInsertingImage(false);
    toast.success('Image inserted into content');
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Blog Posts
          </h1>
          <p className="text-muted-foreground">Manage blog content</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Title & Slug */}
                <div className="col-span-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated-from-title"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                {/* Featured Image Upload */}
                <div className="col-span-2">
                  <Label className="mb-2 block">Featured Image</Label>
                  <ImageUpload
                    value={formData.featured_image_url || undefined}
                    onChange={(url) => setFormData({ ...formData, featured_image_url: url })}
                    onRemove={() => setFormData({ ...formData, featured_image_url: '' })}
                    bucket="product-images"
                    folder="blog"
                  />
                </div>

                {/* Excerpt */}
                <div className="col-span-2">
                  <Label>Excerpt</Label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* Content with inline image insert */}
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label>Content * (HTML supported)</Label>
                  </div>

                  {isInsertingImage && (
                    <div className="mb-3 p-3 border rounded-lg bg-muted/50">
                      <p className="text-sm font-medium mb-2">Upload an image to insert into the content:</p>
                      <ImageUpload
                        onChange={handleInsertInlineImage}
                        onRemove={() => setIsInsertingImage(false)}
                        bucket="product-images"
                        folder="blog-inline"
                      />
                    </div>
                  )}

                  <RichTextEditor
                    ref={contentRef}
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    rows={14}
                    onInsertImage={() => setIsInsertingImage(!isInsertingImage)}
                  />
                </div>

                {/* Author & Tags */}
                <div>
                  <Label>Author Name</Label>
                  <Input
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="farming, tips, beginner"
                  />
                </div>
                <div>
                  <Label>Read Time (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.read_time_minutes}
                    onChange={(e) => setFormData({ ...formData, read_time_minutes: parseInt(e.target.value) || 5 })}
                  />
                </div>

                {/* SEO */}
                <div>
                  <Label>Meta Title</Label>
                  <Input
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Meta Description</Label>
                  <Input
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  />
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                    <Label>Published</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <Label>Featured</Label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingPost ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Posts Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : posts?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No blog posts found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts?.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    {post.featured_image_url ? (
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-16 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-xs text-muted-foreground">/blog/{post.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{post.category}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {post.is_published ? (
                        <Badge className="bg-green-500/20 text-green-700">Published</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                      {post.is_featured && (
                        <Badge className="bg-yellow-500/20 text-yellow-700">Featured</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{post.view_count}</TableCell>
                  <TableCell>{formatDate(post.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { if (confirm('Delete this post?')) deleteMutation.mutate(post.id); }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
}

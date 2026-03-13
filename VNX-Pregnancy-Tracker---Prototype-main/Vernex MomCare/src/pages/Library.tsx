import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockArticles } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Clock, BookOpen, ArrowRight, Baby, Heart, Apple, Dumbbell, Stethoscope, Book, Music, Bell } from 'lucide-react';
import { Article } from '@/types';

const categoryIcons: Record<string, React.ElementType> = {
  'Pregnancy Stages': Baby,
  'Diet & Nutrition': Apple,
  'Symptoms & Relief': Heart,
  'Fitness': Dumbbell,
  'Birth Preparation': Stethoscope,
  'Medical Care': Book,
  'Music & Relaxation': Music,
  'Official Updates': Bell,
};

export default function Library() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Official Updates');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const categories = [...new Set(mockArticles.map((a) => a.category))].sort((a, b) => {
    if (a === 'Official Updates') return -1;
    if (b === 'Official Updates') return 1;
    return a.localeCompare(b);
  });

  const filteredArticles = mockArticles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Educational Library</h1>
          <p className="text-muted-foreground">
            Curated pregnancy resources and reading materials
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article, index) => {
            const Icon = categoryIcons[article.category] || BookOpen;
            const isVideo = article.content === 'youtube';
            const isAudio = article.content === 'spotify';
            const mediaLabel = isVideo ? 'Video' : isAudio ? 'Audio' : 'Theory';
            const actionLabel = article.externalLink
              ? isVideo
                ? 'Watch'
                : isAudio
                ? 'Listen'
                : 'Open'
              : 'Read more';

            return (
              <Card
                key={article.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 animate-fade-in overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => {
  if (article.externalLink) {
    window.open(article.externalLink, '_blank');
  } else {
    setSelectedArticle(article);
  }
}}

              >
                {/* Colored Header */}
                <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center">
                  <Icon className="h-12 w-12 text-primary/50 group-hover:scale-110 transition-transform" />
                </div>

                <CardContent className="p-5">
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {article.category}
                  </Badge>
                  <Badge variant="outline" className="mb-2 ml-2 text-xs">
                    {mediaLabel}
                  </Badge>
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {article.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {article.readTime > 0 ? `${article.readTime} min read` : 'Listen'}

                    </span>
                    <span className="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                      {actionLabel}
                      <ArrowRight className="h-3 w-3" />
                    </span>

                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredArticles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No articles found matching your search.</p>
          </div>
        )}

        {/* Article Detail Dialog */}
        {selectedArticle && (
          <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <Badge variant="secondary" className="w-fit mb-2">
                  {selectedArticle.category}
                </Badge>
                <DialogTitle className="text-xl">{selectedArticle.title}</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Clock className="h-4 w-4" />
                  {selectedArticle.readTime} min read
                </div>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="h-48 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-primary/40" />
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  {selectedArticle.summary}
                </p>

                <div className="prose prose-sm max-w-none">
                  <p>{selectedArticle.content}</p>
                  {selectedArticle.summary && (
                    <p>{selectedArticle.summary}</p>
                  )}
                </div>

                <div className="rounded-xl bg-accent/30 p-4">
                  <p className="text-sm font-medium mb-1">Key Takeaway</p>
                  <p className="text-sm text-muted-foreground">
                    Always consult with your healthcare provider for personalized advice regarding your pregnancy journey.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}

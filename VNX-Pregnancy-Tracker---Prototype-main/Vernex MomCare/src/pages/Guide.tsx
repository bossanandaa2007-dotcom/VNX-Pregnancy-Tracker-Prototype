import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockGuideItems } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Apple,
  Dumbbell,
  Heart,
  CheckCircle,
  XCircle,
  Pill,
  Droplets,
  Footprints,
  Moon,
  Calendar,
  Coffee,
} from 'lucide-react';

const categoryConfig = {
  diet: { label: 'Diet', icon: Apple, color: 'text-success' },
  exercise: { label: 'Exercise', icon: Dumbbell, color: 'text-info' },
  wellness: { label: 'Wellness', icon: Heart, color: 'text-primary' },
  dos: { label: "Do's", icon: CheckCircle, color: 'text-success' },
  donts: { label: "Don'ts", icon: XCircle, color: 'text-destructive' },
};

const iconMap: Record<string, React.ElementType> = {
  pill: Pill,
  droplet: Droplets,
  footprints: Footprints,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  coffee: Coffee,
  moon: Moon,
  'calendar-check': Calendar,
};

export default function Guide() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredItems =
    activeTab === 'all'
      ? mockGuideItems
      : mockGuideItems.filter((item) => item.category === activeTab);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pregnancy Guide</h1>
          <p className="text-muted-foreground">
            Essential tips and guidelines for a healthy pregnancy
          </p>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All
            </TabsTrigger>
            {Object.entries(categoryConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {config.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item, index) => {
                const category = categoryConfig[item.category];
                const Icon = iconMap[item.icon] || Heart;

                return (
                  <Card
                    key={item.id}
                    className="group hover:shadow-lg transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/50 ${category.color} group-hover:scale-110 transition-transform`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{item.title}</h3>
                          </div>
                          <span
                            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                              item.category === 'dos'
                                ? 'bg-success/10 text-success'
                                : item.category === 'donts'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-accent text-accent-foreground'
                            }`}
                          >
                            {category.label}
                          </span>
                          <p className="text-sm text-muted-foreground mt-2">
                            {item.content}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Weekly Tips */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
            <h2 className="text-lg font-semibold mb-4">Week 24 Tips</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Iron', title: 'Eat Iron-Rich Foods', desc: 'Spinach, beans, lean meat' },
                { label: 'Water', title: 'Stay Hydrated', desc: '8-10 glasses daily' },
                { label: 'Relax', title: 'Practice Relaxation', desc: 'Deep breathing exercises' },
                { label: 'Sleep', title: 'Sleep Well', desc: 'Left side position preferred' },
              ].map((tip, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-background/80 p-4 text-center animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
                    {tip.label}
                  </span>
                  <p className="font-medium text-sm">{tip.title}</p>
                  <p className="text-xs text-muted-foreground">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

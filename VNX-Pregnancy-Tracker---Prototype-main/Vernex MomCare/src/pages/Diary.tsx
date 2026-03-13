import { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar, Image, Smile, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from "@/config/api";

type Mood = 'happy' | 'calm' | 'tired' | 'sad';

interface DiaryEntry {
  date: string;
  text: string;
  mood?: Mood;
  imageData?: string;
}

export default function Diary() {
  const { user } = useAuth();
  const { toast } = useToast();

  const getLocalDateString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
  };

  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [text, setText] = useState('');
  const [mood, setMood] = useState<Mood | undefined>();
  const [imageData, setImageData] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const existingEntry = entry;

  const fetchEntry = async (date: string) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/diary?userId=${user.id}&date=${date}`
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || 'Failed to fetch diary entry');
      }
      const data = await res.json();
      const nextEntry = data.entry as DiaryEntry | null;
      setEntry(nextEntry);
      setText(nextEntry?.text || '');
      setMood(nextEntry?.mood);
      setImageData(nextEntry?.imageData || undefined);
    } catch (err) {
      console.error('Diary fetch error:', err);
      toast({
        title: 'Error',
        description: 'Unable to load diary entry for selected date',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchEntry(selectedDate);
    }
  }, [selectedDate, user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/diary/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          date: selectedDate,
          text,
          mood,
          imageData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save failed');
      setEntry(data.entry as DiaryEntry);
      toast({
        title: 'Saved',
        description: `Diary updated for ${selectedDate}`,
      });
    } catch (err) {
      console.error('Diary save error:', err);
      toast({
        title: 'Save failed',
        description: 'Unable to save diary entry',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      setImageData(result);
    };
    reader.readAsDataURL(file);
  };

  const isMobile = () =>
    /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent || '');

  const stopCameraStream = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (!isCameraOpen) {
      stopCameraStream();
      return;
    }

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera error:', err);
        setIsCameraOpen(false);
      }
    };

    start();
    return () => stopCameraStream();
  }, [isCameraOpen]);

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">My Pregnancy Diary</h1>
          <p className="text-muted-foreground">
            A safe space to write, reflect, and remember
          </p>
        </div>

        {/* Date Picker */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Calendar className="h-5 w-5 text-primary" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
              }}
              className="w-fit"
            />
          </CardContent>
        </Card>

        {/* Existing Entry View */}
        {existingEntry && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Your Story for {selectedDate}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {existingEntry.mood && (
                <p className="text-sm">
                  Mood: <span className="capitalize">{existingEntry.mood}</span>
                </p>
              )}
              <p className="whitespace-pre-line text-muted-foreground">
                {existingEntry.text}
              </p>
              {existingEntry.imageData && (
                <img
                  src={existingEntry.imageData}
                  alt="Diary"
                  className="rounded-xl max-h-64"
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Write / Edit Section */}
        <Card>
          <CardHeader>
            <CardTitle>How was your day, mom?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mood */}
            <div className="flex gap-2">
              {(['happy', 'calm', 'tired', 'sad'] as Mood[]).map((m) => (
                <Button
                  key={m}
                  variant={mood === m ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMood(m)}
                  className="capitalize"
                >
                  <Smile className="h-4 w-4 mr-1" />
                  {m}
                </Button>
              ))}
            </div>

            {/* Text */}
            <Textarea
              placeholder="Write anything you feel like today..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
            />

            {/* Image Upload */}
            <div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    if (isMobile()) {
                      cameraInputRef.current?.click();
                    } else {
                      setIsCameraOpen(true);
                    }
                  }}
                >
                  <Image className="h-4 w-4" />
                  Take Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  <Image className="h-4 w-4" />
                  Upload Photo
                </Button>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) =>
                  e.target.files && handleImageUpload(e.target.files[0])
                }
              />
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                  e.target.files && handleImageUpload(e.target.files[0])
                }
              />
              {imageData && (
                <img
                  src={imageData}
                  alt="Preview"
                  className="mt-3 rounded-xl max-h-48"
                />
              )}
            </div>

            {/* Save */}
            <Button onClick={handleSave} className="w-full" disabled={saving || loading}>
              {saving ? 'Saving...' : `Save Story for ${selectedDate}`}
            </Button>
          </CardContent>
        </Card>

        {/* Empty State */}
        {!existingEntry && !text && !loading && (
          <p className="text-center text-sm text-muted-foreground">
            You haven\'t written anything for this day yet
          </p>
        )}

        {/* Camera Modal (Desktop) */}
        {isCameraOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-background p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Take Photo</h3>
                <Button variant="outline" size="sm" onClick={() => setIsCameraOpen(false)}>
                  Close
                </Button>
              </div>
              <div className="mt-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-xl bg-black"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  onClick={() => {
                    const video = videoRef.current;
                    const canvas = canvasRef.current;
                    if (!video || !canvas) return;
                    canvas.width = video.videoWidth || 640;
                    canvas.height = video.videoHeight || 480;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    setImageData(dataUrl);
                    setIsCameraOpen(false);
                  }}
                >
                  Capture
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

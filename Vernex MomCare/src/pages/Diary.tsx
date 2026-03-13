import { useEffect, useMemo, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as DiaryCalendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Edit, Image, Smile, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addDays, format, parseISO, subDays } from 'date-fns';
import { API_BASE } from "@/config/api";

type Mood = 'happy' | 'calm' | 'tired' | 'sad';

interface DiaryEntry {
  date: string;
  text: string;
  mood?: Mood;
  images?: string[];
  imageData?: string;
}

const getMonthKey = (value: Date) => format(value, 'yyyy-MM');
const parseDateValue = (value: string) => parseISO(`${value}T00:00:00`);
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 0.78;

const normalizeEntryImages = (entry: DiaryEntry | null) => {
  if (!entry) return [];
  if (Array.isArray(entry.images) && entry.images.length > 0) {
    return entry.images.filter(Boolean);
  }
  return entry.imageData ? [entry.imageData] : [];
};

const resizeImageDataUrl = (source: string) =>
  new Promise<string>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const scale = Math.min(
        1,
        MAX_IMAGE_DIMENSION / Math.max(image.width || 1, image.height || 1)
      );
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round((image.width || 1) * scale));
      canvas.height = Math.max(1, Math.round((image.height || 1) * scale));

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Image processing is unavailable'));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
    };
    image.onerror = () => reject(new Error('Image failed to load'));
    image.src = source;
  });

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
  const [images, setImages] = useState<string[]>([]);
  const [highlightedDates, setHighlightedDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => parseDateValue(getLocalDateString()));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [processingImages, setProcessingImages] = useState(0);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const existingEntry = entry;
  const highlightedDayObjects = useMemo(
    () => highlightedDates.map((value) => parseDateValue(value)),
    [highlightedDates]
  );

  const fetchEntry = async (date: string) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/diary?patientId=${user.id}&date=${date}`
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
      setImages(normalizeEntryImages(nextEntry));
      setIsEditing(!nextEntry);
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

  const fetchHighlightedDates = async (month: Date) => {
    if (!user?.id) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/diary/dates?patientId=${user.id}&month=${getMonthKey(month)}`
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || 'Failed to fetch diary dates');
      }

      const data = await res.json();
      setHighlightedDates(Array.isArray(data?.dates) ? data.dates : []);
    } catch (err) {
      console.error('Diary dates fetch error:', err);
      toast({
        title: 'Error',
        description: 'Unable to load diary dates for the calendar',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchEntry(selectedDate);
    }
  }, [selectedDate, user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchHighlightedDates(calendarMonth);
    }
  }, [calendarMonth, user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    if (processingImages > 0) {
      toast({
        title: 'Images still loading',
        description: 'Wait for the selected photos to finish processing before saving.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const outgoingImages = [...images];
      const res = await fetch(`${API_BASE}/api/diary/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: user.id,
          date: selectedDate,
          text,
          mood,
          images: outgoingImages,
          imageData: outgoingImages[0] || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save failed');
      const savedEntry = data.entry as DiaryEntry;
      const persistedImages = normalizeEntryImages(savedEntry);
      const nextImages = persistedImages.length > 0 ? persistedImages : outgoingImages;
      setEntry({
        ...savedEntry,
        images: nextImages,
        imageData: nextImages[0] || '',
      });
      setImages(nextImages);
      setIsEditing(false);
      setHighlightedDates((prev) =>
        prev.includes(selectedDate) ? prev : [...prev, selectedDate].sort()
      );
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
    setProcessingImages((prev) => prev + 1);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = String(reader.result || '');
        const optimized = await resizeImageDataUrl(result);
        setImages((prev) => [...prev, optimized]);
      } catch (_error) {
        toast({
          title: 'Image failed',
          description: `Could not prepare ${file.name}. Try a different image.`,
          variant: 'destructive',
        });
      } finally {
        setProcessingImages((prev) => Math.max(prev - 1, 0));
      }
    };
    reader.onerror = () => {
      setProcessingImages((prev) => Math.max(prev - 1, 0));
      toast({
        title: 'Image failed',
        description: `Could not load ${file.name}. Try again.`,
        variant: 'destructive',
      });
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

  const changeSelectedDate = (nextDate: string) => {
    setSelectedDate(nextDate);
    setCalendarMonth(parseDateValue(nextDate));
  };

  const goToPreviousDay = () => {
    changeSelectedDate(format(subDays(parseDateValue(selectedDate), 1), 'yyyy-MM-dd'));
  };

  const goToNextDay = () => {
    changeSelectedDate(format(addDays(parseDateValue(selectedDate), 1), 'yyyy-MM-dd'));
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/40">
          <div className="p-5 sm:p-6">
            <h1 className="text-2xl font-bold">My Pregnancy Diary</h1>
            <p className="text-muted-foreground">
              A safe space to write, reflect, and remember
            </p>
          </div>
        </div>

        {/* Date Picker */}
        <Card>
          <CardContent className="flex flex-col gap-3 overflow-hidden pt-6 sm:flex-row sm:items-center">
            <Calendar className="h-5 w-5 text-primary" />
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 rounded-xl"
                onClick={goToPreviousDay}
                aria-label="Go to previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full min-w-0 justify-between font-normal sm:w-[220px]"
                  >
                    <span>{format(parseDateValue(selectedDate), 'dd-MM-yyyy')}</span>
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <DiaryCalendar
                    mode="single"
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    selected={parseDateValue(selectedDate)}
                    onSelect={(date) => {
                      if (!date) return;
                      const nextDate = format(date, 'yyyy-MM-dd');
                      changeSelectedDate(nextDate);
                      setCalendarOpen(false);
                    }}
                    modifiers={{ written: highlightedDayObjects }}
                    modifiersClassNames={{
                      written: 'bg-primary/15 text-primary font-semibold rounded-md',
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 rounded-xl"
                onClick={goToNextDay}
                aria-label="Go to next day"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Entry View */}
        {existingEntry && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Your Story for {selectedDate}
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setIsEditing((prev) => !prev)}
              >
                {isEditing ? 'Cancel' : 'Edit Entry'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {(['happy', 'calm', 'tired', 'sad'] as Mood[]).map((m) => (
                      <Button
                        key={m}
                        variant={mood === m ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMood(m)}
                        className="min-w-[calc(50%-0.25rem)] flex-1 capitalize sm:min-w-0 sm:flex-none"
                      >
                        <Smile className="h-4 w-4 mr-1" />
                        {m}
                      </Button>
                    ))}
                  </div>

                  <Textarea
                    placeholder="Write anything you feel like today..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={6}
                  />

                  <div className="space-y-3">
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
                    {processingImages > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Processing {processingImages} image{processingImages > 1 ? 's' : ''}...
                      </p>
                    )}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      hidden
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleImageUpload(e.target.files[0]);
                        }
                        e.target.value = '';
                      }}
                    />
                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(e) => {
                        if (!e.target.files) return;
                        Array.from(e.target.files).forEach(handleImageUpload);
                        e.target.value = '';
                      }}
                    />
                    {images.length > 0 && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {images.map((image, index) => (
                          <div key={`${selectedDate}-draft-${index}`} className="relative overflow-hidden rounded-xl border bg-accent/20">
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                              aria-label={`Remove image ${index + 1}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <img
                              src={image}
                              alt={`Preview ${index + 1}`}
                              className="h-48 w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button onClick={handleSave} className="w-full" disabled={saving || loading || processingImages > 0}>
                    {saving
                      ? 'Saving...'
                      : processingImages > 0
                      ? 'Processing images...'
                      : `Update Story for ${selectedDate}`}
                  </Button>
                </>
              ) : (
                <>
                  {existingEntry.mood && (
                    <p className="text-sm">
                      Mood: <span className="capitalize">{existingEntry.mood}</span>
                    </p>
                  )}
                  <p className="whitespace-pre-line text-muted-foreground">
                    {existingEntry.text}
                  </p>
                  {normalizeEntryImages(existingEntry).length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {normalizeEntryImages(existingEntry).map((image, index) => (
                        <img
                          key={`${existingEntry.date}-saved-${index}`}
                          src={image}
                          alt={`Diary memory ${index + 1}`}
                          className="rounded-xl max-h-64 w-full object-cover"
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Write / Edit Section */}
        {!existingEntry && (
          <Card>
            <CardHeader>
              <CardTitle>How was your day, mom?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mood */}
              <div className="flex flex-wrap gap-2">
                {(['happy', 'calm', 'tired', 'sad'] as Mood[]).map((m) => (
                  <Button
                    key={m}
                    variant={mood === m ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMood(m)}
                    className="min-w-[calc(50%-0.25rem)] flex-1 capitalize sm:min-w-0 sm:flex-none"
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
              <div className="space-y-3">
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
                {processingImages > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Processing {processingImages} image{processingImages > 1 ? 's' : ''}...
                  </p>
                )}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                    e.target.value = '';
                  }}
                />
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    if (!e.target.files) return;
                    Array.from(e.target.files).forEach(handleImageUpload);
                    e.target.value = '';
                  }}
                />
                {images.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {images.map((image, index) => (
                      <div key={`${selectedDate}-draft-${index}`} className="relative overflow-hidden rounded-xl border bg-accent/20">
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <img
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="h-48 w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save */}
              <Button onClick={handleSave} className="w-full" disabled={saving || loading || processingImages > 0}>
                {saving
                  ? 'Saving...'
                  : processingImages > 0
                  ? 'Processing images...'
                  : `${existingEntry ? 'Update' : 'Save'} Story for ${selectedDate}`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!existingEntry && !text && images.length === 0 && !loading && (
          <p className="text-center text-sm text-muted-foreground">
            You haven't written anything for this day yet
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
                    const rawWidth = video.videoWidth || 640;
                    const rawHeight = video.videoHeight || 480;
                    const scale = Math.min(
                      1,
                      MAX_IMAGE_DIMENSION / Math.max(rawWidth, rawHeight)
                    );
                    canvas.width = Math.max(1, Math.round(rawWidth * scale));
                    canvas.height = Math.max(1, Math.round(rawHeight * scale));
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
                    setImages((prev) => [...prev, dataUrl]);
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

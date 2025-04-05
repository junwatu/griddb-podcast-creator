"use client"

import { useState, useRef } from 'react';

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Upload, FileText, Play, Pause, SkipForward, SkipBack, Volume2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [audioData, setAudioData] = useState<{
    audioFiles: Record<string, string>;
    audioScript: {
      introduction: string;
      main_talking_points: Array<{ title: string; content: string }>;
      conclusion: string;
      call_to_action: string;
    };
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState('female1');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        alert("Please upload a PDF file");
      }
    }
  };

  const handleUploadAndConvert = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setConvertProgress(0);

    try {
      // Create form data with the file and selected voice
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('voice', selectedVoice);

      // Set up progress simulation
      const intervalId = setInterval(() => {
        setConvertProgress(prev => {
          const newProgress = prev + Math.floor(Math.random() * 10) + 1;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 500);

      // Start upload and conversion process
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      console.log(data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process file');
      }

      // Clear interval and complete progress
      clearInterval(intervalId);
      setConvertProgress(100);

      // Handle response data from the API
      const {
        message,
        fileName,
        fileSize,
        tempFilePath,
        ocrResponse,
        audioFiles,
        audioScript
      } = data;

      // Store audio data for the podcast player
      setAudioData({
        audioFiles,
        audioScript
      });

      // Set the audio URL for the first section
      setAudioUrl(audioFiles.introduction);

      // Store OCR text or audio script if needed for other features
      // This could be used in an extended version of the app

      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    } catch (error) {
      console.error('Error processing file:', error);
      setIsProcessing(false);
      alert(error instanceof Error ? error.message : 'Failed to process file');
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Podcast From PDF</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upload your PDF documents and convert them into podcasts with customizable voices.
        </p>
      </div>

      <Tabs defaultValue="upload" className="max-w-3xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload & Convert</TabsTrigger>
          <TabsTrigger value="library" disabled={!audioUrl}>Your Podcasts</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
              <CardDescription>
                Upload a PDF file to convert it into a podcast with AI-generated voices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="pdf-upload">PDF Document</Label>
                <div className="flex gap-2">
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="flex-1"
                    disabled={isProcessing}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('pdf-upload')?.click()}
                    disabled={isProcessing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </div>
                {selectedFile && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <FileText className="h-4 w-4" />
                    {selectedFile.name}
                  </div>
                )}
              </div>

              {selectedFile && (
                <>
                  {isProcessing ? (
                    <div className="space-y-2">
                      <Label>Converting PDF to Podcast...</Label>
                      <Progress value={convertProgress} className="w-full" />
                      <p className="text-sm text-gray-500 text-right">{convertProgress}%</p>
                    </div>
                  ) : (
                    audioUrl ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Success!</AlertTitle>
                        <AlertDescription>
                          Your PDF has been converted to a podcast. You can now listen to it in the "Your Podcasts" tab.
                        </AlertDescription>
                      </Alert>
                    ) : null
                  )}
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={!selectedFile || isProcessing || !!audioUrl}
                onClick={handleUploadAndConvert}
              >
                {isProcessing ? 'Processing...' : 'Convert to Podcast'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="library">
          <Card>
            <CardHeader>
              <CardTitle>Your Podcasts</CardTitle>
              <CardDescription>
                Listen to your converted podcasts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {audioData && (
                <div className="space-y-6">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">{selectedFile?.name}</span>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">
                        {currentSection === 0 ? "Introduction" :
                          currentSection === audioData.audioScript.main_talking_points.length + 1 ? "Conclusion" :
                            currentSection === audioData.audioScript.main_talking_points.length + 2 ? "Call to Action" :
                              audioData.audioScript.main_talking_points[currentSection - 1].title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {currentSection === 0 ? audioData.audioScript.introduction :
                          currentSection === audioData.audioScript.main_talking_points.length + 1 ? audioData.audioScript.conclusion :
                            currentSection === audioData.audioScript.main_talking_points.length + 2 ? audioData.audioScript.call_to_action :
                              audioData.audioScript.main_talking_points[currentSection - 1].content}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Progress
                        value={(currentTime / duration) * 100 || 0}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    <div className="flex justify-center gap-4 mt-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (currentSection > 0) {
                            setCurrentSection(currentSection - 1);
                          }
                        }}
                        disabled={currentSection === 0}
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        onClick={() => {
                          if (isPlaying) {
                            audioRef.current?.pause();
                          } else {
                            audioRef.current?.play();
                          }
                          setIsPlaying(!isPlaying);
                        }}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (currentSection < audioData.audioScript.main_talking_points.length + 2) {
                            setCurrentSection(currentSection + 1);
                          }
                        }}
                        disabled={currentSection === audioData.audioScript.main_talking_points.length + 2}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <Slider
                      defaultValue={[70]}
                      max={100}
                      step={1}
                      className="flex-1"
                      onValueChange={(value) => {
                        if (audioRef.current) {
                          audioRef.current.volume = value[0] / 100;
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Sections</h4>
                    <div className="space-y-1">
                      <Button
                        variant={currentSection === 0 ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setCurrentSection(0)}
                      >
                        Introduction
                      </Button>
                      {audioData.audioScript.main_talking_points.map((point, index) => (
                        <Button
                          key={index}
                          variant={currentSection === index + 1 ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setCurrentSection(index + 1)}
                        >
                          {point.title}
                        </Button>
                      ))}
                      <Button
                        variant={currentSection === audioData.audioScript.main_talking_points.length + 1 ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setCurrentSection(audioData.audioScript.main_talking_points.length + 1)}
                      >
                        Conclusion
                      </Button>
                      <Button
                        variant={currentSection === audioData.audioScript.main_talking_points.length + 2 ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setCurrentSection(audioData.audioScript.main_talking_points.length + 2)}
                      >
                        Call to Action
                      </Button>
                    </div>
                  </div>

                  <audio
                    ref={audioRef}
                    src={currentSection === 0 ? audioData.audioFiles.introduction :
                      currentSection === audioData.audioScript.main_talking_points.length + 1 ? audioData.audioFiles.conclusion :
                        currentSection === audioData.audioScript.main_talking_points.length + 2 ? audioData.audioFiles.call_to_action :
                          audioData.audioFiles[`talking_point_${currentSection - 1}`]}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    onEnded={() => {
                      if (currentSection < audioData.audioScript.main_talking_points.length + 2) {
                        setCurrentSection(currentSection + 1);
                      } else {
                        setIsPlaying(false);
                      }
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
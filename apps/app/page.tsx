"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Upload, FileText, Play, Pause, SkipForward, SkipBack, Volume2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");

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

  const handleConvert = () => {
    if (!selectedFile) return;
    
    setIsConverting(true);
    setConvertProgress(0);
    
    // Simulate conversion process
    const interval = setInterval(() => {
      setConvertProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsConverting(false);
          setAudioUrl("dummy-audio-url"); // In a real app, this would be the actual audio URL
          return 100;
        }
        return prev + 10;
      });
    }, 500);
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
                  />
                  <Button variant="outline" onClick={() => document.getElementById('pdf-upload')?.click()}>
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
                  <div className="space-y-4">
                    <div>
                      <Label>Voice Selection</Label>
                      <Select defaultValue="female1">
                        <SelectTrigger>
                          <SelectValue placeholder="Select a voice" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female1">Emma (Female)</SelectItem>
                          <SelectItem value="female2">Sophia (Female)</SelectItem>
                          <SelectItem value="male1">James (Male)</SelectItem>
                          <SelectItem value="male2">Michael (Male)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {isConverting ? (
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
                disabled={!selectedFile || isConverting || !!audioUrl}
                onClick={handleConvert}
              >
                {isConverting ? 'Converting...' : 'Convert to Podcast'}
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
              {audioUrl && (
                <div className="space-y-6">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">{selectedFile?.name}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress value={30} className="w-full" />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>3:45</span>
                        <span>12:20</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-4 mt-4">
                      <Button variant="outline" size="icon">
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="icon">
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <Slider defaultValue={[70]} max={100} step={1} className="flex-1" />
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline">Download MP3</Button>
                   
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
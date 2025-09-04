import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ImageEditor, ImageEditorRef } from './components/ImageDisplay';
// FIX: Import the FeatureSelector component to resolve the "Cannot find name 'FeatureSelector'" error.
import { FeatureSelector } from './components/FeatureSelector';
import { editImageWithGemini } from './services/geminiService';
import { FEATURES } from './constants';

export default function App(): React.ReactElement {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [currentImageUrl, setImageUrl] = useState<string | null>(null);
  
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const imageEditorRef = useRef<ImageEditorRef>(null);

  // Clean up object URLs on unmount or when URL changes
  useEffect(() => {
    const url = currentImageUrl;
    return () => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [currentImageUrl]);


  const handleImageUpload = (file: File) => {
    setOriginalImage(file);
    setCurrentImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setError(null);
    setActiveFeature(null);
    setPrompt('');
  };

  const handleGenerate = useCallback(async () => {
    if (!currentImageFile) {
      setError("Please upload an image first.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please describe the change you want to make.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveFeature(prompt);

    try {
      const maskBlob = await imageEditorRef.current?.getMask();
      
      const newImageBase64 = await editImageWithGemini(currentImageFile, prompt, maskBlob);
      const newImageDataUrl = `data:image/png;base64,${newImageBase64}`;
      
      const res = await fetch(newImageDataUrl);
      const blob = await res.blob();
      const newFile = new File([blob], "modified-house.png", { type: 'image/png' });

      setCurrentImageFile(newFile);
      setImageUrl(newImageDataUrl);
      imageEditorRef.current?.clearMask();

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred while generating the image.");
    } finally {
      setIsLoading(false);
      setActiveFeature(null);
    }
  }, [currentImageFile, prompt]);


  const handleReset = () => {
    setOriginalImage(null);
    setCurrentImageFile(null);
    setImageUrl(null);
    setError(null);
    setActiveFeature(null);
    setPrompt('');
  };

  const handleImageError = (errorMessage: string) => {
    setError(errorMessage);
    handleReset();
  };
  
  const isModified = originalImage !== currentImageFile;

  return (
    <div className="min-h-screen bg-transparent text-gray-100 font-sans antialiased">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            {currentImageUrl && currentImageFile ? (
              <ImageEditor
                ref={imageEditorRef}
                imageUrl={currentImageUrl}
                isLoading={isLoading}
                activeFeature={activeFeature}
                onReset={handleReset}
                isModified={isModified}
                onImageError={handleImageError}
              />
            ) : (
              <ImageUploader onImageUpload={handleImageUpload} />
            )}
          </div>

          <div className="lg:col-span-4">
            <FeatureSelector 
              features={FEATURES}
              prompt={prompt}
              onPromptChange={setPrompt}
              onGenerate={handleGenerate}
              isDisabled={!currentImageFile || isLoading}
            />
          </div>
        </div>

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-800 text-white p-4 rounded-lg shadow-lg animate-pulse" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}
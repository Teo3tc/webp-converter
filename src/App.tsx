import React, { useState, useCallback } from 'react';
import { Upload, Download, Image as ImageIcon, X, Archive } from 'lucide-react';
import JSZip from 'jszip';

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [convertedImages, setConvertedImages] = useState<{ [key: string]: string }>({});

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(prevFiles => [...prevFiles, ...Array.from(event.target.files || [])]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setConvertedImages(prevImages => {
      const newImages = { ...prevImages };
      delete newImages[index];
      return newImages;
    });
  };

  const convertToWebP = useCallback(async (file: File, index: number) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setConvertedImages(prev => ({ ...prev, [index]: url }));
          }
        }, 'image/webp', 0.8);
      }
    };
    img.src = URL.createObjectURL(file);
  }, []);

  const convertAllToWebP = useCallback(() => {
    selectedFiles.forEach((file, index) => convertToWebP(file, index));
  }, [selectedFiles, convertToWebP]);

  const downloadWebP = useCallback((index: number) => {
    const url = convertedImages[index];
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedFiles[index].name.split('.')[0]}.webp`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [convertedImages, selectedFiles]);

  const downloadAllWebP = useCallback(async () => {
    const zip = new JSZip();
    const promises = Object.entries(convertedImages).map(async ([index, url]) => {
      const response = await fetch(url);
      const blob = await response.blob();
      const fileName = `${selectedFiles[Number(index)].name.split('.')[0]}.webp`;
      zip.file(fileName, blob);
    });

    await Promise.all(promises);
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "converted_images.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [convertedImages, selectedFiles]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Multi-image PNG/JPG to WebP Converter</h1>
        <div className="space-y-6">
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">PNG or JPG (Multiple files allowed)</p>
              </div>
              <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept=".png,.jpg,.jpeg" multiple />
            </label>
          </div>
          {selectedFiles.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Selected Files:</h2>
              <ul className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                    <span className="text-sm text-gray-600">{file.name}</span>
                    <button onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={convertAllToWebP}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300 w-full"
              >
                Convert All to WebP
              </button>
            </div>
          )}
          {Object.keys(convertedImages).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Converted Images:</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {Object.entries(convertedImages).map(([index, url]) => (
                  <div key={index} className="text-center">
                    <ImageIcon className="w-16 h-16 mx-auto mb-2 text-green-500" />
                    <p className="text-sm text-gray-600 mb-2">{selectedFiles[Number(index)].name} converted!</p>
                    <button
                      onClick={() => downloadWebP(Number(index))}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300 flex items-center justify-center mx-auto"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download WebP
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={downloadAllWebP}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition duration-300 flex items-center justify-center mx-auto"
              >
                <Archive className="w-4 h-4 mr-2" />
                Download All as ZIP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
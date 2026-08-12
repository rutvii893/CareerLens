import React, { useState } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError('');

    try {
      // Connect to real backend endpoint
      const response = await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed. Please ensure you are logged in and the file is a valid PDF or DOCX.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-jakarta text-[#0f172a] mb-2">Resume Analyzer</h1>
        <p className="text-[#64748b] font-inter">Upload your resume to analyze your ATS compatibility and identify improvement areas.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm max-w-2xl mx-auto text-center">
        {!result ? (
          <>
            <div className="border-2 border-dashed border-[#e2e8f0] rounded-xl p-10 bg-slate-50 mb-6 flex flex-col items-center justify-center transition-colors hover:border-[#2563eb]">
              <UploadCloud className="w-16 h-16 text-[#64748b] mb-4" />
              <p className="text-[#0f172a] font-bold text-lg mb-1">Drag & drop your resume here</p>
              <p className="text-[#64748b] text-sm mb-4">PDF or DOCX</p>
              <input 
                type="file" 
                className="hidden" 
                id="resume-upload" 
                accept=".pdf,.docx" 
                onChange={handleFileChange} 
              />
              <label 
                htmlFor="resume-upload" 
                className="px-6 py-2 bg-white border border-[#e2e8f0] text-[#0f172a] rounded-lg font-medium cursor-pointer shadow-sm hover:bg-slate-50 transition-colors"
              >
                Browse Files
              </label>
            </div>

            {file && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6 text-left">
                <div className="flex items-center gap-3">
                  <File className="text-[#2563eb] w-6 h-6" />
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">{file.name}</p>
                    <p className="text-xs text-[#64748b]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-[#dc2626] bg-red-50 p-3 rounded-lg mb-6 text-sm font-medium">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <button 
              onClick={handleUpload}
              disabled={uploading || !file}
              className={`w-full py-3.5 rounded-xl font-semibold text-white shadow-md transition-all ${
                uploading || !file ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:shadow-lg'
              }`}
            >
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </button>
          </>
        ) : (
          <div className="py-10">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-[#16a34a]" />
            </div>
            <h2 className="text-2xl font-bold font-jakarta text-[#0f172a] mb-2">Upload Successful</h2>
            <p className="text-[#64748b] mb-2">Filename: <span className="font-semibold text-[#0f172a]">{result.filename}</span></p>
            <p className="text-[#64748b] mb-8">Status: <span className="font-semibold text-[#0f172a] capitalize">{result.status}</span></p>
            
            <button className="px-8 py-3.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all">
              Analyze Resume
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalyzer;

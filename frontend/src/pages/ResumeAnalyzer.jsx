import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, FileCheck } from 'lucide-react';
import api from '../services/api';

const ResumeAnalyzer = () => {
  const navigate = useNavigate();
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
      setError('Please select a resume file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError('');

    try {
      const response = await api.post('/resumes/upload', formData);
      setResult(response.data);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.detail || 'Upload failed. Please ensure the file is a readable PDF or DOCX under 10MB.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="badge-blue text-[11px]">Resume Intelligence</span>
          <span className="text-xs text-slate-400">• ATS Compliance Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight">
          Resume Analyzer & ATS Audit
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-inter mt-1 max-w-2xl">
          Upload your resume in PDF or DOCX format to parse demonstrated skills, audit applicant tracking system compatibility, and identify missing keywords.
        </p>
      </div>

      <div className="card-base p-6 sm:p-10 max-w-2xl mx-auto">
        {!result ? (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-8 sm:p-10 bg-slate-50/50 flex flex-col items-center justify-center text-center transition-all">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h3 className="text-sm sm:text-base font-bold font-jakarta text-slate-900 mb-1">
                Drag & drop your resume here, or browse files
              </h3>
              <p className="text-xs text-slate-500 mb-5 max-w-xs font-inter">
                Supports standard PDF and DOCX formats up to 10MB
              </p>
              <input
                type="file"
                className="hidden"
                id="resume-upload"
                accept=".pdf,.docx"
                onChange={handleFileChange}
              />
              <label
                htmlFor="resume-upload"
                className="btn-secondary text-xs"
              >
                Choose Local File
              </label>
            </div>

            {file && (
              <div className="flex items-center justify-between p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/70 text-left animate-fadeIn">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <span className="badge-blue text-[10px] shrink-0">Ready</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="btn-primary w-full py-3 text-xs disabled:opacity-50"
            >
              {uploading ? 'Analyzing Document Text...' : 'Analyze Resume'}
            </button>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Private & User-Isolated
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-slate-400" /> Instant Keyword Extraction
              </span>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-5 animate-fadeIn">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-jakarta text-slate-900">
                Resume Processed Successfully
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Extracted text and parsed qualifications for <strong className="text-slate-800 font-semibold">{result.filename}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 max-w-sm mx-auto text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Document Status:</span>
                <span className="font-semibold text-slate-900 capitalize">{result.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Document ID:</span>
                <span className="font-mono text-slate-700">#{result.id}</span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/resume/analysis?resumeId=${result.id}`)}
              className="btn-primary px-6 py-2.5 text-xs mx-auto"
            >
              <span>View Full ATS Diagnostic Report</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalyzer;

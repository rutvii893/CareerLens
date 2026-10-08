export const RESUME_TEMPLATES = [
  { id: 'classic', label: 'Classic', description: 'Traditional serif typography with centered contact details.' },
  { id: 'modern', label: 'Modern', description: 'Clean sans-serif typography with a subtle blue accent.' },
  { id: 'minimal', label: 'Minimal', description: 'Simple black-and-white typography and compact spacing.' },
  { id: 'professional', label: 'Professional', description: 'Structured navy headings with balanced whitespace.' },
  { id: 'student', label: 'Student/Fresher', description: 'Education and project friendly styling for early careers.' },
];

export const RESUME_TEMPLATE_STYLES = {
  classic: {
    paper: 'font-serif',
    header: 'text-center text-slate-800',
    section: 'text-slate-800',
    rule: 'border-slate-800',
  },
  modern: {
    paper: 'font-sans',
    header: 'text-left text-blue-700',
    section: 'text-blue-700',
    rule: 'border-blue-700',
  },
  minimal: {
    paper: 'font-sans',
    header: 'text-left text-black',
    section: 'text-black',
    rule: 'border-black',
  },
  professional: {
    paper: 'font-sans',
    header: 'text-left text-cyan-900',
    section: 'text-cyan-900',
    rule: 'border-cyan-900',
  },
  student: {
    paper: 'font-sans',
    header: 'text-center text-teal-700',
    section: 'text-teal-700',
    rule: 'border-teal-700',
  },
};

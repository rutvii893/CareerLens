import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Check, ChevronRight, Download, FilePlus2, LoaderCircle, Plus, Save, Trash2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { generatedResumeService } from '../services/generatedResumeService';
import { RESUME_TEMPLATES, RESUME_TEMPLATE_STYLES } from '../lib/resumeTemplates';

const ROLE_TECHNOLOGIES = {
  'Data Analyst': ['Excel', 'SQL', 'Python', 'Pandas', 'NumPy', 'Power BI', 'Tableau'],
  'Data Scientist': ['Python', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'Jupyter'],
  'AI/ML Engineer': ['Python', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Docker', 'Git', 'SQL'],
  'Software Developer': ['Python', 'Java', 'C++', 'Git', 'SQL', 'Data Structures', 'REST APIs'],
  'Web Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Git', 'SQL'],
  'Cloud Engineer': ['Linux', 'AWS', 'Docker', 'Kubernetes', 'Terraform', 'Python', 'Networking'],
  Cybersecurity: ['Linux', 'Networking', 'Python', 'SIEM', 'Wireshark', 'OWASP', 'Cloud Security'],
  'Business Analyst': ['Excel', 'SQL', 'Power BI', 'Tableau', 'Jira', 'Requirements Analysis', 'Visio'],
};

const SOFT_SKILL_OPTIONS = [
  'Communication', 'Teamwork', 'Leadership', 'Problem Solving', 'Analytical Thinking',
  'Time Management', 'Adaptability', 'Presentation', 'Critical Thinking',
];

const STEPS = [
  'Career field', 'Technical skills', 'Soft skills', 'Certifications',
  'Hackathons', 'Achievements', 'Projects', 'Education', 'Experience',
  'Contact details', 'Resume preview', 'Generate & download',
];

const EMPTY_DRAFT = {
  title: '',
  career_role: '',
  template: 'classic',
  technical_skills: [],
  soft_skills: [],
  certifications: [],
  hackathons: [],
  achievements: [],
  projects: [],
  education: [],
  experience: [],
  contact: {
    name: '', email: '', phone: '', location: '',
    linkedin_url: '', github_url: '', portfolio_url: '',
  },
  summary: '',
  current_step: 1,
};

const ENTRY_SECTIONS = {
  certifications: {
    label: 'Certification',
    fields: [
      ['name', 'Certification name'], ['organization', 'Issuing organization'],
      ['issue_date', 'Issue year/date', 'date'], ['credential_id', 'Credential ID (optional)'],
      ['credential_url', 'Credential URL (optional)', 'url'],
    ],
    empty: { name: '', organization: '', issue_date: '', credential_id: '', credential_url: '' },
  },
  hackathons: {
    label: 'Hackathon or competition',
    fields: [
      ['name', 'Hackathon/competition name'], ['organization', 'Organization'],
      ['date', 'Year/date', 'date'], ['position', 'Position/rank (optional)'],
      ['project_name', 'Project name (optional)'], ['description', 'Description', 'textarea'],
      ['technologies', 'Technologies used (optional)'],
    ],
    empty: { name: '', organization: '', date: '', position: '', project_name: '', description: '', technologies: '' },
  },
  achievements: {
    label: 'Achievement',
    fields: [
      ['title', 'Achievement title'], ['description', 'Description', 'textarea'],
      ['date', 'Year/date', 'date'], ['organization', 'Organization (optional)'],
    ],
    empty: { title: '', description: '', date: '', organization: '' },
  },
  projects: {
    label: 'Project',
    fields: [
      ['name', 'Project name'], ['description', 'Short description', 'textarea'],
      ['technologies', 'Technologies used'], ['contribution', 'Your role/contribution', 'textarea'],
      ['github_url', 'GitHub URL (optional)', 'url'], ['demo_url', 'Live/demo URL (optional)', 'url'],
    ],
    empty: { name: '', description: '', technologies: '', contribution: '', github_url: '', demo_url: '' },
  },
  education: {
    label: 'Education',
    fields: [
      ['degree', 'Degree'], ['institution', 'University/college'],
      ['specialization', 'Branch/specialization'], ['start_year', 'Start year', 'text'],
      ['graduation_year', 'Graduation year', 'text'], ['grade', 'CGPA/percentage'],
      ['coursework', 'Relevant coursework (optional)', 'textarea'],
    ],
    empty: { degree: '', institution: '', specialization: '', start_year: '', graduation_year: '', grade: '', coursework: '' },
  },
  experience: {
    label: 'Experience or internship',
    fields: [
      ['company', 'Company'], ['role', 'Job/internship role'],
      ['start_date', 'Start date', 'date'], ['end_date', 'End date', 'date'],
      ['responsibilities', 'Responsibilities', 'textarea'], ['technologies', 'Technologies/skills used'],
    ],
    empty: { company: '', role: '', start_date: '', end_date: '', responsibilities: '', technologies: '' },
  },
};

const cx = (...values) => values.filter(Boolean).join(' ');

function Field({ label, value, onChange, type = 'text', multiline = false, required = false }) {
  const common = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}{required && <span className="text-red-500"> *</span>}</span>
      {multiline ? (
        <textarea className={cx(common, 'min-h-24 resize-y')} value={value || ''} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={common} type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function EntryEditor({ section, value, onChange }) {
  const definition = ENTRY_SECTIONS[section];
  const rows = value[section] || [];
  const updateRow = (index, key, fieldValue) => {
    onChange(section, rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: fieldValue } : row));
  };
  return (
    <div className="space-y-4">
      {rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
          No {definition.label.toLowerCase()} entries yet. This section is optional.
        </div>
      )}
      {rows.map((row, index) => (
        <div key={`${section}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">{definition.label} {index + 1}</h3>
            <button
              type="button"
              onClick={() => onChange(section, rows.filter((_, rowIndex) => rowIndex !== index))}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600"
              aria-label={`Remove ${definition.label.toLowerCase()} ${index + 1}`}
            >
              <Trash2 size={15} /> Remove
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {definition.fields.map(([key, label, type]) => (
              <div key={key} className={type === 'textarea' ? 'sm:col-span-2' : ''}>
                <Field
                  label={label}
                  type={type === 'url' ? 'url' : 'text'}
                  multiline={type === 'textarea'}
                  value={row[key]}
                  onChange={(fieldValue) => updateRow(index, key, fieldValue)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange(section, [...rows, { ...definition.empty }])}
        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
      >
        <Plus size={16} /> Add {definition.label.toLowerCase()}
      </button>
    </div>
  );
}

function ResumePaper({ resume, template = 'classic' }) {
  const style = RESUME_TEMPLATE_STYLES[template] || RESUME_TEMPLATE_STYLES.classic;
  const hasContact = Object.values(resume.contact || {}).some(Boolean);
  const education = (resume.education || []).filter((item) => item.degree || item.institution);
  const skills = (resume.technical_skills || []).filter((item) => item.name);
  const softSkills = (resume.soft_skills || []).filter(Boolean);
  const projects = (resume.projects || []).filter((item) => item.name || item.description);
  const experience = (resume.experience || []).filter((item) => item.company || item.role || item.responsibilities);
  const certifications = (resume.certifications || []).filter((item) => item.name);
  const achievements = (resume.achievements || []).filter((item) => item.title || item.description);
  const hackathons = (resume.hackathons || []).filter((item) => item.name || item.description);
  const contact = resume.contact || {};
  const contactLines = [
    contact.email, contact.phone, contact.location, contact.linkedin_url, contact.github_url, contact.portfolio_url,
  ].filter(Boolean);

  return (
    <article id="resume-paper" className={cx('resume-paper mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-7 shadow-sm md:p-10', style.paper)}>
      {hasContact && (
        <header className={cx('border-b-2 pb-4', style.rule, template === 'classic' || template === 'student' ? 'text-center' : 'text-left')}>
          {contact.name && <h1 className={cx('text-3xl font-bold tracking-tight', style.header)}>{contact.name}</h1>}
          {resume.career_role && <p className={cx('mt-1 text-sm font-medium', style.header)}>{resume.career_role}</p>}
          {contactLines.length > 0 && <p className="mt-2 break-words text-sm leading-6 text-slate-600">{contactLines.join('  |  ')}</p>}
        </header>
      )}
      {resume.summary && <ResumeSection title="Summary" template={template}><p>{resume.summary}</p></ResumeSection>}
      {education.length > 0 && <ResumeSection title="Education" template={template}>{education.map((item, index) => (
        <div key={index} className="mb-3 last:mb-0">
          <strong>{[item.degree, item.specialization].filter(Boolean).join(' — ')}</strong>
          {(item.institution || item.graduation_year) && <div>{[item.institution, item.graduation_year].filter(Boolean).join(' | ')}</div>}
          {(item.grade || item.coursework) && <div>{[item.grade, item.coursework].filter(Boolean).join(' | ')}</div>}
        </div>
      ))}</ResumeSection>}
      {skills.length > 0 && <ResumeSection title="Technical Skills" template={template}>{skills.map((skill) => `${skill.name} (${skill.knowledge_percent}%)`).join(' • ')}</ResumeSection>}
      {softSkills.length > 0 && <ResumeSection title="Soft Skills" template={template}>{softSkills.join(' • ')}</ResumeSection>}
      {projects.length > 0 && <ResumeSection title="Projects" template={template}>{projects.map((item, index) => (
        <div key={index} className="mb-3 last:mb-0">
          <strong>{item.name}</strong>
          {item.description && <div>{item.description}</div>}
          {item.contribution && <div>Contribution: {item.contribution}</div>}
          {item.technologies && <div>Technologies: {item.technologies}</div>}
          {[item.github_url, item.demo_url].filter(Boolean).length > 0 && <div>{[item.github_url, item.demo_url].filter(Boolean).join(' | ')}</div>}
        </div>
      ))}</ResumeSection>}
      {experience.length > 0 && <ResumeSection title="Experience" template={template}>{experience.map((item, index) => (
        <div key={index} className="mb-3 last:mb-0">
          <strong>{[item.role, item.company].filter(Boolean).join(' — ')}</strong>
          {(item.start_date || item.end_date) && <div>{[item.start_date, item.end_date].filter(Boolean).join(' – ')}</div>}
          {item.responsibilities && <div>{item.responsibilities}</div>}
          {item.technologies && <div>Technologies: {item.technologies}</div>}
        </div>
      ))}</ResumeSection>}
      {certifications.length > 0 && <ResumeSection title="Certifications" template={template}>{certifications.map((item, index) => (
        <div key={index} className="mb-2 last:mb-0">
          <strong>{item.name}</strong>{[item.organization, item.issue_date].filter(Boolean).length > 0 && ` — ${[item.organization, item.issue_date].filter(Boolean).join(', ')}`}
        </div>
      ))}</ResumeSection>}
      {achievements.length > 0 && <ResumeSection title="Achievements" template={template}>{achievements.map((item, index) => (
        <div key={index} className="mb-2 last:mb-0">
          <strong>{item.title}</strong>{item.description && ` — ${item.description}`}
          {[item.organization, item.date].filter(Boolean).length > 0 && <div>{[item.organization, item.date].filter(Boolean).join(' | ')}</div>}
        </div>
      ))}</ResumeSection>}
      {hackathons.length > 0 && <ResumeSection title="Hackathons & Competitions" template={template}>{hackathons.map((item, index) => (
        <div key={index} className="mb-3 last:mb-0">
          <strong>{item.name}</strong>{[item.organization, item.date, item.position].filter(Boolean).length > 0 && ` — ${[item.organization, item.date, item.position].filter(Boolean).join(', ')}`}
          {item.project_name && <div>Project: {item.project_name}</div>}
          {item.description && <div>{item.description}</div>}
          {item.technologies && <div>Technologies: {item.technologies}</div>}
        </div>
      ))}</ResumeSection>}
      {!resume.summary && !education.length && !skills.length && !softSkills.length && !projects.length && !experience.length && !certifications.length && !achievements.length && !hackathons.length && (
        <p className="py-10 text-center text-sm text-slate-500">Add resume details to preview your content here.</p>
      )}
    </article>
  );
}

function ResumeSection({ title, children, template = 'classic' }) {
  const style = RESUME_TEMPLATE_STYLES[template] || RESUME_TEMPLATE_STYLES.classic;
  return (
    <section className="mt-5 break-inside-avoid text-sm leading-6 text-slate-700">
      <h2 className={cx('mb-2 border-b pb-1 text-xs font-bold uppercase tracking-widest', style.section, style.rule)}>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function TemplatePicker({ selected, onChange }) {
  return (
    <fieldset className="mb-5">
      <legend className="mb-2 text-sm font-semibold text-slate-800">Resume template</legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {RESUME_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            aria-pressed={selected === template.id}
            onClick={() => onChange(template.id)}
            className={cx(
              'rounded-xl border p-3 text-left transition',
              selected === template.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300',
            )}
          >
            <span className="block text-sm font-semibold text-slate-800">{template.label}</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">{template.description}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const ResumeGenerator = () => {
  const { user } = useUser();
  const [savedResumes, setSavedResumes] = useState([]);
  const [draft, setDraft] = useState(() => ({
    ...EMPTY_DRAFT,
    contact: { ...EMPTY_DRAFT.contact, name: user?.name || '', email: user?.email || '', location: user?.location || '' },
  }));
  const [resumeId, setResumeId] = useState(null);
  const [step, setStep] = useState(0);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [customSkill, setCustomSkill] = useState('');

  const loadResumes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSavedResumes(await generatedResumeService.list());
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load your generated resumes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const updateField = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const updateContact = (field, value) => setDraft((current) => ({
    ...current, contact: { ...current.contact, [field]: value },
  }));

  const startNew = () => {
    setDraft({
      ...EMPTY_DRAFT,
      contact: { ...EMPTY_DRAFT.contact, name: user?.name || '', email: user?.email || '', location: user?.location || '' },
    });
    setResumeId(null);
    setStep(0);
    setView('wizard');
    setError('');
    setNotice('');
  };

  const openResume = async (id) => {
    setLoading(true);
    setError('');
    try {
      const resume = await generatedResumeService.get(id);
      setDraft(resume);
      setResumeId(resume.id);
      setStep(Math.min(Math.max((resume.current_step || 1) - 1, 0), STEPS.length - 1));
      setView('wizard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to open this resume.');
    } finally {
      setLoading(false);
    }
  };

  const persist = async (data = draft, message = 'Progress saved.') => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = { ...data, current_step: step + 1 };
      const saved = resumeId
        ? await generatedResumeService.update(resumeId, payload)
        : await generatedResumeService.create(payload);
      setResumeId(saved.id);
      setDraft(saved);
      setSavedResumes((resumes) => [saved, ...resumes.filter((item) => item.id !== saved.id)]);
      setNotice(message);
      return saved;
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to save your resume. Please try again.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const addRecommendedSkills = (role) => {
    const current = draft.technical_skills || [];
    const existing = new Set(current.map((skill) => skill.name.toLowerCase()));
    const additions = (ROLE_TECHNOLOGIES[role] || [])
      .filter((name) => !existing.has(name.toLowerCase()))
      .map((name) => ({ name, knowledge_percent: 0 }));
    setDraft((value) => ({ ...value, career_role: role, technical_skills: [...current, ...additions], title: `${role} Resume` }));
  };

  const updateTechnology = (index, updates) => {
    setDraft((current) => ({
      ...current,
      technical_skills: current.technical_skills.map((skill, itemIndex) => itemIndex === index ? { ...skill, ...updates } : skill),
    }));
  };

  const addTechnology = () => {
    const name = customSkill.trim();
    if (!name || draft.technical_skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) return;
    updateField('technical_skills', [...draft.technical_skills, { name, knowledge_percent: 0 }]);
    setCustomSkill('');
  };

  const changeEntrySection = (section, entries) => updateField(section, entries);

  const validateStep = () => {
    if (step === 0 && !draft.career_role) return 'Select a target career field to continue.';
    if (step === 9) {
      if (!draft.contact.name.trim()) return 'Enter your full name to continue.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contact.email.trim())) return 'Enter a valid email address to continue.';
    }
    return '';
  };

  const next = async () => {
    const validation = validateStep();
    if (validation) {
      setError(validation);
      return;
    }
    setError('');
    setNotice('');
    if (step === 9) {
      setSaving(true);
      try {
        const finalized = await generatedResumeService.finalize({ ...draft, current_step: 11 });
        setDraft(finalized);
      } catch (err) {
        setError(err.response?.data?.detail || 'Unable to prepare your resume preview.');
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const generateAndSave = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const finalized = await generatedResumeService.finalize({ ...draft, current_step: 12 });
      setDraft(finalized);
      const saved = resumeId
        ? await generatedResumeService.update(resumeId, finalized)
        : await generatedResumeService.create(finalized);
      setResumeId(saved.id);
      setDraft(saved);
      setSavedResumes((resumes) => [saved, ...resumes.filter((item) => item.id !== saved.id)]);
      setView('complete');
      setNotice('Your resume has been generated and saved.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to generate your resume. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteResume = async (id) => {
    setError('');
    try {
      await generatedResumeService.remove(id);
      setSavedResumes((resumes) => resumes.filter((resume) => resume.id !== id));
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to delete this resume.');
    }
  };

  const downloadPdf = async () => {
    if (!resumeId) {
      setError('Save your resume before downloading the PDF.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const saved = await generatedResumeService.update(resumeId, { ...draft, current_step: 12 });
      setDraft(saved);
      setSavedResumes((resumes) => [saved, ...resumes.filter((item) => item.id !== saved.id)]);
      const response = await generatedResumeService.downloadPdf(saved.id, draft.template);
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `CareerLens-Resume-${saved.id}-${draft.template}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('Your PDF download has started.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to download your resume PDF. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  if (loading && view === 'list') {
    return <div className="flex min-h-[50vh] items-center justify-center gap-3 text-slate-600"><LoaderCircle className="animate-spin text-blue-600" /> Loading your resumes...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-5 md:p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-600">Resume Studio</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Resume Generator</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Build an ATS-friendly resume step by step. Recommended skills start at 0% until you enter your own knowledge level.</p>
        </div>
        {view !== 'list' && (
          <button type="button" onClick={() => { setView('list'); loadResumes(); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            My resumes
          </button>
        )}
      </div>

      {(error || notice) && (
        <div className={cx('mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm', error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800')} role={error ? 'alert' : 'status'}>
          {error && <AlertCircle size={18} className="mt-0.5 shrink-0" />}
          <span>{error || notice}</span>
        </div>
      )}

      {view === 'list' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-xl font-bold text-slate-900">Your resumes</h2><p className="mt-1 text-sm text-slate-500">Saved drafts can be reopened and edited at any time.</p></div>
            <button type="button" onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><FilePlus2 size={17} /> Create resume</button>
          </div>
          {savedResumes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
              <p className="font-semibold text-slate-800">No generated resumes yet</p>
              <p className="mt-1 text-sm text-slate-500">Start with a career field. You can save your progress and come back later.</p>
              <button type="button" onClick={startNew} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Get started</button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {savedResumes.map((resume) => (
                <article key={resume.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                  <button type="button" onClick={() => openResume(resume.id)} className="min-w-0 flex-1 text-left">
                    <h3 className="truncate font-semibold text-slate-900">{resume.title || `${resume.career_role} Resume`}</h3>
                    <p className="mt-1 text-sm text-slate-500">{resume.career_role} · Step {resume.current_step || 1} of {STEPS.length}</p>
                  </button>
                  <button type="button" onClick={() => deleteResume(resume.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${resume.title || resume.career_role} resume`}><Trash2 size={17} /></button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {view === 'wizard' && (
        <>
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="mb-3 flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-slate-800">Step {step + 1} of {STEPS.length}: {STEPS[step]}</span>
              <span className="text-slate-500">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div>
            <div className="mt-3 hidden grid-cols-6 gap-2 md:grid lg:grid-cols-12">
              {STEPS.map((label, index) => (
                <div key={label} className={cx('truncate text-center text-[10px] font-medium', index <= step ? 'text-blue-700' : 'text-slate-400')} title={label}>{index < step ? <Check size={14} className="mx-auto" /> : index + 1}</div>
              ))}
            </div>
          </div>

          <section className="min-h-[390px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <h2 className="mb-1 text-xl font-bold text-slate-900">{STEPS[step]}</h2>
            <p className="mb-6 text-sm text-slate-500">
              {step === 0 && 'Choose the role you want your resume to target.'}
              {step === 1 && 'Rate your current knowledge honestly. Recommendations are never marked as mastered automatically.'}
              {step > 1 && step < 9 && 'Add only details you want included. All entries in this section are optional.'}
              {step === 9 && 'We started with your profile name, email, and location when available. Review and edit them here.'}
              {step === 10 && 'Review the ATS-friendly layout. Sections with no information are omitted.'}
              {step === 11 && 'Choose a template, then generate and save your resume. The PDF download is available once it is saved.'}
            </p>

            {step === 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.keys(ROLE_TECHNOLOGIES).map((role) => (
                  <button key={role} type="button" onClick={() => addRecommendedSkills(role)} className={cx('rounded-xl border p-4 text-left font-semibold transition', draft.career_role === role ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-100' : 'border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50')}>
                    {role}{draft.career_role === role && <Check size={17} className="float-right" />}
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div>
                {!draft.technical_skills.length ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">Select a career field to see relevant technology recommendations.</div>
                ) : (
                  <div className="space-y-3">
                    {draft.technical_skills.map((skill, index) => (
                      <div key={`${skill.name}-${index}`} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 md:p-4">
                        <span className="min-w-32 flex-1 font-semibold text-slate-800">{skill.name}</span>
                        <label className="flex min-w-56 flex-1 items-center gap-3 text-xs font-medium text-slate-600">
                          <span className="shrink-0">Knowledge</span>
                          <input aria-label={`${skill.name} knowledge percentage`} type="range" min="0" max="100" step="1" value={skill.knowledge_percent} onChange={(event) => updateTechnology(index, { knowledge_percent: Number(event.target.value) })} className="w-full accent-blue-600" />
                          <span className="w-11 text-right font-bold text-slate-800">{skill.knowledge_percent}%</span>
                        </label>
                        <button type="button" onClick={() => updateField('technical_skills', draft.technical_skills.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${skill.name}`}><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-5 flex flex-wrap gap-2">
                  <input value={customSkill} onChange={(event) => setCustomSkill(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTechnology(); } }} placeholder="Add another technology" className="min-w-56 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  <button type="button" onClick={addTechnology} className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"><Plus size={16} /> Add skill</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="flex flex-wrap gap-2">
                  {SOFT_SKILL_OPTIONS.map((skill) => {
                    const selected = draft.soft_skills.includes(skill);
                    return <button key={skill} type="button" onClick={() => updateField('soft_skills', selected ? draft.soft_skills.filter((item) => item !== skill) : [...draft.soft_skills, skill])} className={cx('rounded-full border px-3.5 py-2 text-sm font-medium', selected ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600 hover:border-blue-300')}>{selected && <Check size={14} className="mr-1 inline" />}{skill}</button>;
                  })}
                </div>
                <form className="mt-5 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); const nextSkill = customSkill.trim(); if (nextSkill && !draft.soft_skills.some((item) => item.toLowerCase() === nextSkill.toLowerCase())) updateField('soft_skills', [...draft.soft_skills, nextSkill]); setCustomSkill(''); }}>
                  <input value={customSkill} onChange={(event) => setCustomSkill(event.target.value)} placeholder="Add a custom soft skill" className="min-w-56 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  <button className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"><Plus size={16} /> Add skill</button>
                </form>
                {draft.soft_skills.filter((skill) => !SOFT_SKILL_OPTIONS.includes(skill)).length > 0 && <div className="mt-4 flex flex-wrap gap-2">{draft.soft_skills.filter((skill) => !SOFT_SKILL_OPTIONS.includes(skill)).map((skill) => <button key={skill} type="button" onClick={() => updateField('soft_skills', draft.soft_skills.filter((item) => item !== skill))} className="rounded-full bg-violet-50 px-3 py-1.5 text-sm text-violet-800">{skill} ×</button>)}</div>}
              </div>
            )}

            {['certifications', 'hackathons', 'achievements', 'projects', 'education', 'experience'].map((section, index) => step === index + 3 && <EntryEditor key={section} section={section} value={draft} onChange={changeEntrySection} />)}

            {step === 9 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" value={draft.contact.name} onChange={(value) => updateContact('name', value)} required />
                <Field label="Email" type="email" value={draft.contact.email} onChange={(value) => updateContact('email', value)} required />
                <Field label="Phone" type="tel" value={draft.contact.phone} onChange={(value) => updateContact('phone', value)} />
                <Field label="Location" value={draft.contact.location} onChange={(value) => updateContact('location', value)} />
                <Field label="LinkedIn URL" type="url" value={draft.contact.linkedin_url} onChange={(value) => updateContact('linkedin_url', value)} />
                <Field label="GitHub URL" type="url" value={draft.contact.github_url} onChange={(value) => updateContact('github_url', value)} />
                <Field label="Portfolio URL" type="url" value={draft.contact.portfolio_url} onChange={(value) => updateContact('portfolio_url', value)} />
              </div>
            )}

            {(step === 10 || step === 11) && (
              <>
                <TemplatePicker selected={draft.template} onChange={(template) => updateField('template', template)} />
                <ResumePaper resume={draft} template={draft.template} />
              </>
            )}
          </section>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => { setError(''); setNotice(''); setStep((current) => Math.max(current - 1, 0)); }} disabled={step === 0 || saving} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><ArrowLeft size={16} /> Back</button>
            <div className="ml-auto flex flex-wrap gap-2">
              <button type="button" onClick={() => persist()} disabled={saving || !draft.career_role} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><Save size={16} /> {saving ? 'Saving...' : 'Save progress'}</button>
              {step < 11 ? (
                <button type="button" onClick={next} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Preparing...' : 'Next'} <ArrowRight size={16} /></button>
              ) : (
                <button type="button" onClick={generateAndSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? <><LoaderCircle className="animate-spin" size={16} /> Generating...</> : <><Check size={16} /> Generate and save</>}</button>
              )}
            </div>
          </div>
        </>
      )}

      {view === 'complete' && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
            <div><h2 className="font-bold text-green-900">Resume ready</h2><p className="text-sm text-green-800">Saved to your account. Print or choose “Save as PDF” to download a copy.</p></div>
            <button type="button" onClick={downloadPdf} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"><Download size={16} /> {saving ? 'Preparing PDF...' : 'Download PDF'}</button>
          </div>
          <TemplatePicker selected={draft.template} onChange={(template) => updateField('template', template)} />
          <ResumePaper resume={draft} template={draft.template} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setStep(0); setView('wizard'); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit resume</button>
            <button type="button" onClick={() => { setView('list'); loadResumes(); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">All resumes <ChevronRight size={16} /></button>
          </div>
        </section>
      )}
    </div>
  );
};

export default ResumeGenerator;

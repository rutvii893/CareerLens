from __future__ import annotations

from html import escape
from io import BytesIO
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)


TEMPLATES = {
    'classic': {
        'label': 'Classic',
        'description': 'Traditional serif typography with centered contact details.',
        'accent': '#24364B',
        'heading_font': 'Times-Bold',
        'body_font': 'Times-Roman',
        'header_alignment': TA_CENTER,
        'margin': 0.68,
        'rule': True,
        'top_bar': False,
    },
    'modern': {
        'label': 'Modern',
        'description': 'Clean sans-serif typography with a subtle blue accent.',
        'accent': '#2563EB',
        'heading_font': 'Helvetica-Bold',
        'body_font': 'Helvetica',
        'header_alignment': TA_LEFT,
        'margin': 0.62,
        'rule': True,
        'top_bar': True,
    },
    'minimal': {
        'label': 'Minimal',
        'description': 'Simple black-and-white typography and compact spacing.',
        'accent': '#111827',
        'heading_font': 'Helvetica-Bold',
        'body_font': 'Helvetica',
        'header_alignment': TA_LEFT,
        'margin': 0.58,
        'rule': False,
        'top_bar': False,
    },
    'professional': {
        'label': 'Professional',
        'description': 'Structured navy headings with balanced whitespace.',
        'accent': '#164E63',
        'heading_font': 'Helvetica-Bold',
        'body_font': 'Helvetica',
        'header_alignment': TA_LEFT,
        'margin': 0.72,
        'rule': True,
        'top_bar': False,
    },
    'student': {
        'label': 'Student/Fresher',
        'description': 'Education and project friendly styling for early careers.',
        'accent': '#0F766E',
        'heading_font': 'Helvetica-Bold',
        'body_font': 'Helvetica',
        'header_alignment': TA_CENTER,
        'margin': 0.62,
        'rule': True,
        'top_bar': True,
    },
}

SECTION_ORDER = (
    ('summary', 'Summary'),
    ('education', 'Education'),
    ('technical_skills', 'Technical Skills'),
    ('soft_skills', 'Soft Skills'),
    ('projects', 'Projects'),
    ('experience', 'Experience'),
    ('certifications', 'Certifications'),
    ('achievements', 'Achievements'),
    ('hackathons', 'Hackathons & Competitions'),
)


def list_templates() -> list[dict[str, str]]:
    return [
        {'id': template_id, 'label': definition['label'], 'description': definition['description']}
        for template_id, definition in TEMPLATES.items()
    ]


def _text(value: Any) -> str:
    return escape(str(value)).replace('\n', '<br/>')


def _paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(_text(text), style)


def _labeled(label: str, value: Any, style: ParagraphStyle) -> Paragraph | None:
    if not value:
        return None
    return Paragraph(f'<b>{escape(label)}:</b> {_text(value)}', style)


def _entry_title(parts: list[str], style: ParagraphStyle) -> Paragraph | None:
    title = ' | '.join(part for part in parts if part)
    return Paragraph(f'<b>{_text(title)}</b>', style) if title else None


def _section_content(resume: dict[str, Any], section: str, body_style: ParagraphStyle) -> list[Any]:
    content: list[Any] = []
    if section == 'summary':
        if resume.get('summary'):
            content.append(_paragraph(resume['summary'], body_style))
    elif section == 'education':
        for item in resume.get('education') or []:
            entry: list[Any] = []
            title = _entry_title([item.get('degree', ''), item.get('specialization', '')], body_style)
            if title:
                entry.append(title)
            details = ' | '.join(value for value in (
                item.get('institution', ''),
                item.get('start_year', '') + (' - ' + item['graduation_year'] if item.get('graduation_year') else '') if item.get('start_year') else item.get('graduation_year', ''),
            ) if value)
            if details:
                entry.append(_paragraph(details, body_style))
            for label, key in (('Grade', 'grade'), ('Relevant coursework', 'coursework')):
                paragraph = _labeled(label, item.get(key), body_style)
                if paragraph:
                    entry.append(paragraph)
            if entry:
                content.extend(entry + [Spacer(1, 5)])
    elif section == 'technical_skills':
        skills = [
            f"{item['name']} ({item['knowledge_percent']:g}%)"
            for item in resume.get('technical_skills') or []
            if item.get('name')
        ]
        if skills:
            content.append(_paragraph(' | '.join(skills), body_style))
    elif section == 'soft_skills':
        skills = [skill.strip() for skill in resume.get('soft_skills') or [] if skill.strip()]
        if skills:
            content.append(_paragraph(' | '.join(skills), body_style))
    elif section == 'projects':
        for item in resume.get('projects') or []:
            entry = []
            title = _entry_title([item.get('name', '')], body_style)
            if title:
                entry.append(title)
            for label, key in (
                ('Description', 'description'),
                ('Contribution', 'contribution'),
                ('Technologies', 'technologies'),
                ('GitHub', 'github_url'),
                ('Demo', 'demo_url'),
            ):
                paragraph = _labeled(label, item.get(key), body_style)
                if paragraph:
                    entry.append(paragraph)
            if entry:
                content.extend(entry + [Spacer(1, 5)])
    elif section == 'experience':
        for item in resume.get('experience') or []:
            entry = []
            title = _entry_title([item.get('role', ''), item.get('company', '')], body_style)
            if title:
                entry.append(title)
            dates = ' - '.join(value for value in (item.get('start_date', ''), item.get('end_date', '')) if value)
            if dates:
                entry.append(_paragraph(dates, body_style))
            for label, key in (('Responsibilities', 'responsibilities'), ('Technologies', 'technologies')):
                paragraph = _labeled(label, item.get(key), body_style)
                if paragraph:
                    entry.append(paragraph)
            if entry:
                content.extend(entry + [Spacer(1, 5)])
    elif section == 'certifications':
        for item in resume.get('certifications') or []:
            entry = []
            title = _entry_title([item.get('name', '')], body_style)
            if title:
                entry.append(title)
            issuer = ' | '.join(value for value in (item.get('organization', ''), item.get('issue_date', '')) if value)
            if issuer:
                entry.append(_paragraph(issuer, body_style))
            for label, key in (('Credential ID', 'credential_id'), ('Credential URL', 'credential_url')):
                paragraph = _labeled(label, item.get(key), body_style)
                if paragraph:
                    entry.append(paragraph)
            if entry:
                content.extend(entry + [Spacer(1, 5)])
    elif section == 'achievements':
        for item in resume.get('achievements') or []:
            entry = []
            title = _entry_title([item.get('title', '')], body_style)
            if title:
                entry.append(title)
            for label, key in (('Description', 'description'), ('Organization', 'organization'), ('Date', 'date')):
                paragraph = _labeled(label, item.get(key), body_style)
                if paragraph:
                    entry.append(paragraph)
            if entry:
                content.extend(entry + [Spacer(1, 5)])
    elif section == 'hackathons':
        for item in resume.get('hackathons') or []:
            entry = []
            title = _entry_title([item.get('name', '')], body_style)
            if title:
                entry.append(title)
            details = ' | '.join(value for value in (
                item.get('organization', ''),
                item.get('date', ''),
                item.get('position', ''),
            ) if value)
            if details:
                entry.append(_paragraph(details, body_style))
            for label, key in (
                ('Project', 'project_name'),
                ('Description', 'description'),
                ('Technologies', 'technologies'),
            ):
                paragraph = _labeled(label, item.get(key), body_style)
                if paragraph:
                    entry.append(paragraph)
            if entry:
                content.extend(entry + [Spacer(1, 5)])
    return content


def generate_resume_pdf(resume: dict[str, Any], template_id: str) -> bytes:
    if template_id not in TEMPLATES:
        raise ValueError(f'Unsupported resume template: {template_id}')

    template = TEMPLATES[template_id]
    accent = colors.HexColor(template['accent'])
    styles = getSampleStyleSheet()
    header_style = ParagraphStyle(
        'ResumeHeader',
        parent=styles['Title'],
        fontName=template['heading_font'],
        fontSize=22,
        leading=26,
        alignment=template['header_alignment'],
        textColor=accent,
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        'ResumeSubtitle',
        parent=styles['Normal'],
        fontName=template['body_font'],
        fontSize=10,
        leading=13,
        alignment=template['header_alignment'],
        textColor=colors.HexColor('#475569'),
        spaceAfter=5,
    )
    contact_style = ParagraphStyle(
        'ResumeContact',
        parent=subtitle_style,
        fontSize=8.5,
        leading=12,
        spaceAfter=2,
    )
    section_style = ParagraphStyle(
        'ResumeSection',
        parent=styles['Heading2'],
        fontName=template['heading_font'],
        fontSize=10,
        leading=13,
        textColor=accent,
        spaceBefore=9,
        spaceAfter=4,
        keepWithNext=True,
    )
    body_style = ParagraphStyle(
        'ResumeBody',
        parent=styles['BodyText'],
        fontName=template['body_font'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1F2937'),
        spaceAfter=2,
        splitLongWords=True,
    )

    margin = template['margin'] * inch
    output = BytesIO()
    document = SimpleDocTemplate(
        output,
        pagesize=letter,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin + (5 if template['top_bar'] else 0),
        bottomMargin=margin,
        title=resume.get('title') or f"{resume.get('career_role', 'Resume')} Resume",
        author=(resume.get('contact') or {}).get('name', ''),
        subject='ATS-friendly resume',
    )
    story: list[Any] = []
    contact = resume.get('contact') or {}
    name = contact.get('name')
    if name:
        story.append(_paragraph(name, header_style))
    if resume.get('career_role'):
        story.append(_paragraph(resume['career_role'], subtitle_style))
    contact_values = [
        contact.get('email'),
        contact.get('phone'),
        contact.get('location'),
        contact.get('linkedin_url'),
        contact.get('github_url'),
        contact.get('portfolio_url'),
    ]
    contact_values = [value for value in contact_values if value]
    if contact_values:
        story.append(_paragraph(' | '.join(contact_values), contact_style))
    if name or contact_values or resume.get('career_role'):
        story.append(Spacer(1, 6))
        if template['rule']:
            story.append(HRFlowable(width='100%', thickness=0.8, color=accent, spaceAfter=4))

    for section, title in SECTION_ORDER:
        content = _section_content(resume, section, body_style)
        if content:
            heading = Paragraph(title.upper(), section_style)
            first_item, *remaining = content
            story.append(KeepTogether([heading, first_item]))
            story.extend(remaining)

    def draw_page(canvas, _document):
        canvas.saveState()
        page_width, page_height = letter
        if template['top_bar']:
            canvas.setFillColor(accent)
            canvas.rect(0, page_height - 4, page_width, 4, fill=1, stroke=0)
        canvas.setStrokeColor(colors.HexColor('#CBD5E1'))
        canvas.setLineWidth(0.4)
        canvas.line(margin, margin - 10, page_width - margin, margin - 10)
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#64748B'))
        canvas.drawRightString(page_width - margin, margin - 23, str(canvas.getPageNumber()))
        canvas.restoreState()

    document.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    return output.getvalue()

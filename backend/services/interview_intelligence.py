from __future__ import annotations

from typing import List, Optional
from .. import models
from .career_intelligence import find_role, role_skills
from .resume_intelligence import extract_skills


class InterviewIntelligenceError(Exception):
    """Raised when interview intelligence cannot use the requested context."""


def generate_questions(
    resume: Optional[models.Resume],
    target_role: str,
    interview_type: str,
    custom_skills: Optional[List[str]] = None,
) -> list[dict]:
    resume_skills = []
    if resume and resume.extracted_text:
        resume_skills = extract_skills(resume.extracted_text)
    if custom_skills:
        resume_skills = list(dict.fromkeys(resume_skills + custom_skills))
    
    selected_type = (interview_type or 'Mixed').casefold()
    questions = []
    question_id = 1

    if selected_type in {'technical', 'mixed'}:
        skills_to_use = resume_skills[:2] if resume_skills else ['Python or SQL', 'System Architecture']
        for skill in skills_to_use:
            questions.append({
                'id': question_id,
                'category': 'technical',
                'prompt': f'How have you used {skill} in a real project, and what technical trade-off or architectural decision did you make?',
                'expected_points': ['specific project context', 'technical decision', 'result or lesson learned'],
            })
            question_id += 1

    if selected_type in {'behavioral', 'hr', 'mixed'}:
        questions.append({
            'id': question_id,
            'category': 'behavioral',
            'prompt': f'Tell me about a complex challenge or bottleneck you faced while working toward or in a {target_role} role.',
            'expected_points': ['clear situation', 'actions taken', 'measurable or concrete outcome'],
        })
        question_id += 1
        questions.append({
            'id': question_id,
            'category': 'behavioral',
            'prompt': 'Describe a situation where you had to quickly adapt to critical feedback or changing requirements.',
            'expected_points': ['specific feedback', 'changes implemented', 'impact on delivery'],
        })

    return questions


def evaluate_answer(question: dict, answer_text: str) -> dict:
    answer = answer_text.strip()
    words = answer.split()
    expected = question.get('expected_points', [])
    normalized = answer.casefold()
    point_matches = []
    for point in expected:
        keywords = [word for word in point.casefold().split() if len(word) > 4]
        if any(keyword in normalized for keyword in keywords):
            point_matches.append(point)

    completeness = len(point_matches) / len(expected) if expected else 0.0
    length_bonus = min(1.0, len(words) / 80)
    score = round(min(100.0, (completeness * 75.0) + (length_bonus * 25.0)), 2)
    strengths = ['The answer addresses the question directly.'] if words else []
    if len(words) >= 30:
        strengths.append('The answer provides enough detail to evaluate.')
    missing = [point for point in expected if point not in point_matches]
    improvements = [f'Add {point}.' for point in missing]
    if len(words) < 30:
        improvements.append('Add a specific example and measurable outcome.')

    return {
        'score': score,
        'strengths': strengths,
        'missing_points': missing,
        'improvement_feedback': improvements,
    }

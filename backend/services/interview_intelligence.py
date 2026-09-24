from __future__ import annotations

from .. import models
from .career_intelligence import find_role, role_skills
from .resume_intelligence import extract_skills


class InterviewIntelligenceError(Exception):
    """Raised when interview intelligence cannot use the requested context."""


def generate_questions(resume: models.Resume, target_role: str, interview_type: str) -> list[dict]:
    resume_skills = extract_skills(resume.extracted_text or '')
    selected_type = interview_type.casefold()
    questions = []
    question_id = 1

    if selected_type in {'technical', 'mixed'}:
        for skill in (resume_skills[:2] or ['the main technical skill in your resume']):
            questions.append({
                'id': question_id,
                'category': 'technical',
                'prompt': f'How have you used {skill} in a project, and what trade-off did you make?',
                'expected_points': ['specific project context', 'technical decision', 'result or lesson'],
            })
            question_id += 1

    if selected_type in {'behavioral', 'hr', 'mixed'}:
        questions.append({
            'id': question_id,
            'category': 'behavioral',
            'prompt': f'Tell me about a challenge you faced while preparing for or working toward {target_role}.',
            'expected_points': ['clear situation', 'actions taken', 'measurable or concrete outcome'],
        })
        question_id += 1
        questions.append({
            'id': question_id,
            'category': 'behavioral',
            'prompt': 'Describe how you receive feedback and apply it to improve your work.',
            'expected_points': ['specific feedback', 'change made', 'result'],
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
        improvements.append('Add a specific example and outcome.')

    return {
        'score': score,
        'strengths': strengths,
        'missing_points': missing,
        'improvement_feedback': improvements,
    }

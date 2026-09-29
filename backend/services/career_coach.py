from __future__ import annotations

import re
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import crud, models
from .career_intelligence import DEFAULT_ROLE_PROFILES, analyze_career_gap, find_or_create_role, role_skills
from .gemini_service import GeminiService, GeminiServiceError
from .resume_intelligence import clean_resume_text, extract_skills


def _latest_resume(db: Session, user_id: int) -> models.Resume | None:
    return db.scalar(
        select(models.Resume)
        .where(models.Resume.user_id == user_id)
        .order_by(models.Resume.uploaded_at.desc())
    )


def build_context(db: Session, user_id: int, resume_id: int | None, target_role: str | None) -> dict:
    resume = crud.get_resume(db, resume_id) if resume_id is not None else _latest_resume(db, user_id)
    if resume is not None and resume.user_id != user_id:
        resume = _latest_resume(db, user_id)

    user_db = crud.get_user(db, user_id)
    custom_skills = list(user_db.custom_skills or []) if user_db else []
    target_role_name = (target_role or (user_db.target_role if user_db else 'Full Stack Engineer')).strip()

    role = find_or_create_role(db, None, target_role_name)
    gap = analyze_career_gap(resume, role, custom_skills)
    roadmap = crud.get_latest_career_roadmap(db, user_id, resume.id if resume else None)

    return {
        'resume': resume,
        'role': role,
        'current_skills': gap['current_skills'],
        'matching_skills': gap['matching_skills'],
        'missing_skills': gap['missing_skills'],
        'recommended_skills': gap['recommended_skills'],
        'roadmap': roadmap.roadmap if roadmap else [],
        'required_skills': role_skills(role) if role else [],
        'target_role': role.name,
    }


def _compare_roles_with_user_skills(user_skills: List[str], target_role: str) -> List[Dict[str, Any]]:
    user_skills_lower = {s.lower() for s in user_skills}
    role_comparisons = []

    for r_name, r_reqs in DEFAULT_ROLE_PROFILES.items():
        matched = [s for s in r_reqs if s.lower() in user_skills_lower]
        missing = [s for s in r_reqs if s.lower() not in user_skills_lower]
        overlap_pct = round((len(matched) / max(1, len(r_reqs))) * 100)
        is_target = r_name.lower() == target_role.lower()

        tier = 'Direct Match' if overlap_pct >= 60 or is_target else ('Adjacent Role' if overlap_pct >= 30 else 'Skill-Building Opportunity')

        role_comparisons.append({
            'role': r_name,
            'tier': tier,
            'overlap_pct': overlap_pct,
            'matched_skills': matched,
            'missing_skills': missing,
            'total_required': len(r_reqs),
            'is_target': is_target,
        })

    # Sort so target role and highest overlap roles appear first
    role_comparisons.sort(key=lambda x: (x['is_target'], x['overlap_pct']), reverse=True)
    return role_comparisons


def _fallback_answer(question: str, context: dict, history: Optional[List[dict]] = None) -> str:
    role = context['target_role']
    current_skills = context['current_skills']
    missing_skills = context['missing_skills']
    matching_skills = context['matching_skills']
    required_skills = context['required_skills']

    current_str = ', '.join(current_skills) if current_skills else 'No verified skills recorded yet'
    missing_str = ', '.join(missing_skills) if missing_skills else 'None (all core requirements met)'
    
    q_lower = question.lower()
    advice_lines: List[str] = []

    # 1. System Design Questions
    if 'system design' in q_lower or 'architecture' in q_lower or 'scalab' in q_lower:
        advice_lines.append(f"## System Design Preparation Strategy for {role}")
        advice_lines.append(f"Given your current verified competencies (**{current_str}**), here is a structured blueprint to master system design for {role} interviews and production systems:\n")
        
        advice_lines.append("### 1. Foundational Architectural Concepts to Learn")
        advice_lines.append("- **High-Level Tiering & API Design**: REST vs GraphQL, stateless services, and API gateway routing.")
        advice_lines.append("- **Data Modeling & Storage Tradeoffs**: SQL (ACID, relational indexing) vs NoSQL (document/key-value), read/write replicas, and sharding.")
        advice_lines.append("- **Caching Strategies**: Redis/Memcached cache-aside, write-through, cache invalidation, and TTL tuning.")
        advice_lines.append("- **Asynchronous Processing**: Message queues (RabbitMQ/Kafka) for decoupling heavy background tasks and event-driven workflows.")
        
        advice_lines.append("\n### 2. Tailored Learning Sequence for Your Skills")
        if any(s.lower() in {'python', 'fastapi', 'django', 'flask', 'node.js', 'express'} for s in current_skills):
            advice_lines.append("1. **Tier 1 (Single-Node Optimization)**: Benchmark your current backend framework for connection pooling, database query optimization, and async I/O.")
            advice_lines.append("2. **Tier 2 (Distributed Scaling)**: Add a load balancer (NGINX/HAProxy), horizontal pod autoscaling with Docker, and a centralized Redis cache.")
            advice_lines.append("3. **Tier 3 (Reliability & Observability)**: Implement rate limiting, circuit breakers, structured logging, and health metrics monitoring.")
        else:
            advice_lines.append("1. **Tier 1**: Master client-server communication protocols, latency vs throughput tradeoffs, and caching patterns.")
            advice_lines.append("2. **Tier 2**: Study microservices decomposition, database indexing, and message streaming architectures.")

        advice_lines.append("\n### 3. High-Yield Practice Scenarios to Master")
        advice_lines.append("- *Design a Real-Time Notification & Activity Feed* (WebSockets + Redis pub/sub).")
        advice_lines.append("- *Design a Scalable URL Shortener / Rate Limiter* (Token bucket algorithm + Redis).")
        advice_lines.append("- *Design a Resilient Job Queue & Resume Processing Engine* (Async workers + S3 storage + PostgreSQL).")

    # 2. Suitable Jobs & Role Recommendations Questions
    elif 'suitable' in q_lower or 'suggest' in q_lower and 'job' in q_lower or 'which job' in q_lower or 'roles' in q_lower or 'recommend job' in q_lower or 'fit' in q_lower:
        role_matches = _compare_roles_with_user_skills(current_skills, role)
        
        advice_lines.append(f"## Personalized Role Suitability & Skill Overlap Analysis")
        advice_lines.append(f"Based on your **{len(current_skills)} verified skills** ({current_str}) and active target baseline (**{role}**), here is how your profile compares across career paths:\n")

        # Top 3 role evaluations
        for idx, r_data in enumerate(role_matches[:4], 1):
            r_title = r_data['role']
            overlap = r_data['overlap_pct']
            tier = r_data['tier']
            matched = ', '.join(r_data['matched_skills']) if r_data['matched_skills'] else 'Foundational alignment'
            missing = ', '.join(r_data['missing_skills']) if r_data['missing_skills'] else 'All core skills verified'

            badge = " ⭐ (Selected Target)" if r_data['is_target'] else ""
            advice_lines.append(f"### {idx}. {r_title} — {overlap}% Skill Match [{tier}]{badge}")
            advice_lines.append(f"- **Matching Strengths**: {matched}")
            advice_lines.append(f"- **Skills to Learn/Bridge**: {missing}")
            if overlap >= 50:
                advice_lines.append(f"- **Readiness Assessment**: Strong immediate fit. You can explore active vacancies while polishing remaining competencies.")
            else:
                advice_lines.append(f"- **Readiness Assessment**: High-growth opportunity. Bridge {len(r_data['missing_skills'])} key skill gaps via targeted portfolio projects.")
            advice_lines.append("")

        advice_lines.append("### Recommended Action Plan:")
        advice_lines.append(f"1. Check the **Job Recommendations** tab for live Adzuna postings matching **{role}**.")
        advice_lines.append(f"2. Check the **Learning Roadmap** tab to track phased milestones for closing your top skill gaps.")

    # 3. Resume & ATS Diagnostics Questions
    elif 'resume' in q_lower or 'ats' in q_lower or 'cv' in q_lower or 'score' in q_lower and 'resume' in q_lower:
        advice_lines.append(f"## ATS Resume Optimization Strategy for {role}")
        advice_lines.append("To maximize your automated screening pass rate and recruiter engagement:\n")
        advice_lines.append("### 1. Strategic Keyword Placement")
        if required_skills:
            advice_lines.append(f"- Explicitly include core industry keywords: **{', '.join(required_skills[:6])}** in your Summary and Skills sections.")
        advice_lines.append("- Frame technical accomplishments with the Google **XYZ formula**: *Accomplished [X], as measured by [Y], by doing [Z]*.")
        advice_lines.append("\n### 2. Section Structure Audit")
        advice_lines.append("- Ensure standard headings: `Summary`, `Work Experience`, `Technical Skills`, `Projects`, and `Education`.")
        advice_lines.append("- Export as standard `.pdf` or `.docx` without multi-column tables, charts, or embedded graphics that confuse ATS parsers.")

    # 4. Skill Gaps & What to Learn Questions
    elif 'skill' in q_lower or 'learn' in q_lower or 'gap' in q_lower or 'what next' in q_lower:
        advice_lines.append(f"## Priority Competency Roadmap for {role}")
        if missing_skills:
            advice_lines.append(f"To reach 100% role readiness for **{role}**, prioritize closing these identified skill gaps:\n")
            for idx, s in enumerate(missing_skills[:4], 1):
                advice_lines.append(f"### {idx}. Master **{s}**")
                advice_lines.append(f"- **Why It Matters**: Essential core requirement for {role} production pipelines.")
                advice_lines.append(f"- **Practical Application**: Build a production microservice or hands-on module incorporating {s}.")
        else:
            advice_lines.append(f"You have verified all core competencies for **{role}**! Your next level is system scalability, cloud infrastructure resilience, and mock interview practice.")

    # 5. General & Contextual Guidance
    else:
        advice_lines.append(f"## Career Intelligence Summary for {role}")
        advice_lines.append(f"- **Target Career Role**: {role}")
        advice_lines.append(f"- **Verified Competencies ({len(current_skills)})**: {current_str}")
        advice_lines.append(f"- **Identified Role Skill Gaps**: {missing_str}")
        advice_lines.append("\n### Actionable Next Steps:")
        advice_lines.append("- Ask me specific questions about **System Design**, **Job Matching Comparisons**, **Resume ATS Tuning**, or **Interview Preparation**.")
        advice_lines.append("- Track your milestone completion in the **Career Roadmap** page to dynamically update your readiness score.")

    return "\n".join(advice_lines)


def answer_career_question(
    db: Session,
    user_id: int,
    question: str,
    resume_id: int | None,
    target_role: str | None,
    history: Optional[List[dict]] = None,
) -> dict:
    context = build_context(db, user_id, resume_id, target_role)

    # Format conversation history context
    history_text = ""
    if history:
        turns = []
        for msg in history[-6:]:
            sender = msg.get('sender', 'user')
            text = msg.get('text', '')
            if text and len(text) < 1000:
                turns.append(f"{'User' if sender == 'user' else 'Career Coach'}: {text.strip()}")
        if turns:
            history_text = "\n### Recent Conversation Context:\n" + "\n".join(turns) + "\n"

    prompt = (
        "You are the CareerLens AI Career Coach — an empathetic, deeply technical, and structured career navigation assistant.\n"
        "Provide direct, high-value, actionable advice formatted in clean GitHub-style Markdown (headings, bullet lists, bold text).\n"
        "Never output raw HTML or unstructured blobs. Always ground your guidance in the user's actual profile details below.\n\n"
        f"### User Profile & Career Telemetry:\n"
        f"- Target Career Role: {context['target_role']}\n"
        f"- Verified Skills: {context['current_skills']}\n"
        f"- Missing Role Skills (Gaps): {context['missing_skills']}\n"
        f"- Matching Role Skills: {context['matching_skills']}\n"
        f"- Role Requirements: {context['required_skills']}\n"
        f"- Active Roadmap Phases: {context['roadmap']}\n"
        f"{history_text}\n"
        f"### Current User Question:\n"
        f"{question.strip()}"
    )

    provider = 'deterministic_fallback'
    try:
        answer = GeminiService().generate(prompt)
        provider = 'gemini'
    except GeminiServiceError:
        answer = _fallback_answer(question, context, history)

    return {
        'answer': answer,
        'provider': provider,
        'target_role': context['target_role'],
        'resume_id': context['resume'].id if context['resume'] else None,
        'current_skills': context['current_skills'],
        'missing_skills': context['missing_skills'],
        'roadmap': context['roadmap'],
    }

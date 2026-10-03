from __future__ import annotations

import re
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from .resume_intelligence import clean_resume_text, cosine_similarity, create_embedding, extract_skills


DEFAULT_ROLE_PROFILES = {
    'Data Engineer': ['Python', 'SQL', 'PostgreSQL', 'ETL', 'Data Warehousing', 'Pandas', 'Spark', 'Docker', 'Airflow', 'Kafka'],
    'Backend Engineer': ['Python', 'FastAPI', 'SQL', 'PostgreSQL', 'REST API', 'Docker', 'Git', 'Redis', 'Microservices'],
    'Backend Developer': ['Python', 'FastAPI', 'SQL', 'PostgreSQL', 'REST API', 'Docker', 'Git', 'Redis', 'Microservices'],
    'Frontend Engineer': ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Git', 'REST API', 'Next.js', 'Tailwind CSS'],
    'Frontend Developer': ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Git', 'REST API', 'Next.js', 'Tailwind CSS'],
    'Full Stack Engineer': ['JavaScript', 'TypeScript', 'React', 'Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Git', 'REST API', 'Node.js'],
    'Full Stack Developer': ['JavaScript', 'TypeScript', 'React', 'Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Git', 'REST API', 'Node.js'],
    'Software Engineer': ['Data Structures', 'Algorithms', 'Git', 'SQL', 'Python', 'JavaScript', 'System Design', 'REST API'],
    'Software Developer': ['Data Structures', 'Algorithms', 'Git', 'SQL', 'Python', 'JavaScript', 'System Design', 'REST API'],
    'Data Scientist': ['Python', 'Pandas', 'NumPy', 'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'SQL', 'Scikit-Learn'],
    'Data Analyst': ['SQL', 'Python', 'Excel', 'Tableau', 'Power BI', 'Data Visualization', 'Pandas'],
    'AI/ML Engineer': ['Python', 'PyTorch', 'TensorFlow', 'Machine Learning', 'Deep Learning', 'NLP', 'FastAPI', 'Docker', 'Pandas'],
    'Product Designer': ['Figma', 'UI/UX Design', 'User Research', 'Wireframing', 'Prototyping', 'Product Strategy', 'Agile'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Git', 'Terraform', 'Monitoring'],
}

GENERIC_ROLE_MODIFIERS = {
    'engineer', 'developer', 'software', 'senior', 'junior', 'associate', 'lead',
    'staff', 'principal', 'intern', 'specialist', 'architect', 'consultant',
    'manager', 'tech', 'technology', 'entry', 'level', 'ii', 'iii', 'iv', 'sr', 'jr',
    'expert', 'practitioner', 'role', 'team', 'member', 'and', 'or', '&', 'the', 'for'
}

ROLE_DOMAIN_CLUSTERS = {
    'data_engineering': {
        'aliases': ['data engineer', 'data engineering', 'etl', 'data platform', 'data warehouse', 'data warehousing', 'data pipeline', 'big data', 'lakehouse', 'spark developer', 'analytics engineer'],
        'primary_keywords': ['data engineer', 'data engineering', 'etl', 'data platform', 'data warehouse', 'data warehousing', 'data pipeline', 'big data', 'lakehouse', 'analytics engineer', 'pipeline engineer'],
        'required_token_groups': [{'data', 'engineer'}, {'etl'}, {'data', 'platform'}, {'data', 'pipeline'}, {'data', 'warehouse'}, {'data', 'warehousing'}, {'big', 'data'}, {'analytics', 'engineer'}],
        'adjacent_roles': ['data analyst', 'data scientist', 'backend engineer', 'database administrator'],
        'conflicting_tokens': ['frontend', 'react', 'vue', 'angular', 'ui/ux', 'product designer', 'ios', 'android', 'flutter'],
    },
    'data_science': {
        'aliases': ['data scientist', 'data science', 'machine learning', 'ml engineer', 'ai engineer', 'deep learning', 'nlp engineer'],
        'primary_keywords': ['data scientist', 'machine learning', 'ml engineer', 'ai engineer', 'deep learning', 'nlp engineer'],
        'required_token_groups': [{'data', 'scientist'}, {'machine', 'learning'}, {'ml'}, {'ai', 'engineer'}, {'deep', 'learning'}, {'ai', 'ml'}],
        'adjacent_roles': ['data engineer', 'data analyst', 'applied scientist', 'research scientist'],
        'conflicting_tokens': ['frontend', 'ui/ux', 'product designer'],
    },
    'data_analytics': {
        'aliases': ['data analyst', 'data analytics', 'bi analyst', 'business intelligence', 'reporting analyst', 'tableau analyst', 'power bi analyst'],
        'primary_keywords': ['data analyst', 'data analytics', 'bi analyst', 'business intelligence', 'analytics analyst'],
        'required_token_groups': [{'data', 'analyst'}, {'bi', 'analyst'}, {'business', 'intelligence'}, {'analytics'}],
        'adjacent_roles': ['data engineer', 'data scientist', 'product analyst', 'business analyst'],
        'conflicting_tokens': ['frontend', 'react', 'embedded', 'ios', 'android'],
    },
    'frontend': {
        'aliases': ['frontend engineer', 'frontend developer', 'front end', 'front-end', 'ui engineer', 'ui developer', 'react developer', 'angular developer', 'vue developer', 'next.js developer', 'web developer'],
        'primary_keywords': ['frontend', 'front end', 'ui engineer', 'ui developer', 'react developer', 'web developer', 'angular developer', 'vue developer'],
        'required_token_groups': [{'frontend'}, {'front', 'end'}, {'ui', 'engineer'}, {'ui', 'developer'}, {'react', 'developer'}, {'web', 'developer'}, {'react', 'engineer'}],
        'adjacent_roles': ['full stack developer', 'product designer', 'ui/ux designer'],
        'conflicting_tokens': ['backend', 'data engineer', 'etl', 'devops', 'sre', 'embedded', 'data scientist'],
    },
    'backend': {
        'aliases': ['backend engineer', 'backend developer', 'back end', 'back-end', 'api engineer', 'api developer', 'server engineer', 'microservices developer', 'python backend'],
        'primary_keywords': ['backend', 'back end', 'api engineer', 'server engineer', 'microservices developer'],
        'required_token_groups': [{'backend'}, {'back', 'end'}, {'api', 'engineer'}, {'server', 'engineer'}, {'microservices'}],
        'adjacent_roles': ['full stack developer', 'devops engineer', 'data engineer', 'cloud engineer'],
        'conflicting_tokens': ['frontend', 'ui/ux', 'product designer', 'graphic designer'],
    },
    'fullstack': {
        'aliases': ['full stack engineer', 'full stack developer', 'fullstack', 'full-stack', 'software engineer', 'software developer'],
        'primary_keywords': ['full stack', 'fullstack', 'software engineer', 'software developer'],
        'required_token_groups': [{'full', 'stack'}, {'fullstack'}, {'software', 'engineer'}, {'software', 'developer'}],
        'adjacent_roles': ['frontend developer', 'backend developer'],
        'conflicting_tokens': [],
    },
    'devops': {
        'aliases': ['devops engineer', 'sre', 'site reliability engineer', 'cloud engineer', 'cloud architect', 'infrastructure engineer', 'platform engineer'],
        'primary_keywords': ['devops', 'sre', 'site reliability', 'cloud engineer', 'infrastructure engineer', 'platform engineer'],
        'required_token_groups': [{'devops'}, {'sre'}, {'site', 'reliability'}, {'cloud', 'engineer'}, {'infrastructure'}],
        'adjacent_roles': ['backend engineer', 'systems administrator', 'security engineer'],
        'conflicting_tokens': ['frontend', 'ui/ux', 'product designer'],
    },
    'design': {
        'aliases': ['product designer', 'ui/ux designer', 'ux designer', 'ui designer', 'visual designer', 'interaction designer'],
        'primary_keywords': ['product designer', 'ui/ux', 'ux designer', 'ui designer', 'figma'],
        'required_token_groups': [{'product', 'designer'}, {'ui/ux'}, {'ux', 'designer'}, {'ui', 'designer'}],
        'adjacent_roles': ['frontend developer', 'design technologist'],
        'conflicting_tokens': ['backend', 'data engineer', 'devops'],
    },
}


def evaluate_target_role_relevance(job_title: str, job_description: str, target_role: str) -> dict:
    """
    Evaluates whether a job posting is a Direct Match, Related Opportunity, or Unrelated
    to the user's selected Target Career Role.

    Role Relevance is strictly separated from Skill Overlap:
    - Direct Match: The job title / core domain directly aligns with the target role.
    - Related Opportunity: An adjacent discipline with explainable relationship.
    - Unrelated: Conflicting domain or generic title overlap (must NOT be recommended).
    """
    title_clean = (job_title or '').lower().replace('/', ' ').replace('-', ' ').replace('_', ' ')
    desc_clean = (job_description or '').lower()
    target_clean = (target_role or 'Full Stack Engineer').lower().replace('/', ' ').replace('-', ' ').replace('_', ' ')
    title_words = set(re.findall(r'\b[a-z0-9+#.]+\b', title_clean))
    target_words = set(re.findall(r'\b[a-z0-9+#.]+\b', target_clean))

    # 1. Direct normalized phrase containment
    # e.g., "senior data engineer" contains "data engineer"
    clean_phrase_target = ' '.join(target_clean.split())
    clean_phrase_title = ' '.join(title_clean.split())
    if clean_phrase_target in clean_phrase_title:
        return {
            'tier': 'Direct Match',
            'relevance_score': 1.0,
            'is_direct': True,
            'is_related': False,
            'reason': f'Job title contains exact target role phrase "{clean_phrase_target}".'
        }

    # 2. Identify target domain cluster
    detected_cluster = None
    for cluster_id, cluster_data in ROLE_DOMAIN_CLUSTERS.items():
        if any(alias in target_clean for alias in cluster_data['aliases']):
            detected_cluster = cluster_data
            break

    if detected_cluster:
        # Check for explicitly conflicting tokens in title (unless target itself has them)
        has_conflict = False
        for conf in detected_cluster['conflicting_tokens']:
            if conf in title_clean and conf not in target_clean:
                has_conflict = True
                break

        if not has_conflict:
            # Check direct keywords and token groups
            for kw in detected_cluster['primary_keywords']:
                if kw in title_clean:
                    return {
                        'tier': 'Direct Match',
                        'relevance_score': 1.0,
                        'is_direct': True,
                        'is_related': False,
                        'reason': f'Job title matches domain keyword "{kw}".'
                    }

            for group in detected_cluster['required_token_groups']:
                if group.issubset(title_words):
                    return {
                        'tier': 'Direct Match',
                        'relevance_score': 1.0,
                        'is_direct': True,
                        'is_related': False,
                        'reason': f'Job title contains required domain tokens {group}.'
                    }

            # Check if adjacent role
            for adj in detected_cluster['adjacent_roles']:
                if adj in title_clean:
                    return {
                        'tier': 'Related Opportunity',
                        'relevance_score': 0.5,
                        'is_direct': False,
                        'is_related': True,
                        'reason': f'Adjacent role opportunity ({adj}) relevant to {target_role}.'
                    }

        # If conflict exists or no title match, check if description has heavy direct domain focus without title conflict
        if not has_conflict:
            matches_in_desc = sum(1 for kw in detected_cluster['primary_keywords'] if kw in desc_clean)
            if matches_in_desc >= 2:
                return {
                    'tier': 'Related Opportunity',
                    'relevance_score': 0.5,
                    'is_direct': False,
                    'is_related': True,
                    'reason': f'Job description heavily emphasizes {target_role} responsibilities.'
                }

        return {
            'tier': 'Unrelated',
            'relevance_score': 0.0,
            'is_direct': False,
            'is_related': False,
            'reason': f'Job is not directly aligned with target role {target_role}.'
        }

    # 3. Dynamic generic matching for custom target roles (e.g., "Cybersecurity Specialist")
    distinctive_target_tokens = target_words - GENERIC_ROLE_MODIFIERS
    if distinctive_target_tokens and distinctive_target_tokens.issubset(title_words):
        return {
            'tier': 'Direct Match',
            'relevance_score': 1.0,
            'is_direct': True,
            'is_related': False,
            'reason': f'Job title contains core distinctive tokens {distinctive_target_tokens}.'
        }

    # Fallback check on distinctive token overlap
    overlap = distinctive_target_tokens.intersection(title_words)
    if len(overlap) >= max(1, len(distinctive_target_tokens) // 2) and len(distinctive_target_tokens) > 1:
        return {
            'tier': 'Related Opportunity',
            'relevance_score': 0.5,
            'is_direct': False,
            'is_related': True,
            'reason': f'Job title shares core domain keywords {overlap}.'
        }

    return {
        'tier': 'Unrelated',
        'relevance_score': 0.0,
        'is_direct': False,
        'is_related': False,
        'reason': f'Job title does not match core target role {target_role}.'
    }


DEFAULT_BENCHMARK_JOBS = [
    {
        'title': 'Senior Data Engineer',
        'company': 'DataStream Analytics',
        'location': 'Remote / Hybrid',
        'description': 'Architecting robust data pipelines, ETL workflows, and real-time streaming infrastructure with Python, SQL, Spark, and Kafka.',
        'required_skills': ['Python', 'SQL', 'ETL', 'Data Warehousing', 'Spark', 'Kafka', 'PostgreSQL', 'Airflow'],
    },
    {
        'title': 'Data Platform Engineer',
        'company': 'Nexus Cloud Data',
        'location': 'Bangalore / Remote',
        'description': 'Designing scalable data lakes, distributed database architectures, and ETL pipelines with Python, PostgreSQL, and Docker.',
        'required_skills': ['Python', 'SQL', 'Data Warehousing', 'ETL', 'Docker', 'PostgreSQL', 'Pandas'],
    },
    {
        'title': 'Backend Software Engineer',
        'company': 'HyperScale Tech',
        'location': 'Remote',
        'description': 'Building high-throughput microservices, REST APIs, and asynchronous message processing with FastAPI, PostgreSQL, Redis, and Docker.',
        'required_skills': ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Redis', 'REST API', 'Git'],
    },
    {
        'title': 'Frontend React Engineer',
        'company': 'Vanguard UI Labs',
        'location': 'Remote / Hybrid',
        'description': 'Crafting responsive single-page web applications with React, TypeScript, Tailwind CSS, and state management.',
        'required_skills': ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'REST API'],
    },
    {
        'title': 'Full Stack Developer',
        'company': 'Apex Systems',
        'location': 'Remote',
        'description': 'End-to-end full stack development across React frontends and Python FastAPI / PostgreSQL backends with Docker deployments.',
        'required_skills': ['React', 'JavaScript', 'Python', 'FastAPI', 'PostgreSQL', 'Git', 'Docker'],
    },
    {
        'title': 'Applied AI / ML Engineer',
        'company': 'Cognitive AI Research',
        'location': 'Hybrid',
        'description': 'Developing deep learning models, natural language processing pipelines, and inference microservices using PyTorch, Python, and Docker.',
        'required_skills': ['Python', 'PyTorch', 'TensorFlow', 'Machine Learning', 'Deep Learning', 'FastAPI', 'Docker'],
    },
    {
        'title': 'DevOps & Cloud Engineer',
        'company': 'CloudScale Infra',
        'location': 'Remote',
        'description': 'Managing container orchestration, CI/CD deployment pipelines, and cloud monitoring using Kubernetes, Docker, AWS, and Terraform.',
        'required_skills': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Git', 'Terraform'],
    },
]


def _skill_key(skill: str) -> str:
    return ' '.join(skill.casefold().split())


def ensure_default_roles(db: Session) -> None:
    existing = {name.lower() for name in db.scalars(select(models.CareerRole.name)).all()}
    created = False
    for name, skills in DEFAULT_ROLE_PROFILES.items():
        if name.lower() in existing:
            continue
        role = models.CareerRole(name=name, description=f'Required skills for a {name} career path.')
        role.skills = [models.CareerRoleSkill(skill_name=skill) for skill in skills]
        db.add(role)
        created = True
    if created:
        db.commit()


def ensure_default_benchmark_jobs(db: Session) -> None:
    existing_titles = {t.lower() for t in db.scalars(select(models.Job.title)).all()}
    created = False
    for j_data in DEFAULT_BENCHMARK_JOBS:
        if j_data['title'].lower() in existing_titles:
            continue
        job = models.Job(
            title=j_data['title'],
            company=j_data['company'],
            location=j_data['location'],
            description=j_data['description'],
        )
        job.skills = [models.JobSkill(skill_name=s) for s in j_data['required_skills']]
        db.add(job)
        created = True
    if created:
        db.commit()


def role_skills(role: models.CareerRole) -> list[str]:
    return [skill.skill_name for skill in role.skills]


def find_or_create_role(db: Session, role_id: int | None, target_role: str | None) -> models.CareerRole:
    ensure_default_roles(db)
    if role_id is not None:
        role = db.scalar(select(models.CareerRole).where(models.CareerRole.id == role_id))
        if role:
            return role

    role_name = (target_role or 'Full Stack Engineer').strip()
    # 1. Exact or case-insensitive match
    role = db.scalar(select(models.CareerRole).where(models.CareerRole.name.ilike(role_name)))
    if role:
        return role

    # 2. Substring or keyword match
    for existing_role in db.scalars(select(models.CareerRole)).all():
        if existing_role.name.lower() in role_name.lower() or role_name.lower() in existing_role.name.lower():
            return existing_role

    # 3. Create on-the-fly custom role with sensible default seed skills
    seed_skills = ['Git', 'Problem Solving', 'Communication', 'Project Management', 'Agile']
    if 'data eng' in role_name.lower() or 'etl' in role_name.lower() or 'pipeline' in role_name.lower():
        seed_skills = DEFAULT_ROLE_PROFILES['Data Engineer']
    elif 'front' in role_name.lower() or 'ui' in role_name.lower() or 'web' in role_name.lower():
        seed_skills = DEFAULT_ROLE_PROFILES['Frontend Engineer']
    elif 'back' in role_name.lower() or 'api' in role_name.lower():
        seed_skills = DEFAULT_ROLE_PROFILES['Backend Engineer']
    elif 'data' in role_name.lower() or 'ai' in role_name.lower() or 'ml' in role_name.lower():
        seed_skills = DEFAULT_ROLE_PROFILES['Data Scientist']
    elif 'devops' in role_name.lower() or 'cloud' in role_name.lower() or 'infra' in role_name.lower():
        seed_skills = DEFAULT_ROLE_PROFILES['DevOps Engineer']

    new_role = models.CareerRole(name=role_name, description=f'Custom career profile for {role_name}.')
    new_role.skills = [models.CareerRoleSkill(skill_name=s) for s in seed_skills]
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role


def find_role(db: Session, role_id: int | None, target_role: str) -> models.CareerRole | None:
    return find_or_create_role(db, role_id, target_role)


def analyze_career_gap_from_skills(user_skills: list[str], role: models.CareerRole) -> dict:
    current_by_key = {_skill_key(skill): skill for skill in user_skills}
    required = role_skills(role)
    matching = [skill for skill in required if _skill_key(skill) in current_by_key]
    missing = [skill for skill in required if _skill_key(skill) not in current_by_key]

    coverage_pct = round((len(matching) / len(required)) * 100, 1) if required else 100.0

    return {
        'current_skills': user_skills,
        'matching_skills': matching,
        'missing_skills': missing,
        'recommended_skills': missing[:],
        'similarity_score': coverage_pct,
        'embedding_model': 'skill-coverage-heuristic',
    }


def analyze_career_gap(resume: models.Resume | None, role: models.CareerRole, custom_skills: list[str] | None = None) -> dict:
    current_skills: list[str] = []
    text = ''
    if resume and resume.extracted_text:
        text = clean_resume_text(resume.extracted_text)
        current_skills.extend(extract_skills(text))

    if custom_skills:
        current_skills.extend(custom_skills)

    # Deduplicate while preserving order
    deduped: list[str] = []
    seen = set()
    for s in current_skills:
        k = _skill_key(s)
        if k not in seen:
            seen.add(k)
            deduped.append(s)

    current_by_key = {_skill_key(skill): skill for skill in deduped}
    required = role_skills(role)
    matching = [skill for skill in required if _skill_key(skill) in current_by_key]
    missing = [skill for skill in required if _skill_key(skill) not in current_by_key]

    similarity_score = None
    embedding_model = None
    if text:
        resume_embedding, _ = create_embedding(text)
        role_text = f'{role.name} {" ".join(required)}'
        role_embedding, embedding_model = create_embedding(role_text)
        if resume_embedding is not None and role_embedding is not None:
            similarity_score = round(max(0.0, cosine_similarity(resume_embedding, role_embedding)) * 100, 2)

    if similarity_score is None:
        similarity_score = round((len(matching) / len(required)) * 100, 1) if required else 100.0

    return {
        'current_skills': deduped,
        'matching_skills': matching,
        'missing_skills': missing,
        'recommended_skills': missing[:],
        'similarity_score': similarity_score,
        'embedding_model': embedding_model,
    }


def build_roadmap(role: models.CareerRole, missing_skills: list[str], matching_skills: list[str] | None = None) -> list[dict]:
    roadmap = []
    matched = list(matching_skills or [])

    # Phase 1: Recognize user's verified baseline skills
    if matched:
        roadmap.append({
            'phase': 1,
            'title': f'Phase 1: Verified Baseline Strengths ({", ".join(matched[:3]) if len(matched) <= 3 else f"{len(matched)} skills verified"})',
            'skills': matched,
            'status': 'completed',
        })

    # Phases for Missing Skill Gaps
    if missing_skills:
        for index in range(0, len(missing_skills), 2):
            chunk = missing_skills[index:index + 2]
            phase_num = len(roadmap) + 1
            is_first_gap = (len(roadmap) == (1 if matched else 0))
            roadmap.append({
                'phase': phase_num,
                'title': f'Phase {phase_num}: Master {" & ".join(chunk)} for {role.name}',
                'skills': chunk,
                'status': 'ready' if is_first_gap else 'planned',
            })
    else:
        # All required skills verified! Add advanced optimization phase
        all_skills = role_skills(role)
        phase_num = len(roadmap) + 1
        roadmap.append({
            'phase': phase_num,
            'title': f'Phase {phase_num}: Advanced Production Pipelines & Scalability for {role.name}',
            'skills': all_skills[:4] if all_skills else ['Scalability', 'Observability'],
            'status': 'ready',
        })

    # Final Phase: Capstone Project & Portfolio Interview Readiness
    capstone_num = len(roadmap) + 1
    roadmap.append({
        'phase': capstone_num,
        'title': f'Phase {capstone_num}: Capstone Portfolio Project & {role.name} Interview Readiness',
        'skills': [f'{role.name} Architecture', 'System Design', 'Behavioral Interview Prep'],
        'status': 'planned',
    })

    return roadmap


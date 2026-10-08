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


def get_learning_resources(skill_name: str, target_role: str) -> dict:
    """Generates valid learning resource links based on skill name."""
    s_clean = skill_name.strip()
    s_url = re.sub(r'[^a-zA-Z0-9]', '', s_clean).lower()
    encoded = re.sub(r'\s+', '+', s_clean)
    
    # Authoritative documentation links for common technologies
    doc_links = {
        'python': 'https://docs.python.org/3/',
        'sql': 'https://www.w3schools.com/sql/',
        'postgresql': 'https://www.postgresql.org/docs/',
        'pandas': 'https://pandas.pydata.org/docs/',
        'react': 'https://react.dev/',
        'javascript': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        'typescript': 'https://www.typescriptlang.org/docs/',
        'fastapi': 'https://fastapi.tiangolo.com/',
        'docker': 'https://docs.docker.com/',
        'git': 'https://git-scm.com/doc',
        'aws': 'https://docs.aws.amazon.com/',
        'spark': 'https://spark.apache.org/docs/latest/',
        'airflow': 'https://airflow.apache.org/docs/',
        'kafka': 'https://kafka.apache.org/documentation/',
    }
    
    doc_url = doc_links.get(s_url, f'https://devdocs.io/#q={encoded}')
    
    return {
        'youtube': [
            {'title': f'{s_clean} Full Course for Beginners', 'url': f'https://www.youtube.com/results?search_query={encoded}+full+course'},
            {'title': f'{s_clean} Tutorial for {target_role}', 'url': f'https://www.youtube.com/results?search_query={encoded}+{re.sub(r"\s+", "+", target_role)}'}
        ],
        'courses': [
            {'title': f'freeCodeCamp: {s_clean} Guide', 'url': 'https://www.freecodecamp.org/news/search/?query=' + encoded},
            {'title': f'Official Documentation & Tutorials', 'url': doc_url}
        ],
        'practice': [
            {'title': f'LeetCode / HackerRank {s_clean} Practice', 'url': 'https://www.leetcode.com/problemset/all/'},
            {'title': f'Kaggle {s_clean} Datasets & Practice', 'url': 'https://www.kaggle.com/search?q=' + encoded}
        ]
    }


def build_roadmap(role: models.CareerRole, missing_skills: list[str], matching_skills: list[str] | None = None) -> list[dict]:
    """
    Constructs a 4-Phase Career Roadmap adapted to the target role and user skills:
    Phase 1 — FOUNDATION (Core verified & fundamental skills)
    Phase 2 — SKILL DEVELOPMENT (Missing skills & gap-bridging)
    Phase 3 — PROJECTS & PRACTICE (Practical project building & hands-on application)
    Phase 4 — JOB READINESS (Resume, interviews, portfolio & career preparation)
    """
    role_name = role.name if role else 'Software Engineer'
    req = role_skills(role) if role else ['Python', 'SQL', 'Git', 'REST API', 'Docker']
    matched = list(matching_skills or [])
    missing = list(missing_skills or [s for s in req if s not in matched])
    
    # Phase 1: Foundation
    phase1_skills = matched[:4] if matched else req[:2]
    phase1_resources = [get_learning_resources(s, role_name) for s in phase1_skills[:2]] if phase1_skills else [get_learning_resources(req[0], role_name)]
    
    phase1 = {
        'phase': 1,
        'name': 'FOUNDATION',
        'title': f'Phase 1 — FOUNDATION: Verify Core Prerequisites for {role_name}',
        'objective': f'Build and verify the essential foundational concepts required for a successful {role_name} career path.',
        'importance': f'Establishing strong fundamentals in {", ".join(phase1_skills[:3]) if phase1_skills else "core tools"} prevents technical debt and speeds up complex system development.',
        'skills': phase1_skills if phase1_skills else ['Core Programming', 'Git Fundamentals'],
        'tasks': [
            {'task_id': 'p1_t1', 'title': f'Verify environment setup and core proficiency in {phase1_skills[0] if phase1_skills else "programming fundamentals"}', 'completed': True if matched else False, 'associated_skill': phase1_skills[0] if phase1_skills else 'Core Programming'},
            {'task_id': 'p1_t2', 'title': f'Practice standard syntax, data structures, and algorithms for {role_name}', 'completed': True if matched else False, 'associated_skill': phase1_skills[1] if len(phase1_skills) > 1 else (phase1_skills[0] if phase1_skills else 'Data Structures')},
            {'task_id': 'p1_t3', 'title': 'Configure version control (Git) workflow and remote repositories', 'completed': True if matched else False, 'associated_skill': 'Git'},
        ],
        'resources': phase1_resources,
        'project_suggestion': f'Create a clean open-source repository showcasing fundamental operations in {phase1_skills[0] if phase1_skills else "core language"}.',
        'expected_outcome': f'Demonstrate fluency in basic syntax, environment tooling, and fundamental problem-solving required for {role_name}.',
        'status': 'completed' if matched else 'ready'
    }

    # Phase 2: Skill Development
    phase2_skills = missing if missing else [s for s in req if s not in phase1_skills][:4]
    if not phase2_skills:
        phase2_skills = ['Advanced Architecture', 'Distributed Systems', 'Performance Tuning']
    phase2_resources = [get_learning_resources(s, role_name) for s in phase2_skills[:3]]
    
    phase2 = {
        'phase': 2,
        'name': 'SKILL DEVELOPMENT',
        'title': f'Phase 2 — SKILL DEVELOPMENT: Bridge Skill Gaps for {role_name}',
        'objective': f'Acquire and master missing high-priority technical skills identified for {role_name}.',
        'importance': f'Closing skill gaps in {", ".join(phase2_skills[:3])} directly increases your resume match percentage for target vacancies.',
        'skills': phase2_skills,
        'tasks': [
            {'task_id': 'p2_t1', 'title': f'Learn core principles and hands-on usage of {phase2_skills[0] if phase2_skills else "missing skills"}', 'completed': False, 'associated_skill': phase2_skills[0] if phase2_skills else 'Missing Skill'},
            {'task_id': 'p2_t2', 'title': f'Build mini-modules and unit tests using {phase2_skills[1] if len(phase2_skills) > 1 else phase2_skills[0]}', 'completed': False, 'associated_skill': phase2_skills[1] if len(phase2_skills) > 1 else phase2_skills[0]},
            {'task_id': 'p2_t3', 'title': f'Practice real-world coding problems involving {", ".join(phase2_skills[:2])}', 'completed': False, 'associated_skill': phase2_skills[2] if len(phase2_skills) > 2 else phase2_skills[0]},
        ],
        'resources': phase2_resources,
        'project_suggestion': f'Develop an end-to-end service or module integrating {", ".join(phase2_skills[:2])}.',
        'expected_outcome': f'Able to independently write production-ready code using {", ".join(phase2_skills[:2])}.',
        'status': 'ready' if matched else 'planned'
    }

    # Phase 3: Projects & Practice
    phase3_skills = (phase2_skills[:2] + ['System Architecture', 'CI/CD Pipelines'])
    phase3_resources = [get_learning_resources('System Design', role_name), get_learning_resources('Docker', role_name)]
    
    phase3 = {
        'phase': 3,
        'name': 'PROJECTS & PRACTICE',
        'title': f'Phase 3 — PROJECTS & PRACTICE: Build Real Portfolio Applications',
        'objective': 'Apply acquired technical skills through real implementation and capstone project building.',
        'importance': 'Recruiters and engineering managers evaluate hands-on execution and repository quality over theoretical knowledge.',
        'skills': phase3_skills,
        'tasks': [
            {'task_id': 'p3_t1', 'title': f'Architect and implement a capstone project tailored for a {role_name}', 'completed': False, 'associated_skill': phase3_skills[0] if phase3_skills else 'System Architecture'},
            {'task_id': 'p3_t2', 'title': 'Containerize application components using Docker and automate builds with CI/CD', 'completed': False, 'associated_skill': 'Docker'},
            {'task_id': 'p3_t3', 'title': 'Write comprehensive API documentation and detailed README with architecture diagrams', 'completed': False, 'associated_skill': 'REST API'},
        ],
        'resources': phase3_resources,
        'project_suggestion': f'Full-featured production capstone project: {role_name} pipeline/service with live deployment and monitoring.',
        'expected_outcome': 'A fully deployed, open-source portfolio project showcasing production quality and architecture.',
        'status': 'planned'
    }

    # Phase 4: Job Readiness
    phase4_skills = [f'{role_name} System Design', 'Behavioral Preparation', 'ATS Optimization']
    phase4_resources = [get_learning_resources('System Design', role_name), get_learning_resources('Mock Interview', role_name)]
    
    phase4 = {
        'phase': 4,
        'name': 'JOB READINESS',
        'title': f'Phase 4 — JOB READINESS: Resume, Interviews & Portfolio Preparation',
        'objective': 'Prepare your resume, online applications, technical mock interviews, and recruiter strategy.',
        'importance': 'Converting technical skills into job offers requires structured interview performance and ATS optimization.',
        'skills': phase4_skills,
        'tasks': [
            {'task_id': 'p4_t1', 'title': f'Optimize resume ATS score for {role_name} using CareerLens Resume Intelligence', 'completed': False, 'associated_skill': 'ATS Optimization'},
            {'task_id': 'p4_t2', 'title': f'Complete 3 role-specific mock interview practice runs in CareerLens AI Coach', 'completed': False, 'associated_skill': 'Interview Prep'},
            {'task_id': 'p4_t3', 'title': f'Apply to matched {role_name} vacancies on Job Search board', 'completed': False, 'associated_skill': 'Job Search'},
        ],
        'resources': phase4_resources,
        'project_suggestion': 'Tailor bullet points using the STAR method for technical & behavioral interview storytelling.',
        'expected_outcome': f'Fully prepared to excel in technical screening and land top {role_name} job offers.',
        'status': 'planned'
    }

    return [phase1, phase2, phase3, phase4]


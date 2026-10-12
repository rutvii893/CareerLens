import time
from backend.main import app
from fastapi.testclient import TestClient
from uuid import uuid4

client = TestClient(app)
email = f'bench-{uuid4().hex[:8]}@careerlens.io'
t0 = time.time()
client.post('/api/v1/auth/register', json={'name': 'Timer Test', 'email': email, 'password': 'password123', 'role': 'student'})
token = client.post('/api/v1/auth/login', json={'email': email, 'password': 'password123'}).json()['access_token']
headers = {'Authorization': f'Bearer {token}'}
print(f'Auth setup: {time.time() - t0:.2f}s')

for role in ['Frontend Engineer', 'Data Engineer', 'AI/ML Engineer']:
    t_start = time.time()
    upd = client.put('/api/v1/users/me/target-goal', json={'target_role': role, 'target_score': 85}, headers=headers)
    t_upd = time.time() - t_start

    t_dash_start = time.time()
    dash = client.get('/api/v1/users/me/dashboard', headers=headers)
    t_dash = time.time() - t_dash_start
    dj = dash.json()

    t_skills_start = time.time()
    skills = client.get('/api/v1/users/me/skills', headers=headers)
    t_skills = time.time() - t_skills_start
    sj = skills.json()

    print(f"Role [{role}]: upd={t_upd:.3f}s, dash={t_dash:.3f}s (role={dj.get('target_role')}, gap={dj.get('overall_skill_gap')}), skills={t_skills:.3f}s (readiness={sj.get('role_readiness_score')})")

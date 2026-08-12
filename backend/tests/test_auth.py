import os
import tempfile

import pytest
from fastapi.testclient import TestClient

from ..main import app
from ..database import Base, engine

client = TestClient(app)


@pytest.fixture(scope='module', autouse=True)
def create_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_register_login_and_fetch_profile():
    payload = {'name': 'Test User', 'email': 'test@example.com', 'password': 'password123', 'role': 'student'}
    response = client.post('/api/v1/auth/register', json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body['email'] == payload['email']
    assert body['name'] == payload['name']

    login_response = client.post('/api/v1/auth/login', json={'name': 'Test User', 'email': 'test@example.com', 'password': 'password123', 'role': 'student'})
    assert login_response.status_code == 200
    token = login_response.json().get('access_token')
    assert token

    profile_response = client.get('/api/v1/users/me', headers={'Authorization': f'Bearer {token}'})
    assert profile_response.status_code == 200
    profile = profile_response.json()
    assert profile['email'] == payload['email']

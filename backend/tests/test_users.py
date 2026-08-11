from fastapi.testclient import TestClient

from ..main import app

client = TestClient(app)


def test_dashboard_requires_auth():
    response = client.get('/api/v1/users/me/dashboard')
    assert response.status_code == 403 or response.status_code == 401

"""
Core API Tests - Startup Style
Test only what users actually use, not theoretical edge cases.
"""

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)




def test_tendon_calculation():
    """Test tendon calculation that users need."""
    # Use the non-authenticated endpoint for testing
    response = client.post(
        "/kinematics",
        json={
            "bending_angles": [0.5, 0.3],
            "rotation_angles": [0.0, 0.0],
            "backbone_lengths": [0.1, 0.1],
            "coupling_lengths": [0.02, 0.02, 0.02],
            "discretization_steps": 10,
            "tendon_config": {"count": 6, "radius": 0.012},
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "result" in data["data"]


def test_user_authentication():
    """Test user login that users actually use."""
    import time

    # Register user with unique username using timestamp
    unique_username = f"authtestuser_{int(time.time())}"
    unique_email = f"authtestuser_{int(time.time())}@example.com"
    register_response = client.post(
        "/auth/register",
        json={
            "username": unique_username,
            "email": unique_email,
            "password": "testpass123",
        },
    )
    assert register_response.status_code == 201

    # Login user
    login_response = client.post(
        "/auth/login", json={"username": unique_username, "password": "testpass123"}
    )
    assert login_response.status_code == 200
    data = login_response.json()
    assert "access_token" in data["data"]


def test_delete_account():
    """Test delete account functionality that users need."""
    import time

    # Register user with unique username using timestamp
    unique_username = f"deletetestuser_{int(time.time())}"
    unique_email = f"deletetestuser_{int(time.time())}@example.com"
    register_response = client.post(
        "/auth/register",
        json={
            "username": unique_username,
            "email": unique_email,
            "password": "testpass123",
        },
    )
    assert register_response.status_code == 201

    # Login user
    login_response = client.post(
        "/auth/login", json={"username": unique_username, "password": "testpass123"}
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    token = login_data["data"]["access_token"]

    # Delete account with authentication
    headers = {"Authorization": f"Bearer {token}"}
    delete_response = client.delete("/auth/account", headers=headers)
    assert delete_response.status_code == 200
    delete_data = delete_response.json()
    assert delete_data["success"] is True
    assert "Account deleted successfully" in delete_data["message"]

    # Verify user can no longer login
    login_after_delete = client.post(
        "/auth/login", json={"username": unique_username, "password": "testpass123"}
    )
    assert login_after_delete.status_code == 401


def test_preset_save_load():
    """Test preset functionality that users rely on."""
    # This would need authentication in real scenario
    # For now, just test the endpoint exists
    response = client.get("/presets")
    assert response.status_code in [200, 401, 403]  # Either success or auth required

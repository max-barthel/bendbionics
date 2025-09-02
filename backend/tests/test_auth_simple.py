from unittest.mock import patch

from app.auth import (
    create_access_token,
    create_verification_token,
    get_password_hash,
    verify_password,
    verify_token,
)


class TestAuthSimple:
    """Simple tests for authentication functions."""

    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "testpassword"
        hashed = get_password_hash(password)

        result = verify_password(password, hashed)
        assert result is True

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password."""
        password = "testpassword"
        wrong_password = "wrongpassword"
        hashed = get_password_hash(password)

        result = verify_password(wrong_password, hashed)
        assert result is False

    def test_get_password_hash_creates_different_hashes(self):
        """Test that password hashing creates different hashes for same
        password."""
        password = "testpassword"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Hashes should be different (due to salt)
        assert hash1 != hash2

        # But both should verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True

    def test_create_access_token_with_expires_delta(self):
        """Test creating access token with custom expiration."""
        data = {"sub": "testuser", "role": "user"}

        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_access_token_empty_data(self):
        """Test creating access token with empty data."""
        data = {}

        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

    @patch("app.auth.jwt.decode")
    def test_verify_token_valid(self, mock_jwt_decode):
        """Test token verification with valid token."""
        mock_jwt_decode.return_value = {"sub": "testuser"}

        result = verify_token("valid_token")

        assert result is not None
        assert result.username == "testuser"

    @patch("app.auth.jwt.decode")
    def test_verify_token_no_subject(self, mock_jwt_decode):
        """Test token verification with token missing subject."""
        mock_jwt_decode.return_value = {"role": "user"}  # No "sub" field

        result = verify_token("invalid_token")

        assert result is None

    @patch("app.auth.jwt.decode")
    def test_verify_token_jwt_error(self, mock_jwt_decode):
        """Test token verification with JWT error."""
        from jose import JWTError

        mock_jwt_decode.side_effect = JWTError("Invalid token")

        result = verify_token("invalid_token")

        assert result is None

    @patch("app.auth.create_access_token")
    def test_create_verification_token(self, mock_create_access_token):
        """Test creating verification token."""
        mock_create_access_token.return_value = "verification_token"

        result = create_verification_token("test@example.com")

        assert result == "verification_token"
        mock_create_access_token.assert_called_once()

    def test_create_verification_token_different_emails(self):
        """Test that verification tokens are different for different emails."""
        token1 = create_verification_token("user1@example.com")
        token2 = create_verification_token("user2@example.com")

        assert token1 != token2
        assert isinstance(token1, str)
        assert isinstance(token2, str)

    def test_password_hash_verification_roundtrip(self):
        """Test complete password hashing and verification roundtrip."""
        password = "complex_password_123!"

        # Hash the password
        hashed = get_password_hash(password)

        # Verify the password
        is_valid = verify_password(password, hashed)

        assert is_valid is True
        assert hashed != password  # Hash should be different from original

    def test_token_creation_and_verification_roundtrip(self):
        """Test complete token creation and verification roundtrip."""
        data = {"sub": "testuser", "role": "admin"}

        # Create token
        token = create_access_token(data)

        # Verify token
        token_data = verify_token(token)

        assert token_data is not None
        assert token_data.username == "testuser"

    def test_auth_module_imports(self):
        """Test that auth module imports work correctly."""
        # Test that we can import the auth functions and variables
        from app.auth import (
            create_access_token,
            create_verification_token,
            get_password_hash,
            security,
            verify_password,
            verify_token,
        )

        # Test that functions are callable
        assert callable(verify_password)
        assert callable(get_password_hash)
        assert callable(create_access_token)
        assert callable(verify_token)
        assert callable(create_verification_token)

        # Test that security is defined
        assert security is not None

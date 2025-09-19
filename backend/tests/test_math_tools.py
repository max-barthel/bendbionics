import numpy as np

from app.utils.math_tools import (homogeneous_matrix, rotation_matrix_y,
                                  rotation_matrix_z)


class TestMathTools:
    """Test math utility functions."""

    def test_homogeneous_matrix_identity(self):
        """Test creating homogeneous matrix with identity rotation."""
        rotation = np.eye(3)
        translation = np.array([1, 2, 3])

        result = homogeneous_matrix(rotation, translation)

        assert result.shape == (4, 4)
        assert np.array_equal(result[:3, :3], rotation)
        assert np.array_equal(result[:3, 3], translation)
        assert result[3, 3] == 1
        assert result[3, :3].sum() == 0

    def test_homogeneous_matrix_with_rotation(self):
        """Test creating homogeneous matrix with rotation."""
        # Create a 90-degree rotation around Z-axis
        rotation = np.array([[0, -1, 0], [1, 0, 0], [0, 0, 1]])
        translation = np.array([10, 20, 30])

        result = homogeneous_matrix(rotation, translation)

        assert result.shape == (4, 4)
        assert np.array_equal(result[:3, :3], rotation)
        assert np.array_equal(result[:3, 3], translation)
        assert result[3, 3] == 1

    def test_homogeneous_matrix_zero_translation(self):
        """Test creating homogeneous matrix with zero translation."""
        rotation = np.eye(3)
        translation = np.array([0, 0, 0])

        result = homogeneous_matrix(rotation, translation)

        assert result.shape == (4, 4)
        assert np.array_equal(result[:3, :3], rotation)
        assert np.array_equal(result[:3, 3], translation)
        assert result[3, 3] == 1

    def test_rotation_matrix_z_zero_angle(self):
        """Test Z-axis rotation matrix with zero angle."""
        result = rotation_matrix_z(0)

        expected = np.eye(3)
        assert np.array_equal(result, expected)

    def test_rotation_matrix_z_90_degrees(self):
        """Test Z-axis rotation matrix with 90 degrees."""
        result = rotation_matrix_z(np.pi / 2)

        expected = np.array([[0, -1, 0], [1, 0, 0], [0, 0, 1]])
        assert np.allclose(result, expected)

    def test_rotation_matrix_z_180_degrees(self):
        """Test Z-axis rotation matrix with 180 degrees."""
        result = rotation_matrix_z(np.pi)

        expected = np.array([[-1, 0, 0], [0, -1, 0], [0, 0, 1]])
        assert np.allclose(result, expected)

    def test_rotation_matrix_z_360_degrees(self):
        """Test Z-axis rotation matrix with 360 degrees."""
        result = rotation_matrix_z(2 * np.pi)

        expected = np.eye(3)
        assert np.allclose(result, expected)

    def test_rotation_matrix_z_negative_angle(self):
        """Test Z-axis rotation matrix with negative angle."""
        result = rotation_matrix_z(-np.pi / 2)

        expected = np.array([[0, 1, 0], [-1, 0, 0], [0, 0, 1]])
        assert np.allclose(result, expected)

    def test_rotation_matrix_y_zero_angle(self):
        """Test Y-axis rotation matrix with zero angle."""
        result = rotation_matrix_y(0)

        expected = np.eye(3)
        assert np.array_equal(result, expected)

    def test_rotation_matrix_y_90_degrees(self):
        """Test Y-axis rotation matrix with 90 degrees."""
        result = rotation_matrix_y(np.pi / 2)

        expected = np.array([[0, 0, 1], [0, 1, 0], [-1, 0, 0]])
        assert np.allclose(result, expected)

    def test_rotation_matrix_y_180_degrees(self):
        """Test Y-axis rotation matrix with 180 degrees."""
        result = rotation_matrix_y(np.pi)

        expected = np.array([[-1, 0, 0], [0, 1, 0], [0, 0, -1]])
        assert np.allclose(result, expected)

    def test_rotation_matrix_y_360_degrees(self):
        """Test Y-axis rotation matrix with 360 degrees."""
        result = rotation_matrix_y(2 * np.pi)

        expected = np.eye(3)
        assert np.allclose(result, expected)

    def test_rotation_matrix_y_negative_angle(self):
        """Test Y-axis rotation matrix with negative angle."""
        result = rotation_matrix_y(-np.pi / 2)

        expected = np.array([[0, 0, -1], [0, 1, 0], [1, 0, 0]])
        assert np.allclose(result, expected)

    def test_rotation_matrices_orthogonal(self):
        """Test that rotation matrices are orthogonal."""
        angles = [0, np.pi / 4, np.pi / 2, np.pi, 3 * np.pi / 2, 2 * np.pi]

        for angle in angles:
            # Test Z-axis rotation
            R_z = rotation_matrix_z(angle)
            assert np.allclose(R_z @ R_z.T, np.eye(3))
            assert np.allclose(np.linalg.det(R_z), 1.0)

            # Test Y-axis rotation
            R_y = rotation_matrix_y(angle)
            assert np.allclose(R_y @ R_y.T, np.eye(3))
            assert np.allclose(np.linalg.det(R_y), 1.0)

    def test_homogeneous_matrix_combined_rotation(self):
        """Test homogeneous matrix with combined rotation and translation."""
        # Create a rotation matrix (45 degrees around Z)
        angle = np.pi / 4
        rotation = rotation_matrix_z(angle)
        translation = np.array([5, 10, 15])

        result = homogeneous_matrix(rotation, translation)

        # Verify structure
        assert result.shape == (4, 4)
        assert np.array_equal(result[:3, :3], rotation)
        assert np.array_equal(result[:3, 3], translation)
        assert result[3, 3] == 1
        assert result[3, :3].sum() == 0

        # Verify that it's a valid transformation matrix
        # (determinant should be 1 for proper transformations)
        assert np.allclose(np.linalg.det(result), 1.0)

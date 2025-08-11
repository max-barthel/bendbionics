import numpy as np
from app.utils.geometry_tools import extract_xyz_coordinates


class TestGeometryTools:
    """Test cases for geometry tools."""

    def test_extract_xyz_coordinates_single_segment(self):
        """Test extracting XYZ coordinates from a single segment."""
        # Create a simple transformation matrix
        T1 = np.array([[1, 0, 0, 1], [0, 1, 0, 2], [0, 0, 1, 3], [0, 0, 0, 1]])
        T2 = np.array([[1, 0, 0, 4], [0, 1, 0, 5], [0, 0, 1, 6], [0, 0, 0, 1]])

        T_all = [[T1, T2]]

        result = extract_xyz_coordinates(T_all)

        assert len(result) == 1
        assert len(result[0]) == 2
        assert result[0][0] == [1.0, 2.0, 3.0]
        assert result[0][1] == [4.0, 5.0, 6.0]

    def test_extract_xyz_coordinates_multiple_segments(self):
        """Test extracting XYZ coordinates from multiple segments."""
        # Create transformation matrices for two segments
        T1 = np.array([[1, 0, 0, 1], [0, 1, 0, 2], [0, 0, 1, 3], [0, 0, 0, 1]])
        T2 = np.array([[1, 0, 0, 4], [0, 1, 0, 5], [0, 0, 1, 6], [0, 0, 0, 1]])
        T3 = np.array([[1, 0, 0, 7], [0, 1, 0, 8], [0, 0, 1, 9], [0, 0, 0, 1]])

        T_all = [[T1, T2], [T3]]

        result = extract_xyz_coordinates(T_all)

        assert len(result) == 2
        assert len(result[0]) == 2
        assert len(result[1]) == 1
        assert result[0][0] == [1.0, 2.0, 3.0]
        assert result[0][1] == [4.0, 5.0, 6.0]
        assert result[1][0] == [7.0, 8.0, 9.0]

    def test_extract_xyz_coordinates_with_rotation(self):
        """
        Test extracting XYZ coordinates from
        transformation matrices with rotation.
        """
        # Create a transformation matrix with rotation
        T = np.array(
            [
                [0, -1, 0, 10],
                [1, 0, 0, 20],
                [0, 0, 1, 30],
                [0, 0, 0, 1],
            ]
        )

        T_all = [[T]]

        result = extract_xyz_coordinates(T_all)

        assert len(result) == 1
        assert len(result[0]) == 1
        assert result[0][0] == [10.0, 20.0, 30.0]

    def test_extract_xyz_coordinates_empty_segment(self):
        """Test extracting XYZ coordinates from an empty segment."""
        T_all = [[]]

        result = extract_xyz_coordinates(T_all)

        assert len(result) == 1
        assert len(result[0]) == 0

    def test_extract_xyz_coordinates_empty_list(self):
        """Test extracting XYZ coordinates from an empty list."""
        T_all = []

        result = extract_xyz_coordinates(T_all)

        assert len(result) == 0

    def test_extract_xyz_coordinates_identity_matrix(self):
        """
        Test extracting XYZ coordinates from identity transformation matrices.
        """
        T = np.eye(4)
        T[0:3, 3] = [0, 0, 0]  # Set translation to zero

        T_all = [[T]]

        result = extract_xyz_coordinates(T_all)

        assert len(result) == 1
        assert len(result[0]) == 1
        assert result[0][0] == [0.0, 0.0, 0.0]

    def test_extract_xyz_coordinates_large_translation(self):
        """Test extracting XYZ coordinates with large translation values."""
        T = np.array(
            [
                [1, 0, 0, 1000.5],
                [0, 1, 0, -500.25],
                [0, 0, 1, 750.75],
                [0, 0, 0, 1],
            ]
        )

        T_all = [[T]]

        result = extract_xyz_coordinates(T_all)

        assert len(result) == 1
        assert len(result[0]) == 1
        assert result[0][0] == [1000.5, -500.25, 750.75]

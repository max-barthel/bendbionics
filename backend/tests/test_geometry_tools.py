import numpy as np
from app.utils.geometry_tools import extract_xyz_coordinates


class TestGeometryTools:
    """Test geometry utility functions."""

    def test_extract_xyz_coordinates_single_segment(self):
        """Test extracting XYZ coordinates from a single segment."""
        # Create a single segment with 2 transformation matrices
        T_all = [
            [
                np.array([
                    [1, 0, 0, 0],  # Identity matrix at origin
                    [0, 1, 0, 0],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]
                ]),
                np.array([
                    [1, 0, 0, 1],  # Translated by 1 in x
                    [0, 1, 0, 2],  # Translated by 2 in y
                    [0, 0, 1, 3],  # Translated by 3 in z
                    [0, 0, 0, 1]
                ])
            ]
        ]

        result = extract_xyz_coordinates(T_all)

        assert len(result) == 1  # One segment
        assert len(result[0]) == 2  # Two points in the segment

        # Check first point (origin)
        assert result[0][0] == [0, 0, 0]

        # Check second point (translated)
        assert result[0][1] == [1, 2, 3]

    def test_extract_xyz_coordinates_multiple_segments(self):
        """Test extracting XYZ coordinates from multiple segments."""
        # Create two segments
        T_all = [
            [  # First segment
                np.array([
                    [1, 0, 0, 0],
                    [0, 1, 0, 0],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]
                ]),
                np.array([
                    [1, 0, 0, 1],
                    [0, 1, 0, 0],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]
                ])
            ],
            [  # Second segment
                np.array([
                    [1, 0, 0, 2],
                    [0, 1, 0, 0],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]
                ]),
                np.array([
                    [1, 0, 0, 3],
                    [0, 1, 0, 1],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]
                ])
            ]
        ]

        result = extract_xyz_coordinates(T_all)

        assert len(result) == 2  # Two segments

        # Check first segment
        assert len(result[0]) == 2
        assert result[0][0] == [0, 0, 0]
        assert result[0][1] == [1, 0, 0]

        # Check second segment
        assert len(result[1]) == 2
        assert result[1][0] == [2, 0, 0]
        assert result[1][1] == [3, 1, 0]

    def test_extract_xyz_coordinates_empty_segment(self):
        """Test extracting XYZ coordinates from empty segment."""
        T_all = [[]]  # Empty segment

        result = extract_xyz_coordinates(T_all)

        assert len(result) == 1
        assert len(result[0]) == 0

    def test_extract_xyz_coordinates_rotation_and_translation(self):
        """Test extracting XYZ coordinates with rotation and translation."""
        # Create a transformation matrix with rotation and translation
        angle = np.pi / 4  # 45 degrees
        cos_a = np.cos(angle)
        sin_a = np.sin(angle)

        T_all = [
            [
                np.array([
                    [cos_a, -sin_a, 0, 1],  # Rotated and translated
                    [sin_a, cos_a, 0, 2],
                    [0, 0, 1, 3],
                    [0, 0, 0, 1]
                ])
            ]
        ]

        result = extract_xyz_coordinates(T_all)

        assert len(result) == 1
        assert len(result[0]) == 1

        # Check that translation part is extracted correctly
        # (rotation doesn't affect the translation vector)
        expected_x, expected_y, expected_z = 1, 2, 3
        actual_x, actual_y, actual_z = result[0][0]

        assert actual_x == expected_x
        assert actual_y == expected_y
        assert actual_z == expected_z

    def test_extract_xyz_coordinates_complex_transformation(self):
        """Test extracting XYZ coordinates from complex transformation."""
        # Create a more complex transformation matrix
        T_all = [
            [
                np.array([
                    [0.7071, -0.7071, 0, 10.5],  # 45° rotation + translation
                    [0.7071, 0.7071, 0, -5.2],
                    [0, 0, 1, 100.0],
                    [0, 0, 0, 1]
                ]),
                np.array([
                    [1, 0, 0, 0],  # Identity matrix
                    [0, 1, 0, 0],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]
                ])
            ]
        ]

        result = extract_xyz_coordinates(T_all)

        assert len(result) == 1
        assert len(result[0]) == 2

        # Check first point (translated)
        assert result[0][0] == [10.5, -5.2, 100.0]

        # Check second point (origin)
        assert result[0][1] == [0, 0, 0]

    def test_extract_xyz_coordinates_data_types(self):
        """Test that the function returns correct data types."""
        T_all = [
            [
                np.array([
                    [1, 0, 0, 1.5],
                    [0, 1, 0, 2.7],
                    [0, 0, 1, 3.9],
                    [0, 0, 0, 1]
                ])
            ]
        ]

        result = extract_xyz_coordinates(T_all)

        # Check that result is a list of lists of lists
        assert isinstance(result, list)
        assert isinstance(result[0], list)
        assert isinstance(result[0][0], list)

        # Check that coordinates are floats
        x, y, z = result[0][0]
        assert isinstance(x, float)
        assert isinstance(y, float)
        assert isinstance(z, float)

        # Check values
        assert x == 1.5
        assert y == 2.7
        assert z == 3.9

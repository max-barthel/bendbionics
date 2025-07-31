import math

import numpy as np


class PCC:
    """Piecewise Constant Curvature (PCC) model for the TDCR."""

    # Functions
    # -----------------------------------------------------------
    # Homogeneous matrix definition
    def homogeneous_matrix(rotation_matrix, translation_vector):
        # Create a 4x4 identity matrix
        transformation_matrix = np.eye(4)

        # Set the upper-left 3x3 part to the rotation matrix
        transformation_matrix[:3, :3] = rotation_matrix

        # Set the upper-right 3x1 part to the translation vector
        transformation_matrix[:3, 3] = translation_vector

        return transformation_matrix

    # Transformation matrix of coupling elements.
    def transformation_matrix_coupling_element(
        length_coupling_element, homogeneous_matrix
    ):

        # Homogeneous rotation matrix.
        rotation_matrix = np.eye(3)

        # Translation vector length in z axis.
        translation_vector = [0, 0, length_coupling_element]

        # Transformation matrix of a coupling element.
        transformation_matrix_coupling_element = homogeneous_matrix(
            rotation_matrix, translation_vector
        )

        # Convert to (1, 4, 4) array.
        transformation_matrix_coupling_element = np.expand_dims(
            transformation_matrix_coupling_element, axis=0
        )

        return transformation_matrix_coupling_element

    # Transformation matrix of i-th backbone piece for plotting.
    def transformation_matrix_backbone(
        bending_angle_theta,
        turning_angle_phi,
        length_backbone,
        discretization_points_backbone,
    ):

        # Discretization of the backbone from 0 to length_backbone
        length_backbone = np.linspace(
            0, length_backbone, discretization_points_backbone
        )

        # Discretization of the bending angle from 0 to bending_angle_theta
        bending_angle_theta = np.linspace(
            0, bending_angle_theta, discretization_points_backbone
        )

        # Initializing transformation matrix
        transformation_matrix_backbone = np.zeros(
            (discretization_points_backbone, 4, 4)
        )

        for index in range(discretization_points_backbone):

            index_bending_angle = bending_angle_theta[index]
            index_length = length_backbone[index]

            # Rotation matrix around Z depending on turning_angle_phi_i.
            rotation_matrix_z = np.array(
                [
                    [
                        math.cos(turning_angle_phi),
                        -math.sin(turning_angle_phi),
                        0,
                    ],
                    [
                        math.sin(turning_angle_phi),
                        math.cos(turning_angle_phi),
                        0,
                    ],
                    [0, 0, 1],
                ]
            )

            # Rotation matrix around Z depending on -turning_angle_phi_i
            rotation_matrix_minus_z = np.array(
                [
                    [
                        math.cos(-turning_angle_phi),
                        -math.sin(-turning_angle_phi),
                        0,
                    ],
                    [
                        math.sin(-turning_angle_phi),
                        math.cos(-turning_angle_phi),
                        0,
                    ],
                    [0, 0, 1],
                ]
            )

            # Rotation matrix around Y depending on index_bending_angle
            rotation_matrix_y = np.array(
                [
                    [
                        math.cos(index_bending_angle),
                        0,
                        math.sin(index_bending_angle),
                    ],
                    [0, 1, 0],
                    [
                        -math.sin(index_bending_angle),
                        0,
                        math.cos(index_bending_angle),
                    ],
                ]
            )

            # Rotation matrix of backbone
            rotation_matrix = (
                rotation_matrix_z @ rotation_matrix_y @ rotation_matrix_minus_z
            )

            # Translation vector of backbone
            if index_bending_angle == 0:
                translation_vector = np.array([0, 0, index_length])
            else:
                translation_vector = (
                    index_length / index_bending_angle
                ) * np.array(
                    [
                        math.cos(turning_angle_phi)
                        * (1 - math.cos(index_bending_angle)),
                        math.sin(turning_angle_phi)
                        * (1 - math.cos(index_bending_angle)),
                        math.sin(index_bending_angle),
                    ]
                )

            # Transformation matrix of backbone in vector form
            transformation_matrix_backbone[index] = homogeneous_matrix(
                rotation_matrix, translation_vector
            )

        return transformation_matrix_backbone

    # Coupling of the backbone transformation matrix and the coupling element.
    def couple(
        lower_transformation_matrix,
        upper_transformation_matrix,
        discretization_points,
    ):

        # Tip transformation matrix of the backbone
        # with check for more than one 4x4 matrix.
        if lower_transformation_matrix.shape[0] > 1:
            tip_transformation = lower_transformation_matrix[-1, :, :]
        else:
            tip_transformation = lower_transformation_matrix[0, :, :]

        # Initializing coupled transformation matrix.
        coupled_transformation = np.zeros((discretization_points, 4, 4))

        # Coupling of the backbone transformation matrix and the coupling element.
        for discretization in range(discretization_points):
            coupled_transformation[discretization] = (
                tip_transformation
                @ upper_transformation_matrix[discretization]
            )

        return coupled_transformation

    # Function calls
    # -----------------------------------------------------------

    # Number of building blocks
    number_building_blocks = len(length_backbone) + len(
        length_coupling_element
    )
    list_building_blocks = list(range(number_building_blocks))

    first_couple = transformation_matrix_coupling_element(
        length_coupling_element[0], homogeneous_matrix
    )
    print("1:", first_couple)
    second_couple = couple(
        first_couple,
        transformation_matrix_backbone(
            bending_angle_theta[0],
            turning_angle_phi[0],
            length_backbone[0],
            discretization_points_backbone,
        ),
        discretization_points_backbone,
    )
    print("2:", second_couple)
    third_couple = couple(
        second_couple,
        transformation_matrix_coupling_element(
            length_coupling_element[1], homogeneous_matrix
        ),
        1,
    )
    print("3:", third_couple)
    fourth_couple = couple(
        third_couple,
        transformation_matrix_backbone(
            bending_angle_theta[1],
            turning_angle_phi[1],
            length_backbone[1],
            discretization_points_backbone,
        ),
        discretization_points_backbone,
    )
    print("4:", fourth_couple)
    fifth_couple = couple(
        fourth_couple,
        transformation_matrix_coupling_element(
            length_coupling_element[2], homogeneous_matrix
        ),
        1,
    )
    print("5:", fifth_couple)
    sixth_couple = couple(
        fifth_couple,
        transformation_matrix_backbone(
            bending_angle_theta[2],
            turning_angle_phi[2],
            length_backbone[2],
            discretization_points_backbone,
        ),
        discretization_points_backbone,
    )
    print("6:", sixth_couple)
    seventh_couple = couple(
        sixth_couple,
        transformation_matrix_coupling_element(
            length_coupling_element[3], homogeneous_matrix
        ),
        1,
    )
    print("7:", seventh_couple)

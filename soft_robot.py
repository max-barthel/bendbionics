# Digital twin of a TDCR (Tendum Driven Continuum Robot) with kin. PCC model

import math

import numpy as np

# Input parameters
# -----------------------------------------------------------
# Matrix values from robot base to tip
bending_angle_theta = [
    math.radians(20.5),
    math.radians(36),
    math.radians(36),
]  # in [deg]
turning_angle_phi = [
    math.radians(60),
    math.radians(60),
    math.radians(60),
]  # in [deg] (from x-axis)
length_backbone = [70 * 10**-3, 70 * 10**-3, 70 * 10**-3]  # in [mm]
radius_backbone = [2, 2, 2]  # in [mm]
discretization_points_backbone = 5  # Discretization points of the backbone
length_coupling_element = [
    30 * 10**-3,
    30 * 10**-3,
    30 * 10**-3,
    15 * 10**-3,
]  # in [mm]
toggle_coupling_element = False  # between body/line
radius_coupling_element = [
    25 * 10**-3,
    21 * 10**-3,
    17 * 10**-3,
]  # Coupling element radii in [mm]
discretization_points_cylinder = (
    1000  # Number of points for the cylinders of the coupling elements
)
toggle_tendons = True
tendon_number = 3
tendon_distance = [30 * 10**-3, 30 * 10**-3, 30 * 10**-3, 30]  # in [mm]


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


# Transformation matrix of Coupling Elements
def transformation_matrix_coupling_element(length_coupling_element, homogeneous_matrix):

    # Homogeneous rotation matrix
    rotation_matrix = np.eye(3)

    # Translation vector length in z axis
    translation_vector = [0, 0, length_coupling_element]

    # Transformation matrix of a coupling element
    transformation_matrix_coupling_element = homogeneous_matrix(
        rotation_matrix, translation_vector
    )

    # Convert to (1, 4, 4) array
    transformation_matrix_coupling_element = np.expand_dims(
        transformation_matrix_coupling_element, axis=0
    )

    return transformation_matrix_coupling_element


# Transformationsmartix des i-ten Teil des Backbones für Ploting
def transformation_matarix_backbone(
    bending_angle_theta,
    turning_angle_phi,
    length_backbone,
    discretization_points_backbone,
):

    # Discretization of the backbone from 0 to length_backbone
    length_backbone = np.linspace(0, length_backbone, discretization_points_backbone)

    # Discretization of the bending angle from 0 to bending_angle_theta
    bending_angle_theta = np.linspace(
        0, bending_angle_theta, discretization_points_backbone
    )

    # Initializing transformation matrix
    transformation_matrix_backbone = np.zeros((discretization_points_backbone, 4, 4))

    for index in range(discretization_points_backbone):

        index_bending_angle = bending_angle_theta[index]
        index_length = length_backbone[index]

        # Rotation matrix around Z depeinding on turning_angle_phi_i
        rotation_matrix_z = np.array(
            [
                [math.cos(turning_angle_phi), -math.sin(turning_angle_phi), 0],
                [math.sin(turning_angle_phi), math.cos(turning_angle_phi), 0],
                [0, 0, 1],
            ]
        )

        # Rotation matrix around Z depending on -turning_angle_phi_i
        rotation_matrix_minus_z = np.array(
            [
                [math.cos(-turning_angle_phi), -math.sin(-turning_angle_phi), 0],
                [math.sin(-turning_angle_phi), math.cos(-turning_angle_phi), 0],
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
                [-math.sin(index_bending_angle), 0, math.cos(index_bending_angle)],
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
            translation_vector = (index_length / index_bending_angle) * np.array(
                [
                    math.cos(turning_angle_phi) * (1 - math.cos(index_bending_angle)),
                    math.sin(turning_angle_phi) * (1 - math.cos(index_bending_angle)),
                    math.sin(index_bending_angle),
                ]
            )

        # Transformation matrix of backbone in vector form
        transformation_matrix_backbone[index] = homogeneous_matrix(
            rotation_matrix, translation_vector
        )

    return transformation_matrix_backbone


# Coupling of the Transformation matrix of the backbone and the coupling element
def couple(
    lower_transformation_matrix, upper_transformation_matrix, discretization_points
):

    # Tip transformation matrix of the backbone with check for more than one 4x4 matrix
    if lower_transformation_matrix.shape[0] > 1:
        tip_transformation = lower_transformation_matrix[-1, :, :]
    else:
        tip_transformation = lower_transformation_matrix[0, :, :]

    # Initializing coupled transformation matrix
    coupled_transformation = np.zeros((discretization_points, 4, 4))

    # Coupling of the transformation matrix of the backbone and the coupling element
    for discretization in range(discretization_points):
        coupled_transformation[discretization] = (
            tip_transformation @ upper_transformation_matrix[discretization]
        )

    return coupled_transformation


# Transformationsmatrizen der Seilführungen am Kopplungselement
# function T_sf = trans_mat_sf(T_ke_sf, tendon_distance, tendon_number)
#    bending_angle_theta = linspace(0, 4*pi/tendon_number, tendon_number);
#    x = tendon_distance * cos(bending_angle_theta);
#    y = tendon_distance * sin(bending_angle_theta);
#    T_sf = cell(1, tendon_number);
#    for i = 1:tendon_number
#    T_sf{i} = T_ke_sf * [1, 0, 0, x(:,i);...
#                         0, 1, 0, y(:,i);...
#                         0, 0, 1, 0;...
#                         0, 0, 0, 1];
#    end
# end

# Generiert den Zylinder der Backbones
# function [cylinder] = cylinder_coords(radius, discretization_points_cylinder, T_ke_u,
# T_ke_o)
#    bending_angle_theta = linspace(0, 2*pi, discretization_points_cylinder);
#    x = radius * cos(bending_angle_theta);
#    y = radius * sin(bending_angle_theta);
#    cylinder = cell(1,2);
#    for i = 1:discretization_points_cylinder
#        T_circle_u = T_ke_u * [1, 0, 0, x(1,i);...
#                       0, 1, 0, y(1,i);...
#                       0, 0, 1, 0;...
#                       0, 0, 0, 1];
#        T_circle_o = T_ke_o * [1, 0, 0, x(1,i);...
#                       0, 1, 0, y(1,i);...
#                       0, 0, 1, 0;...
#                       0, 0, 0, 1];
# #Kreis unten
#        cylinder{1}(:,i) = [T_circle_u(1,4); T_circle_u(2,4); T_circle_u(3,4)];
#        cylinder{2}(:,i) = [T_circle_o(1,4); T_circle_o(2,4); T_circle_o(3,4)];
# end

# Function calls
# -----------------------------------------------------------

# Number of building blocks
number_building_blocks = len(length_backbone) + len(length_coupling_element)
list_building_blocks = list(range(number_building_blocks))

first_couple = transformation_matrix_coupling_element(
    length_coupling_element[0], homogeneous_matrix
)
print("1:", first_couple)
second_couple = couple(
    first_couple,
    transformation_matarix_backbone(
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
    transformation_matarix_backbone(
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
    transformation_matarix_backbone(
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

# Cable guide points
# T_sf1 = trans_mat_sf(T_ke1_sf, tendon_distance(1), tendon_number);
# T_sf2 = trans_mat_sf(T_ke2_sf_c, tendon_distance(2), tendon_number);
# T_sf3 = trans_mat_sf(T_ke3_sf_c, tendon_distance(3), tendon_number);
# T_sf4 = trans_mat_sf(T_ke4_c, tendon_distance(4), tendon_number);

# Cable lengths
# l_sf_start =length_backbone(1) + length_coupling_element(2);
# l_sf_end11 = norm(T_sf2{1}(1:3, 4) - T_sf1{1}(1:3, 4));   # Cable 1 segment 1
# l_sf_end12 = norm(T_sf3{1}(1:3, 4) - T_sf2{1}(1:3, 4));   # Cable 1 segment 2
# l_sf_end13 = norm(T_sf4{1}(1:3, 4) - T_sf3{1}(1:3, 4));   # Cable 1 segment 3
# l_sf_end21 = norm(T_sf2{2}(1:3, 4) - T_sf1{2}(1:3, 4));   # Cable 2 segment 1
# l_sf_end22 = norm(T_sf3{2}(1:3, 4) - T_sf2{2}(1:3, 4));   # Cable 2 segment 2
# l_sf_end23 = norm(T_sf4{2}(1:3, 4) - T_sf3{2}(1:3, 4));   # Cable 2 segment 3
# l_sf_end31 = norm(T_sf2{3}(1:3, 4) - T_sf1{3}(1:3, 4));   # Cable 3 segment 1
# l_sf_end32 = norm(T_sf3{3}(1:3, 4) - T_sf2{3}(1:3, 4));   # Cable 3 segment 2
# l_sf_end33 = norm(T_sf4{3}(1:3, 4) - T_sf3{3}(1:3, 4));   # Cable 3 segment 3

# Cable length changes
# delta_l_sf11 = l_sf_start - l_sf_end11;
# delta_l_sf12 = l_sf_start - l_sf_end12;
# delta_l_sf13 = l_sf_start - l_sf_end13;
# delta_l_sf21 = l_sf_start - l_sf_end21;
# delta_l_sf22 = l_sf_start - l_sf_end22;
# delta_l_sf23 = l_sf_start - l_sf_end23;
# delta_l_sf31 = l_sf_start - l_sf_end31;
# delta_l_sf32 = l_sf_start - l_sf_end32;
# delta_l_sf33 = l_sf_start - l_sf_end33;

# Spatial coordinates for the cylinders of the coupling elements
# [cylinder1] = cylinder_coords(radius_coupling_element(1),
# discretization_points_cylinder, [1,0,0,0;0,1,0,0;0,0,1,0;0,0,0,1], T_ke1);
# [cylinder2] = cylinder_coords(radius_coupling_element(1),
# discretization_points_cylinder, T_bb1_c_tip, T_ke2_sf_c);
# [cylinder3] = cylinder_coords(radius_coupling_element(2),
# discretization_points_cylinder, T_ke2_sf_c, T_ke2_c);
# [cylinder4] = cylinder_coords(radius_coupling_element(2),
# discretization_points_cylinder, T_bb2_c_tip, T_ke3_sf_c);
# [cylinder5] = cylinder_coords(radius_coupling_element(3),
# discretization_points_cylinder, T_ke3_sf_c, T_ke3_c);
# [cylinder6] = cylinder_coords(radius_coupling_element(3),
# discretization_points_cylinder, T_bb3_c_tip, T_ke4_c);

# Plotting the TDCR
# -----------------------------------------------------------

# figure;
# hold on;

# Plottet die Koppelelemente
# grey = [0.5, 0.5, 0.5];

# if toggle_coupling_element

# Plotet die Koppelelemente als Volumenkörper
#    p1 = fill3(cylinder1{1}(1,:), cylinder1{1}(2,:), cylinder1{1}(3,:),
# grey);  # Bottom cap
#    fill3(cylinder1{2}(1,:), cylinder1{2}(2,:), cylinder1{2}(3,:), grey);  # Top cap
#    fill3(cylinder2{1}(1,:), cylinder2{1}(2,:), cylinder2{1}(3,:), grey);  # Bottom cap
#    fill3(cylinder2{2}(1,:), cylinder2{2}(2,:), cylinder2{2}(3,:), grey);  # Top cap
#    fill3(cylinder3{1}(1,:), cylinder3{1}(2,:), cylinder3{1}(3,:), grey);  # Bottom cap
#    fill3(cylinder3{2}(1,:), cylinder3{2}(2,:), cylinder3{2}(3,:), grey);  # Top cap
#    fill3(cylinder4{1}(1,:), cylinder4{1}(2,:), cylinder4{1}(3,:), grey);  # Bottom cap
#    fill3(cylinder4{2}(1,:), cylinder4{2}(2,:), cylinder4{2}(3,:), grey);  # Top cap
#    fill3(cylinder5{1}(1,:), cylinder5{1}(2,:), cylinder5{1}(3,:), grey);  # Bottom cap
#    fill3(cylinder5{2}(1,:), cylinder5{2}(2,:), cylinder5{2}(3,:), grey);  # Top cap
#    fill3(cylinder6{1}(1,:), cylinder6{1}(2,:), cylinder6{1}(3,:), grey);  # Bottom cap
#    fill3(cylinder6{2}(1,:), cylinder6{2}(2,:), cylinder6{2}(3,:), grey);  # Top cap

#    surf([cylinder1{1}(1,:); cylinder1{2}(1,:)], [cylinder1{1}(2,:);
# cylinder1{2}(2,:)], [cylinder1{1}(3,:); cylinder1{2}(3,:)], 'FaceColor', grey,
# 'EdgeColor', 'none')
#    surf([cylinder2{1}(1,:); cylinder2{2}(1,:)], [cylinder2{1}(2,:);
# cylinder2{2}(2,:)], [cylinder2{1}(3,:); cylinder2{2}(3,:)], 'FaceColor', grey,
# 'EdgeColor', 'none')
#    surf([cylinder3{1}(1,:); cylinder3{2}(1,:)], [cylinder3{1}(2,:);
# cylinder3{2}(2,:)], [cylinder3{1}(3,:); cylinder3{2}(3,:)], 'FaceColor', grey,
# 'EdgeColor', 'none')
#    surf([cylinder4{1}(1,:); cylinder4{2}(1,:)], [cylinder4{1}(2,:);
# cylinder4{2}(2,:)], [cylinder4{1}(3,:); cylinder4{2}(3,:)], 'FaceColor', grey,
# 'EdgeColor', 'none')
#    surf([cylinder5{1}(1,:); cylinder5{2}(1,:)], [cylinder5{1}(2,:);
# cylinder5{2}(2,:)], [cylinder5{1}(3,:); cylinder5{2}(3,:)], 'FaceColor', grey,
# 'EdgeColor', 'none')
#    surf([cylinder6{1}(1,:); cylinder6{2}(1,:)], [cylinder6{1}(2,:);
# cylinder6{2}(2,:)], [cylinder6{1}(3,:); cylinder6{2}(3,:)], 'FaceColor', grey,
# 'EdgeColor', 'none')
# else

# Plotet die Prüfpunkte
#    plot3(T_ke1(1,4),T_ke1(2,4),T_ke1(3,4), 'index.', 'LineWidth', 2, 'MarkerSize',
# 14); # KE1
#    plot3(T_bb1_c_tip(1,4),T_bb1_c_tip(2,4),T_bb1_c_tip(3,4), 'index.', 'LineWidth',
# 2, 'MarkerSize', 14); # BB1
#    plot3(T_ke2_c(1,4),T_ke2_c(2,4),T_ke2_c(3,4), 'index.', 'LineWidth', 2,
# 'MarkerSize', 14); # KE2
#    plot3(T_bb2_c_tip(1,4),T_bb2_c_tip(2,4),T_bb2_c_tip(3,4), 'index.', 'LineWidth',
# 2, 'MarkerSize', 14); # BB2
#    plot3(T_ke3_c(1,4),T_ke3_c(2,4),T_ke3_c(3,4), 'index.', 'LineWidth', 2,
# 'MarkerSize', 14); # KE3
#    plot3(T_bb3_c_tip(1,4),T_bb3_c_tip(2,4),T_bb3_c_tip(3,4), 'index.', 'LineWidth',
# 2, 'MarkerSize', 14); # BB3
#    plot3(T_ke4_c(1,4),T_ke4_c(2,4),T_ke4_c(3,4), 'index.', 'LineWidth', 2,
# 'MarkerSize', 14); # KE4


# Plotet die Koppelelemente als Linie
#    p1 = plot3([0, T_ke1(1,4)], [0, T_ke1(2,4)], [0, T_ke1(3,4)], 'Color', grey,
# 'LineWidth', 2); # KE1
#    plot3([T_bb1_c_tip(1,4), T_ke2_c(1,4)], [T_bb1_c_tip(2,4), T_ke2_c(2,4)],
# [T_bb1_c_tip(3,4), T_ke2_c(3,4)], 'Color', grey, 'LineWidth', 2); # KE2
#    plot3([T_bb2_c_tip(1,4), T_ke3_c(1,4)], [T_bb2_c_tip(2,4), T_ke3_c(2,4)],
# [T_bb2_c_tip(3,4), T_ke3_c(3,4)], 'Color', grey, 'LineWidth', 2); # KE3
#    plot3([T_bb3_c_tip(1,4), T_ke4_c(1,4)], [T_bb3_c_tip(2,4), T_ke4_c(2,4)],
# [T_bb3_c_tip(3,4), T_ke4_c(3,4)], 'Color', grey, 'LineWidth', 2); # KE4

# end

# Plotet das Backbone des Roboters
# p2 = plot3(T_bb1_c(:,13),T_bb1_c(:,14),T_bb1_c(:,15), 'index-', 'LineWidth', 2); # BB1
# plot3(T_bb2_c(:,13),T_bb2_c(:,14),T_bb2_c(:,15), 'index-', 'LineWidth', 2);   # BB2
# plot3(T_bb3_c(:,13),T_bb3_c(:,14),T_bb3_c(:,15), 'index-', 'LineWidth', 2);   # BB3

# if toggle_tendons
# Plotet die Seilführungspunkte
#    plot3(T_sf1{1}(1,4),T_sf1{1}(2,4),T_sf1{1}(3,4), 'r.', 'LineWidth', 2,
# 'MarkerSize', 14); # SF11
#    plot3(T_sf1{2}(1,4),T_sf1{2}(2,4),T_sf1{2}(3,4), 'b.', 'LineWidth', 2,
# 'MarkerSize', 14); # SF12
#    plot3(T_sf1{3}(1,4),T_sf1{3}(2,4),T_sf1{3}(3,4), 'g.', 'LineWidth', 2,
# 'MarkerSize', 14); # SF12
#    plot3(T_sf2{1}(1,4),T_sf2{1}(2,4),T_sf2{1}(3,4), 'r.', 'LineWidth', 2,
# 'MarkerSize', 14); # SF21
#    plot3(T_sf2{2}(1,4),T_sf2{2}(2,4),T_sf2{2}(3,4), 'b.', 'LineWidth', 2,
# 'MarkerSize', 14); # SF22
#    plot3(T_sf2{3}(1,4),T_sf2{3}(2,4),T_sf2{3}(3,4), 'g.', 'LineWidth', 2,
# 'MarkerSize', 14); # SF22
#    plot3(T_sf3{1}(1,4),T_sf3{1}(2,4),T_sf3{1}(3,4), 'r.', 'LineWidth', 2,
# 'MarkerSize', 14); # SF31
#    plot3(T_sf3{2}(1,4),T_sf3{2}(2,4),T_sf3{2}(3,4), 'b.', 'LineWidth', 2,
# 'MarkerSize', 14); # SF32
#    plot3(T_sf3{3}(1,4),T_sf3{3}(2,4),T_sf3{3}(3,4), 'g.', 'LineWidth', 2,
# 'MarkerSize', 14); # SF32
#   plot3(T_sf4{1}(1,4),T_sf4{1}(2,4),T_sf4{1}(3,4), 'r.', 'LineWidth', 2,
# 'MarkerSize', 14); # SF41
#    plot3(T_sf4{2}(1,4),T_sf4{2}(2,4),T_sf4{2}(3,4), 'b.', 'LineWidth', 2,
# 'MarkerSize', 14); # SF42
#    plot3(T_sf4{3}(1,4),T_sf4{3}(2,4),T_sf4{3}(3,4), 'g.', 'LineWidth', 2,
# 'MarkerSize', 14); # SF42

# Plotet die Seile
#    p3 = plot3([tendon_distance(1), T_sf1{1}(1,4), T_sf2{1}(1,4), T_sf3{1}(1,4),
# T_sf4{1}(1,4)], [0, T_sf1{1}(2,4), T_sf2{1}(2,4), T_sf3{1}(2,4), T_sf4{1}(2,4)],
# [0, T_sf1{1}(3,4), T_sf2{1}(3,4), T_sf3{1}(3,4), T_sf4{1}(3,4)], 'r-', 'LineWidth',
# 2); # Seil 1
#    p4 = plot3([-0.015, T_sf1{2}(1,4), T_sf2{2}(1,4), T_sf3{2}(1,4), T_sf4{2}(1,4)],
# [0.025981, T_sf1{2}(2,4), T_sf2{2}(2,4), T_sf3{2}(2,4), T_sf4{2}(2,4)],
# [0, T_sf1{2}(3,4), T_sf2{2}(3,4), T_sf3{2}(3,4), T_sf4{2}(3,4)], 'b-',
# 'LineWidth', 2); # Seil 2
#    p5= plot3([-0.015, T_sf1{3}(1,4), T_sf2{3}(1,4), T_sf3{3}(1,4), T_sf4{3}(1,4)],
# [-0.025981, T_sf1{3}(2,4), T_sf2{3}(2,4), T_sf3{3}(2,4), T_sf4{3}(2,4)],
# [0, T_sf1{3}(3,4), T_sf2{3}(3,4), T_sf3{3}(3,4), T_sf4{3}(3,4)], 'g-', 'LineWidth',
# 2); # Seil 3

# end

# Bodenplatte
# light_grey = [1 1 1]*0.9;
# squaresize = 0.04;
# fill3([1 1 -1 -1]*squaresize,[-1 1 1 -1]*squaresize,[0 0 0 0],light_grey);

# Grapheinstellung
# xlabel('x [m]')
# ylabel('y [m]')
# zlabel('z [m]')
# grid on
# view([0.1 1 0.5])
# daspect([1 1 1])
# hold off;

# title('PCC-Berechnungsmodell');

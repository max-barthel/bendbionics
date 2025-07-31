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

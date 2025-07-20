# Transformation matrices of the tendon guides at the coupling element.
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

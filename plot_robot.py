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

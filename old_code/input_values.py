import math

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
tendon_distance = [
    30 * 10**-3,
    30 * 10**-3,
    30 * 10**-3,
    30 * 10**-3,
]  # in [mm]

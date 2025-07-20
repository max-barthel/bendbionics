import json
import math
from pathlib import Path

from unit_converter import UnitConverter as uc


class Ui:
    def __init__(self):
        self.uc = uc()

    def input_parameters(self):
        """Input parameters for the digital twin of a TDCR."""
        print("-----------------------------------------------------------")
        print("Input parameters for the digital twin of a TDCR.")
        print("-----------------------------------------------------------")

        # Number of segments.
        segments = self._validate_int_input(
            "Enter the number of segments for the TDCR (integer): ",
            range(1, 1000),
        )

        print("\nAll following parameters from robot base to tip.\n")

        # Backbone parameters.
        backbone_params = self._input_backbone(segments)

        # Coupling element parameters.
        coupling_element_params = self._input_coupling_element(segments)

        # Tendon parameters.
        tendon_params = self._input_tendon(segments)

        return {
            "segments": segments,
            "bending_angle_theta": backbone_params[0],
            "turning_angle_phi": backbone_params[1],
            "length_backbone": backbone_params[2],
            "radius_backbone": backbone_params[3],
            "discretization_points_backbone": backbone_params[4],
            "length_coupling_element": coupling_element_params[0],
            "toggle_coupling_element": coupling_element_params[1],
            "radius_coupling_element": coupling_element_params[2],
            "discretization_points_cylinder": coupling_element_params[3],
            "toggle_tendons": tendon_params[0],
            "tendon_number": tendon_params[1],
            "radius_tendon_routing": tendon_params[2],
        }

    def _input_backbone(self, segments):
        """Input parameters for the backbone."""
        print("-----------------------------------------------------------")
        print("Input parameters for the backbone.")
        print("-----------------------------------------------------------")
        # Bending angle of the backbone.
        bending_angle_theta = self._input_multiple_values(
            segments,
            "Bending angle of the backbone in [deg]",
            float,
            math.radians,
        )

        # Turning angle of the backbone.
        turning_angle_phi = self._input_multiple_values(
            segments,
            "Turning angle of the backbone in [deg] (from x-axis)",
            float,
            math.radians,
        )

        # Length of the backbone.
        length_backbone = self._input_multiple_values(
            segments,
            "Length of the backbone in [mm]",
            float,
            uc.mm_to_m,
        )

        # Radius of the backbone.
        radius_backbone = self._input_multiple_values(
            segments, "Radius of the backbone in [mm]", float, uc.mm_to_m
        )

        # Discretization points of the backbone.
        discretization_points_backbone = self._validate_int_input(
            "Discretization points of the backbone: ",
            range(1, 1_000_001),
        )

        return (
            bending_angle_theta,
            turning_angle_phi,
            length_backbone,
            radius_backbone,
            discretization_points_backbone,
        )

    def _input_coupling_element(self, segments):
        """Input parameters for the coupling element."""
        print("-----------------------------------------------------------")
        print("Input parameters for the coupling element.")
        print("-----------------------------------------------------------")
        # Length of the coupling element.
        length_coupling_element = self._input_multiple_values(
            segments + 1,
            "Length of the coupling element in [mm]",
            float,
            uc.mm_to_m,
        )

        # Toggle coupling element.
        toggle_coupling_element = self.validate_input(
            "Toggle coupling element between [body] and [line]: ",
            ["body", "line"],
        )
        if toggle_coupling_element == "body":
            # Radius of the coupling element.
            radius_coupling_element = self._input_multiple_values(
                segments,
                "Radius of the coupling element in [mm]",
                float,
                uc.mm_to_m,
            )

            # Discretization points of the coupling element cylinders.
            discretization_points_cylinder = self._validate_int_input(
                "Discretization points of the coupling element cylinders: ",
                range(1, 1_000_001),
            )
        else:
            radius_coupling_element = []
            discretization_points_cylinder = 0

        return (
            length_coupling_element,
            toggle_coupling_element,
            radius_coupling_element,
            discretization_points_cylinder,
        )

    def _input_tendon(self, segments):
        """Input parameters for the tendons."""
        print("-----------------------------------------------------------")
        print("Input parameters for the tendons.")
        print("-----------------------------------------------------------")
        # Toggle tendons.
        toggle_tendons = self.validate_input(
            "Toggle tendons [on] or [off]: ", ["on", "off"]
        )
        toggle_tendons = toggle_tendons.lower() == "on"
        if toggle_tendons:
            # Number of tendons.
            tendon_number = self._validate_int_input(
                "Enter the number of tendons (integer): ", range(1, 101)
            )

            # Distance between the tendons.
            radius_tendon_routing = self._input_multiple_values(
                segments + 1,
                "Tendon routing radius per coupling element in [mm]",
                float,
                uc.mm_to_m,
            )
        else:
            tendon_number = 0
            radius_tendon_routing = []
        return toggle_tendons, tendon_number, radius_tendon_routing

    def _input_multiple_values(
        self, amounts, message, data_type, conversion=None
    ):
        """Input multiple values from the user."""
        amount = 0
        parameter = []
        while amount < amounts:
            input_parameter = input(f"{message} ({amount + 1}/{amounts}): ")
            try:
                input_parameter = data_type(input_parameter)
            except ValueError:
                print(f"Invalid input. Please enter a {str(data_type)} input.")
            else:
                if conversion:
                    input_parameter = conversion(input_parameter)
                parameter.append(input_parameter)
                amount += 1
        print("")
        return parameter

    def validate_input(self, input_message, options):
        """Validate user input against a set of options."""
        while True:
            choice = input(input_message)
            choice = choice.strip().lower()
            if choice in options:
                print("")
                return choice
            else:
                print(f"Invalid input. Please enter one of {options}.")

    def _validate_int_input(self, input_message, valid_range):
        """Validate integer input within a specified range."""
        while True:
            try:
                value = int(input(input_message))
            except ValueError:
                print("Invalid input. Please enter an integer.")
            else:
                if value in valid_range:
                    print("")
                    return value
                else:
                    print(
                        "Input out of range. Please enter a value between "
                        + f"{valid_range.start} and {valid_range.stop - 1}."
                    )

    # Save and load parameters
    # -----------------------------------------------------------
    def save_parameters(self, parameters, filename="input_values.json"):
        """Save input parameters to a JSON file."""
        file_path = Path(f"project_data/{filename}")
        with file_path.open("w") as file:
            json.dump(parameters, file, indent=4)
        print(f"Parameters saved to {file_path.resolve()}")

    def load_parameters(self, filename="input_values.json"):
        """Load input parameters from a JSON file."""
        file_path = Path(f"project_data/{filename}")
        if not file_path.exists():
            print(f"File {file_path.resolve()} does not exist.")
            return None
        with file_path.open("r") as file:
            parameters = json.load(file)
        print(f"Parameters loaded from {file_path.resolve()}")
        return parameters

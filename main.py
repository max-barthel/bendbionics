# Digital twin of a TDCR (tendon driven continuum robot)
# with kinematic PCC (piecewise constant curvature) model.

from ui import Ui


class Main:
    """Main class for the digital twin of a TDCR."""

    def __init__(self):
        """Initialize the main class."""
        self.ui = Ui()

    def run(self):
        """Run the main program."""
        welcome_message = "Welcome to the digital twin of a TDCR!\n"
        welcome_message += "Press 'q' to exit the program."
        print(welcome_message)

        message = "Do you want to to load a stored data set "
        message += "or create a new one? (stored/new)"
        print(message)
        choice = self.ui.validate_input(
            "Enter your choice: ", ["stored", "new"]
        )
        if choice == "stored":
            parameters = self.ui.load_parameters()
            if not parameters:
                self.ui.input_parameters()
        elif choice == "new":
            parameters = self.ui.input_parameters()
            save_choice = self.ui.validate_input(
                "Do you want to save the parameters? (yes/no): ",
                ["yes", "no"],
            )
            if save_choice == "yes":
                self.ui.save_parameters(parameters)
        else:
            print("Invalid choice. Please enter 'stored' or 'new'.")


if __name__ == "__main__":
    # Make an instance of main and run the program.
    main = Main()
    main.run()

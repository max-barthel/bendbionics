import tkinter as tk
from tkinter import ttk
from soft_robot import homogeneous_matrix, transformation_matrix_coupling_element, transformation_matarix_backbone, couple

def on_button_click():
    # Beispielaufruf der Funktionen aus soft_robot.py
    length_coupling_element = 0.03
    bending_angle_theta = 0.36
    turning_angle_phi = 1.05
    length_backbone = 0.07
    discretization_points_backbone = 5

    first_couple = transformation_matrix_coupling_element(length_coupling_element, homogeneous_matrix)
    print('1:', first_couple)
    second_couple = couple(first_couple, transformation_matarix_backbone(bending_angle_theta, turning_angle_phi, length_backbone, discretization_points_backbone), discretization_points_backbone)
    print('2:', second_couple)

# Hauptfenster erstellen
root = tk.Tk()
root.title("Soft Robot UI")

# Fenstergröße festlegen
root.geometry("400x300")

# Label hinzufügen
label = ttk.Label(root, text="Soft Robot Simulation")
label.pack(pady=10)

# Schaltfläche hinzufügen
button = ttk.Button(root, text="Run Simulation", command=on_button_click)
button.pack(pady=10)

# Hauptschleife starten
root.mainloop()
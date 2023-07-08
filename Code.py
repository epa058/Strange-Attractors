import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from mpl_toolkits.mplot3d import Axes3D
import math

while True:
    error = False
    print("1: Lorenz attractor")
    print("2: Aizawa attractor")
    print("3: Halvorsen attractor")
    print("4: Three-scroll unified chaotic system attractor 2 (TSUCS2)")

    attractor = input("Enter either 1, 2, 3, or 4: ")

    try:
        attractor = int(attractor)
    except:
        print("Enter an integer.")
        print()
        continue

    # Position and time step
    x, y, z = [], [], []
    dt = 0.01

    # Total steps
    steps = 4000

    # Trajectories
    trajectories = []

    numTraj = input("Enter the number of trajectories: ")
        
    try:
        numTraj = int(numTraj)
    except:
        print("Enter an integer.")
        print()
        continue

    for i in range(numTraj):
        try:
            if attractor == 1 or attractor == 2:
                a, b, c = input("Enter a comma-separated initial position (around 1, 1, 1 is recommended): ").split(',')
            elif attractor == 3:
                a, b, c = input("Enter a comma-separated initial position (around 1, 0, 0 is recommended): ").split(',')
            elif attractor == 4:
                a, b, c = input("Enter a comma-separated initial position (no recommendation because I don't know either): ").split(',')
        except:
            print("Bruh.")
            print()
            error = True
            break
            
        try:
            x.append(float(a.strip()))
            y.append(float(b.strip()))
            z.append(float(c.strip()))
        except:
            print("Bruh.")
            print()
            error = True
            break

    if error:
            continue

    save = input("Do you wish to \"save\" the animation or only \"view\" it in real time?: ")

    try:
        save = str(save)
        save.lower()
        if save.lower() == "save":
            save = True
            
        elif save.lower() == "view":
            save = False
            
        else:
            print("Enter \"save\" or \"view.\"")
            print()
            continue
            
    except:
        print("Enter \"save\" or \"view.\"")
        print()
        continue

    # Initialize the system
    if attractor == 1:
        attractor = "Lorenz"
            
        for i in range(numTraj):
            print("Initial position: (x, y, z) = (%.2f, %.2f, %.2f)" % (x[i], y[i], z[i]))

        # Lorenz parameters
        rho = 28.0
        sigma = 10.0
        beta = 8.0 / 3.0

        # Lorenz integration for noobs
        def lorenz(x, y, z, dt):
            dx = sigma * (y - x) * dt
            dy = (x * (rho - z) - y) * dt
            dz = (x * y - beta * z) * dt
            return x + dx, y + dy, z + dz

        # Trajectory
        for i in range(numTraj):
            trajectories.append(np.zeros((steps, 3)))

        for i in range(numTraj):
            for j in range(steps):
                x[i], y[i], z[i] = lorenz(x[i], y[i], z[i], dt)
                trajectories[i][j] = x[i], y[i], z[i]
            
    elif attractor == 2:
        attractor = "Aizawa"
        
        for i in range(numTraj):
            print("Initial position: (x, y, z) = (%.2f, %.2f, %.2f)" % (x[i], y[i], z[i]))

        # Aizawa parameters
        alpha = 0.95
        beta = 0.7
        gamma = 0.65
        delta = 3.5
        epsilon = 0.25
        zeta  = 0.1

        # Aizawa integration for noobs
        def aizawa(x, y, z, dt):
            dx = ((z - beta) * x - delta * y) * dt
            dy = (delta * x + (z - beta) * y) * dt
            dz = (gamma + alpha * z - (z*z*z / 3) - (x*x + y*y) * (1 + epsilon * z) + zeta * z * x*x*x) * dt
            return x + dx, y + dy, z + dz

        # Trajectory
        for i in range(numTraj):
            trajectories.append(np.zeros((steps, 3)))

        for i in range(numTraj):
            for j in range(steps):
                x[i], y[i], z[i] = aizawa(x[i], y[i], z[i], dt)
                trajectories[i][j] = x[i], y[i], z[i]

    elif attractor == 3:
        attractor = "Halvorsen"
        
        for i in range(numTraj):
            print("Initial position: (x, y, z) = (%.2f, %.2f, %.2f)" % (x[i], y[i], z[i]))

        # Halvorsen parameters
        alpha = 1.89

        # Halvorsen integration for noobs
        def halvorsen(x, y, z, dt):
            dx = (- alpha * x - 4 * y - 4 * z - y*y) * dt
            dy = (- alpha * y - 4 * z - 4 * x - z*z) * dt
            dz = (- alpha * z - 4 * x - 4 * y - x*x) * dt
            return x + dx, y + dy, z + dz

        # Trajectory
        for i in range(numTraj):
            trajectories.append(np.zeros((steps, 3)))

        for i in range(numTraj):
            for j in range(steps):
                x[i], y[i], z[i] = halvorsen(x[i], y[i], z[i], dt)
                trajectories[i][j] = x[i], y[i], z[i]

    elif attractor == 4:
        attractor = "TSUCS2"
        
        for i in range(numTraj):
            print("Initial position: (x, y, z) = (%.2f, %.2f, %.2f)" % (x[i], y[i], z[i]))

        # TSUCS2 parameters
        alpha = 40
        beta = 1.833
        delta = 0.16
        epsilon = 0.65
        sigma = 55
        zeta  = 20

        # TSUCS2 integration for noobs
        def TSUCS2(x, y, z, dt):
            dx = (alpha * (y - x) + delta * x * z) * dt
            dy = (sigma * x - x * z + zeta * y) * dt
            dz = (beta * z + x * y - epsilon * x*x) * dt
            return x + dx, y + dy, z + dz

        # Trajectory
        for i in range(numTraj):
            trajectories.append(np.zeros((steps, 3)))

        for i in range(numTraj):
            for j in range(steps):
                x[i], y[i], z[i] = TSUCS2(x[i], y[i], z[i], dt)
                trajectories[i][j] = x[i], y[i], z[i]
                
    else:
        print("Enter a valid integer.")
        print()
        continue

    # Figure setup
    fig = plt.figure()
    ax = plt.axes(projection='3d')
    ax.set_xlabel("X Axis")
    ax.set_ylabel("Y Axis")
    ax.set_zlabel("Z Axis")
    ax.set_title("%s Attractor" % (attractor))

    '''
    # Plot final figure
    for i in range(numTraj):
        ax.plot(trajectories[i][:, 0], trajectories[i][:, 1], trajectories[i][:, 2], label="Trajectory %d" % (i+1))
        plt.draw()

    plt.legend()
    plt.show()
    
    print()
    continue
    '''
    
    # Animate
    def animate(i):
        ax.clear()
        ax.set_box_aspect([1,1,1])
        #ax.set_xlim3d([-2, 2])
        #ax.set_ylim3d([-2, 2])
        #ax.set_zlim3d([-2, 2])
        for j in range(numTraj):
            ax.plot(trajectories[j][:i+1, 0], trajectories[j][:i+1, 1], trajectories[j][:i+1, 2])
        plt.draw()

    ani = animation.FuncAnimation(fig, animate, frames=steps, interval=1, repeat=False)

    if save == True:
        ani.save("%s Attractor.gif" % (attractor), writer="pillow", fps=30, dpi=100)
    
    plt.show()
    
    print()
    continue

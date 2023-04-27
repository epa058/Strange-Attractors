import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from mpl_toolkits.mplot3d import Axes3D
import math

print("1: Lorenz attractor")
print("2: Aizawa attractor")

attractor = int(input("Enter either 1 or 2: "))

# Position and time step
x, y, z = [], [], []
dt = 0.01

# Total steps
steps = 4000

# Trajectories
trajectories = []

# Initialize the system
if attractor == 1:
    
    attractor = "Lorenz"
    numTraj = int(input("Enter the number of trajectories: "))

    for i in range(numTraj):
        a, b, c = input("Enter an initial position (around 1, 1, 1 is recommended): ").split(', ')
        x.append(float(a))
        y.append(float(b))
        z.append(float(c))
    
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
    numTraj = int(input("Enter the number of trajectories: "))

    for i in range(numTraj):
        print(x, y, z)
        a, b, c = input("Enter an initial position (around 0.1, 0, 0 is recommended): ").split(', ')
        x.append(float(a))
        y.append(float(b))
        z.append(float(c))
        print(x, y, z)
        
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
        dz = (gamma + alpha * z - (z**3 / 3) - (x**2 + y**2) * (1 + epsilon * z) + zeta * z * x**3) * dt
        return x + dx, y + dy, z + dz

    # Trajectory
    for i in range(numTraj):
        trajectories.append(np.zeros((steps, 3)))

    for i in range(numTraj):
        for j in range(steps):
            x[i], y[i], z[i] = aizawa(x[i], y[i], z[i], dt)
            trajectories[i][j] = x[i], y[i], z[i]

# Figure setup
fig = plt.figure()
ax = plt.axes(projection='3d')
ax.set_xlabel("X Axis")
ax.set_ylabel("Y Axis")
ax.set_zlabel("Z Axis")
ax.set_title("%s Attractor" % (attractor))

# Plot final figure
for i in range(numTraj):
    ax.plot(trajectories[i][:, 0], trajectories[i][:, 1], trajectories[i][:, 2], label="Trajectory %d" % (i+1))
    plt.draw()

plt.legend()
plt.show()
'''
# Animate
def animate(i):
    ax.clear()
    ax.set_xlim(-30, 30)
    ax.set_ylim(-30, 30)
    ax.set_zlim(0, 60)
    ax.plot(data[:i+1, 0], data[:i+1, 1], data[:i+1, 2])
    plt.draw()

ani = FuncAnimation(fig, animate, frames=10000, interval=1, repeat=False)
ani.save('chaos.gif', writer='pillow', fps=30, dpi=100)
plt.show()
'''

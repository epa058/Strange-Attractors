import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from mpl_toolkits.mplot3d import Axes3D
import math

print("1: Lorenz attractor")
print("2: Aizawa attractor")

choice = input("Enter either 1 or 2: ")

# Time step
dt = 0.01

# Total steps
steps = 4000

# Initialize the system
if choice == "1":
    choice = "Lorenz"
    
    x, y, z = 1, 1, 1
    print("Initial position: (x, y, z) = (%.2f, %.2f, %.2f)" % (x, y, z))

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
    data = np.zeros((steps, 3))
    for i in range(steps):
        x, y, z = lorenz(x, y, z, dt)
        data[i] = x, y, z

elif choice == "2":
    choice = "Aizawa"
    
    x, y, z = 0.1, 0, 0
    u, v, w = 1.1, 0, 0
    print("Initial position: (x, y, z) = (%.2f, %.2f, %.2f)" % (x, y, z))
    print("Initial position: (u, v, w) = (%.2f, %.2f, %.2f)" % (u, v, w))

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
    data1 = np.zeros((steps, 3))
    data2 = np.zeros((steps, 3))
    for i in range(steps):
        x, y, z = aizawa(x, y, z, dt)
        u, v, w = aizawa(u, v, w, dt)
        data1[i] = x, y, z
        data2[i] = u, v, w

# Figure setup
fig = plt.figure()
ax = plt.axes(projection='3d')
ax.set_xlabel("X Axis")
ax.set_ylabel("Y Axis")
ax.set_zlabel("Z Axis")
ax.set_title("%s Attractor" % (choice))

# Plot final figure
ax.plot(data1[:, 0], data1[:, 1], data1[:, 2])
ax.plot(data2[:, 0], data2[:, 1], data2[:, 2])
plt.draw()
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

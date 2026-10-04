import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from mpl_toolkits.mplot3d import Axes3D
import math

while True:
    error = False
    print("1: Aizawa attractor")
    print("2: Anishchenko-Astakhov attractor")
    print("3: Arneodo attractor")
    print("4: Burke-Shaw attractor")
    print("5: Chen-Celikovsky attractor")
    print("6: Chen-Lee attractor")
    print("7: Chua attractor")
    print("8: Coullet attractor")
    print("9: Coupled Lorenz attractor")
    print("10: Dadras attractor")
    print("11: Four-Wing attractor")
    print("12: Generalized Chua attractor (n=3)")
    print("13: Genesio-Tesi attractor")
    print("14: Hadley attractor")
    print("15: Halvorsen attractor")
    print("16: Liu-Chen attractor")
    print("17: Lorenz attractor")
    print("18: Lorenz Mod 1 attractor")
    print("19: Lorenz Mod 2 attractor")
    print("20: Lu Chen attractor")
    print("21: Newton-Leipnik attractor")
    print("22: Nose-Hoover attractor")
    print("23: Qi attractor")
    print("24: Qi-Chen attractor")
    print("25: Rayleigh-Benard attractor")
    print("26: Rossler attractor")
    print("27: Rucklidge attractor")
    print("28: Sakarya attractor")
    print("29: Shimizu-Morioka attractor")
    print("30: Thomas attractor")
    print("31: TSUCS1 attractor")
    print("32: TSUCS2 attractor")
    print("33: Wang-Sun attractor")
    print("34: Wimol-Banlue attractor")
    print("35: Yu-Wang attractor")

    attractor = input("Enter an integer from 1 to 35: ")

    try:
        attractor = int(attractor)
    except ValueError:
        print("Enter an integer.")
        print()
        continue

    if attractor < 1 or attractor > 35:
        print("Enter a valid integer.")
        print()
        continue

    # Position and time step
    x, y, z = [], [], []
    dt = 0.01

    # Total steps (also the number of animation frames)
    steps = 4000

    # Points revealed per animation frame (only TSUCS2 uses more than 1)
    pointsPerFrame = 1

    # Trajectories
    trajectories = []

    numTraj = input("Enter the number of trajectories: ")
        
    try:
        numTraj = int(numTraj)
    except ValueError:
        print("Enter an integer.")
        print()
        continue

    if numTraj < 1:
        print("Enter at least 1 trajectory.")
        print()
        continue

    for i in range(numTraj):
        try:
            if attractor == 1:
                a, b, c = input("Enter a comma-separated initial position (around 0.1, 0, 0 is recommended): ").split(',')
            elif attractor == 2:
                a, b, c = input("Enter a comma-separated initial position (around 1, 0, 0 is recommended): ").split(',')
            elif attractor == 3:
                a, b, c = input("Enter a comma-separated initial position (around 0.1, 0, 0 is recommended): ").split(',')
            elif attractor == 4:
                a, b, c = input("Enter a comma-separated initial position (around 1, 0, 0 is recommended): ").split(',')
            elif attractor == 5:
                a, b, c = input("Enter a comma-separated initial position (around 1, 1, 1 is recommended): ").split(',')
            elif attractor == 6:
                a, b, c = input("Enter a comma-separated initial position (around 1, 1, 1 is recommended): ").split(',')
            elif attractor == 7:
                a, b, c = input("Enter a comma-separated initial position (around 0.7, 0, 0 is recommended): ").split(',')
            elif attractor == 8:
                a, b, c = input("Enter a comma-separated initial position (around 0.1, 0, 0 is recommended): ").split(',')
            elif attractor == 9:
                a, b, c = input("Enter a comma-separated initial position (around 1, 1, 1 is recommended): ").split(',')
            elif attractor == 10:
                a, b, c = input("Enter a comma-separated initial position (around 1, 1, 1 is recommended): ").split(',')
            elif attractor == 11:
                a, b, c = input("Enter a comma-separated initial position (around 1, 1, 1 is recommended): ").split(',')
            elif attractor == 12:
                a, b, c = input("Enter a comma-separated initial position (around 0.1, 0, 0 is recommended): ").split(',')
            elif attractor == 13:
                a, b, c = input("Enter a comma-separated initial position (around 0.1, 0.1, 0.1 is recommended): ").split(',')
            elif attractor == 14:
                a, b, c = input("Enter a comma-separated initial position (around 0.1, 0, 0 is recommended): ").split(',')
            elif attractor == 15:
                a, b, c = input("Enter a comma-separated initial position (around 1, 0, 0 is recommended): ").split(',')
            elif attractor == 16:
                a, b, c = input("Enter a comma-separated initial position (around 1, 3, 5 is recommended): ").split(',')
            elif attractor == 17:
                a, b, c = input("Enter a comma-separated initial position (around 1, 1, 1 is recommended): ").split(',')
            elif attractor == 18:
                a, b, c = input("Enter a comma-separated initial position (around 0, 1, 0 is recommended): ").split(',')
            elif attractor == 19:
                a, b, c = input("Enter a comma-separated initial position (around -0.1, 0, 0 is recommended): ").split(',')
            elif attractor == 20:
                a, b, c = input("Enter a comma-separated initial position (around 1, 1, 1 is recommended): ").split(',')
            elif attractor == 21:
                a, b, c = input("Enter a comma-separated initial position (around 0.349, 0, -0.16 is recommended): ").split(',')
            elif attractor == 22:
                a, b, c = input("Enter a comma-separated initial position (around 0, 5, 0 is recommended): ").split(',')
            elif attractor == 23:
                a, b, c = input("Enter a comma-separated initial position (around 1, 1, 1 is recommended): ").split(',')
            elif attractor == 24:
                a, b, c = input("Enter a comma-separated initial position (around 1, 1, 1 is recommended): ").split(',')
            elif attractor == 25:
                a, b, c = input("Enter a comma-separated initial position (around 10, 10, 10 is recommended): ").split(',')
            elif attractor == 26:
                a, b, c = input("Enter a comma-separated initial position (around 1, 1, 1 is recommended): ").split(',')
            elif attractor == 27:
                a, b, c = input("Enter a comma-separated initial position (around 1, 0, 4.5 is recommended): ").split(',')
            elif attractor == 28:
                a, b, c = input("Enter a comma-separated initial position (around 1, -1, 1 is recommended): ").split(',')
            elif attractor == 29:
                a, b, c = input("Enter a comma-separated initial position (around 0.1, 0, 0 is recommended): ").split(',')
            elif attractor == 30:
                a, b, c = input("Enter a comma-separated initial position (around 1.1, 1.1, -0.01 is recommended): ").split(',')
            elif attractor == 31:
                a, b, c = input("Enter a comma-separated initial position (around 1, 1, 1 is recommended): ").split(',')
            elif attractor == 32:
                a, b, c = input("Enter a comma-separated initial position (around 1, 0, 0 and 1, 1, 1 are recommended): ").split(',')
            elif attractor == 33:
                a, b, c = input("Enter a comma-separated initial position (around 0.5, 0.1, 0.1 is recommended): ").split(',')
            elif attractor == 34:
                a, b, c = input("Enter a comma-separated initial position (around 1, 0, 0 is recommended): ").split(',')
            elif attractor == 35:
                a, b, c = input("Enter a comma-separated initial position (around 1, 1, 1 is recommended): ").split(',')
        except ValueError:
            print("Bruh.")
            print()
            error = True
            break
            
        try:
            x.append(float(a.strip()))
            y.append(float(b.strip()))
            z.append(float(c.strip()))
        except ValueError:
            print("Bruh.")
            print()
            error = True
            break

    if error:
            continue

    save = input("Do you wish to \"save\" the animation or only \"view\" it in real time?: ")

    if save.lower() == "save":
        save = True

    elif save.lower() == "view":
        save = False

    else:
        print("Enter \"save\" or \"view.\"")
        print()
        continue

    # Initialize the system
    initPos = []
    for i in range(numTraj):
        print("Initial position: (x0, y0, z0) = (%.2f, %.2f, %.2f)" % (x[i], y[i], z[i]))
        initPos.append((x[i], y[i], z[i]))

    # Trajectory
    for i in range(numTraj):
        trajectories.append(np.zeros((steps, 3)))

    # AIZAWA ATTRACTOR
    if attractor == 1:
        attractor = "Aizawa"

        # Aizawa parameters
        alpha = 0.95
        beta = 0.7
        gamma = 0.6
        delta = 3.5
        epsilon = 0.25
        zeta  = 0.1

        # Aizawa integration for noobs
        def aizawa(x, y, z, dt):
            dx = ((z - beta) * x - delta * y) * dt
            dy = (delta * x + (z - beta) * y) * dt
            dz = (gamma + alpha * z - (z*z*z / 3) - (x*x + y*y) * (1 + epsilon * z) + zeta * z * x*x*x) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            trajectories[i][0] = initPos[i]
            for j in range(1, steps):
                x[i], y[i], z[i] = aizawa(x[i], y[i], z[i], dt)
                trajectories[i][j] = x[i], y[i], z[i]

    # ANISHCHENKO-ASTAKHOV ATTRACTOR
    elif attractor == 2:
        attractor = "Anishchenko-Astakhov"

        dt = 0.02
        integSteps = 20000 # t = 400
        drawStride = 1 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Anishchenko-Astakhov parameters
        mu = 1.2
        eta = 0.5

        # Anishchenko-Astakhov integration for noobs
        def anishchenko_astakhov(x, y, z, dt):
            I = 1 if x > 0 else 0 # Heaviside step
            dx = (mu * x + y - x * z) * dt
            dy = (- x) * dt
            dz = (- eta * z + eta * I * x*x) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = anishchenko_astakhov(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # ARNEODO ATTRACTOR
    elif attractor == 3:
        attractor = "Arneodo"

        dt = 0.01
        integSteps = 40000 # t = 400
        drawStride = 2 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Arneodo parameters
        alpha = -5.5
        beta = 3.5
        delta = -1.0

        # Arneodo integration for noobs
        def arneodo(x, y, z, dt):
            dx = (y) * dt
            dy = (z) * dt
            dz = (- alpha * x - beta * y - z + delta * x*x*x) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = arneodo(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # BURKE-SHAW ATTRACTOR
    elif attractor == 4:
        attractor = "Burke-Shaw"

        dt = 0.002
        integSteps = 48000 # t = 96
        drawStride = 2 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Burke-Shaw parameters
        s = 10.0
        v = 4.272

        # Burke-Shaw integration for noobs
        def burke_shaw(x, y, z, dt):
            dx = (- s * (x + y)) * dt
            dy = (- y - s * x * z) * dt
            dz = (s * x * y + v) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = burke_shaw(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # CHEN-CELIKOVSKY ATTRACTOR
    elif attractor == 5:
        attractor = "Chen-Celikovsky"

        dt = 0.001
        integSteps = 40000 # t = 40
        drawStride = 2 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Chen-Celikovsky parameters
        alpha = 35.0
        beta = 3.0
        delta = 28.0

        # Chen-Celikovsky integration for noobs
        def chen_celikovsky(x, y, z, dt):
            dx = (alpha * (y - x)) * dt
            dy = ((delta - alpha) * x - x * z + delta * y) * dt
            dz = (x * y - beta * z) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = chen_celikovsky(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # CHEN-LEE ATTRACTOR
    elif attractor == 6:
        attractor = "Chen-Lee"

        dt = 0.002
        integSteps = 200000 # t = 400
        drawStride = 10 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Chen-Lee parameters
        alpha = 5.0
        beta = -10.0
        delta = -0.38

        # Chen-Lee integration for noobs
        def chen_lee(x, y, z, dt):
            dx = (alpha * x - y * z) * dt
            dy = (beta * y + x * z) * dt
            dz = (delta * z + x * y / 3) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = chen_lee(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # CHUA ATTRACTOR
    elif attractor == 7:
        attractor = "Chua"

        dt = 0.01
        integSteps = 20000 # t = 200
        drawStride = 1 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Chua parameters
        alpha = 15.6
        beta = 1.0
        gamma = 25.58
        m0 = -8.0 / 7.0
        m1 = -5.0 / 7.0

        # Chua integration for noobs
        def chua(x, y, z, dt):
            G = m1 * x + 0.5 * (m0 - m1) * (abs(x + 1) - abs(x - 1)) # Chua diode
            dx = (alpha * (y - x - G)) * dt
            dy = (beta * (x - y + z)) * dt
            dz = (- gamma * y) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = chua(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # COULLET ATTRACTOR
    elif attractor == 8:
        attractor = "Coullet"

        dt = 0.02
        integSteps = 32000 # t = 640
        drawStride = 1 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Coullet parameters
        alpha = 0.8
        beta = -1.1
        gamma = -0.45
        delta = -1.0

        # Coullet integration for noobs
        def coullet(x, y, z, dt):
            dx = (y) * dt
            dy = (z) * dt
            dz = (alpha * x + beta * y + gamma * z + delta * x*x*x) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = coullet(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # COUPLED LORENZ ATTRACTOR
    elif attractor == 9:
        attractor = "Coupled Lorenz"

        dt = 0.01
        integSteps = 12000 # t = 120
        drawStride = 1 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Coupled Lorenz: a drive Lorenz system (x1, y1, z1) pushes a response Lorenz system (x, y, z) through x.
        # The response system is the one plotted. Both start at the entered initial position.

        # Coupled Lorenz parameters
        sigma = 10.0
        beta = 8.0 / 3.0
        rho1 = 35.0
        rho2 = 1.15
        k = 2.85

        # Coupled Lorenz integration for noobs
        def coupled_lorenz(x, y, z, x1, y1, z1, dt):
            dx1 = sigma * (y1 - x1) * dt
            dy1 = (rho1 * x1 - y1 - x1 * z1) * dt
            dz1 = (x1 * y1 - beta * z1) * dt
            dx = (sigma * (y - x) + k * (x1 - x)) * dt
            dy = (rho2 * x - y - x * z) * dt
            dz = (x * y - beta * z) * dt
            return x + dx, y + dy, z + dz, x1 + dx1, y1 + dy1, z1 + dz1

        for i in range(numTraj):
            x1, y1, z1 = initPos[i] # Drive system state
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i], x1, y1, z1 = coupled_lorenz(x[i], y[i], z[i], x1, y1, z1, dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # DADRAS ATTRACTOR
    elif attractor == 10:
        attractor = "Dadras"

        dt = 0.001
        integSteps = 180000 # t = 180
        drawStride = 9 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Dadras parameters
        alpha = 3.0
        beta = 2.7
        gamma = 1.7
        delta = 2.0
        epsilon = 9.0

        # Dadras integration for noobs
        def dadras(x, y, z, dt):
            dx = (y - alpha * x + beta * y * z) * dt
            dy = (gamma * y - x * z + z) * dt
            dz = (delta * x * y - epsilon * z) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = dadras(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # FOUR-WING ATTRACTOR
    elif attractor == 11:
        attractor = "Four-Wing"

        dt = 0.002
        integSteps = 80000 # t = 160
        drawStride = 4 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Four-Wing parameters
        alpha = 4.0
        beta = 6.0
        gamma = 10.0
        delta = 5.0
        kappa = 1.0

        # Four-Wing integration for noobs
        def four_wing(x, y, z, dt):
            dx = (alpha * x - beta * y * z) * dt
            dy = (- gamma * y + x * z) * dt
            dz = (kappa * x - delta * z + x * y) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = four_wing(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # GENERALIZED CHUA (N=3) ATTRACTOR
    elif attractor == 12:
        attractor = "Generalized Chua (n=3)"

        dt = 0.01
        integSteps = 160000 # t = 1600 (the trajectory hops between scrolls slowly, so it needs a long run)
        drawStride = 8 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Generalized Chua: a Chua circuit whose diode has more breakpoints, giving n double scrolls
        # (from github.com/cdrckrgt/attractors, multiscroll.py)

        # Generalized Chua parameters
        alpha = 9.0
        beta = 14.286
        gamma = 0.0
        nScroll = 3
        breakpoints = [0, 1.0, 2.15, 3.6, 8.2, 13.0]
        slopes = [-1.0 / 7.0, 2.0 / 7.0, -4.0 / 7.0, 2.0 / 7.0, -4.0 / 7.0, 2.0 / 7.0]

        # Piecewise-linear Chua diode with 2 * nScroll - 1 breakpoints
        def generalized_chua_diode(x):
            h = slopes[2 * nScroll - 1] * x
            for k in range(1, 2 * nScroll):
                h += 0.5 * (slopes[k - 1] - slopes[k]) * (abs(x + breakpoints[k]) - abs(x - breakpoints[k]))
            return h

        # Generalized Chua integration for noobs
        def generalized_chua(x, y, z, dt):
            dx = (alpha * (y - generalized_chua_diode(x))) * dt
            dy = (x - y + z) * dt
            dz = (- beta * y - gamma * z) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = generalized_chua(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # GENESIO-TESI ATTRACTOR
    elif attractor == 13:
        attractor = "Genesio-Tesi"

        dt = 0.01
        integSteps = 60000 # t = 600
        drawStride = 1 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Genesio-Tesi parameters
        alpha = 0.44
        beta = 1.1
        gamma = 1.0

        # Genesio-Tesi integration for noobs
        def genesio_tesi(x, y, z, dt):
            dx = (y) * dt
            dy = (z) * dt
            dz = (- gamma * x - beta * y - alpha * z + x*x) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = genesio_tesi(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # HADLEY ATTRACTOR
    elif attractor == 14:
        attractor = "Hadley"

        dt = 0.0002
        integSteps = 1000000 # t = 200
        drawStride = 50 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Hadley parameters
        alpha = 0.25
        beta = 4.0
        F = 8.0
        G = 1.0

        # Hadley integration for noobs
        def hadley(x, y, z, dt):
            dx = (- y*y - z*z - alpha * x + alpha * F) * dt
            dy = (x * y - beta * x * z - y + G) * dt
            dz = (beta * x * y + x * z - z) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = hadley(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # HALVORSEN ATTRACTOR
    elif attractor == 15:
        attractor = "Halvorsen"

        dt = 0.002
        integSteps = 20000 # t = 40
        drawStride = 1 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Halvorsen parameters
        alpha = 1.4 

        # Halvorsen integration for noobs
        def halvorsen(x, y, z, dt):
            dx = (- alpha * x - 4 * y - 4 * z - y*y) * dt
            dy = (- alpha * y - 4 * z - 4 * x - z*z) * dt
            dz = (- alpha * z - 4 * x - 4 * y - x*x) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = halvorsen(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # LIU-CHEN ATTRACTOR
    elif attractor == 16:
        attractor = "Liu-Chen"

        dt = 0.001
        integSteps = 72000 # t = 72
        drawStride = 3 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Liu-Chen parameters
        alpha = 2.4
        beta = -3.78
        gamma = 14.0
        delta = -11.0
        epsilon = 4.0
        zeta = 5.58
        eta = -1.0

        # Liu-Chen integration for noobs
        def liu_chen(x, y, z, dt):
            dx = (alpha * y + beta * x + gamma * y * z) * dt
            dy = (delta * y - z + epsilon * x * z) * dt
            dz = (zeta * z + eta * x * y) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = liu_chen(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # LORENZ ATTRACTOR
    elif attractor == 17:
        attractor = "Lorenz"

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

        for i in range(numTraj):
            trajectories[i][0] = initPos[i]
            for j in range(1, steps):
                x[i], y[i], z[i] = lorenz(x[i], y[i], z[i], dt)
                trajectories[i][j] = x[i], y[i], z[i]

    # LORENZ MOD 1 ATTRACTOR
    elif attractor == 18:
        attractor = "Lorenz Mod 1"

        dt = 0.005
        integSteps = 16000 # t = 80
        drawStride = 1 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Lorenz Mod 1 parameters
        alpha = 0.1
        beta = 4.0
        gamma = 14.0
        delta = 0.08

        # Lorenz Mod 1 integration for noobs
        def lorenz_mod_1(x, y, z, dt):
            dx = (- alpha * x + y*y - z*z + alpha * gamma) * dt
            dy = (x * (y - beta * z) + delta) * dt
            dz = (- z + x * (beta * y + z)) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = lorenz_mod_1(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # LORENZ MOD 2 ATTRACTOR
    elif attractor == 19:
        attractor = "Lorenz Mod 2"

        dt = 0.002
        integSteps = 20000 # t = 40
        drawStride = 1 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Lorenz Mod 2 parameters
        alpha = 0.9
        beta = 5.0
        gamma = 9.9
        delta = 1.0

        # Lorenz Mod 2 integration for noobs
        def lorenz_mod_2(x, y, z, dt):
            dx = (- alpha * x + y*y - z*z + alpha * gamma) * dt
            dy = (x * (y - beta * z) + delta) * dt
            dz = (- z + x * (beta * y + z)) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = lorenz_mod_2(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # LU CHEN ATTRACTOR
    elif attractor == 20:
        attractor = "Lu Chen"

        dt = 0.001
        integSteps = 200000 # t = 200
        drawStride = 10 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Lu Chen parameters
        alpha = -10.0
        beta = -4.0
        gamma = 18.1

        # Lu Chen integration for noobs
        def lu_chen(x, y, z, dt):
            dx = (- alpha * beta * x / (alpha + beta) - y * z + gamma) * dt
            dy = (x * z + alpha * y) * dt
            dz = (beta * z + x * y) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = lu_chen(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # NEWTON-LEIPNIK ATTRACTOR
    elif attractor == 21:
        attractor = "Newton-Leipnik"

        dt = 0.02
        integSteps = 32000 # t = 640
        drawStride = 1 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Newton-Leipnik parameters
        alpha = 0.4
        beta = 0.175

        # Newton-Leipnik integration for noobs
        def newton_leipnik(x, y, z, dt):
            dx = (- alpha * x + y + 10 * y * z) * dt
            dy = (- x - 0.4 * y + 5 * x * z) * dt
            dz = (beta * z - 5 * x * y) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = newton_leipnik(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # NOSE-HOOVER ATTRACTOR
    elif attractor == 22:
        attractor = "Nose-Hoover"

        # Nose-Hoover has no single attractor: starts like (1, 0, 0) lie on smooth tori, while (0, 5, 0) is in the
        # chaotic sea, which fills in slowly, hence the long run
        dt = 0.0005
        integSteps = 2000000 # t = 1000
        drawStride = 50 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Nose-Hoover parameters
        alpha = 1.5

        # Nose-Hoover integration for noobs
        def nose_hoover(x, y, z, dt):
            dx = (y) * dt
            dy = (- x + y * z) * dt
            dz = (alpha - y*y) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = nose_hoover(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # QI ATTRACTOR
    elif attractor == 23:
        attractor = "Qi"

        dt = 0.0001 # Euler blows up at dt = 0.0005
        integSteps = 200000 # t = 20
        drawStride = 10 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Qi is 4D: the fourth variable w starts at 1. Only (x, y, z) is plotted.
        # Equations from the chaoticatmospheres poster, but with gamma = 8/3 instead of the printed 1:
        # at gamma = 1 the system settles onto a periodic loop, at 8/3 it is strongly chaotic.

        # Qi parameters
        alpha = 30.0
        beta = 10.0
        gamma = 8.0 / 3.0
        delta = 10.0

        # Qi integration for noobs
        def qi(x, y, z, w, dt):
            dx = (alpha * (y - x) + y * z * w) * dt
            dy = (beta * (x + y) - x * z * w) * dt
            dz = (- gamma * z + x * y * w) * dt
            dw = (- delta * w + x * y * z) * dt
            return x + dx, y + dy, z + dz, w + dw

        for i in range(numTraj):
            w = 1.0 # Fourth variable
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i], w = qi(x[i], y[i], z[i], w, dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # QI-CHEN ATTRACTOR
    elif attractor == 24:
        attractor = "Qi-Chen"

        dt = 0.0005
        integSteps = 80000 # t = 40
        drawStride = 4 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Qi-Chen parameters
        alpha = 38.0
        beta = 8.0 / 3.0
        gamma = 80.0

        # Qi-Chen integration for noobs
        def qi_chen(x, y, z, dt):
            dx = (alpha * (y - x) + y * z) * dt
            dy = (gamma * x + y - x * z) * dt
            dz = (x * y - beta * z) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = qi_chen(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # RAYLEIGH-BENARD ATTRACTOR
    elif attractor == 25:
        attractor = "Rayleigh-Benard"

        # Rayleigh-Benard parameters
        alpha = 9.0
        r = 12.0
        beta = 5.0

        # Rayleigh-Benard integration for noobs
        def rayleigh_benard(x, y, z, dt):
            dx = (- alpha * x + alpha * y) * dt
            dy = (r * x - y - x * z) * dt
            dz = (x * y - beta * z) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            trajectories[i][0] = initPos[i]
            for j in range(1, steps):
                x[i], y[i], z[i] = rayleigh_benard(x[i], y[i], z[i], dt)
                trajectories[i][j] = x[i], y[i], z[i]

    # ROSSLER ATTRACTOR
    elif attractor == 26:
        attractor = "Rossler"

        dt = 0.005
        integSteps = 120000 # t = 600
        drawStride = 6 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Rossler parameters
        alpha = 0.2
        beta = 0.2
        gamma = 5.7

        # Rossler integration for noobs
        def rossler(x, y, z, dt):
            dx = (- (y + z)) * dt
            dy = (x + alpha * y) * dt
            dz = (beta + z * (x - gamma)) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = rossler(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # RUCKLIDGE ATTRACTOR
    elif attractor == 27:
        attractor = "Rucklidge"

        dt = 0.02
        integSteps = 28000 # t = 560
        drawStride = 1 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Rucklidge parameters
        kappa = 2.0
        alpha = 6.7

        # Rucklidge integration for noobs
        def rucklidge(x, y, z, dt):
            dx = (- kappa * x + alpha * y - y * z) * dt
            dy = (x) * dt
            dz = (- z + y*y) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = rucklidge(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # SAKARYA ATTRACTOR
    elif attractor == 28:
        attractor = "Sakarya"

        dt = 0.002
        integSteps = 132000 # t = 264
        drawStride = 3 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Sakarya parameters
        alpha = 0.4
        beta = 0.3

        # Sakarya integration for noobs
        def sakarya(x, y, z, dt):
            dx = (- x + y + y * z) * dt
            dy = (- x - y + alpha * x * z) * dt
            dz = (z - beta * x * y) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = sakarya(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # SHIMIZU-MORIOKA ATTRACTOR
    elif attractor == 29:
        attractor = "Shimizu-Morioka"

        dt = 0.05
        integSteps = 12000 # t = 600
        drawStride = 1 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Shimizu-Morioka parameters
        alpha = 0.75
        beta = 0.45

        # Shimizu-Morioka integration for noobs
        def shimizu_morioka(x, y, z, dt):
            dx = (y) * dt
            dy = ((1 - z) * x - alpha * y) * dt
            dz = (x*x - beta * z) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = shimizu_morioka(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # THOMAS ATTRACTOR
    elif attractor == 30:
        attractor = "Thomas"

        dt = 0.05
        integSteps = 40000 # t = 2000
        drawStride = 1 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Thomas parameters
        beta = 0.208186

        # Thomas integration for noobs
        def thomas(x, y, z, dt):
            dx = (math.sin(y) - beta * x) * dt
            dy = (math.sin(z) - beta * y) * dt
            dz = (math.sin(x) - beta * z) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = thomas(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # TSUCS1 ATTRACTOR
    elif attractor == 31:
        attractor = "TSUCS1"

        dt = 0.001
        integSteps = 40000 # t = 40
        drawStride = 2 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # TSUCS1 parameters
        alpha = 40.0
        beta = 0.833
        delta = 0.5
        epsilon = 0.65
        zeta = 20.0

        # TSUCS1 integration for noobs
        def TSUCS1(x, y, z, dt):
            dx = (alpha * (y - x) + delta * x * z) * dt
            dy = (zeta * y - x * z) * dt
            dz = (beta * z + x * y - epsilon * x*x) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = TSUCS1(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # TSUCS2 ATTRACTOR
    elif attractor == 32:
        attractor = "TSUCS2"

        dt = 0.0001 # Because TSUCS2 is huge (Euler blows up at larger dt)
        integSteps = 200000 # t = 20, enough to visit all three scrolls
        drawStride = 5 # Keep every 5th point for drawing (about as smooth as Lorenz)
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # TSUCS2 parameters
        alpha = 40
        beta = 11/6
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

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = TSUCS2(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # WANG-SUN ATTRACTOR
    elif attractor == 33:
        attractor = "Wang-Sun"

        dt = 0.005
        integSteps = 128000 # t = 640
        drawStride = 4 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Wang-Sun parameters
        alpha = 0.2
        beta = -0.01
        gamma = 1.0
        delta = -0.4
        epsilon = -1.0
        zeta = -1.0

        # Wang-Sun integration for noobs
        def wang_sun(x, y, z, dt):
            dx = (alpha * x + gamma * y * z) * dt
            dy = (beta * x + delta * y - x * z) * dt
            dz = (epsilon * z + zeta * x * y) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = wang_sun(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # WIMOL-BANLUE ATTRACTOR
    elif attractor == 34:
        attractor = "Wimol-Banlue"

        dt = 0.05
        integSteps = 12000 # t = 600
        drawStride = 1 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Wimol-Banlue parameters
        alpha = 2.0

        # Wimol-Banlue integration for noobs
        def wimol_banlue(x, y, z, dt):
            dx = (y - x) * dt
            dy = (- z * math.tanh(x)) * dt
            dz = (- alpha + x * y + abs(y)) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = wimol_banlue(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # YU-WANG ATTRACTOR
    elif attractor == 35:
        attractor = "Yu-Wang"

        dt = 0.001
        integSteps = 60000 # t = 60
        drawStride = 3 # Keep every drawStride-th point for drawing
        pointsPerFrame = integSteps // drawStride // steps # Drawn points revealed per frame so the animation stays at steps frames

        # Yu-Wang parameters
        alpha = 10.0
        beta = 40.0
        gamma = 2.0
        delta = 2.5

        # Yu-Wang integration for noobs
        def yu_wang(x, y, z, dt):
            dx = (alpha * (y - x)) * dt
            dy = (beta * x - gamma * x * z) * dt
            dz = (math.exp(x * y) - delta * z) * dt
            return x + dx, y + dy, z + dz

        for i in range(numTraj):
            fullTraj = np.zeros((integSteps, 3))
            fullTraj[0] = initPos[i]
            for j in range(1, integSteps):
                x[i], y[i], z[i] = yu_wang(x[i], y[i], z[i], dt)
                fullTraj[j] = x[i], y[i], z[i]
            trajectories[i] = fullTraj[::drawStride]

    # Figure setup
    fig = plt.figure()
    ax = plt.axes(projection='3d')
    ax.set_xlabel("X Axis")
    ax.set_ylabel("Y Axis")
    ax.set_zlabel("Z Axis")
    ax.set_title("%s Attractor" % (attractor))

    # Set the view angle
    if attractor == "Lorenz":
        ax.view_init(elev=30, azim=-60) # (also standard view angle)

    elif attractor == "Aizawa":
        ax.view_init(elev=45, azim=10)

    elif attractor == "Halvorsen":
        ax.view_init(elev=30, azim=45)

    elif attractor == "TSUCS2":
        ax.view_init(elev=20, azim=130)

    else:
        ax.view_init(elev=30, azim=-60)

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
        n = (i + 1) * pointsPerFrame
        for j in range(numTraj):
            ax.plot(trajectories[j][:n, 0], trajectories[j][:n, 1], trajectories[j][:n, 2], label="$(x_0, y_0, z_0) = (%.2f, %.2f, %.2f)$" % (initPos[j][0], initPos[j][1], initPos[j][2]))
        ax.legend(loc="upper right") # COMMENT OUT IF YOU DO NOT WANT A LEGEND IN YOUR ANIMATIONS
        plt.draw()

    ani = animation.FuncAnimation(fig, animate, frames=steps, interval=1, repeat=False)

    if save == True:
        ani.save("%s Attractor.gif" % (attractor), writer="pillow", fps=30, dpi=100)

    plt.show()
    
    print()
    continue

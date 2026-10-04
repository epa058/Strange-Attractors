// Strange attractor definitions for the live viewer.
//
// Each entry describes one system. The equations are written in GLSL (the shader language the GPU runs):
//   params  constants used by the equations
//   pre     optional helper variables (for example Chua's diode)
//   dx      vec4 of derivatives (dx/dt, dy/dt, dz/dt, dw/dt) for the state (x, y, z, w)
//   dxB     derivatives of a second state (x1, y1, z1); only Coupled Lorenz uses it, for its drive system
// The equations match Code.py. The remaining fields are numerical settings:
//   period  typical time for one loop around the attractor (sets the playback speed)
//   dtMax   largest RK4 step that keeps the attractor's shape and chaos in 32-bit floats
//   windowLoops  particles stop warming up at random times over this many loops; longer for weakly chaotic
//          systems, whose particles would otherwise stay bunched along one short stretch of trajectory
//   ic      starting point (as in Code.py); particles start here plus a tiny random nudge (jitter)
//   boundLo/boundHi  particles that leave this box (or become NaN) are respawned onto another particle
//   respawn optional: continually respawn particles in a box (for systems that are not chaotic)
//   poster  optional: Euler step size for the "poster look" option (a deliberate numerical artifact)
//   center/radius    framing for the camera; extent: size along x, y, z (used by the equal-axes option)

export const ATTRACTORS = [
  {
    name: "Aizawa",
    equations: "ẋ = (z − b)x − dy\nẏ = dx + (z − b)y\nż = c + az − z³/3 − (x² + y²)(1 + ez) + fzx³",
    params: `const float a = 0.95;
const float b = 0.7;
const float c = 0.6;
const float d = 3.5;
const float e = 0.25;
const float f = 0.1;`,
    dx: `vec4((z - b)*x - d*y, d*x + (z - b)*y, c + a*z - z*z*z/3.0 - (x*x + y*y)*(1.0 + e*z) + f*z*x*x*x, 0.0)`,
    period: 1.795, dtMax: 0.05, windowLoops: 49,
    ic: [0.1, 0.0, 0.0, 0.0],
    jitter: [0.00299, 0.00297, 0.00221, 0.001],
    boundLo: [-10.4623, -10.3706, -7.00928, -3.0], boundHi: [10.4492, 10.452, 8.49169, 3.0],
    center: [0.0211765, 0.0326682, 0.743213], radius: 2.287, extent: [2.861, 2.82, 2.189],
  },
  {
    name: "Anishchenko-Astakhov",
    equations: "ẋ = μx + y − xz\nẏ = −x\nż = −ηz + η·I(x)·x²,  I(x) = 1 if x > 0 else 0",
    params: `const float mu = 1.2;
const float eta = 0.5;`,
    pre: `float I = step(0.0, x);`,
    dx: `vec4(mu*x + y - x*z, -x, -eta*z + eta*I*x*x, 0.0)`,
    period: 7.501, dtMax: 0.1, windowLoops: 54,
    ic: [1.0, 0.0, 0.0, 0.0],
    jitter: [0.00836, 0.00908, 0.00443, 0.001],
    boundLo: [-29.0889, -29.1413, -13.1857, -3.0], boundHi: [29.4004, 34.3965, 17.8467, 3.0],
    center: [-0.0667535, 2.58785, 2.28569], radius: 6.32, extent: [7.812, 8.946, 4.328],
  },
  {
    name: "Arneodo",
    equations: "ẋ = y\nẏ = z\nż = −ax − by − z + dx³",
    params: `const float a = -5.5;
const float b = 3.5;
const float d = -1.0;`,
    dx: `vec4(y, z, -a*x - b*y - z + d*x*x*x, 0.0)`,
    period: 5.459, dtMax: 0.1, windowLoops: 20,
    ic: [0.1, 0.0, 0.0, 0.0],
    jitter: [0.00706, 0.0118, 0.0224, 0.001],
    boundLo: [-24.7295, -41.3068, -78.4466, -3.0], boundHi: [24.7207, 41.4106, 78.6711, 3.0],
    center: [-0.00239068, 0.017265, 0.0326267], radius: 11.78, extent: [6.823, 10.68, 19.86],
  },
  {
    name: "Burke-Shaw",
    equations: "ẋ = −s(x + y)\nẏ = −y − sxz\nż = sxy + v",
    params: `const float s = 10.0;
const float v = 4.272;`,
    dx: `vec4(-s*(x + y), -y - s*x*z, s*x*y + v, 0.0)`,
    period: 1.456, dtMax: 0.02, windowLoops: 20,
    ic: [1.0, 0.0, 0.0, 0.0],
    jitter: [0.00337, 0.00447, 0.0037, 0.001],
    boundLo: [-11.7907, -15.6445, -12.96, -3.0], boundHi: [11.7971, 15.6323, 12.9428, 3.0],
    center: [-0.0165235, 0.0288576, 0.0136692], radius: 3.113, extent: [3.151, 4.077, 3.494],
  },
  {
    name: "Chen-Celikovsky",
    equations: "ẋ = a(y − x)\nẏ = (c − a)x − xz + cy\nż = xy − bz",
    params: `const float a = 35.0;
const float b = 3.0;
const float c = 28.0;`,
    dx: `vec4(a*(y - x), (c - a)*x - x*z + c*y, x*y - b*z, 0.0)`,
    period: 0.5373, dtMax: 0.02, windowLoops: 20,
    ic: [1.0, 1.0, 1.0, 0.0],
    jitter: [0.0491, 0.0563, 0.046, 0.001],
    boundLo: [-169.991, -194.509, -132.891, -3.0], boundHi: [173.681, 199.469, 189.054, 3.0],
    center: [0.670639, 0.686279, 25.6617], radius: 35.09, extent: [40.35, 45.12, 35.5],
  },
  {
    name: "Chen-Lee",
    equations: "ẋ = ax − yz\nẏ = by + xz\nż = cz + xy/3",
    params: `const float a = 5.0;
const float b = -10.0;
const float c = -0.38;`,
    dx: `vec4(a*x - y*z, b*y + x*z, c*z + x*y/3.0, 0.0)`,
    period: 1.581, dtMax: 0.05, windowLoops: 29,
    ic: [1.0, 1.0, 1.0, 0.0],
    jitter: [0.0298, 0.0243, 0.01, 0.001],
    boundLo: [-104.153, -85.1132, -25.8668, -3.0], boundHi: [104.152, 85.1189, 44.1033, 3.0],
    center: [0.0222543, 0.0348332, 8.99693], radius: 18.77, extent: [28.29, 22.71, 9.683],
  },
  {
    name: "Chua",
    equations: "ẋ = a(y − x − G(x))\nẏ = b(x − y + z)\nż = −cy\nG(x) = m₁x + ½(m₀ − m₁)(|x + 1| − |x − 1|)",
    params: `const float a = 15.6;
const float b = 1.0;
const float c = 25.58;
const float m0 = -1.1428571428571428;
const float m1 = -0.7142857142857143;`,
    pre: `float G = m1*x + 0.5*(m0 - m1)*(abs(x + 1.0) - abs(x - 1.0));`,
    dx: `vec4(a*(y - x - G), b*(x - y + z), -c*y, 0.0)`,
    period: 4.291, dtMax: 0.1, windowLoops: 20,
    ic: [0.7, 0.0, 0.0, 0.0],
    jitter: [0.00459, 0.000817, 0.00722, 0.001],
    boundLo: [-16.0762, -2.86018, -25.2674, -3.0], boundHi: [16.0761, 2.85989, 25.2649, 3.0],
    center: [-0.000442924, 0.000147053, -0.000119337], radius: 4.194, extent: [4.522, 0.7834, 7.022],
  },
  {
    name: "Coullet",
    equations: "ẋ = y\nẏ = z\nż = ax + by + cz + dx³",
    params: `const float a = 0.8;
const float b = -1.1;
const float c = -0.45;
const float d = -1.0;`,
    dx: `vec4(y, z, a*x + b*y + c*z + d*x*x*x, 0.0)`,
    period: 8.589, dtMax: 0.05, windowLoops: 20,
    ic: [0.1, 0.0, 0.0, 0.0],
    jitter: [0.0027, 0.00244, 0.00251, 0.001],
    boundLo: [-9.44475, -8.55075, -8.78756, -3.0], boundHi: [9.44453, 8.54911, 8.78436, 3.0],
    center: [0.00014949, 0.00197109, -5.91092e-05], radius: 2.071, extent: [2.624, 2.267, 2.265],
  },
  {
    name: "Coupled Lorenz",
    equations: "Response (shown):\nẋ = σ(y − x) + k(x₁ − x)\nẏ = ρ₂x − y − xz\nż = xy − βz\nDrive:\nẋ₁ = σ(y₁ − x₁)\nẏ₁ = ρ₁x₁ − y₁ − x₁z₁\nż₁ = x₁y₁ − βz₁",
    params: `const float sigma = 10.0;
const float beta = 2.6666666666666665;
const float rho1 = 35.0;
const float rho2 = 1.15;
const float k = 2.85;`,
    dx: `vec4(sigma*(y - x) + k*(x1 - x), rho2*x - y - x*z, x*y - beta*z, 0.0)`,
    dxB: `vec4(sigma*(y1 - x1), rho1*x1 - y1 - x1*z1, x1*y1 - beta*z1, 0.0)`,
    period: 2.327, dtMax: 0.1, windowLoops: 20,
    ic: [1.0, 1.0, 1.0, 0.0], icB: [1.0, 1.0, 1.0],
    jitter: [0.00875, 0.00218, 0.00104, 0.001], jitterB: [0.0436, 0.0627, 0.0555],
    boundLo: [-30.6861, -7.64695, -3.12957, -3.0], boundHi: [30.5518, 7.64439, 4.1208, 3.0],
    boundLoB: [-152.873, -220.174, -162.711], boundHiB: [152.036, 218.385, 225.863],
    center: [-0.00182569, -0.00277267, 0.486225], radius: 4.101, extent: [7.853, 2.148, 1.002],
  },
  {
    name: "Dadras",
    equations: "ẋ = y − ax + byz\nẏ = cy − xz + z\nż = dxy − ez",
    params: `const float a = 3.0;
const float b = 2.7;
const float c = 1.7;
const float d = 2.0;
const float e = 9.0;`,
    dx: `vec4(y - a*x + b*y*z, c*y - x*z + z, d*x*y - e*z, 0.0)`,
    period: 3.026, dtMax: 0.005, windowLoops: 20,
    ic: [1.0, 1.0, 1.0, 0.0],
    jitter: [0.0362, 0.0195, 0.026, 0.001],
    boundLo: [-125.302, -70.2406, -92.2826, -3.0], boundHi: [128.121, 66.0842, 89.3729, 3.0],
    center: [0.683398, -0.82336, 0.377677], radius: 13.53, extent: [19.92, 13.72, 12.14],
  },
  {
    name: "Four-Wing",
    equations: "ẋ = ax − byz\nẏ = −cy + xz\nż = kx − dz + xy",
    params: `const float a = 4.0;
const float b = 6.0;
const float c = 10.0;
const float d = 5.0;
const float k = 1.0;`,
    dx: `vec4(a*x - b*y*z, -c*y + x*z, k*x - d*z + x*y, 0.0)`,
    period: 0.9677, dtMax: 0.002, windowLoops: 20,
    ic: [1.0, 1.0, 1.0, 0.0],
    jitter: [0.0896, 0.0333, 0.0394, 0.001],
    boundLo: [-315.104, -115.428, -138.461, -3.0], boundHi: [312.091, 117.785, 137.158, 3.0],
    center: [0.147868, 0.421494, 0.0506884], radius: 33.09, extent: [58.88, 19.21, 23.3],
  },
  {
    name: "Generalized Chua (n=3)",
    equations: "ẋ = α(y − h(x))\nẏ = x − y + z\nż = −βy − γz\nh(x): piecewise-linear diode, 5 breakpoints (3 double scrolls)",
    params: `const float alpha = 9.0;
const float beta = 14.286;
const float gamma = 0.0;
const float s0 = -0.14285714285714285;
const float s1 = 0.2857142857142857;
const float s2 = -0.5714285714285714;
const float s3 = 0.2857142857142857;
const float s4 = -0.5714285714285714;
const float s5 = 0.2857142857142857;`,
    pre: `float h = s5*x + 0.5*(s0 - s1)*(abs(x + 1.0) - abs(x - 1.0)) + 0.5*(s1 - s2)*(abs(x + 2.15) - abs(x - 2.15)) + 0.5*(s2 - s3)*(abs(x + 3.6) - abs(x - 3.6)) + 0.5*(s3 - s4)*(abs(x + 8.2) - abs(x - 8.2)) + 0.5*(s4 - s5)*(abs(x + 13.0) - abs(x - 13.0));`,
    dx: `vec4(alpha*(y - h), x - y + z, -beta*y - gamma*z, 0.0)`,
    period: 2.398, dtMax: 0.1, windowLoops: 20,
    ic: [0.1, 0.0, 0.0, 0.0],
    jitter: [0.0584, 0.00944, 0.0805, 0.001],
    boundLo: [-204.609, -32.9498, -281.346, -3.0], boundHi: [204.277, 33.1576, 282.211, 3.0],
    center: [-2.60786, 0.367998, 5.79345], radius: 42.18, extent: [51.94, 8.02, 66.0],
  },
  {
    name: "Genesio-Tesi",
    equations: "ẋ = y\nẏ = z\nż = −cx − by − az + x²",
    params: `const float a = 0.44;
const float b = 1.1;
const float c = 1.0;`,
    dx: `vec4(y, z, -c*x - b*y - a*z + x*x, 0.0)`,
    period: 8.53, dtMax: 0.1, windowLoops: 20,
    ic: [0.1, 0.1, 0.1, 0.0],
    jitter: [0.00168, 0.00153, 0.00166, 0.001],
    boundLo: [-5.54124, -5.22162, -5.75105, -3.0], boundHi: [6.24143, 5.52039, 5.90125, 3.0],
    center: [0.34598, 0.145231, 0.0664531], radius: 1.375, extent: [1.646, 1.488, 1.624],
  },
  {
    name: "Hadley",
    equations: "ẋ = −y² − z² − ax + aF\nẏ = xy − bxz − y + G\nż = bxy + xz − z",
    params: `const float a = 0.25;
const float b = 4.0;
const float F = 8.0;
const float G = 1.0;`,
    dx: `vec4(-y*y - z*z - a*x + a*F, x*y - b*x*z - y + G, b*x*y + x*z - z, 0.0)`,
    period: 2.44, dtMax: 0.1, windowLoops: 21,
    ic: [0.1, 0.0, 0.0, 0.0],
    jitter: [0.00298, 0.00435, 0.00418, 0.001],
    boundLo: [-9.5397, -15.1354, -14.6074, -3.0], boundHi: [11.3437, 15.3481, 14.6837, 3.0],
    center: [0.912946, 0.0736014, 0.111346], radius: 3.057, extent: [2.691, 3.894, 3.87],
  },
  {
    name: "Halvorsen",
    equations: "ẋ = −ax − 4y − 4z − y²\nẏ = −ay − 4z − 4x − z²\nż = −az − 4x − 4y − x²",
    params: `const float a = 1.4;`,
    dx: `vec4(-a*x - 4.0*y - 4.0*z - y*y, -a*y - 4.0*z - 4.0*x - z*z, -a*z - 4.0*x - 4.0*y - x*x, 0.0)`,
    period: 1.513, dtMax: 0.05, windowLoops: 20,
    ic: [1.0, 0.0, 0.0, 0.0],
    jitter: [0.0197, 0.0197, 0.0197, 0.001],
    boundLo: [-72.3277, -72.3531, -72.3358, -3.0], boundHi: [65.36, 65.388, 65.3667, 3.0],
    poster: { dt: 0.005 }, // optional coarse-Euler "poster look": a numerical artifact that spirals into the centre
    center: [-3.29348, -3.36088, -3.20964], radius: 16.2, extent: [18.78, 18.74, 18.6],
  },
  {
    name: "Liu-Chen",
    equations: "ẋ = ay + bx + cyz\nẏ = dy − z + exz\nż = fz + gxy",
    params: `const float a = 2.4;
const float b = -3.78;
const float c = 14.0;
const float d = -11.0;
const float e = 4.0;
const float f = 5.58;
const float g = -1.0;`,
    dx: `vec4(a*y + b*x + c*y*z, d*y - z + e*x*z, f*z + g*x*y, 0.0)`,
    period: 0.7959, dtMax: 0.02, windowLoops: 41,
    ic: [1.0, 3.0, 5.0, 0.0],
    jitter: [0.0161, 0.014, 0.00746, 0.001],
    boundLo: [-64.5269, -48.9132, -26.0927, -3.0], boundHi: [48.0471, 48.8358, 26.108, 3.0],
    center: [-6.82874, 0.160071, -0.121358], radius: 8.707, extent: [13.08, 9.87, 5.903],
  },
  {
    name: "Lorenz",
    equations: "ẋ = σ(y − x)\nẏ = x(ρ − z) − y\nż = xy − βz",
    params: `const float sigma = 10.0;
const float rho = 28.0;
const float beta = 2.6666666666666665;`,
    dx: `vec4(sigma*(y - x), x*(rho - z) - y, x*y - beta*z, 0.0)`,
    period: 1.133, dtMax: 0.05, windowLoops: 20,
    ic: [1.0, 1.0, 1.0, 0.0],
    jitter: [0.0373, 0.0509, 0.0423, 0.001],
    boundLo: [-130.682, -178.028, -123.089, -3.0], boundHi: [130.658, 177.994, 172.888, 3.0],
    center: [-0.0400544, -0.0641891, 23.7634], radius: 32.42, extent: [32.55, 42.03, 37.11],
  },
  {
    name: "Lorenz Mod 1",
    equations: "ẋ = −ax + y² − z² + ac\nẏ = x(y − bz) + d\nż = −z + x(by + z)",
    params: `const float a = 0.1;
const float b = 4.0;
const float c = 14.0;
const float d = 0.08;`,
    dx: `vec4(-a*x + y*y - z*z + a*c, x*(y - b*z) + d, -z + x*(b*y + z), 0.0)`,
    period: 1.422, dtMax: 0.02, windowLoops: 20,
    ic: [0.0, 1.0, 0.0, 0.0],
    jitter: [0.0121, 0.0164, 0.0229, 0.001],
    boundLo: [-42.2722, -58.142, -81.1328, -3.0], boundHi: [42.7134, 56.6283, 79.1041, 3.0],
    center: [0.247459, -0.39573, -0.275341], radius: 10.56, extent: [8.804, 11.01, 15.72],
  },
  {
    name: "Lorenz Mod 2",
    equations: "ẋ = −ax + y² − z² + ac\nẏ = x(y − bz) + d\nż = −z + x(by + z)",
    params: `const float a = 0.9;
const float b = 5.0;
const float c = 9.9;
const float d = 1.0;`,
    dx: `vec4(-a*x + y*y - z*z + a*c, x*(y - b*z) + d, -z + x*(b*y + z), 0.0)`,
    period: 0.5432, dtMax: 0.02, windowLoops: 20,
    ic: [-0.1, 0.0, 0.0, 0.0],
    jitter: [0.015, 0.0227, 0.03, 0.001],
    boundLo: [-52.0625, -78.5962, -103.928, -3.0], boundHi: [52.6798, 80.3639, 106.366, 3.0],
    center: [0.286188, 0.773152, 0.937491], radius: 16.74, extent: [11.4, 18.85, 25.22],
  },
  {
    name: "Lu Chen",
    equations: "ẋ = −abx/(a + b) − yz + c\nẏ = xz + ay\nż = bz + xy",
    params: `const float a = -10.0;
const float b = -4.0;
const float c = 18.1;`,
    dx: `vec4(-a*b*x/(a + b) - y*z + c, x*z + a*y, b*z + x*y, 0.0)`,
    period: 0.9086, dtMax: 0.02, windowLoops: 30,
    ic: [1.0, 1.0, 1.0, 0.0],
    jitter: [0.0334, 0.0261, 0.0213, 0.001],
    boundLo: [-112.393, -86.0844, -62.6192, -3.0], boundHi: [121.706, 96.5261, 86.4352, 3.0],
    center: [4.62133, 4.94299, 11.4551], radius: 22.74, extent: [32.35, 24.71, 20.28],
  },
  {
    name: "Newton-Leipnik",
    equations: "ẋ = −ax + y + 10yz\nẏ = −x − 0.4y + 5xz\nż = bz − 5xy",
    params: `const float a = 0.4;
const float b = 0.175;`,
    dx: `vec4(-a*x + y + 10.0*y*z, -x - 0.4*y + 5.0*x*z, b*z - 5.0*x*y, 0.0)`,
    period: 9.396, dtMax: 0.1, windowLoops: 20,
    ic: [0.349, 0.0, -0.16, 0.0],
    jitter: [0.00157, 0.000607, 0.000591, 0.001],
    boundLo: [-5.49312, -2.13328, -1.86231, -3.0], boundHi: [5.46286, 2.11422, 2.2757, 3.0],
    center: [-0.0071226, 5.21196e-05, 0.224075], radius: 0.7209, extent: [1.296, 0.4361, 0.4571],
  },
  {
    name: "Nose-Hoover",
    equations: "ẋ = y\nẏ = −x + yz\nż = a − y²\n(starts in the chaotic sea; other starts lie on smooth tori)",
    params: `const float a = 1.5;`,
    dx: `vec4(y, -x + y*z, a - y*y, 0.0)`,
    period: 14.54, dtMax: 0.1, windowLoops: 70,
    ic: [0.0, 5.0, 0.0, 0.0],
    jitter: [0.00926, 0.0105, 0.00959, 0.001],
    boundLo: [-32.3847, -37.0494, -33.5887, -3.0], boundHi: [32.4628, 36.5782, 33.5388, 3.0],
    center: [0.0179597, -0.133429, -0.0138832], radius: 6.769, extent: [7.815, 7.764, 7.869],
  },
  {
    name: "Qi",
    equations: "ẋ = a(y − x) + yz\nẏ = b(x + y) − xz\nż = −cz − ew + xy\nẇ = −dw + fz + xy   (4D, showing x, y, z)",
    params: `const float a = 50.0;
const float b = 24.0;
const float c = 13.0;
const float d = 8.0;
const float e = 33.0;
const float f = 30.0;`,
    dx: `vec4(a*(y - x) + y*z, b*(x + y) - x*z, -c*z - e*w + x*y, -d*w + f*z + x*y)`,
    period: 0.0919, dtMax: 0.001, windowLoops: 20,
    ic: [0.1, 0.1, 0.1, 1.0],
    jitter: [0.692, 0.785, 1.57, 2.38],
    boundLo: [-2421.7, -2743.99, -5870.45, -7812.08], boundHi: [2425.32, 2747.75, 5143.11, 8851.99],
    center: [-1.68391, 13.8683, -276.409], radius: 696.9, extent: [457.9, 461.2, 1233.0],
  },
  {
    name: "Qi-Chen",
    equations: "ẋ = a(y − x) + yz\nẏ = cx + y − xz\nż = xy − bz",
    params: `const float a = 38.0;
const float b = 2.6666666666666665;
const float c = 80.0;`,
    dx: `vec4(a*(y - x) + y*z, c*x + y - x*z, x*y - b*z, 0.0)`,
    period: 0.3554, dtMax: 0.002, windowLoops: 20,
    ic: [1.0, 1.0, 1.0, 0.0],
    jitter: [0.177, 0.0831, 0.0779, 0.001],
    boundLo: [-617.69, -288.778, -191.057, -3.0], boundHi: [623.935, 292.724, 354.338, 3.0],
    center: [-1.78597, -1.08479, 78.3615], radius: 73.95, extent: [126.1, 54.23, 55.09],
  },
  {
    name: "Rayleigh-Benard",
    equations: "ẋ = −ax + ay\nẏ = rx − y − xz\nż = xy − bz\n(r = 12: spirals into two fixed points; particles are continually respawned)",
    params: `const float a = 9.0;
const float r = 12.0;
const float b = 5.0;`,
    dx: `vec4(-a*x + a*y, r*x - y - x*z, x*y - b*z, 0.0)`,
    period: 0.7, dtMax: 0.01,
    ic: [10.0, 10.0, 10.0, 0.0],
    jitter: [0.03, 0.03, 0.025, 0.001],
    boundLo: [-105.0, -105.0, -75.0, -3.0], boundHi: [105.0, 105.0, 100.0, 3.0],
    respawn: {"rate": 0.05, "boxLo": [-15.0, -15.0, 0.0], "boxHi": [15.0, 15.0, 25.0]},
    center: [0.0, 0.0, 12.5], radius: 24.62, extent: [30.0, 30.0, 25.0],
  },
  {
    name: "Rossler",
    equations: "ẋ = −(y + z)\nẏ = x + ay\nż = b + z(x − c)",
    params: `const float a = 0.2;
const float b = 0.2;
const float c = 5.7;`,
    dx: `vec4(-(y + z), x + a*y, b + z*(x - c), 0.0)`,
    period: 9.46, dtMax: 0.1, windowLoops: 20,
    ic: [1.0, 1.0, 1.0, 0.0],
    jitter: [0.0205, 0.0186, 0.0228, 0.001],
    boundLo: [-70.7087, -66.6809, -68.3608, -3.0], boundHi: [73.0347, 63.7304, 91.1793, 3.0],
    center: [1.08942, -1.4477, 9.37514], radius: 16.46, extent: [20.01, 18.25, 18.72],
  },
  {
    name: "Rucklidge",
    equations: "ẋ = −kx + ay − yz\nẏ = x\nż = −z + y²",
    params: `const float k = 2.0;
const float a = 6.7;`,
    dx: `vec4(-k*x + a*y - y*z, x, -z + y*y, 0.0)`,
    period: 7.159, dtMax: 0.1, windowLoops: 20,
    ic: [1.0, 0.0, 4.5, 0.0],
    jitter: [0.0196, 0.011, 0.015, 0.001],
    boundLo: [-68.5709, -38.4466, -44.7011, -3.0], boundHi: [68.8857, 38.3754, 60.2064, 3.0],
    center: [-0.0906822, 0.0225436, 7.37612], radius: 11.47, extent: [15.69, 10.0, 13.41],
  },
  {
    name: "Sakarya",
    equations: "ẋ = −x + y + yz\nẏ = −x − y + axz\nż = z − bxy",
    params: `const float a = 0.4;
const float b = 0.3;`,
    dx: `vec4(-x + y + y*z, -x - y + a*x*z, z - b*x*y, 0.0)`,
    period: 4.735, dtMax: 0.02, windowLoops: 20,
    ic: [1.0, -1.0, 1.0, 0.0],
    jitter: [0.0558, 0.0297, 0.0248, 0.001],
    boundLo: [-193.819, -103.632, -84.8352, -3.0], boundHi: [196.902, 103.987, 88.8547, 3.0],
    center: [0.237666, 0.0944746, 2.44327], radius: 20.93, extent: [35.82, 16.58, 13.95],
  },
  {
    name: "Shimizu-Morioka",
    equations: "ẋ = y\nẏ = (1 − z)x − ay\nż = x² − bz",
    params: `const float a = 0.75;
const float b = 0.45;`,
    dx: `vec4(y, (1.0 - z)*x - a*y, x*x - b*z, 0.0)`,
    period: 15.09, dtMax: 0.1, windowLoops: 20,
    ic: [0.1, 0.0, 0.0, 0.0],
    jitter: [0.00275, 0.00193, 0.00225, 0.001],
    boundLo: [-9.62729, -6.74336, -6.74048, -3.0], boundHi: [9.62604, 6.74389, 9.01982, 3.0],
    center: [-0.01159, 0.0174399, 1.1068], radius: 1.85, extent: [2.57, 1.642, 2.095],
  },
  {
    name: "Thomas",
    equations: "ẋ = sin y − bx\nẏ = sin z − by\nż = sin x − bz",
    params: `const float b = 0.208186;`,
    dx: `vec4(sin(y) - b*x, sin(z) - b*y, sin(x) - b*z, 0.0)`,
    period: 12.69, dtMax: 0.1, windowLoops: 41,
    ic: [1.1, 1.1, -0.01, 0.0],
    jitter: [0.00493, 0.00493, 0.00493, 0.001],
    boundLo: [-15.8998, -15.9013, -15.9027, -3.0], boundHi: [18.6057, 18.6061, 18.6079, 3.0],
    center: [1.37975, 1.35917, 1.36153], radius: 4.167, extent: [4.795, 4.814, 4.824],
  },
  {
    name: "TSUCS1",
    equations: "ẋ = a(y − x) + dxz\nẏ = fy − xz\nż = bz + xy − ex²",
    params: `const float a = 40.0;
const float b = 0.833;
const float d = 0.5;
const float e = 0.65;
const float f = 20.0;`,
    dx: `vec4(a*(y - x) + d*x*z, f*y - x*z, b*z + x*y - e*x*x, 0.0)`,
    period: 0.3697, dtMax: 0.01, windowLoops: 150,
    ic: [1.0, 1.0, 1.0, 0.0],
    jitter: [0.137, 0.133, 0.0826, 0.001],
    boundLo: [-478.165, -465.931, -255.548, -3.0], boundHi: [478.207, 465.92, 322.379, 3.0],
    center: [-0.022411, -0.0479411, 33.2735], radius: 96.28, extent: [125.0, 121.9, 81.21],
  },
  {
    name: "TSUCS2",
    equations: "ẋ = a(y − x) + dxz\nẏ = bx − xz + fy\nż = cz + xy − ex²",
    params: `const float a = 40.0;
const float b = 55.0;
const float c = 1.8333333333333333;
const float d = 0.16;
const float e = 0.65;
const float f = 20.0;`,
    dx: `vec4(a*(y - x) + d*x*z, b*x - x*z + f*y, c*z + x*y - e*x*x, 0.0)`,
    period: 0.1421, dtMax: 0.005, windowLoops: 137,
    ic: [1.0, 1.0, 1.0, 0.0],
    jitter: [0.269, 0.353, 0.273, 0.001],
    boundLo: [-941.062, -1233.85, -856.252, -3.0], boundHi: [941.21, 1233.92, 1054.79, 3.0],
    center: [-0.201512, 0.251479, 100.033], radius: 247.9, extent: [255.4, 332.4, 264.8],
  },
  {
    name: "Wang-Sun",
    equations: "ẋ = ax + cyz\nẏ = bx + dy − xz\nż = ez + fxy",
    params: `const float a = 0.2;
const float b = -0.01;
const float c = 1.0;
const float d = -0.4;
const float e = -1.0;
const float f = -1.0;`,
    dx: `vec4(a*x + c*y*z, b*x + d*y - x*z, e*z + f*x*y, 0.0)`,
    period: 25.61, dtMax: 0.05, windowLoops: 20,
    ic: [0.5, 0.1, 0.1, 0.0],
    jitter: [0.00559, 0.00538, 0.00436, 0.001],
    boundLo: [-19.3917, -18.6742, -15.5264, -3.0], boundHi: [19.7065, 18.9881, 15.0153, 3.0],
    center: [0.0182923, 0.0205525, 0.188271], radius: 2.836, extent: [3.834, 3.433, 2.384],
  },
  {
    name: "Wimol-Banlue",
    equations: "ẋ = y − x\nẏ = −z·tanh(x)\nż = −a + xy + |y|",
    params: `const float a = 2.0;`,
    dx: `vec4(y - x, -z*tanh(x), -a + x*y + abs(y), 0.0)`,
    period: 7.88, dtMax: 0.1, windowLoops: 20,
    ic: [1.0, 0.0, 0.0, 0.0],
    jitter: [0.00573, 0.00864, 0.0135, 0.001],
    boundLo: [-20.0158, -30.1773, -46.0018, -3.0], boundHi: [20.07, 30.2802, 48.1526, 3.0],
    center: [-0.0818971, -0.134805, 0.913062], radius: 7.01, extent: [4.627, 6.583, 11.48],
  },
  {
    name: "Yu-Wang",
    equations: "ẋ = a(y − x)\nẏ = bx − cxz\nż = e^(xy) − dz",
    params: `const float a = 10.0;
const float b = 40.0;
const float c = 2.0;
const float d = 2.5;`,
    dx: `vec4(a*(y - x), b*x - c*x*z, exp(x*y) - d*z, 0.0)`,
    period: 0.7725, dtMax: 0.01, windowLoops: 20,
    ic: [1.0, 1.0, 1.0, 0.0],
    jitter: [0.0044, 0.00801, 0.0451, 0.001],
    boundLo: [-15.3966, -28.1011, -130.92, -3.0], boundHi: [15.3967, 27.9855, 184.568, 3.0],
    center: [0.0014643, -0.0319157, 24.3659], radius: 18.2, extent: [4.377, 7.086, 35.44],
  },];

// Build the GLSL derivative function for one attractor.
export function derivGLSL(att) {
  return `
void deriv(in vec4 A, in vec4 B, out vec4 dA, out vec4 dB) {
  float x = A.x, y = A.y, z = A.z, w = A.w;
  float x1 = B.x, y1 = B.y, z1 = B.z;
${att.params.split('\n').map((l) => '  ' + l).join('\n')}
${(att.pre || '').split('\n').map((l) => '  ' + l).join('\n')}
  dA = ${att.dx};
  dB = ${att.dxB || 'vec4(0.0)'};
}`;
}

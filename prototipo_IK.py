import numpy as np

def dh_transform(alpha, a, d, theta):
    """Retorna a matriz de transformação homogênea A_i para os parâmetros DH fornecidos."""
    alpha, theta = np.radians(alpha), np.radians(theta)
    return np.array([
        [np.cos(theta), -np.sin(theta)*np.cos(alpha),  np.sin(theta)*np.sin(alpha), a*np.cos(theta)],
        [np.sin(theta),  np.cos(theta)*np.cos(alpha), -np.cos(theta)*np.sin(alpha), a*np.sin(theta)],
        [0,              np.sin(alpha),                np.cos(alpha),               d],
        [0,              0,                           0,                           1]
    ])

def forward_kinematics(DH_params, angulos=[0, 0, 0, 0, 0, 0]):

    # Corrige para não depender de variável global "DH"
    params = [row.copy() for row in DH_params]
    for i in range(min(len(params), len(angulos))):
        params[i][3] = angulos[i]

    T = np.eye(4)
    for (alpha, a, d, theta) in params:
        A = dh_transform(alpha, a, d, theta)
        T = T @ A
    return T

def inverse_kinematics(DH_params, T06, angulos):
    # Parâmetros DH
    params = [row.copy() for row in DH_params]
    a1, a2, a3, d1, d4, d6 = params[0][1], params[1][1], params[2][1], params[0][2], params[3][2], params[5][2]

    pwc = [T06[0, 3] - d6 * T06[0, 2], T06[1, 3] - d6 * T06[1, 2], T06[2, 3] - d6 * T06[2, 2]]
    Pwc = np.array(pwc)

    theta1 = np.arctan2(Pwc[1], Pwc[0])

    # TRATAMENTO PARA SEMPRE PEGAR O THETA1 MAIS PROXIMO DO THETA1 ANTERIOR
    if theta1 < 0:
        theta1 += 2 * np.pi
    if theta1 > np.pi:
        theta1 -= np.pi
    if abs(theta1 - np.radians(angulos[0])) > abs(theta1 + np.pi - np.radians(angulos[0])):
        theta1 += np.pi

    r = np.sqrt(Pwc[0]**2 + Pwc[1]**2) - a1
    s = Pwc[2] - d1

    # Comprimento efetivo do elo 3 e offset entre ângulo planar e θ3 DH
    L3 = np.hypot(a3, d4)
    beta = np.arctan2(d4, a3) if not (abs(a3) < 1e-12 and abs(d4) < 1e-12) else 0.0

    # Lei dos cossenos (use L3)
    D = (r**2 + s**2 - a2**2 - L3**2) / (2 * a2 * L3)
    D = np.clip(D, -1.0, 1.0)  # evita NaN numérico

    # Ângulo do triângulo (planar) θ3' (duas soluções)
    theta3p_a = np.arctan2(np.sqrt(1 - D**2), D)
    theta3p_b = np.arctan2(-np.sqrt(1 - D**2), D)

    # θ2 usa θ3' na componente geométrica
    theta2a = np.arctan2(s, r) - np.arctan2(L3 * np.sin(theta3p_a), a2 + L3 * np.cos(theta3p_a))
    theta2b = np.arctan2(s, r) - np.arctan2(L3 * np.sin(theta3p_b), a2 + L3 * np.cos(theta3p_b))

    # Converte para θ3 DH aplicando o offset beta
    theta3a = theta3p_a - beta
    theta3b = theta3p_b - beta

    if abs(theta2a - np.radians(angulos[1])) > abs(theta2b - np.radians(angulos[1])):
        theta2 = theta2b  # escolhe a solução mais próxima do ângulo anterior
        theta3 = theta3b
    else:
        theta2 = theta2a
        theta3 = theta3a

    # -------- Orientação: resolver θ4, θ5 e θ6 --------
    R06 = T06[:3, :3]

    # T03 com θ1, θ2, θ3 encontrados
    T03 = np.eye(4)
    th123_deg = [np.degrees(theta1), np.degrees(theta2), np.degrees(theta3)]
    for i in range(3):
        alpha, a, d, _ = params[i]
        T03 = T03 @ dh_transform(alpha, a, d, th123_deg[i])
    R03 = T03[:3, :3]

    # R36 = R03^T * R06
    R36 = R03.T @ R06

    # Extração robusta considerando a convenção DH usada (α4=+90, α5=−90, α6=0)
    eps = 1e-9
    s5_mag = np.hypot(R36[2, 0], R36[2, 1])
    theta5 = np.arctan2(s5_mag, R36[2, 2])

    if s5_mag > eps:
        # c4 = -R36[0,2]/s5, s4 = -R36[1,2]/s5
        c4 = -R36[0, 2] / s5_mag
        s4 = -R36[1, 2] / s5_mag
        theta4 = np.arctan2(s4, c4)

        # c6 = R36[2,0]/s5, s6 = -R36[2,1]/s5
        c6 = R36[2, 0] / s5_mag
        s6 = -R36[2, 1] / s5_mag
        theta6 = np.arctan2(s6, c6)
    else:
        # Singularidade do punho: θ5 ≈ 0 -> apenas θ4+θ6 é observável
        theta5 = 0.0 if R36[2, 2] > 0 else np.pi
        phi = np.arctan2(R36[1, 0], R36[0, 0])  # φ = θ4 + θ6
        # Mantenha θ4 próximo do anterior e ajuste θ6
        theta4 = np.radians(angulos[3])
        theta6 = phi - theta4

    # Escolha da solução equivalente mais próxima do estado anterior
    prev = np.radians(angulos)

    def bring_close(th, th_prev):
        return th + 2*np.pi * np.round((th_prev - th) / (2*np.pi))

    sol1 = np.array([theta1, theta2, theta3, theta4, theta5, theta6])
    # Solução equivalente (θ4+π, -θ5, θ6+π) produz mesma orientação
    sol2 = np.array([theta1, theta2, theta3, theta4 + np.pi, -theta5, theta6 + np.pi])

    sol1_adj = np.array([bring_close(sol1[i], prev[i]) for i in range(6)])
    sol2_adj = np.array([bring_close(sol2[i], prev[i]) for i in range(6)])

    err1 = np.linalg.norm(sol1_adj[3:6] - prev[3:6])
    err2 = np.linalg.norm(sol2_adj[3:6] - prev[3:6])
    sol = sol1_adj if err1 <= err2 else sol2_adj

    return np.degrees(sol)

# === Exemplo de uso ===
if __name__ == "__main__":
    # Parâmetros DH (exemplo genérico)
    DH = [
        [90, 100, 330, 0]    # α1, a1, d1, θ1
        ,[0, 400, 0, 0]      # α2, a2, d2, θ2
        ,[-90, 0, 0, 0]      # α3, a3, d3, θ3
        ,[90, 0, 375, 0]     # α4, a4, d4, θ4
        ,[-90, 0, 0, 0]      # α5, a5, d5, θ5
        ,[0, 0, 200, 0]      # α6, a6, d6, θ6
    ]

    # input de ângulos (graus)
    angulos = [89.60009765625, 151.2, -167.76, 260.8001953125, -57.19995117187499, 235.20000000000007]

    T06 = forward_kinematics(DH, angulos)
    print("\nMatriz de transformação global (T06):")
    np.set_printoptions(precision=2, suppress=True)
    print(T06)

    T06[0,3]=340

    # IK completo [θ1..θ6]
    th_sol = inverse_kinematics(DH, T06, angulos)
    print("\nIK [θ1..θ6] (graus):")
    print(th_sol)


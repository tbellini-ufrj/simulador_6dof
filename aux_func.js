function ajustarAngulo(angulo) {
    return ((angulo % 360) + 360) % 360;
}

// Funcao para criar um slider com um campo de texto
function createSliderWithText(min, max, initialValue, onChange, labelText) {
    var container = new BABYLON.GUI.StackPanel();
    container.isVertical = true;
    container.height = "50px";
    container.width = "220px";

    var label = new BABYLON.GUI.TextBlock();
    label.text = labelText;
    label.height = "20px";
    label.color = "white";
    label.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    container.addControl(label);

    var sliderContainer = new BABYLON.GUI.StackPanel();
    sliderContainer.isVertical = false;
    sliderContainer.height = "30px";
    sliderContainer.width = "220px";

    var slider = new BABYLON.GUI.Slider();
    slider.minimum = min;
    slider.maximum = max;
    slider.value = initialValue;
    slider.height = "20px";
    slider.width = "150px";
    slider.color = "white";
    slider.background = "gray";
    slider.onValueChangedObservable.add(function (value) {
        inputText.text = value.toFixed(2);
        onChange(value);
    });

    var inputText = new BABYLON.GUI.InputText();
    inputText.width = "60px";
    inputText.text = initialValue.toFixed(2);
    inputText.color = "white";
    inputText.background = "gray";
    inputText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    inputText.onBlurObservable.add(function () {
        var value = parseFloat(inputText.text);
        if (!isNaN(value) && value >= min && value <= max) {
            slider.value = value;
            onChange(value);
        } else {
            inputText.text = slider.value.toFixed(2);
        }
    });

    sliderContainer.addControl(slider);
    sliderContainer.addControl(inputText);
    container.addControl(sliderContainer);

    return container;
}

var startRenderLoop = function (engine, canvas) {
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
}

function showAxis(scene, parent) {
    var axesViewer = new BABYLON.Debug.AxesViewer(scene, 100);
    if (parent) {
        axesViewer.xAxis.parent = parent;
        axesViewer.yAxis.parent = parent;
        axesViewer.zAxis.parent = parent;
    }
    return axesViewer;
}

function printMatrixToDataTab(mesh) {
    const matrix = mesh.getWorldMatrix().toArray();
    // Transpor a matriz 4x4
    let transposed = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            transposed[i * 4 + j] = matrix[j * 4 + i];
        }
    }

    let transformHtml = '<table border="1" style="border-collapse:collapse;text-align:center;margin:0 auto;">';
    for (let i = 0; i < 4; i++) {
        transformHtml += '<tr>';
        for (let j = 0; j < 4; j++) {
            const value = transposed[i * 4 + j].toFixed(2);

            const isRotation = (i < 3 && j < 3);   // R (3x3)
            const isPosition = (i < 3 && j === 3); // t = [x y z]^T
            const isBottomRow = (i === 3 && j < 3);
            const isOne = (i === 3 && j === 3);

            let bg = '#ffffff';
            if (isRotation) bg = '#dbeafe';     // azul claro
            else if (isPosition) bg = '#dcfce7';// verde claro
            else if (isBottomRow) bg = '#f3f4f6';// cinza claro
            else if (isOne) bg = '#fef3c7';     // amarelo claro

            transformHtml += `<td style="padding:4px;background:${bg};">${value}</td>`;
        }
        transformHtml += '</tr>';
    }
    transformHtml += '</table>';

    const transformLegendHtml = `
        <div style="margin-top:8px;font-size:12px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <div><span style="display:inline-block;width:12px;height:12px;background:#dbeafe;border:1px solid #999;margin-right:4px;"></span>Rotacao (R, 3x3)</div>
            <div><span style="display:inline-block;width:12px;height:12px;background:#dcfce7;border:1px solid #999;margin-right:4px;"></span>Posicao (x, y, z)</div>
            <div><span style="display:inline-block;width:12px;height:12px;background:#f3f4f6;border:1px solid #999;margin-right:4px;"></span>Linha homogênea</div>
            <div><span style="display:inline-block;width:12px;height:12px;background:#fef3c7;border:1px solid #999;margin-right:4px;"></span>Elemento [4,4] = 1</div>
        </div>
    `;

    // Montar tabela DH
    const dhParams = (typeof DH !== "undefined") ? DH : (window.DH || null);
    let dhHtml = '';
    if (dhParams && Array.isArray(dhParams)) {
        const scene = mesh.getScene ? mesh.getScene() : null;
        const jointNames = ['waist', 'arm1', 'arm2', 'wrist', 'hand', 'claw'];
        // obter ângulos atuais (em graus) das juntas, se os meshes existirem; caso contrário usar DH theta
        const jointAnglesDeg = dhParams.map((row, i) => {
            let val = row[3]; // valor theta no DH (deg)
            if (scene) {
                const m = scene.getMeshByName(jointNames[i]);
                if (m && m.rotation && typeof m.rotation.z === 'number') {
                    val = BABYLON.Tools.ToDegrees(m.rotation.z);
                }
            }
            return val;
        });

        dhHtml += '<table border="1" style="border-collapse:collapse;text-align:center;margin:0 auto;">';
        dhHtml += '<tr><th style="padding:3px;">i</th><th style="padding:3px;">α (deg)</th><th style="padding:3px;">a (mm)</th><th style="padding:3px;">d (mm)</th><th style="padding:3px;">θ (deg)</th></tr>';
        for (let i = 0; i < dhParams.length; i++) {
            const row = dhParams[i];
            const alpha = Number(row[0]).toFixed(2);
            const a = Number(row[1]).toFixed(2);
            const d = Number(row[2]).toFixed(2);
            const thetaDisplay = `<b>${Number(jointAnglesDeg[i]).toFixed(2)}</b>`;
            dhHtml += `<tr><td style="padding:3px;">${i+1}</td><td style="padding:3px;">${alpha}</td><td style="padding:3px;">${a}</td><td style="padding:3px;">${d}</td><td style="padding:3px;">${thetaDisplay}</td></tr>`;
        }
        dhHtml += '</table>';
    }

    document.querySelector('#tab-data').innerHTML = `
        <div style="display:flex;gap:0px;align-items:flex-start;padding:5px;">
            <div style="flex:1;min-width:300px;">
                <div style="padding:0px;">
                    <b>Matriz DH</b><br><br>
                    ${dhHtml}
                </div>
            </div>
            <div style="flex:1;min-width:300px;">
                <div style="padding:0px;">
                    <b>Matriz de transformacao global:</b><br><br>
                    ${transformHtml}
                    ${transformLegendHtml}
                </div>
            </div>
        </div>
    `;
}
// Desloca o ângulo em múltiplos de 2π para ficar o mais próximo possível do anterior
function bring_close(th, th_prev) {
    return th + 2*Math.PI * Math.round((th_prev - th) / (2*Math.PI));
}

// Ajusta cada ângulo da solucao aos limites das juntas (em graus).
// Juntas de volta completa (faixa >= 360) sao apenas aproximadas do ângulo anterior;
// juntas limitadas sao trazidas para dentro da faixa por múltiplos de 2π.
// Retorna null se algum ângulo nao couber nos limites.
function adjustSolutionToLimits(solution, prevAngles, jointLimitsDeg) {
    const TWO_PI = 2 * Math.PI;
    const adjusted = [];
    for (let i = 0; i < 6; i++) {
        let th = solution[i];
        const limits = jointLimitsDeg ? jointLimitsDeg[i] : null;
        if (!limits || (limits[1] - limits[0]) >= 360) {
            th = bring_close(th, prevAngles[i]);
        } else {
            const lo = BABYLON.Tools.ToRadians(limits[0]) - 1e-9;
            const hi = BABYLON.Tools.ToRadians(limits[1]) + 1e-9;
            th = th - TWO_PI * Math.floor((th - lo) / TWO_PI); // th em [lo, lo+2π)
            if (th > hi) return null;
        }
        adjusted.push(th);
    }
    return adjusted;
}

// Cinematica inversa analitica do braco 6R (punho esferico).
// Enumera as 8 combinacoes ombro x cotovelo x punho, descarta as que violam
// alcance ou limites de junta e devolve a mais proxima da configuracao anterior.
// Retorna null quando a pose e inalcancavel.
function inverse_kinematics(DH_params, T06, prevAngles, jointLimitsDeg) {
    const a1 = DH_params[0][1], a2 = DH_params[1][1], a3 = DH_params[2][1];
    const d1 = DH_params[0][2], d4 = DH_params[3][2], d6 = DH_params[5][2];
    const prev = (Array.isArray(prevAngles) && prevAngles.length === 6) ? prevAngles : [0,0,0,0,0,0];

    // Ponto do punho: recua d6 ao longo do eixo de aproximacao (z6)
    const px = T06[0][3] - d6 * T06[0][2];
    const py = T06[1][3] - d6 * T06[1][2];
    const pz = T06[2][3] - d6 * T06[2][2];

    const R06 = [
        [T06[0][0], T06[0][1], T06[0][2]],
        [T06[1][0], T06[1][1], T06[1][2]],
        [T06[2][0], T06[2][1], T06[2][2]],
    ];

    const rho = Math.hypot(px, py); // Distância radial no plano XY
    const s = pz - d1;              // Altura em relacao ao ombro
    const L3 = Math.hypot(a3, d4);  // Comprimento efetivo do antebraco
    const beta = Math.atan2(d4, a3);

    // Singularidade de ombro: punho sobre o eixo z0 -> mantém theta1 anterior
    const theta1Base = (rho < 1e-9) ? prev[0] : Math.atan2(py, px);

    const solutions = [];
    // Dois ramos de ombro: braco "para frente" (r positivo) e "para tras" (r negativo)
    const armBranches = [[theta1Base, rho], [theta1Base + Math.PI, -rho]];
    for (const [theta1, radial] of armBranches) {
        const r = radial - a1;
        const D = (r*r + s*s - a2*a2 - L3*L3) / (2 * a2 * L3); // Lei dos cossenos
        if (Math.abs(D) > 1 + 1e-9) continue; // Fora de alcance neste ramo
        const Dc = clip(D, -1, 1);
        const sqrt1mD2 = Math.sqrt(Math.max(0, 1 - Dc*Dc));

        // Dois ramos de cotovelo: acima e abaixo
        for (const elbowSign of [1, -1]) {
            const theta3p = Math.atan2(elbowSign * sqrt1mD2, Dc);
            const theta2 = Math.atan2(s, r) - Math.atan2(L3*Math.sin(theta3p), a2 + L3*Math.cos(theta3p));
            const theta3 = theta3p - beta;

            // T03 com θ1..θ3 deste ramo
            let T03 = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
            const th123_deg = [theta1, theta2, theta3].map(BABYLON.Tools.ToDegrees);
            for (let i = 0; i < 3; i++) {
                const [alpha, a, d] = DH_params[i];
                T03 = matMul4(T03, dhTransform(alpha, a, d, th123_deg[i]));
            }
            const R03 = [
                [T03[0][0], T03[0][1], T03[0][2]],
                [T03[1][0], T03[1][1], T03[1][2]],
                [T03[2][0], T03[2][1], T03[2][2]],
            ];

            // R36 = R03^T * R06 = Rz(θ4)·Ry(-θ5)·Rz(θ6)
            const R36 = matMul3(matT3(R03), R06);

            const s5_mag = Math.hypot(R36[2][0], R36[2][1]);
            const wristBranches = [];
            if (s5_mag > 1e-8) {
                const theta4 = Math.atan2(-R36[1][2], -R36[0][2]);
                const theta5 = Math.atan2(s5_mag, R36[2][2]);
                const theta6 = Math.atan2(-R36[2][1], R36[2][0]);
                wristBranches.push([theta4, theta5, theta6]);
                wristBranches.push([theta4 + Math.PI, -theta5, theta6 + Math.PI]);
            } else if (R36[2][2] > 0) {
                // Singularidade de punho (θ5 = 0): só θ4+θ6 é determinado
                const theta4 = prev[3];
                wristBranches.push([theta4, 0, Math.atan2(R36[1][0], R36[0][0]) - theta4]);
            } else {
                // Singularidade de punho (θ5 = π): só θ6-θ4 é determinado
                const theta4 = prev[3];
                wristBranches.push([theta4, Math.PI, theta4 + Math.atan2(R36[1][0], -R36[0][0])]);
            }

            for (const [theta4, theta5, theta6] of wristBranches) {
                solutions.push([theta1, theta2, theta3, theta4, theta5, theta6]);
            }
        }
    }

    // Escolhe a solucao valida mais proxima da configuracao anterior
    let best = null;
    let bestScore = Infinity;
    for (const sol of solutions) {
        const adjusted = adjustSolutionToLimits(sol, prev, jointLimitsDeg);
        if (!adjusted) continue;
        let score = 0;
        for (let i = 0; i < 6; i++) {
            const diff = adjusted[i] - prev[i];
            score += diff * diff;
        }
        if (score < bestScore) {
            bestScore = score;
            best = adjusted;
        }
    }
    return best;
}

// Cinematica direta: multiplica as transformacoes DH com os ângulos (rad) dados
function computeFK(DH_params, anglesRad) {
    let T = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
    for (let i = 0; i < DH_params.length; i++) {
        const [alpha, a, d] = DH_params[i];
        T = matMul4(T, dhTransform(alpha, a, d, BABYLON.Tools.ToDegrees(anglesRad[i])));
    }
    return T;
}

// Resolve a IK e valida a solucao antes de aceita-la:
// 1) a cinematica direta da solucao precisa atingir a pose alvo
//    (rejeita alvos inalcancaveis, que a IK aproximaria por recorte);
// 2) o salto maximo de junta deve ser proporcional ao deslocamento
//    comandado (impede que um pequeno arrasto de slider "teleporte"
//    o braco para uma configuracao espelhada).
// Retorna os 6 ângulos (rad) ou null se a pose nao for aceitavel.
function solveIKChecked(DH_params, T06, prevAngles, jointLimitsDeg) {
    const angles = inverse_kinematics(DH_params, T06, prevAngles, jointLimitsDeg);
    if (!Array.isArray(angles) || angles.length !== 6 || !angles.every(Number.isFinite)) return null;

    const T = computeFK(DH_params, angles);
    const posError = Math.hypot(T[0][3] - T06[0][3], T[1][3] - T06[1][3], T[2][3] - T06[2][3]);
    let rotError = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            rotError = Math.max(rotError, Math.abs(T[i][j] - T06[i][j]));
        }
    }
    if (posError > 0.5 || rotError > 1e-3) return null;

    // Deslocamento comandado: pose atual -> pose alvo
    const Tprev = computeFK(DH_params, prevAngles);
    const posDelta = Math.hypot(T06[0][3] - Tprev[0][3], T06[1][3] - Tprev[1][3], T06[2][3] - Tprev[2][3]);
    let traceRel = 0; // traco de Rprev^T * Ralvo
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            traceRel += Tprev[j][i] * T06[j][i];
        }
    }
    const rotDelta = Math.acos(clip((traceRel - 1) / 2, -1, 1));

    // 15° de folga + 0.5° por mm de deslocamento + 1.5x a rotacao comandada
    const allowedJump = BABYLON.Tools.ToRadians(15) + posDelta * BABYLON.Tools.ToRadians(0.5) + 1.5 * rotDelta;
    for (let i = 0; i < 6; i++) {
        const jump = Math.abs(angles[i] - prevAngles[i]);
        // θ4 e θ6 ganham 180° extras: perto da singularidade do punho (θ5 ≈ 0)
        // eles giram em auto-movimento, quase sem alterar a pose da ferramenta
        const limit = (i === 3 || i === 5) ? allowedJump + Math.PI : allowedJump;
        if (jump > limit) return null;
    }

    return angles;
}

function matT3(A) { // Transposta de matriz 3x3
    return [
        [A[0][0], A[1][0], A[2][0]],
        [A[0][1], A[1][1], A[2][1]],
        [A[0][2], A[1][2], A[2][2]],
    ];
}

function matMul3(A, B) { // Multiplicacao de matrizes 3x3
    const R = [[0,0,0],[0,0,0],[0,0,0]];
    for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) {
        let s = 0;
        for (let j = 0; j < 3; j++) s += A[i][j]*B[j][k];
        R[i][k] = s;
        }
    }
    return R;
    }

function matMul4(A, B) { // Multiplicacao de matrizes 4x4
    const R = Array.from({ length: 4 }, () => [0,0,0,0]);
    for (let i = 0; i < 4; i++) {
        for (let k = 0; k < 4; k++) {
        let s = 0;
        for (let j = 0; j < 4; j++) s += A[i][j]*B[j][k];
        R[i][k] = s;
        }
    }
    return R;
}

// Matriz de transformacao DH
function dhTransform(alphaDeg, a, d, thetaDeg) { 
    const alpha = BABYLON.Tools.ToRadians(alphaDeg);
    const theta = BABYLON.Tools.ToRadians(thetaDeg);
    const ca = Math.cos(alpha), sa = Math.sin(alpha);
    const ct = Math.cos(theta), st = Math.sin(theta);
    return [
        [ ct, -st*ca,  st*sa, a*ct ],
        [ st,  ct*ca, -ct*sa, a*st ],
        [  0,     sa,     ca,    d ],
        [  0,      0,      0,    1 ]
    ];
}


function clip(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); } 

// Extrai ângulos de Euler ZYX (R = Rz(yaw)·Ry(pitch)·Rx(roll)) da matriz T.
// A mesma convencao e usada na exibicao dos sliders e nos setters abaixo.
// Em gimbal lock (pitch = ±90°, ferramenta na horizontal) roll e yaw sao
// acoplados e so a combinacao deles e determinada pela matriz; rollHint
// (o roll atualmente exibido) define como repartir a combinacao, mantendo
// os sliders estaveis: o roll segue o usuario e o yaw nao se mexe sozinho.
function eulerZYXFromT(T, rollHint) {
    const sp = clip(-T[2][0], -1, 1);
    const pitch = Math.asin(sp);
    let roll, yaw;
    if (Math.abs(sp) < 0.99999) {
        roll = Math.atan2(T[2][1], T[2][2]);
        yaw  = Math.atan2(T[1][0], T[0][0]);
    } else {
        roll = rollHint || 0;
        if (sp > 0) {
            // pitch = +90°: T[0][1] = sin(roll-yaw), T[0][2] = cos(roll-yaw)
            yaw = roll - Math.atan2(T[0][1], T[0][2]);
        } else {
            // pitch = -90°: T[0][1] = -sin(roll+yaw), T[0][2] = -cos(roll+yaw)
            yaw = Math.atan2(-T[0][1], -T[0][2]) - roll;
        }
    }
    return { roll: roll, pitch: pitch, yaw: yaw };
}

// Reconstrói a parte de rotacao de T a partir de Euler ZYX
function applyEulerZYX(T, roll, pitch, yaw) {
    const c1 = Math.cos(yaw), s1 = Math.sin(yaw);
    const c2 = Math.cos(pitch), s2 = Math.sin(pitch);
    const c3 = Math.cos(roll), s3 = Math.sin(roll);

    T[0][0] = c1*c2;            T[0][1] = c1*s2*s3 - s1*c3;  T[0][2] = c1*s2*c3 + s1*s3;
    T[1][0] = s1*c2;            T[1][1] = s1*s2*s3 + c1*c3;  T[1][2] = s1*s2*c3 - c1*s3;
    T[2][0] = -s2;              T[2][1] = c2*s3;             T[2][2] = c2*c3;

    return T;
}

function setRoll(T, roll, rollHint) {
    const e = eulerZYXFromT(T, rollHint);
    return applyEulerZYX(T, roll, e.pitch, e.yaw);
}

function setPitch(T, pitch, rollHint) {
    const e = eulerZYXFromT(T, rollHint);
    return applyEulerZYX(T, e.roll, pitch, e.yaw);
}

function setYaw(T, yaw, rollHint) {
    const e = eulerZYXFromT(T, rollHint);
    return applyEulerZYX(T, e.roll, e.pitch, yaw);
}

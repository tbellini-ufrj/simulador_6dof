var canvas = document.getElementById("renderCanvas");

var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function () { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false }); };

const DH = [
  // [alpha(deg), a, d, theta(deg)]
  [90, 100, 330, 0],
  [0,  400,   0, 0],
  [-90,  0,   0, 0],
  [90,   0, 375, 0],
  [-90,  0,   0, 0],
  [0,    0, 200, 0]
];

// Limites de cada junta em graus (mesmas faixas dos sliders de cinematica direta)
const JOINT_LIMITS_DEG = [
  [0, 360],    // θ1 waist
  [0, 180],    // θ2 arm1
  [-240, 61],  // θ3 arm2
  [0, 360],    // θ4 wrist
  [-90, 90],   // θ5 hand
  [0, 360]     // θ6 claw
];

var createScene =  function () {
    var scene = new BABYLON.Scene(engine);

    // O BABYLON.JS nao usa a convencao de sistema de coordenadas Z-up do CAD
    // Necessario o comando abaixo para respeitar a regra da mao direita.
    scene.useRightHandedSystem = true
    
    scene.clearColor = new BABYLON.Color4(0.2, 0.3, 0.5, 1); // RGBA values: Red, Green, Blue, Alpha
    var camera = new BABYLON.ArcRotateCamera("Camera", BABYLON.Tools.ToRadians(45), BABYLON.Tools.ToRadians(60), 500, new BABYLON.Vector3(0, 0, 450), scene);
    
    camera.lowerBetaLimit = 0.1; // Limite inferior de inclinacao
    camera.upperBetaLimit = (Math.PI / 2) * 0.99; // Limite superior de inclinacao
    camera.lowerRadiusLimit = 500; // Limite mínimo de zoom
    camera.radius= 1500;
    camera.upperRadiusLimit = 5000; // Limite máximo de zoom
    camera.wheelPrecision = 1; // Sensibilidade do scroll do mouse
    camera.panningSensibility = 30; // Sensibilidade de arrasto do mouse
    camera.attachControl(canvas, true); // Anexar controles ao canvas
    //desligando controles da camera do teclado
    camera.keysUp = [];
    camera.keysDown = [];
    camera.keysLeft = [];
    camera.keysRight = [];
    camera.upVector = new BABYLON.Vector3(0, 0, 1);  // Definindo Z como cima
    // Cria iluminacao
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 0, 1), scene);
    
    // Reduzindo levemente a iluminacao
    light.intensity = 0.7 ;
    
    // Importacao e posicionamento dos modelos

    var importedMeshes = [];
    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/tbellini-ufrj/simulador_6dof/main/modelos/", "Base.stl", scene, function (newMeshes) {
        var importedMesh = newMeshes[0];
        importedMesh.setPivotPoint(new BABYLON.Vector3(0, 0, 0));
        importedMesh.parent = base;
        importedMesh.rotation.x = BABYLON.Tools.ToRadians(90); 
        importedMesh.material = new BABYLON.StandardMaterial("importedMeshMaterial", scene);
        importedMesh.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        importedMeshes.push(importedMesh);
    });
    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/tbellini-ufrj/simulador_6dof/main/modelos/", "Waist.stl", scene, function (newMeshes) {
        var importedMesh = newMeshes[0];
        importedMesh.setPivotPoint(new BABYLON.Vector3(0, 0, 0));
        importedMesh.parent = waist;
        importedMesh.rotation.y = BABYLON.Tools.ToRadians(90);
        importedMesh.rotation.z = BABYLON.Tools.ToRadians(90);
        importedMesh.material = new BABYLON.StandardMaterial("importedMeshMaterial", scene);
        importedMesh.material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        importedMeshes.push(importedMesh);
    });
    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/tbellini-ufrj/simulador_6dof/main/modelos/", "Arm1.stl", scene, function (newMeshes) {
        var importedMesh = newMeshes[0];
        importedMesh.setPivotPoint(new BABYLON.Vector3(0, 0, 0));
        importedMesh.parent = arm1; 
        importedMesh.rotation.y = BABYLON.Tools.ToRadians(90);
        importedMesh.rotation.x = BABYLON.Tools.ToRadians(90);
        importedMesh.material = new BABYLON.StandardMaterial("importedMeshMaterial", scene);
        importedMesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
        importedMeshes.push(importedMesh);
    });
    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/tbellini-ufrj/simulador_6dof/main/modelos/", "Arm2.stl", scene, function (newMeshes) {
        var importedMesh = newMeshes[0];
        importedMesh.setPivotPoint(new BABYLON.Vector3(0, 0, 0));
        importedMesh.parent = arm2;
        importedMesh.rotation.x = BABYLON.Tools.ToRadians(-90);
        importedMesh.rotation.y = BABYLON.Tools.ToRadians(90);
        importedMesh.material = new BABYLON.StandardMaterial("importedMeshMaterial", scene);
        importedMesh.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        importedMeshes.push(importedMesh);
    });
    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/tbellini-ufrj/simulador_6dof/main/modelos/", "Wrist.stl", scene, function (newMeshes) {
        var importedMesh = newMeshes[0];
        importedMesh.setPivotPoint(new BABYLON.Vector3(0, 0, 0));
        importedMesh.parent = wrist;
        importedMesh.rotation.z = BABYLON.Tools.ToRadians(-90);
        importedMesh.position.z = 250;
        importedMesh.material = new BABYLON.StandardMaterial("importedMeshMaterial", scene);
        importedMesh.material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        importedMeshes.push(importedMesh);
    });
    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/tbellini-ufrj/simulador_6dof/main/modelos/", "Hand_v2.stl", scene, function (newMeshes) {
        var importedMesh = newMeshes[0];
        importedMesh.setPivotPoint(new BABYLON.Vector3(0, 0, 0));
        importedMesh.parent = hand;
        importedMesh.rotation.x = BABYLON.Tools.ToRadians(-90);
        importedMesh.rotation.y = BABYLON.Tools.ToRadians(-90);
        importedMesh.material = new BABYLON.StandardMaterial("importedMeshMaterial", scene);
        importedMesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0); 
        importedMeshes.push(importedMesh);
    });
    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/tbellini-ufrj/simulador_6dof/main/modelos/", "Claw.stl", scene, function (newMeshes) {
        var importedMesh = newMeshes[0];
        importedMesh.setPivotPoint(new BABYLON.Vector3(0, 0, 0));
        importedMesh.parent = claw;
        importedMesh.position.z = 75
        importedMesh.material = new BABYLON.StandardMaterial("importedMeshMaterial", scene);
        importedMesh.material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        importedMeshes.push(importedMesh);
    });

    // Tratamento de redimensionamento da janela
    window.addEventListener("resize", function () {
        engine.resize();
    });

    // Objetos auxiliares para posicionamento dos eixos
    // Os eixos sao criados por meio de objetos auxiliares invisiveis
    // (fazendo eventuais ajustes de rotacao para alinhar o eixo do CAD)
    var base = BABYLON.MeshBuilder.CreateBox("base", { width: 0.1, height: 0.1, depth: 0.1 }, scene);
    var servoWaist = BABYLON.MeshBuilder.CreateBox("servoWaist", { width: 0.1, height: 0.1, depth: 0.1 }, scene);
    servoWaist.position.z = 200;
    servoWaist.parent = base;
    
    var waist = BABYLON.MeshBuilder.CreateBox("waist", { width: 1, height: 1, depth: 1 }, scene);
    waist.parent = servoWaist;

    var servo01 = BABYLON.MeshBuilder.CreateBox("servo01", { width: 1, height: 1, depth: 1 }, scene);
    servo01.position.x = 100;
    servo01.position.z = 130;
    servo01.rotation.x = BABYLON.Tools.ToRadians(90);
    servo01.parent = waist;
    
    var arm1 = BABYLON.MeshBuilder.CreateBox("arm1", { width: 1, height: 1, depth: 1 }, scene);
    arm1.parent = servo01;
    
    var servo02 = BABYLON.MeshBuilder.CreateBox("servo02", { width: 1, height: 1, depth: 1 }, scene);
    servo02.position.x = 400;
    servo02.parent = arm1;
    
    var arm2 = BABYLON.MeshBuilder.CreateBox("arm2", { width: 1, height: 1, depth: 1 }, scene);
    arm2.parent = servo02;
    
    var servo03 = BABYLON.MeshBuilder.CreateBox("servo03", { width: 1, height: 1, depth: 1 }, scene);
    servo03.rotation.x = BABYLON.Tools.ToRadians(-90);
    servo03.parent = arm2;
    
    var wrist = BABYLON.MeshBuilder.CreateBox("wrist", { width: 1, height: 1, depth: 1 }, scene);
    wrist.parent = servo03;
    
    var servo04 = BABYLON.MeshBuilder.CreateBox("servo04", { width: 1, height: 1, depth: 1 }, scene);
    servo04.position.z = 375
    servo04.rotation.x = BABYLON.Tools.ToRadians(90);
    servo04.parent = wrist;
    
    var hand = BABYLON.MeshBuilder.CreateBox("hand", { width: 1, height: 1, depth: 1 }, scene);
    hand.parent = servo04;
    
    var servo05 = BABYLON.MeshBuilder.CreateBox("servo05", { width: 1, height: 1, depth: 1 }, scene);

    servo05.rotation.x = BABYLON.Tools.ToRadians(-90);
    servo05.parent = hand;
    
    var claw = BABYLON.MeshBuilder.CreateBox("claw", { width: 1, height: 1, depth: 1 }, scene);
    claw.parent = servo05;

    var actuator = BABYLON.MeshBuilder.CreateBox("actuator", { width: 1, height: 1, depth: 1 }, scene);
    actuator.position.z = 200
    actuator.parent = claw; 

    // Posicionamento inicial
    // Inicia a engine
    engine.runRenderLoop(function () {
        scene.render();
    });

    var waistIni = BABYLON.Tools.ToRadians(180);
    var arm1Ini = BABYLON.Tools.ToRadians(90);
    var arm2Ini = BABYLON.Tools.ToRadians(0);
    var wristIni = BABYLON.Tools.ToRadians(180);
    var handIni = BABYLON.Tools.ToRadians(0);
    var clawIni = BABYLON.Tools.ToRadians(0);

    waist.rotation.z = waistIni;
    arm1.rotation.z = arm1Ini;
    arm2.rotation.z = arm2Ini;
    wrist.rotation.z = wristIni;
    hand.rotation.z = handIni;
    claw.rotation.z = clawIni;

    var actuatorIniX = actuator.getAbsolutePosition().x;
    var actuatorIniY = actuator.getAbsolutePosition().y;
    var actuatorIniZ = actuator.getAbsolutePosition().z;

    console.log("Posicao inicial do atuador: ", actuatorIniX, actuatorIniY, actuatorIniZ);

    
    // GUI
    var GUI = BABYLON.GUI;
    // Instancia para GUI
    
    // GUI para os botoes
    var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Painel para os botões (lado esquerdo)
    var UiPanelLeft = new BABYLON.GUI.StackPanel();
    UiPanelLeft.width = "220px";
    UiPanelLeft.fontSize = "14px";
    UiPanelLeft.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    UiPanelLeft.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(UiPanelLeft);
    
    // Botao de Start/Stop
    var startStopButton = GUI.Button.CreateSimpleButton("startStopButton", "Start Program");
    startStopButton.paddingTop = "10px";
    startStopButton.width = "150px";
    startStopButton.height = "40px";
    startStopButton.color = "white";
    startStopButton.background = "green";
    startStopButton.onPointerUpObservable.add(function () {
        if (isRoutineRunning) {
            stopRoutine();
        } else {
            startRoutine();
        }
    });
    UiPanelLeft.addControl(startStopButton);

    // Inicialmente, definir visibilidade dos eixos como falsa
    var toggleAxisButton = GUI.Button.CreateSimpleButton("toggleAxisButton", "Toggle Axes");
    var axesVisible = false;
    var baseAxis = null;
    var servo01Axis = null;
    var servo02Axis = null;  
    var servo03Axis = null;
    var servo04Axis = null;
    var servo05Axis = null;
    var actuatorAxis = null;
    toggleAxisButton.paddingTop = "10px";
    toggleAxisButton.width = "150px";
    toggleAxisButton.height = "40px";
    toggleAxisButton.color = "white";
    toggleAxisButton.background = "blue";
    toggleAxisButton.onPointerUpObservable.add(function() {
        axesVisible = !axesVisible;
        if (axesVisible) {
            baseAxis = showAxis(scene,base);
            servo01Axis = showAxis(scene,servo01);
            servo02Axis = showAxis(scene,servo02);
            servo03Axis = showAxis(scene,servo03);
            servo04Axis = showAxis(scene,servo04);
            servo05Axis = showAxis(scene,servo05);
            actuatorAxis = showAxis(scene,actuator);
        }
        if (!axesVisible) {
            if (baseAxis) { baseAxis.dispose(); baseAxis = null; }
            if (servo01Axis) { servo01Axis.dispose(); servo01Axis = null; }
            if (servo02Axis) { servo02Axis.dispose(); servo02Axis = null; }
            if (servo03Axis) { servo03Axis.dispose(); servo03Axis = null; }
            if (servo04Axis) { servo04Axis.dispose(); servo04Axis = null; }
            if (servo05Axis) { servo05Axis.dispose(); servo05Axis = null; }
            if (actuatorAxis) { actuatorAxis.dispose(); actuatorAxis = null; }
        }
    });
    UiPanelLeft.addControl(toggleAxisButton);

    var pontos = [];
    const programJoints = [
        { key: "waist", label: "θ1", min: 0, max: 360 },
        { key: "arm1", label: "θ2", min: 0, max: 180 },
        { key: "arm2", label: "θ3", min: -240, max: 61 },
        { key: "wrist", label: "θ4", min: 0, max: 360 },
        { key: "hand", label: "θ5", min: -90, max: 90 },
        { key: "claw", label: "θ6", min: 0, max: 360 }
    ];
    const programJointKeys = programJoints.map(joint => joint.key);
    let selectedProgramJoint = programJoints[0].key;
    let selectedProgramPointIndex = null;
    const programJointSelector = document.getElementById("programJointSelector");
    const programTableContainer = document.getElementById("programTableContainer");
    const programStatus = document.getElementById("programStatus");

    function createJointValues(initialValue) {
        return programJointKeys.reduce((values, joint) => {
            values[joint] = initialValue;
            return values;
        }, {});
    }

    function setProgramStatus(message = "", isError = false) {
        programStatus.textContent = message;
        programStatus.classList.toggle("error", isError);
    }

    function getVelocitySourceLabel(source) {
        if (source === "manual") return "manual";
        if (source === "suggested") return "sugerida";
        return "padrão";
    }

    function formatProgramNumber(value, decimals = 3) {
        return Number.isFinite(value) ? value.toFixed(decimals) : "";
    }

    function formatProgramTimeSeconds(value) {
        return Number.isFinite(value) ? value.toFixed(0) : "";
    }

    function renderProgramTable() {
        const selectedJointConfig = programJoints.find(joint => joint.key === selectedProgramJoint);
        const selectorButtons = programJointSelector.querySelectorAll("button[data-joint]");
        selectorButtons.forEach(button => {
            button.classList.toggle("active", button.dataset.joint === selectedProgramJoint);
            button.disabled = Boolean(isRoutineRunning);
        });

        if (pontos.length === 0) {
            programTableContainer.innerHTML = `
                <div class="programming-empty">
                    Adicione pontos ao programa para editar posições, velocidades e tempos.
                </div>
            `;
            return;
        }

        let cumulativeTime = 0;
        let cumulativeTimeIsValid = true;
        const rows = pontos.map((point, index) => {
            const durationIsValid = index === 0 || (Number.isFinite(point.deltaT) && point.deltaT > 0);
            if (index > 0 && durationIsValid && cumulativeTimeIsValid) {
                cumulativeTime += point.deltaT;
            } else if (!durationIsValid) {
                cumulativeTimeIsValid = false;
            }

            const positionDeg = BABYLON.Tools.ToDegrees(point[selectedProgramJoint]);
            const velocityDeg = BABYLON.Tools.ToDegrees(point.velocities[selectedProgramJoint]);
            const selectedClass = index === selectedProgramPointIndex ? "selected" : "";
            const disabled = isRoutineRunning ? "disabled" : "";
            const durationField = index === 0
                ? `<input type="text" value="—" disabled aria-label="Ponto inicial sem duração anterior">`
                : `<input class="${durationIsValid ? "" : "invalid"}" type="number" min="1" step="1" value="${formatProgramTimeSeconds(point.deltaT)}" data-field="duration" data-point-index="${index}" ${disabled}>`;
            const cumulativeDisplay = cumulativeTimeIsValid ? formatProgramTimeSeconds(cumulativeTime) : "—";

            return `
                <tr class="${selectedClass}" data-point-index="${index}">
                    <td><strong>P${index + 1}</strong></td>
                    <td>${durationField}</td>
                    <td>${cumulativeDisplay}</td>
                    <td>
                        <input type="number" min="${selectedJointConfig.min}" max="${selectedJointConfig.max}" step="0.1"
                            value="${formatProgramNumber(positionDeg)}" data-field="position" data-point-index="${index}" ${disabled}>
                    </td>
                    <td>
                        <div class="velocity-field">
                            <input type="number" step="0.1" value="${formatProgramNumber(velocityDeg)}"
                                data-field="velocity" data-point-index="${index}" ${disabled}>
                            <span class="velocity-source">${getVelocitySourceLabel(point.velocitySources[selectedProgramJoint])}</span>
                            <button type="button" class="use-suggested-velocity"
                                data-action="use-suggested-velocity" data-point-index="${index}"
                                aria-label="Usar velocidade sugerida para P${index + 1}" ${disabled}>Usar sugestão</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        programTableContainer.innerHTML = `
            <table class="programming-table">
                <thead>
                    <tr>
                        <th>Ponto</th>
                        <th>Δt anterior [s]</th>
                        <th>Tempo acumulado [s]</th>
                        <th>${selectedJointConfig.label} posição [grau]</th>
                        <th>${selectedJointConfig.label} velocidade [grau/s]</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    function updateProgramSelectionStyles() {
        programTableContainer.querySelectorAll("tr[data-point-index]").forEach(row => {
            row.classList.toggle(
                "selected",
                Number.parseInt(row.dataset.pointIndex, 10) === selectedProgramPointIndex
            );
        });

        pontos.forEach((point, index) => {
            if (!point.indicador || point.indicador.isDisposed()) return;
            const isSelected = index === selectedProgramPointIndex;
            point.indicador.scaling.setAll(isSelected ? 1.35 : 1);
            point.indicador.material.diffuseColor = isSelected
                ? new BABYLON.Color3(1, 0.75, 0)
                : new BABYLON.Color3(1, 0, 0);
        });
    }

    function forceRobotWorldMatrices() {
        [base, waist, arm1, arm2, wrist, hand, claw, actuator].forEach(mesh => {
            mesh.computeWorldMatrix(true);
        });
    }

    function refreshPointCartesianPosition(point) {
        forceRobotWorldMatrices();
        const position = actuator.getAbsolutePosition();
        point.x = position.x;
        point.y = position.y;
        point.z = position.z;
        point.indicador.position.copyFrom(position);
    }

    function selectProgramPoint(index) {
        if (isRoutineRunning || index < 0 || index >= pontos.length) return;
        selectedProgramPointIndex = index;
        setPositionFromPoint(pontos[index]);
        forceRobotWorldMatrices();
        updateSliders();
        printMatrixToDataTab(actuator);
        updateProgramSelectionStyles();
    }

    function handleProgramInputChange(event) {
        const input = event.target.closest("input[data-field][data-point-index]");
        if (!input || isRoutineRunning) return;

        const pointIndex = Number.parseInt(input.dataset.pointIndex, 10);
        const point = pontos[pointIndex];
        const value = Number.parseFloat(input.value);
        const jointConfig = programJoints.find(joint => joint.key === selectedProgramJoint);
        selectProgramPoint(pointIndex);

        if (input.dataset.field === "duration") {
            if (!Number.isFinite(value) || value <= 0) {
                input.classList.add("invalid");
                setProgramStatus("A duração deve ser maior que zero.", true);
                return;
            }
            point.deltaT = value;
        } else if (input.dataset.field === "position") {
            if (!Number.isFinite(value) || value < jointConfig.min || value > jointConfig.max) {
                input.classList.add("invalid");
                setProgramStatus(`A posição de ${jointConfig.label} deve estar entre ${jointConfig.min}° e ${jointConfig.max}°.`, true);
                return;
            }
            point[selectedProgramJoint] = BABYLON.Tools.ToRadians(value);
            setPositionFromPoint(point);
            refreshPointCartesianPosition(point);
            updateSliders();
            printMatrixToDataTab(actuator);
        } else if (input.dataset.field === "velocity") {
            if (!Number.isFinite(value)) {
                input.classList.add("invalid");
                setProgramStatus("A velocidade deve ser um número finito.", true);
                return;
            }
            point.velocities[selectedProgramJoint] = BABYLON.Tools.ToRadians(value);
            point.velocitySources[selectedProgramJoint] = "manual";
        }

        setProgramStatus("Alteração salva.");
        renderProgramTable();
        updateProgramSelectionStyles();
    }

    function initializeProgrammingUI() {
        programJointSelector.innerHTML = programJoints.map(joint => `
            <button type="button" class="joint-selector-button" data-joint="${joint.key}">${joint.label}</button>
        `).join("");

        programJointSelector.addEventListener("click", event => {
            const button = event.target.closest("button[data-joint]");
            if (!button || isRoutineRunning) return;
            selectedProgramJoint = button.dataset.joint;
            setProgramStatus();
            renderProgramTable();
            updateProgramSelectionStyles();
        });

        programTableContainer.addEventListener("focusin", event => {
            const input = event.target.closest("input[data-point-index]");
            if (input) selectProgramPoint(Number.parseInt(input.dataset.pointIndex, 10));
        });
        programTableContainer.addEventListener("click", event => {
            const suggestionButton = event.target.closest('button[data-action="use-suggested-velocity"]');
            if (suggestionButton) {
                if (isRoutineRunning) return;

                const pointIndex = Number.parseInt(suggestionButton.dataset.pointIndex, 10);
                selectProgramPoint(pointIndex);

                try {
                    pontos[pointIndex].velocities[selectedProgramJoint] = calculateSuggestedVelocity(
                        pointIndex,
                        selectedProgramJoint
                    );
                    pontos[pointIndex].velocitySources[selectedProgramJoint] = "suggested";
                    setProgramStatus(`Velocidade sugerida aplicada a P${pointIndex + 1}.`);
                    renderProgramTable();
                    updateProgramSelectionStyles();
                } catch (error) {
                    setProgramStatus(error.message, true);
                }
                return;
            }

            const row = event.target.closest("tr[data-point-index]");
            if (row) selectProgramPoint(Number.parseInt(row.dataset.pointIndex, 10));
        });
        programTableContainer.addEventListener("keydown", event => {
            if (event.key !== "Enter") return;
            const input = event.target.closest("input[data-field][data-point-index]");
            if (!input) return;
            event.preventDefault();
            handleProgramInputChange(event);
        });
        programTableContainer.addEventListener("change", handleProgramInputChange);
        renderProgramTable();
    }

    function calculateSuggestedVelocity(pointIndex, joint) {
        if (pointIndex === 0 || pointIndex === pontos.length - 1) return 0;

        const previousPoint = pontos[pointIndex - 1];
        const currentPoint = pontos[pointIndex];
        const nextPoint = pontos[pointIndex + 1];

        if (!(currentPoint.deltaT > 0) || !(nextPoint.deltaT > 0)) {
            throw new RangeError("As durações vizinhas devem ser maiores que zero.");
        }

        return TrajectoryMath.suggestIntermediateVelocity(
            previousPoint[joint],
            currentPoint[joint],
            nextPoint[joint],
            currentPoint.deltaT,
            nextPoint.deltaT
        );
    }

    function suggestPreviousPointVelocities() {
        if (pontos.length < 3) return;

        const currentIndex = pontos.length - 2;
        const currentPoint = pontos[currentIndex];

        programJointKeys.forEach(joint => {
            if (currentPoint.velocitySources[joint] === "manual") return;
            currentPoint.velocities[joint] = calculateSuggestedVelocity(currentIndex, joint);
            currentPoint.velocitySources[joint] = "suggested";
        });
    }

    function adicionarPonto() {
        const ponto = {
            waist: waist.rotation.z,
            arm1: arm1.rotation.z,
            arm2: arm2.rotation.z,
            wrist: wrist.rotation.z,
            hand: hand.rotation.z,
            claw: claw.rotation.z,
            x: actuator.getAbsolutePosition().x,
            y: actuator.getAbsolutePosition().y,
            z: actuator.getAbsolutePosition().z,
            indicador : BABYLON.MeshBuilder.CreateSphere("pontoEsfera", { diameter: 15 }, scene),
            deltaT: pontos.length === 0 ? 0 : currentFrame,
            velocities: createJointValues(0),
            velocitySources: createJointValues("default")
        };

        ponto.indicador.position = new BABYLON.Vector3(ponto.x, ponto.y, ponto.z);
        var mat = new BABYLON.StandardMaterial("matEsfera", scene);
        mat.diffuseColor = new BABYLON.Color3(1, 0, 0); // vermelho
        ponto.indicador.material = mat;
        
        pontos.push(ponto);
        suggestPreviousPointVelocities();
        selectedProgramPointIndex = pontos.length - 1;
        renderProgramTable();
        updateProgramSelectionStyles();
    }

    initializeProgrammingUI();

    var addPointButton = GUI.Button.CreateSimpleButton("addPointButton", "Add Point");
    addPointButton.paddingTop = "10px";
    addPointButton.width = "150px";
    addPointButton.height = "40px";
    addPointButton.color = "white";
    addPointButton.background = "blue";
    addPointButton.onPointerUpObservable.add(function() {
        if (!isRoutineRunning) adicionarPonto();
    });
    UiPanelLeft.addControl(addPointButton);

    // Container horizontal para os controles de quadro
    var frameControlContainer = new BABYLON.GUI.StackPanel();
    frameControlContainer.isVertical = false;
    frameControlContainer.height = "40px";
    frameControlContainer.width = "150px";
    frameControlContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    frameControlContainer.paddingTop = "10px";

    // Botao seta esquerda
    var leftArrowButton = BABYLON.GUI.Button.CreateSimpleButton("leftArrowButton", "-");
    leftArrowButton.width = "40px";
    leftArrowButton.height = "30px";
    leftArrowButton.color = "white";
    leftArrowButton.background = "blue";
    leftArrowButton.fontSize = "24px";

    // Campo numérico central
    var frameNumberInput = new BABYLON.GUI.InputText();
    frameNumberInput.width = "70px";
    frameNumberInput.height = "30px";
    frameNumberInput.text = "1";
    frameNumberInput.color = "white";
    frameNumberInput.background = "gray";
    frameNumberInput.fontSize = "18px";
    frameNumberInput.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    frameNumberInput.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    frameNumberInput.maxWidth = 70;
    frameNumberInput.thickness = 1;

    // Botao seta direita
    var rightArrowButton = BABYLON.GUI.Button.CreateSimpleButton("rightArrowButton", "+");
    rightArrowButton.width = "40px";
    rightArrowButton.height = "30px";
    rightArrowButton.color = "white";
    rightArrowButton.background = "blue";
    rightArrowButton.fontSize = "24px";

    // Valor do quadro atual
    var currentFrame = 1;
    function updateFrameInput() {
        frameNumberInput.text = currentFrame.toString();
    }

    leftArrowButton.onPointerUpObservable.add(function () {
        currentFrame = Math.max(0, currentFrame - 1);
        updateFrameInput();
    });

    rightArrowButton.onPointerUpObservable.add(function () {
        currentFrame = currentFrame + 1;
        updateFrameInput();
    });

    frameNumberInput.onTextChangedObservable.add(function () {
        var val = parseInt(frameNumberInput.text);
        if (!isNaN(val) && val >= 0) {
            currentFrame = val;
        } else {
            frameNumberInput.text = currentFrame.toString();
        }
    });

    frameControlContainer.addControl(leftArrowButton);
    frameControlContainer.addControl(frameNumberInput);
    frameControlContainer.addControl(rightArrowButton);

    UiPanelLeft.addControl(frameControlContainer);
    function updateFrameControlsState() {
        const disabled = pontos.length === 0 || isRoutineRunning;
        frameControlContainer.isEnabled = !disabled;
        leftArrowButton.isEnabled = !disabled;
        rightArrowButton.isEnabled = !disabled;
        frameNumberInput.isEnabled = !disabled;

        const gray = "gray";
        const blue = "blue";
        leftArrowButton.background = disabled ? gray : blue;
        rightArrowButton.background = disabled ? gray : blue;
        frameNumberInput.background = disabled ? gray : "gray";
    }

    scene.onBeforeRenderObservable.add(updateFrameControlsState);

    function clearPontos() {
        // remover esferas indicadoras da cena
        pontos.forEach(p => {
            if (p.indicador && !p.indicador.isDisposed()) {
                p.indicador.dispose();
            }
        });
        pontos = [];
        selectedProgramPointIndex = null;

        // opcional: limpar a trajetória caso exista
        if (typeof clearTrajectory === "function") {
            clearTrajectory();
        }

        // atualizar estado dos controles dependentes de pontos
        updateFrameControlsState();
        setProgramStatus();
        renderProgramTable();
    }

    // Botao para limpar pontos
    var clearPointsButton = GUI.Button.CreateSimpleButton("clearPointsButton", "Clear Points");
    clearPointsButton.paddingTop = "10px";
    clearPointsButton.width = "150px";
    clearPointsButton.height = "40px";
    clearPointsButton.color = "white";
    clearPointsButton.background = "red";
    clearPointsButton.onPointerUpObservable.add(function () {
        if (!isRoutineRunning) clearPontos();
    });
    UiPanelLeft.addControl(clearPointsButton);

    // Painel para os sliders (lado direito)
    var UiPanelRight = new BABYLON.GUI.StackPanel();
    UiPanelRight.width = "220px";
    UiPanelRight.fontSize = "14px";
    UiPanelRight.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    UiPanelRight.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(UiPanelRight);

    var servoSlidersContainer = new BABYLON.GUI.StackPanel();
    servoSlidersContainer.width = "220px";
    servoSlidersContainer.isVisible = true; // Comeca visível
    servoSlidersContainer.paddingTop = "20px";
    

    var ikControlsContainer = new BABYLON.GUI.StackPanel();
    ikControlsContainer.width = "220px";
    ikControlsContainer.isVisible = false; // Comeca oculto
    ikControlsContainer.paddingTop = "20px";
    
    // Botao para alternar entre os menus
    var toggleMenuButton = BABYLON.GUI.Button.CreateSimpleButton("toggleMenuButton", "Toggle direct/inverse kinematics");
    toggleMenuButton.width = "150px";
    toggleMenuButton.height = "40px";
    toggleMenuButton.color = "white";
    toggleMenuButton.background = "purple";
    toggleMenuButton.onPointerUpObservable.add(function () {
        servoSlidersContainer.isVisible = !servoSlidersContainer.isVisible;
        ikControlsContainer.isVisible = !ikControlsContainer.isVisible;
        updateSliders();
    });
    UiPanelRight.addControl(toggleMenuButton);
    
        UiPanelRight.addControl(servoSlidersContainer);
        UiPanelRight.addControl(ikControlsContainer);
    
    var isUpdating = false; 
    function updateSliders() {
        if (servoSlidersContainer.isVisible) {
            isUpdating = true;
            sliderWaistContainer.children[1].children[0].value = ajustarAngulo(BABYLON.Tools.ToDegrees(waist.rotation.z));
            sliderArm1Container.children[1].children[0].value = ajustarAngulo(BABYLON.Tools.ToDegrees(arm1.rotation.z));
            sliderArm2Container.children[1].children[0].value = BABYLON.Tools.ToDegrees(arm2.rotation.z);
            sliderWristContainer.children[1].children[0].value = ajustarAngulo(BABYLON.Tools.ToDegrees(wrist.rotation.z));
            sliderHandContainer.children[1].children[0].value = BABYLON.Tools.ToDegrees(hand.rotation.z);
            sliderClawContainer.children[1].children[0].value = ajustarAngulo(BABYLON.Tools.ToDegrees(claw.rotation.z));
            isUpdating = false;
        }
        if (ikControlsContainer.isVisible) {
            isUpdating = true;
            // Pose atual calculada pela cinematica direta (mesma convencao usada pela IK).
            // ikRollDisplayRad estabiliza a divisao roll/yaw em gimbal lock (pitch = ±90°).
            const T = computeFK(DH, getCurrentJointAngles());
            const euler = eulerZYXFromT(T, ikRollDisplayRad);
            ikRollDisplayRad = euler.roll;
            sliderIKXContainer.children[1].children[0].value = T[0][3];
            sliderIKYContainer.children[1].children[0].value = T[1][3];
            sliderIKZContainer.children[1].children[0].value = T[2][3];
            sliderIKRollContainer.children[1].children[0].value = BABYLON.Tools.ToDegrees(euler.roll);
            sliderIKPitchContainer.children[1].children[0].value = BABYLON.Tools.ToDegrees(euler.pitch);
            sliderIKYawContainer.children[1].children[0].value = BABYLON.Tools.ToDegrees(euler.yaw);
            isUpdating = false;
        }
    }
    scene.onBeforeRenderObservable.add(function () {
        printMatrixToDataTab(actuator);
    });

    function getCurrentJointAngles() {
        return [waist.rotation.z, arm1.rotation.z, arm2.rotation.z, wrist.rotation.z, hand.rotation.z, claw.rotation.z];
    }

    function setJointAngles(angles) {
        waist.rotation.z = angles[0];
        arm1.rotation.z = angles[1];
        arm2.rotation.z = angles[2];
        wrist.rotation.z = angles[3];
        hand.rotation.z = angles[4];
        claw.rotation.z = angles[5];
    }

    // Pose alvo construida a partir dos ângulos atuais (evita ler matrizes
    // de mesh possivelmente desatualizadas dentro do mesmo frame)
    function getActuatorT06() {
        return computeFK(DH, getCurrentJointAngles());
    }

    function solveAndApplyIK(T06) {
        const angles = solveIKChecked(DH, T06, getCurrentJointAngles(), JOINT_LIMITS_DEG);
        if (angles) {
            setJointAngles(angles);
            forceRobotWorldMatrices();
        }
        // Sincroniza os sliders com a pose real (reverte o slider se a IK falhou)
        updateSliders();
        return angles !== null;
    }

    var sliderWaistContainer = createSliderWithText(0, 360, BABYLON.Tools.ToDegrees(waistIni), function (value) {
        if (isUpdating) return;
        waist.rotation.z = BABYLON.Tools.ToRadians(value);
    }, "θ1 (deg)");
    servoSlidersContainer.addControl(sliderWaistContainer);

    var sliderArm1Container = createSliderWithText(0, 180, BABYLON.Tools.ToDegrees(arm1Ini), function (value) {
        if (isUpdating) return;
        arm1.rotation.z = BABYLON.Tools.ToRadians(value);
    }, "θ2 (deg)");
    servoSlidersContainer.addControl(sliderArm1Container);

    var sliderArm2Container = createSliderWithText(-240, 61, BABYLON.Tools.ToDegrees(arm2Ini), function (value) {
        if (isUpdating) return;
        arm2.rotation.z = BABYLON.Tools.ToRadians(value);
    }, "θ3 (deg)");
    servoSlidersContainer.addControl(sliderArm2Container);

    var sliderWristContainer = createSliderWithText(0, 360, BABYLON.Tools.ToDegrees(wristIni), function (value) {
        if (isUpdating) return;
        wrist.rotation.z = BABYLON.Tools.ToRadians(value);
    }, "θ4 (deg)");
    servoSlidersContainer.addControl(sliderWristContainer);

    var sliderHandContainer = createSliderWithText(-90, 90, BABYLON.Tools.ToDegrees(handIni), function (value) {
        if (isUpdating) return;
        hand.rotation.z = BABYLON.Tools.ToRadians(value);
    }, "θ5 (deg)");
    servoSlidersContainer.addControl(sliderHandContainer);

    var sliderClawContainer = createSliderWithText(0, 360, BABYLON.Tools.ToDegrees(clawIni), function (value) {
        if (isUpdating) return;
        claw.rotation.z = BABYLON.Tools.ToRadians(value);
    }, "θ6 (deg)");
    servoSlidersContainer.addControl(sliderClawContainer);

    // Faixas dos sliders de IK limitadas ao alcance geometrico maximo do braco
    var ikMaxRadial = DH[0][1] + DH[1][1] + Math.hypot(DH[2][1], DH[3][2]) + DH[5][2]; // a1+a2+L3+d6
    var ikMaxZ = DH[0][2] + DH[1][1] + Math.hypot(DH[2][1], DH[3][2]) + DH[5][2];      // d1+a2+L3+d6

    // Pose inicial calculada pela cinematica direta (valores iniciais dos sliders)
    var TIniIK = computeFK(DH, [waistIni, arm1Ini, arm2Ini, wristIni, handIni, clawIni]);
    var eulerIniIK = eulerZYXFromT(TIniIK, 0);
    // Roll atualmente exibido: referencia para dividir roll/yaw em gimbal lock
    var ikRollDisplayRad = eulerIniIK.roll;

    var sliderIKXContainer = createSliderWithText(-ikMaxRadial, ikMaxRadial, TIniIK[0][3], function (value) {
        if (isUpdating) return;
        const T06 = getActuatorT06();
        T06[0][3] = value;
        solveAndApplyIK(T06);
    }, "Posicao X");
    ikControlsContainer.addControl(sliderIKXContainer);

    var sliderIKYContainer = createSliderWithText(-ikMaxRadial, ikMaxRadial, TIniIK[1][3], function (value) {
        if (isUpdating) return;
        const T06 = getActuatorT06();
        T06[1][3] = value;
        solveAndApplyIK(T06);
    }, "Posicao Y");
    ikControlsContainer.addControl(sliderIKYContainer);

    var sliderIKZContainer = createSliderWithText(0, ikMaxZ, TIniIK[2][3], function (value) {
        if (isUpdating) return;
        const T06 = getActuatorT06();
        T06[2][3] = value;
        solveAndApplyIK(T06);
    }, "Posicao Z");
    ikControlsContainer.addControl(sliderIKZContainer);

    var sliderIKRollContainer = createSliderWithText(-180, 180, BABYLON.Tools.ToDegrees(eulerIniIK.roll), function (value) {
        if (isUpdating) return;
        // Decompoe a pose atual com o roll exibido ate agora e ja adota o novo
        // valor como referencia, para que em gimbal lock o roll siga o usuario
        const previousRoll = ikRollDisplayRad;
        const newRoll = BABYLON.Tools.ToRadians(value);
        const T06 = setRoll(getActuatorT06(), newRoll, previousRoll);
        ikRollDisplayRad = newRoll;
        if (!solveAndApplyIK(T06)) {
            ikRollDisplayRad = previousRoll;
            updateSliders();
        }
    }, "Roll");
    ikControlsContainer.addControl(sliderIKRollContainer);

    // Pitch da convencao ZYX e definido apenas em [-90°, 90°]
    var sliderIKPitchContainer = createSliderWithText(-90, 90, BABYLON.Tools.ToDegrees(eulerIniIK.pitch), function (value) {
        if (isUpdating) return;
        const T06 = setPitch(getActuatorT06(), BABYLON.Tools.ToRadians(value), ikRollDisplayRad);
        solveAndApplyIK(T06);
    }, "Pitch");
    ikControlsContainer.addControl(sliderIKPitchContainer);

    var sliderIKYawContainer = createSliderWithText(-180, 180, BABYLON.Tools.ToDegrees(eulerIniIK.yaw), function (value) {
        if (isUpdating) return;
        const T06 = setYaw(getActuatorT06(), BABYLON.Tools.ToRadians(value), ikRollDisplayRad);
        solveAndApplyIK(T06);
    }, "Yaw");
    ikControlsContainer.addControl(sliderIKYawContainer);

    // Ao soltar um slider de IK, ressincroniza a exibicao com a pose real
    // (o cursor pode ter sido arrastado alem de uma pose alcancavel)
    [sliderIKXContainer, sliderIKYContainer, sliderIKZContainer,
     sliderIKRollContainer, sliderIKPitchContainer, sliderIKYawContainer].forEach(function (container) {
        container.children[1].children[0].onPointerUpObservable.add(function () {
            updateSliders();
        });
    });

    // Controle manual pelo teclado
    var rotationSpeed = 0.03;
    window.addEventListener("keydown", function (event) {
        if (servoSlidersContainer.isVisible) {
            switch (event.key.toLowerCase()) {
                case "q":
                    waist.rotation.z -= rotationSpeed; 
                    break;
                    case "w": 
                    waist.rotation.z += rotationSpeed; 
                    break;
                case "e":
                    if (BABYLON.Tools.ToDegrees(arm1.rotation.z - rotationSpeed) <= 0) {
                        arm1.rotation.z = BABYLON.Tools.ToRadians(0);
                    } else {
                        arm1.rotation.z -= rotationSpeed;
                    }
                    break;
                case "r":
                    if (BABYLON.Tools.ToDegrees(arm1.rotation.z + rotationSpeed) >= 180) {
                        arm1.rotation.z = BABYLON.Tools.ToRadians(180);
                    } else {
                        arm1.rotation.z += rotationSpeed;
                    }
                    break;
                case "a":
                    if(BABYLON.Tools.ToDegrees(arm2.rotation.z - rotationSpeed) <= -240) {
                        arm2.rotation.z = BABYLON.Tools.ToRadians(-240);
                    } else {
                        arm2.rotation.z -= rotationSpeed;
                    }
                    break;
                case "s":
                    if(BABYLON.Tools.ToDegrees(arm2.rotation.z + rotationSpeed) >= 61) {
                        arm2.rotation.z = BABYLON.Tools.ToRadians(61);
                    } else {
                        arm2.rotation.z += rotationSpeed;
                    }
                    break;
                case "d":
                    wrist.rotation.z -= rotationSpeed;
                    break;
                case "f":
                    wrist.rotation.z += rotationSpeed;
                    break;
                case "x":
                    if (BABYLON.Tools.ToDegrees(hand.rotation.z - rotationSpeed) <= -90) {
                        hand.rotation.z = BABYLON.Tools.ToRadians(-90);
                    } else {
                        hand.rotation.z -= rotationSpeed;
                    }
                    break;
                case "z":
                    if (BABYLON.Tools.ToDegrees(hand.rotation.z - rotationSpeed) >= 90) {
                        hand.rotation.z = BABYLON.Tools.ToRadians(90);
                    } else {
                        hand.rotation.z += rotationSpeed;
                    }
                    break;
                case "c":
                    claw.rotation.z -= rotationSpeed; 
                    break;
                case "v": 
                    claw.rotation.z += rotationSpeed; 
                    break;
                }
            updateSliders();
        }
    });
    // Rotina e trajeto

    let trajectoryPoints = [];
    let trajectoryLine = null;
    let pendingSinceRebuild = 0; // quantos pontos novos desde a última recriacao
    const rebuildBatchSize = 8; // ajuste conforme desempenho desejado

    function clearTrajectory() {
        trajectoryPoints = [];
        pendingSinceRebuild = 0;
        if (trajectoryLine) {
            trajectoryLine.dispose();
            trajectoryLine = null;
        }
    }

    function addTrajectoryPoint(vec3) {
        trajectoryPoints.push(vec3);

        if (!trajectoryLine) {
            // primeira criacao
            trajectoryLine = BABYLON.MeshBuilder.CreateLines("trajectory", {
                points: trajectoryPoints,
                updatable: true
            }, scene);
            trajectoryLine.color = new BABYLON.Color3(1, 1, 1);
            pendingSinceRebuild = 0;
            return;
        }

        // Se o número de pontos mudou, precisamos recriar a malha.
        // Para nao recriar a cada ponto, espere acumular N pontos.
        pendingSinceRebuild++;
        if (pendingSinceRebuild >= rebuildBatchSize) {
            trajectoryLine.dispose();
            trajectoryLine = BABYLON.MeshBuilder.CreateLines("trajectory", {
                points: trajectoryPoints,
                updatable: true
            }, scene);
            trajectoryLine.color = new BABYLON.Color3(1, 1, 1);
            pendingSinceRebuild = 0;
        } else {
            // Entre recriacões, atualiza a posicao dos pontos já existentes
            BABYLON.MeshBuilder.CreateLines(null, {
                points: trajectoryPoints.slice(0, trajectoryLine.getVerticesData(BABYLON.VertexBuffer.PositionKind).length / 3),
                updatable: true,
                instance: trajectoryLine
            });
        }
    }


    var isRoutineRunning = false;

    function updateRoutineControlsState() {
        startStopButton.textBlock.text = isRoutineRunning ? "Stop Program" : "Start Program";
        startStopButton.background = isRoutineRunning ? "red" : "green";
        addPointButton.isEnabled = !isRoutineRunning;
        clearPointsButton.isEnabled = !isRoutineRunning;
        addPointButton.background = isRoutineRunning ? "gray" : "blue";
        clearPointsButton.background = isRoutineRunning ? "gray" : "red";
        updateFrameControlsState();
        renderProgramTable();
        updateProgramSelectionStyles();
    }

    function openProgrammingTab() {
        const button = document.querySelector('.tabButton[data-tab="programming"]');
        if (button) button.click();
    }

    function validateRoutine() {
        if (!Array.isArray(pontos) || pontos.length < 2) {
            return "Adicione pelo menos dois pontos para executar o programa.";
        }

        for (let index = 1; index < pontos.length; index++) {
            if (!Number.isFinite(pontos[index].deltaT) || pontos[index].deltaT <= 0) {
                selectedProgramPointIndex = index;
                return `A duração anterior de P${index + 1} deve ser maior que zero.`;
            }
        }

        for (let index = 0; index < pontos.length; index++) {
            for (const joint of programJointKeys) {
                if (!Number.isFinite(pontos[index][joint]) || !Number.isFinite(pontos[index].velocities[joint])) {
                    selectedProgramPointIndex = index;
                    return `P${index + 1} possui uma posição ou velocidade inválida.`;
                }
            }
        }

        return null;
    }

    function startRoutine() {
        if (isRoutineRunning) return;

        const validationError = validateRoutine();
        if (validationError) {
            setProgramStatus(validationError, true);
            renderProgramTable();
            updateProgramSelectionStyles();
            openProgrammingTab();
            return;
        }

        setProgramStatus();
        isRoutineRunning = true;
        updateRoutineControlsState();
        clearAllCharts();

        clearTrajectory();
        setPositionFromPoint(pontos[0]);
        forceRobotWorldMatrices();
        addTrajectoryPoint(actuator.getAbsolutePosition().clone());

        performRoutine(pontos);
    }

    function stopRoutine() {
        isRoutineRunning = false;
        updateRoutineControlsState();
    }

    async function performRoutine(routinePoints) {
        let totalTimeMs = 0;

        for (let i = 0; i + 1 < routinePoints.length && isRoutineRunning; i++) {
            const durationMs = routinePoints[i + 1].deltaT * 1000;
            await movePointToPoint(routinePoints[i], routinePoints[i + 1], durationMs, totalTimeMs);
            if (isRoutineRunning) totalTimeMs += durationMs;
        }

        isRoutineRunning = false;
        updateRoutineControlsState();
    }

    // Move entre dois pontos usando um polinômio cúbico com posições e velocidades de contorno.
    function movePointToPoint(startPoint, endPoint, durationMs, tOffsetMs = 0) {
        return new Promise((resolve) => {
            const durationSeconds = durationMs / 1000;
            const coefficients = {};
            programJointKeys.forEach(joint => {
                coefficients[joint] = TrajectoryMath.calculateCubicCoefficients(
                    startPoint[joint],
                    endPoint[joint],
                    startPoint.velocities[joint],
                    endPoint.velocities[joint],
                    durationSeconds
                );
            });

            let startTime = null;
            let rafId = null;

            function applyJointState(joint, position) {
                switch (joint) {
                    case "waist": waist.rotation.z = position; break;
                    case "arm1":  arm1.rotation.z = position; break;
                    case "arm2":  arm2.rotation.z = position; break;
                    case "wrist": wrist.rotation.z = position; break;
                    case "hand":  hand.rotation.z = position; break;
                    case "claw":  claw.rotation.z = position; break;
                }
            }

            function step(timestamp) {
                if (startTime === null) startTime = timestamp;
                const elapsedMs = timestamp - startTime;
                const clampedMs = Math.min(elapsedMs, durationMs);
                const localTime = clampedMs / 1000;
                const jointStates = {};

                programJointKeys.forEach(joint => {
                    const state = TrajectoryMath.evaluateCubic(coefficients[joint], localTime);
                    jointStates[joint] = state;
                    applyJointState(joint, state.position);
                });

                updateSliders();
                printMatrixToDataTab(actuator);
                forceRobotWorldMatrices();
                addTrajectoryPoint(actuator.getAbsolutePosition().clone());

                if (typeof addData === "function" && typeof chart1 !== "undefined") {
                    const totalLabel = ((tOffsetMs + clampedMs) / 1000).toFixed(3);
                    const positionsDeg = programJointKeys.map(joint => BABYLON.Tools.ToDegrees(jointStates[joint].position));
                    const velocitiesDeg = programJointKeys.map(joint => BABYLON.Tools.ToDegrees(jointStates[joint].velocity));
                    const accelerationsDeg = programJointKeys.map(joint => BABYLON.Tools.ToDegrees(jointStates[joint].acceleration));

                    addData(chart1, totalLabel, ...positionsDeg);
                    addData(chart2, totalLabel, ...velocitiesDeg);
                    addData(chart3, totalLabel, ...accelerationsDeg);
                }

                if (elapsedMs >= durationMs) {
                    setPositionFromPoint(endPoint);
                    forceRobotWorldMatrices();
                    updateSliders();
                    addTrajectoryPoint(actuator.getAbsolutePosition().clone());
                    if (rafId) cancelAnimationFrame(rafId);
                    resolve();
                    return;
                }

                if (!isRoutineRunning) {
                    if (rafId) cancelAnimationFrame(rafId);
                    resolve();
                    return;
                }

                rafId = requestAnimationFrame(step);
            }

            rafId = requestAnimationFrame(step);
        });
    }

    function setPositionFromPoint(point) {
        waist.rotation.z = point.waist;
        arm1.rotation.z = point.arm1;
        arm2.rotation.z = point.arm2;
        wrist.rotation.z = point.wrist;
        hand.rotation.z = point.hand;
        claw.rotation.z = point.claw;
    }

    return scene;
};

window.initFunction = async function () {

    var asyncEngineCreation = async function () {
        try {
            return createDefaultEngine();
        } catch (e) {
            console.log("the available createEngine function failed. Creating the default engine instead");
            return createDefaultEngine();
        }
    }

    window.engine = await asyncEngineCreation();
    if (!engine) throw 'engine should not be null.';
    startRenderLoop(engine, canvas);
    window.scene = createScene();
};
initFunction().then(() => {
    sceneToRender = scene
});

// Resize
window.addEventListener("resize", function () {
    engine.resize();
})

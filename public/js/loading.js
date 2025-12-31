// Minecraft-style dancing monkey using Three.js
function initLoadingAnimation() {
    const canvas = document.getElementById('monkeyCanvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(300, 300);
    renderer.setClearColor(0x000000, 0);

    // Minecraft-style blocky materials
    const brownMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const lightBrownMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E });
    const faceMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
    const blackMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    // Monkey group
    const monkey = new THREE.Group();

    // Body (blocky cube)
    const bodyGeom = new THREE.BoxGeometry(1.2, 1.4, 0.8);
    const body = new THREE.Mesh(bodyGeom, brownMaterial);
    body.position.y = 0;
    monkey.add(body);

    // Head
    const headGeom = new THREE.BoxGeometry(1, 1, 0.9);
    const head = new THREE.Mesh(headGeom, brownMaterial);
    head.position.y = 1.3;
    monkey.add(head);

    // Face
    const faceGeom = new THREE.BoxGeometry(0.7, 0.6, 0.2);
    const face = new THREE.Mesh(faceGeom, faceMaterial);
    face.position.set(0, 1.2, 0.5);
    monkey.add(face);

    // Eyes
    const eyeGeom = new THREE.BoxGeometry(0.15, 0.15, 0.1);
    const leftEye = new THREE.Mesh(eyeGeom, blackMaterial);
    leftEye.position.set(-0.2, 1.35, 0.6);
    monkey.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, blackMaterial);
    rightEye.position.set(0.2, 1.35, 0.6);
    monkey.add(rightEye);

    // Ears
    const earGeom = new THREE.BoxGeometry(0.3, 0.4, 0.2);
    const leftEar = new THREE.Mesh(earGeom, lightBrownMaterial);
    leftEar.position.set(-0.6, 1.4, 0);
    monkey.add(leftEar);

    const rightEar = new THREE.Mesh(earGeom, lightBrownMaterial);
    rightEar.position.set(0.6, 1.4, 0);
    monkey.add(rightEar);

    // Arms
    const armGeom = new THREE.BoxGeometry(0.3, 1, 0.3);
    const leftArm = new THREE.Mesh(armGeom, brownMaterial);
    leftArm.position.set(-0.75, 0.2, 0);
    leftArm.geometry.translate(0, -0.5, 0);
    monkey.add(leftArm);

    const rightArm = new THREE.Mesh(armGeom, brownMaterial);
    rightArm.position.set(0.75, 0.2, 0);
    rightArm.geometry.translate(0, -0.5, 0);
    monkey.add(rightArm);

    // Legs
    const legGeom = new THREE.BoxGeometry(0.4, 0.9, 0.4);
    const leftLeg = new THREE.Mesh(legGeom, brownMaterial);
    leftLeg.position.set(-0.3, -1.1, 0);
    leftLeg.geometry.translate(0, -0.45, 0);
    monkey.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeom, brownMaterial);
    rightLeg.position.set(0.3, -1.1, 0);
    rightLeg.geometry.translate(0, -0.45, 0);
    monkey.add(rightLeg);

    // Tail
    const tailGeom = new THREE.BoxGeometry(0.2, 0.2, 1);
    const tail = new THREE.Mesh(tailGeom, brownMaterial);
    tail.position.set(0, -0.3, -0.9);
    monkey.add(tail);

    scene.add(monkey);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    camera.position.z = 5;
    camera.position.y = 0.5;

    let time = 0;
    let animationId;

    function animate() {
        animationId = requestAnimationFrame(animate);
        time += 0.05;

        // Dancing animation
        monkey.position.y = Math.sin(time * 2) * 0.2;
        monkey.rotation.y = Math.sin(time) * 0.3;

        // Arm swing
        leftArm.rotation.x = Math.sin(time * 2) * 0.8;
        rightArm.rotation.x = Math.sin(time * 2 + Math.PI) * 0.8;
        leftArm.rotation.z = Math.sin(time * 1.5) * 0.3 - 0.2;
        rightArm.rotation.z = -Math.sin(time * 1.5) * 0.3 + 0.2;

        // Leg movement
        leftLeg.rotation.x = Math.sin(time * 2 + Math.PI) * 0.5;
        rightLeg.rotation.x = Math.sin(time * 2) * 0.5;

        // Head bob
        head.rotation.z = Math.sin(time * 2) * 0.1;
        face.rotation.z = Math.sin(time * 2) * 0.1;
        leftEye.rotation.z = Math.sin(time * 2) * 0.1;
        rightEye.rotation.z = Math.sin(time * 2) * 0.1;

        // Tail wag
        tail.rotation.y = Math.sin(time * 3) * 0.5;

        renderer.render(scene, camera);
    }

    animate();

    // Return cleanup function
    return () => {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    };
}

// Couch monkey lifting weights animation for auth screen
function initCouchMonkeyAnimation() {
    const canvas = document.getElementById('couchMonkeyCanvas');
    if (!canvas) return;

    const VOXEL_SIZE = 1;
    const PALETTE = {
        monkey: { fur: 0x8B4513, skin: 0xD2B48C, eyes: 0x111111 },
        couch: { fabric: 0xCC9900, wood: 0x2c3e50 },
        gym: { weight: 0x333333, bar: 0xbdc3c7 }
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(45, 400 / 350, 0.1, 1000);
    camera.position.set(15, 12, 25);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(400, 350);
    renderer.shadowMap.enabled = true;

    // OrbitControls for mouse interaction
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 6, 0);

    const boxGeo = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);

    function createVoxel(color, x, y, z, parent) {
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
        const mesh = new THREE.Mesh(boxGeo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    }

    function createDumbbell(parent) {
        const group = new THREE.Group();
        // Bar
        for (let x = -1.5; x <= 1.5; x++) createVoxel(PALETTE.gym.bar, x, 0, 0, group);
        // Weights
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                createVoxel(PALETTE.gym.weight, -1.8, y, z, group);
                createVoxel(PALETTE.gym.weight, 1.8, y, z, group);
            }
        }
        group.position.y = -4;
        parent.add(group);
        return group;
    }

    let armGroupL, armGroupR, headGroup;

    function createMonkey() {
        const monkey = new THREE.Group();

        // Body
        for (let x = -2; x <= 2; x++) {
            for (let y = 0; y < 5; y++) {
                for (let z = -1.5; z <= 1.5; z++) {
                    createVoxel(PALETTE.monkey.fur, x, y + 4, z, monkey);
                }
            }
        }

        // Belly (Skin color)
        for (let x = -1; x <= 1; x++) {
            for (let y = 1; y < 4; y++) {
                createVoxel(PALETTE.monkey.skin, x, y + 4, 1.6, monkey);
            }
        }

        // Head
        headGroup = new THREE.Group();
        for (let x = -2; x <= 2; x++) {
            for (let y = 0; y < 4; y++) {
                for (let z = -2; z <= 2; z++) {
                    createVoxel(PALETTE.monkey.fur, x, y + 9, z, headGroup);
                }
            }
        }

        // Face
        for (let x = -1.5; x <= 1.5; x++) {
            for (let y = 0; y < 2.5; y++) {
                createVoxel(PALETTE.monkey.skin, x, y + 9.5, 2.1, headGroup);
            }
        }

        // Eyes
        createVoxel(PALETTE.monkey.eyes, -1, 11, 2.2, headGroup);
        createVoxel(PALETTE.monkey.eyes, 1, 11, 2.2, headGroup);

        monkey.add(headGroup);

        // Arms (Animated)
        armGroupL = new THREE.Group();
        armGroupL.position.set(-3, 8, 0);
        for (let y = 0; y > -4; y--) createVoxel(PALETTE.monkey.fur, 0, y, 0, armGroupL);
        createDumbbell(armGroupL);
        monkey.add(armGroupL);

        armGroupR = new THREE.Group();
        armGroupR.position.set(3, 8, 0);
        for (let y = 0; y > -4; y--) createVoxel(PALETTE.monkey.fur, 0, y, 0, armGroupR);
        createDumbbell(armGroupR);
        monkey.add(armGroupR);

        // Legs (Sitting position)
        for (let z = 1; z < 5; z++) {
            createVoxel(PALETTE.monkey.fur, -1.5, 4, z, monkey);
            createVoxel(PALETTE.monkey.fur, 1.5, 4, z, monkey);
        }

        monkey.position.set(0, 0, 0);
        scene.add(monkey);
    }

    function createCouch() {
        const couch = new THREE.Group();
        // Seat
        for (let x = -8; x <= 8; x++) {
            for (let y = 0; y < 4; y++) {
                for (let z = -4; z <= 4; z++) {
                    createVoxel(PALETTE.couch.fabric, x, y, z, couch);
                }
            }
        }
        // Backrest
        for (let x = -8; x <= 8; x++) {
            for (let y = 4; y < 10; y++) {
                for (let z = -4; z <= -2; z++) {
                    createVoxel(PALETTE.couch.fabric, x, y, z, couch);
                }
            }
        }
        // Arms
        for (let y = 4; y < 7; y++) {
            for (let z = -4; z <= 4; z++) {
                createVoxel(PALETTE.couch.fabric, -9, y, z, couch);
                createVoxel(PALETTE.couch.fabric, 9, y, z, couch);
            }
        }
        couch.position.y = 0.5;
        scene.add(couch);
    }

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(20, 40, 20);
    dir.castShadow = true;
    scene.add(dir);

    createCouch();
    createMonkey();

    camera.lookAt(0, 6, 0);

    let animationId;
    const clock = new THREE.Clock();

    function animate() {
        animationId = requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        // Bicep Curl Animation
        const curl = Math.sin(time * 3) * 0.8 + 0.5;
        armGroupL.rotation.x = -curl;
        armGroupR.rotation.x = -curl;

        // Head follows the weights
        headGroup.rotation.x = Math.sin(time * 3) * 0.15;

        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    return () => {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    };
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 300);
    }
}

function showAuthScreen() {
    hideLoadingScreen();
    document.getElementById('authContainer').classList.remove('hidden');
    // Initialize couch monkey animation when auth screen shows
    initCouchMonkeyAnimation();
}

function showAppScreen() {
    hideLoadingScreen();
}

// Voxel monkey pushing button animation for empty climbing sessions
function initNoSessionsAnimation() {
    const canvas = document.getElementById('noSessionsCanvas');
    if (!canvas) return;

    const VOXEL_SIZE = 1;
    const PALETTE = {
        monkey: { fur: 0x8B4513, skin: 0xD2B48C, eyes: 0x111111 },
        button: { main: 0xFFC000, plus: 0xffffff }
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(12, 10, 20);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(250, 250);
    renderer.shadowMap.enabled = true;

    // OrbitControls for mouse interaction
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 5, 0);

    const boxGeo = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);

    function createVoxel(color, x, y, z, parent) {
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
        const mesh = new THREE.Mesh(boxGeo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    }

    let armGroupL, armGroupR, headGroup, monkeyGroup;

    function createMonkey() {
        monkeyGroup = new THREE.Group();

        // Body
        for (let x = -2; x <= 2; x++) {
            for (let y = 0; y < 5; y++) {
                for (let z = -1.5; z <= 1.5; z++) {
                    createVoxel(PALETTE.monkey.fur, x, y + 4, z, monkeyGroup);
                }
            }
        }

        // Belly (Skin color)
        for (let x = -1; x <= 1; x++) {
            for (let y = 1; y < 4; y++) {
                createVoxel(PALETTE.monkey.skin, x, y + 4, 1.6, monkeyGroup);
            }
        }

        // Head
        headGroup = new THREE.Group();
        for (let x = -2; x <= 2; x++) {
            for (let y = 0; y < 4; y++) {
                for (let z = -2; z <= 2; z++) {
                    createVoxel(PALETTE.monkey.fur, x, y + 9, z, headGroup);
                }
            }
        }

        // Face
        for (let x = -1.5; x <= 1.5; x++) {
            for (let y = 0; y < 2.5; y++) {
                createVoxel(PALETTE.monkey.skin, x, y + 9.5, 2.1, headGroup);
            }
        }

        // Eyes
        createVoxel(PALETTE.monkey.eyes, -1, 11, 2.2, headGroup);
        createVoxel(PALETTE.monkey.eyes, 1, 11, 2.2, headGroup);

        monkeyGroup.add(headGroup);

        // Arms (for pushing)
        armGroupL = new THREE.Group();
        armGroupL.position.set(-3, 8, 0);
        for (let y = 0; y > -4; y--) createVoxel(PALETTE.monkey.fur, 0, y, 0, armGroupL);
        monkeyGroup.add(armGroupL);

        armGroupR = new THREE.Group();
        armGroupR.position.set(3, 8, 0);
        for (let y = 0; y > -4; y--) createVoxel(PALETTE.monkey.fur, 0, y, 0, armGroupR);
        monkeyGroup.add(armGroupR);

        // Legs (standing position)
        for (let y = 0; y < 4; y++) {
            createVoxel(PALETTE.monkey.fur, -1.5, y, 0, monkeyGroup);
            createVoxel(PALETTE.monkey.fur, 1.5, y, 0, monkeyGroup);
        }

        // Tail
        for (let z = -1; z > -4; z--) {
            createVoxel(PALETTE.monkey.fur, 0, 4, z, monkeyGroup);
        }

        monkeyGroup.position.set(-8, 0, 0);
        scene.add(monkeyGroup);
    }

    // Button group
    let buttonGroup;
    
    function createButton() {
        buttonGroup = new THREE.Group();
        
        // Button base (voxel cylinder approximation - round shape)
        const buttonRadius = 4;
        const buttonDepth = 2;
        for (let x = -buttonRadius; x <= buttonRadius; x++) {
            for (let y = -buttonRadius; y <= buttonRadius; y++) {
                if (x*x + y*y <= buttonRadius*buttonRadius) {
                    for (let z = 0; z < buttonDepth; z++) {
                        createVoxel(PALETTE.button.main, x, y + 6, z, buttonGroup);
                    }
                }
            }
        }
        
        // Plus sign on button (white voxels)
        // Horizontal bar
        for (let x = -2; x <= 2; x++) {
            createVoxel(PALETTE.button.plus, x, 6, buttonDepth, buttonGroup);
        }
        // Vertical bar
        for (let y = -2; y <= 2; y++) {
            createVoxel(PALETTE.button.plus, 0, y + 6, buttonDepth, buttonGroup);
        }
        
        buttonGroup.position.set(5, 0, 0);
        scene.add(buttonGroup);
    }

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(20, 40, 20);
    dir.castShadow = true;
    scene.add(dir);

    createMonkey();
    createButton();

    camera.lookAt(0, 5, 0);

    let animationId;
    const clock = new THREE.Clock();

    function animate() {
        animationId = requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        // Push animation cycle
        const pushCycle = Math.sin(time * 2);
        const isPushing = pushCycle > 0.3;
        
        // Monkey leans forward when pushing
        monkeyGroup.rotation.x = isPushing ? 0.15 : 0;
        monkeyGroup.position.x = isPushing ? -6 : -8;
        monkeyGroup.position.z = isPushing ? 2 : 0;

        // Arms extend forward when pushing
        armGroupL.rotation.x = isPushing ? -1.3 : -0.3;
        armGroupR.rotation.x = isPushing ? -1.3 : -0.3;

        // Button gets pressed
        buttonGroup.position.z = isPushing ? -1 : 0;

        // Head looks at button
        headGroup.rotation.x = isPushing ? 0.1 : 0;

        // Slight body bounce
        monkeyGroup.position.y = Math.sin(time * 4) * 0.2;

        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    return () => {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    };
}

// Initialize animation when DOM is ready
document.addEventListener('DOMContentLoaded', initLoadingAnimation);

// Expose functions globally
window.hideLoadingScreen = hideLoadingScreen;
window.showAuthScreen = showAuthScreen;
window.showAppScreen = showAppScreen;
window.initNoSessionsAnimation = initNoSessionsAnimation;

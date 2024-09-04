"use strict";


if (!Detector.webgl) Detector.addGetWebGLMessage();
let input = document.getElementById("fileInput");
let renderer = undefined;
let camera = undefined;
let controls = undefined;

//DAT GUI vars
let gui = undefined;
let showWireframe = false;
let showHandles = false;
let enableLogs = false;
let guiBGColor = undefined;
let GuiBGColorController = undefined;
let GuiWireFrameController = undefined;
let GuiTextureController = undefined;
let GuiBackGroundController = undefined;
let options = undefined;
//let GuiAddP2PController = undefined;


let dotCoorditanes = [];

let shiftClick = false;
let altClick = false;
let scene = undefined;
let threeMesh = undefined;
let threeGeometry = undefined;
let wireframe = undefined;
let pickRenderer = undefined;
let pickScene = undefined;
let threePickMesh = undefined;
let threeSphereMap = new Map();
let selectedVertex = undefined;
let isNewMesh = true;
let DEFHR = undefined;
let handleRadius = undefined;

let positions = undefined;

let memoryManager = new EmscriptenMemoryManager();
let mesh = undefined;
let geometry = undefined;
let newtonSolve = undefined;
let texture = undefined;
let threeMaterial = undefined;

let pickedVertex = undefined;

let loader = undefined;
let posUpdateFlag = false;
let dragControls = undefined;
let controlPoints = [];
let controlPointsVertices = [];
let harmonicSolve = undefined;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let position = undefined;
let normal = undefined;
let polygonSoup2 = undefined;
let boardPolygonSoup = undefined;
let Y = undefined;
let worker = undefined;
let vertexIndex = undefined;
let textureURL = undefined;
let boundaryLength = 0;
let TEXTUREPATH = './textures/';
let defaultTexture = 'boy.png';
let wasOptionsClosed = true;
let isDefaultBackground = true;
let setTimer = undefined;
let addP2P = false;
//let removeP2P = false;
let minSRate = undefined;
let t_add_1 = undefined;
let t_add_2 = undefined;
let t_add_check = false;
let drag_check = true;
let p2pWeight = '1000';

//let saveStr = undefined;


//let harmonicFunction = undefined;
//let boundaryLength = undefined;
//let vertexCount = undefined;
//let W_x = undefined;
//let W_y = undefined;
//let xPositions = undefined;
//let Y_x = undefined;
//let Y_y = undefined;
//let isPreprocessed = false;

function getOS() {
    var userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE', 'Win'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'Windows';
    } else if (/Android/.test(userAgent)) {
        os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
        os = 'Linux';
    }

    return os;
}
function is_touch_device4() {
    var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
    var mq = function (query) {
        return window.matchMedia(query).matches;
    }

    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
        return true;
    }

    // include the 'heartz' as a way to have a non matching MQ to help terminate the join
    // https://git.io/vznFH
    var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
    return mq(query);
}

let platform = getOS();
let isToucheble = (is_touch_device4() || platform == 'iOS' || platform == 'Android') ? true : false;
minSRate = (isToucheble) ? 3 : 1;
t_add_1 = (isToucheble) ? 0 : undefined;
t_add_2 = (isToucheble) ? 0 : undefined;
p2pWeight = (isToucheble) ? '100' : '1000';

DEFHR = (isToucheble) ? 0.5 : 0.2;
handleRadius = DEFHR;
let loadType = '';
let objectToLoad = undefined;
textureURL = TEXTUREPATH + defaultTexture;
objectToLoad = boy;

let initValues = ['1000', '10', '20', p2pWeight, (minSRate + 3).toString(), '0'];
let filename = "square.obj";

let BGColor = function () {
    this.color = 0xa7a09a;
    this.update = function (val) {
        this.color = val;
        if (isDefaultBackground) {
            scene.background = new THREE.Color(this.color);
        }
    }
}
let guiFields = {
    //"Remove p2p": removeP2P,
    "Load Mesh": function () {
        isNewMesh = true;
        loadType = 'OBJ';
        input.click();
    },
    //"Export Mesh": function () {
    //    exportFile(createOutputFile()); 
    //    //function () {
    //    //exportFile(MeshIO.writeOBJ({
    //    //    "v": positions,
    //    //    "vt": uvs,
    //    //    "vn": normals,
    //    //    "f": indices
    //    //}));
    //},
    "Load Texture": function () {
        loadType = 'TEXTURE';
        input.click();
    },

    //"Reverse": function () {
    //    if (worker === typeof undefined) {
    //        console.log('Error in worker!')
    //    }
    //    else {
    //        worker.postMessage([99]);
    //    }
    //},
    "Reset": function () {
        isNewMesh = false;
        initMesh(objectToLoad);
        initDragControls(); //initiate drag controller
        addEventListeners();
        scene.add(threeMesh);
        worker.postMessage([6]);

    },
    //"Save Matrix": function () {
    //    saveToText();
    //},
    "Show Wireframe": showWireframe,
    "Hide Handles": showHandles,
    "Built-in shapes": "boy",
    "Texture": "default",
    "Background": "default",
    "Max # of iterations": initValues[0],
    "t": initValues[1],
    "Max LS iterations": initValues[2],
    "P2P Weight": initValues[3],
    //"Precision": initValues[4],
    //"Render frequency": initValues[5],
    "Sample Rate": initValues[4],
    "Enable logs": enableLogs,
    "Help": function () {
        let modal = document.getElementById("myModal");
        modal.style.display = "block";
        var span = document.getElementsByClassName("close")[0];
        span.onclick = function () {
            modal.style.display = "none";
        }
        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    }
};

init();
animate();

function init() {
    let container = document.createElement("div");
    document.body.appendChild(container);
    initRenderer(container);
    initGUI();
    initCamera();
    initScene();
    initLights();
    initMesh(objectToLoad);
    initControls();
    initDragControls(); //AG: Initiate drag controller
    addEventListeners();
    GuiTextureController.setValue('default');
    GuiBackGroundController.setValue('default');
    initWorker();
    runWorker();
}

function workerMessageReceiver(e) {
    switch (e.data[0]) {
        case 0://Preprocessing is finished. Get the Harmonic Function from worker
            console.log('Worker sent: ' + e.data[1]);
            boundaryLength = e.data[2];
            scene.add(threeMesh);
            let element = document.getElementById("meta");
            element.style.animationName = "none";
            if (isToucheble) {
                element.style.fontSize = "x-small";
                element.style.top = "25px";
                element.textContent = "Double tap to add or remove a p2p handle.";
                element = document.getElementById("info2");
                element.textContent = "v. count: " + geometry.mesh.vertices.length + "/" + boundaryLength;
                element = document.getElementById("title");
                element.style.fontSize = "smaller";
            }
            else {
                element.style.fontSize = "smaller";
                element.textContent = "Shift+click to add p2p handle.";
                element.textContent += "\nAlt+click to remove p2p handle.";
                element = document.getElementById("info2");
                element.textContent = "Vertex count: " + geometry.mesh.vertices.length + "/" + boundaryLength + ' [tot/bound]';
            }

            break;
        case 1://Update mesh from energySD (when not yet converged)
            positions = e.data[1];
            threeMesh.dispatchEvent({ type: "updateMesh" });
            break;
        case 2://converged to min. energy -> update mesh
            positions = e.data[1];
            threeMesh.dispatchEvent({ type: "updateMesh" });

            if (e.data[3]) {
                for (let i = 0; i < positions.length / 3; i++) {
                    geometry.positions[i].x = positions[3 * i];
                    geometry.positions[i].y = positions[3 * i + 1];
                }
                pickScene.remove(threePickMesh);
                initThreePickMesh();
                pickScene.add(threePickMesh);

                if (typeof (controlPoints[e.data[2]]) != 'undefined')
                    controlPoints[e.data[2]].material.color.set(0xff0000);

                wireframe = new THREE.LineSegments();
                wireframe.geometry = new THREE.WireframeGeometry(threeGeometry);
                wireframe.material = new THREE.LineBasicMaterial({
                    color: 0x00ffa0,
                    linewidth: 0.95,
                    transparent: true
                });
                drag_check = true;
            }
            break;
        case 3://save matrix to .txt file
            console.log('Got the matrix to save!');
            saveStr = e.data[1].join(" ");
            saveToText();
            break;
        default://error
            console.log('Error: Wrong message number in Main!');
            break;
    }
}

function initWorker() {
    if (typeof (Worker) !== "undefined") {
        if (typeof (worker) == "undefined") {
            worker = new Worker("./energy_lib/energySD.js");
            worker.onmessage = workerMessageReceiver;
        }
    }
}

function runWorker() {
    worker.postMessage([0, threeGeometry.attributes.position.array, new THREE.BufferAttribute(threeGeometry.getIndex())]);//begin preprocessing in energySD
    worker.postMessage([4, 7, parseInt(initValues[0]), parseFloat(initValues[1]), parseInt(initValues[2]), parseInt(initValues[3]), parseInt(initValues[4]), parseInt(initValues[5])] );//set default user values
}

function initRenderer(container) {
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xffffff, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    pickRenderer = new THREE.WebGLRenderer({
        antialias: false // turn antialiasing off for color based picking
    });
    pickRenderer.setPixelRatio(window.devicePixelRatio);
    pickRenderer.setClearColor(0xffffff, 1.0);
    pickRenderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(pickRenderer.domElement);
}

function initGUI() {
    gui = new dat.GUI();
    guiBGColor = new BGColor();
    //guiHandles = new HandlesSize();

    //let io = gui.addFolder("IO");
    //GuiAddP2PController = gui.add(guiFields, "Add p2p").onChange(toggleAdddP2P).listen();
    //io.add(guiFields, "Export Mesh");

    //io.open();
    //gui.add(guiFields, "Preprocessing+Change");
    //gui.add(guiFields, "Reverse");
    //gui.add(guiFields, "Save Matrix");
    gui.add(guiFields, "Load Mesh");
    gui.add(guiFields, "Load Texture");
    gui.add(guiFields, "Reset");
    options = gui.addFolder("Options");
    options.add(guiFields, "Max # of iterations").onFinishChange(val => { if (parseInt(val) > 0) worker.postMessage([4, 0, parseInt(val, 10)]) }).listen();
    options.add(guiFields, "t").onFinishChange(val => { if (parseInt(val) > 0) worker.postMessage([4, 1, parseInt(val)]) }).listen();
    options.add(guiFields, "Max LS iterations").onFinishChange(val => { if (parseInt(val) > 0) worker.postMessage([4, 2, parseInt(val, 10)]) }).listen(); 
    options.add(guiFields, "P2P Weight").onFinishChange(val => { if (parseInt(val)>0) worker.postMessage([4, 3, parseInt(val,10)]) }).listen(); 
    //options.add(guiFields, "Precision").onFinishChange(val => { worker.postMessage([4, 4, parseFloat(val)]) }).listen();
    //options.add(guiFields, "Render frequency").onFinishChange(val => { worker.postMessage([4, 5, parseInt(val, 10)]) }).listen();
    options.add(guiFields, "Sample Rate").onFinishChange(val => { worker.postMessage([4, 4, parseInt(val, 10)]) }).listen();
    options.add(guiFields, "Enable logs").onChange(toggleLogs).listen();
    if (!wasOptionsClosed)
        options.open();
    gui.add(guiFields, "Built-in shapes", ["bar", "bar2", "square-bar", "square with hole", "disk", "boy", "deer", "elephant", "gingerbreadman", "horse", "monkey", "racoon", "timon"]).onChange(reloadMesh).listen();
    GuiTextureController = gui.add(guiFields, "Texture", ["default", "checkerboard", "checkerboard2", "yellow-cb", "orange-cb", "cycle-cb", "geralt"]).onChange(reloadTexture).listen();
    GuiBackGroundController = gui.add(guiFields, "Background", ["default", "africa", "field", "jungle", "meadow", "mountains", "other..."]).onChange(changeBackground).listen();
    GuiBGColorController = gui.addColor(guiBGColor, "color", 0, 128, 255, 0.3).onChange(val => guiBGColor.update(val)).listen();
    GuiWireFrameController = gui.add(guiFields, "Show Wireframe").onChange(toggleWireframe).listen();
    gui.add(guiFields, "Hide Handles").onChange(toggleHandles).listen();
    gui.add(guiFields, "Help");
    if (isToucheble)
        gui.close();
}

window.onload = function () {
    input.addEventListener("change", function (e) {
        let file = input.files[0];
        filename = file.name;
        switch (loadType) {
            case "OBJ":
                loadType = '';
                handleRadius = DEFHR;
                if (filename.endsWith(".obj")) {
                    let reader = new FileReader();
                    reader.onload = function (e) {
                        let element = document.getElementById("meta");
                        element.style.animationName = "loadingfade";
                        element.style.fontSize = "larger";
                        element.textContent = "Loading...";
                        element = document.getElementById("info2");
                        if (!isToucheble)
                            element.textContent = "Vertex count: ";
                        camera.position.z = 20;
                        worker.postMessage([10]);
                        worker.delete;
                        worker = undefined;
                        wasOptionsClosed = (options.closed) ? true : false;
                        options.delete;
                        options = undefined;
                        gui.destroy();
                        initValues = ['1000', '10', '20', p2pWeight, (minSRate + 4).toString(), '0'];
                        defaultTexture = 'checkerboard.png';
                        initGUIOptionsValues();
                        initGUI();
                        GuiBackGroundController.setValue('default');
                        objectToLoad = reader.result;
                        //isPreprocessed = false;
                        initMesh(objectToLoad);
                        initDragControls();
                        addEventListeners();
                        initWorker();
                        runWorker();
                    }

                    reader.onerror = function (e) {
                        alert("Unable to load OBJ file");
                    }

                    reader.readAsText(file);

                }
                else {
                    alert("Please load an OBJ file");
                }
                break;

            case "TEXTURE":
                console.log('Loading a texture ');
                loadType = '';
                if (filename.endsWith(".jpg") || (filename.endsWith(".png"))) {
                    let reader = new FileReader();
                    reader.onload = function (e) {
                        texture = new THREE.TextureLoader().load(reader.result);
                        //threeMaterial = new THREE.MeshPhongMaterial({ map: texture });
                        threeMaterial = new THREE.MeshBasicMaterial({ map: texture });
                        threeMaterial.transparent = true;
                        threeMesh.material = threeMaterial;
                    }
                    reader.readAsDataURL(file);
                    
                }
                else {
                    alert("Supported texture types: jpg, png");
                }
                break;
            case "BACKGROUND":
                console.log('Loading a background texture ');
                loadType = '';
                if (filename.endsWith(".jpg") || (filename.endsWith(".png"))) {
                    let reader = new FileReader();
                    reader.onload = function (e) {
                        texture = new THREE.TextureLoader().load(reader.result);
                        scene.background = texture;
                    }
                    reader.readAsDataURL(file);

                }
                else {
                    alert("Supported texture types: jpg, png");
                }
                break;
            default:
                console.log('Error in load-type!');
                break;
        }

    });
}

function reloadMesh(value) {

    switch (value) {
        case "square-bar":
            objectToLoad = square;
            initValues = ['1000', '10', '20', p2pWeight, minSRate.toString(), '1'];
            defaultTexture = 'checkerboard.png';
            handleRadius = DEFHR/2;
            break;
        case "square with hole":
            objectToLoad = square_with_hole;
            initValues = ['1000', '10', '20', p2pWeight, (minSRate+1).toString(), '1'];
            defaultTexture = 'checkerboard.png';
            handleRadius = DEFHR/2;
            break;
        case "bar":
            objectToLoad = bar;
            initValues = ['1000', '10', '20', p2pWeight, (minSRate+2).toString(), '0'];
            defaultTexture = 'checkerboard.png';
            handleRadius = DEFHR;
            break;
        case "bar2":
            objectToLoad = bar2;
            initValues = ['1000', '10', '20', p2pWeight, minSRate.toString(), '1'];
            defaultTexture = 'yellow-cb.png';
            handleRadius = DEFHR/1.2;
            break;
        case "disk":
            objectToLoad = big_disk;
            initValues = ['1000', '10', '20', p2pWeight, minSRate.toString(), '1'];
            defaultTexture = 'cycle-cb.png';
            handleRadius = DEFHR/2;
            break;
        case "boy":
            objectToLoad = boy;
            initValues = ['1000', '10', '20', p2pWeight, (minSRate+2).toString(), '0'];
            defaultTexture = 'boy.png';
            handleRadius = DEFHR;
            break;
        case "deer":
            objectToLoad = deer;
            initValues = ['1000', '10', '20', p2pWeight, (minSRate + 2).toString(), '0'];
            defaultTexture = 'deer.png';
            handleRadius = DEFHR;
            break;
        case "elephant":
            objectToLoad = elephant;
            initValues = ['1000', '10', '20', p2pWeight, (minSRate + 4).toString(), '0'];
            defaultTexture = 'elephant.png';
            handleRadius = DEFHR;
            break;
        //case "frog": 
        //    objectToLoad = frog;
        //    initValues = ['1000', '10', '20', '1000', '5'];
        //    defaultTexture = 'frog.png';
        //    handleRadius = DEFHR;
        //    break;
        case "gingerbreadman": 
            objectToLoad = gingerbreadman;
            initValues = ['1000', '10', '20', p2pWeight, (minSRate + 2).toString(), '0'];
            defaultTexture = 'gingerbreadman.png';
            handleRadius = DEFHR;
            break;
        case "horse":
            objectToLoad = horse;
            initValues = ['1000', '10', '20', p2pWeight, (minSRate + 4).toString(), '0'];
            defaultTexture = 'horse.png';
            handleRadius = DEFHR;
            break;
        case "monkey":
            objectToLoad = monkey;
            initValues = ['1000', '10', '20', p2pWeight, (minSRate + 4).toString(), '0'];
            defaultTexture = 'monkey.png';
            handleRadius = DEFHR;
            break;
        case "racoon":
            objectToLoad = racoon;
            initValues = ['1000', '10', '20', p2pWeight, (minSRate + 2).toString(), '0'];
            defaultTexture = 'racoon.png';
            handleRadius = DEFHR;
            break;
        case "timon":
            objectToLoad = timon;
            initValues = ['1000', '10', '20', p2pWeight, (minSRate + 2).toString(), '0'];
            defaultTexture = 'timon.png';
            handleRadius = DEFHR;
            break;
        default:
            console.log('Default mesh loaded: boy');
            objectToLoad = boy;
            defaultTexture = 'boy.png';
            handleRadius = DEFHR;
            break;
    }
    let element = document.getElementById("meta");
    element.style.animationName = "loadingfade";
    element.style.fontSize = "larger";
    element.textContent = "Loading...";
    element = document.getElementById("info2");
    if (!isToucheble)
        element.textContent = "Vertex count: ";
    camera.position.z = 20;
    worker.postMessage([10]);
    worker.delete;
    worker = undefined;
    wasOptionsClosed = (options.closed) ? true : false;
    options.delete;
    options = undefined;
    gui.destroy();
    initGUIOptionsValues();
    initGUI();
    GuiTextureController.setValue('default');
    GuiBackGroundController.setValue('default');
    isNewMesh = true;
    initMesh(objectToLoad);
    initDragControls();
    addEventListeners();
    initWorker();
    runWorker();
}

function reloadTexture(value) {
    if (value == 'default') {
        textureURL = TEXTUREPATH + defaultTexture;
    }
    else {
        textureURL = TEXTUREPATH + value + ".png";
    }
    let loader = new THREE.TextureLoader();
    texture = loader.load(
        textureURL, undefined, undefined,
        function (err) {
            console.log('Error in texture loader! ' + err.type);
            alert(err.type);
        }
    );
    threeMaterial = new THREE.MeshBasicMaterial({ map: texture });
    threeMaterial.transparent = true;
    threeMesh.material = threeMaterial;
}

function changeBackground(value) {
    if (value == 'default') {
        scene.background = new THREE.Color(0xa7a09a);
        isDefaultBackground = true;
    }
    else
        if (value == "other...") {
            loadType = 'BACKGROUND';
            input.click();
            isDefaultBackground = false;
        }
        else {
            isDefaultBackground = false;
            let BGURL = './backgrounds/' + value + '.png';
            let loader = new THREE.TextureLoader();
            let texture = loader.load(
                BGURL, undefined, undefined,
                function (err) {
                    console.log('Error in texture loader! ' + err.type);
                    alert(err.type);
                }
            );
            scene.background = texture;
        }
}

function initGUIOptionsValues() {
    guiFields["Max # of iterations"] = initValues[0];
    guiFields["t"] = initValues[1];
    guiFields["Max LS iterations"] = initValues[2];
    guiFields["P2P Weight"] = initValues[3];
    //guiFields["Precision"] = initValues[4];
    //guiFields["Render frequency"] = initValues[5];
    guiFields["Sample Rate"] = initValues[4];
}

function toggleWireframe(checked) {
    showWireframe = checked;
    if (showWireframe) threeMesh.add(wireframe);
    else threeMesh.remove(wireframe);
}

function toggleLogs(checked) {
    enableLogs = checked;
    if (enableLogs) {
        worker.postMessage([7, 1]);
    }
    else {
        worker.postMessage([7, 0]);
    }
}

function toggleHandles(checked) {
    showHandles = checked;
    if (controlPoints.length > 0) {
        if (showHandles) {
            for (let c of controlPoints) {
                c.material.visible = false;
                c.geometry
            }
        }
        else {
            for (let c of controlPoints) {
                c.material.visible = true;
            }
        }
    }
}

function initCamera() {
    const fov = 50.0;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 500;
    const eyeZ = 20;

    //camera = new THREE.OrthographicCamera(window.innerWidth / -150, window.innerWidth / 150, window.innerHeight / 150, window.innerHeight/-150, near, far);

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = eyeZ;
}

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa7a09a); 

    pickScene = new THREE.Scene();
    pickScene.background = new THREE.Color(0xffffff);
}

function initLights() {
    let ambient = new THREE.AmbientLight(0xffffff, 0.35);
    camera.add(ambient);

    let point = new THREE.PointLight(0xffffff);
    point.position.set(2, 20, 15);
    camera.add(point);
    scene.add(camera);
}

/*AG: Create Polygon-Soup from the geometry of the loaded threeMesh */
function createPlygonSoupFromThreeMesh() {
    let positions = [];
    let indices = [];

    let threePositions = threeGeometry.attributes.position.array;
    for (let i = 0; i < threePositions.length / 3; i++) {
        positions.push(new Vector(threePositions[i * 3 + 0], threePositions[i * 3 + 1], threePositions[i * 3 + 2]));
    }
    let threeIndices = new THREE.BufferAttribute(threeGeometry.getIndex());
    console.log('positions: ' + positions.length);
    for (let i = 0; i < threeIndices.array.count; i++) {
        indices.push(threeIndices.array.array[i]);
    }
    return {
        "v": positions,
        "f": indices
    };
}

function initMesh(text) {
    drag_check = true;
    // remove any previously loaded mesh from scene
    scene.remove(threeMesh);
    pickScene.remove(threePickMesh);
    ////if (isPreprocessed)
    //    memoryManager.deleteExcept([harmonicFunction, W_x, W_y]);
    //else
    memoryManager.deleteExcept([]);
    //AG: Create a three.js mesh (and geometry) object
    //AG: Also create core.mesh and geometry, pickThreeMesh
    initMyThreeMesh(text);
    //scene.add(threeMesh);

    initThreePickMesh();
    pickScene.add(threePickMesh);

    for (let threeSphereMesh of threeSphereMap.values()) scene.remove(threeSphereMesh);
    threeSphereMap = new Map();
    controlPoints.delete;
    controlPointsVertices.delete;
    controlPoints = [];
    controlPointsVertices = [];
    selectedVertex = undefined;
}

/*AG: Load new object with three.js OBJLoader2
 *AG: Then create new polygon soup and build core.mesh object with geometry*/
function initMyThreeMesh(text) {
    //var texture = new THREE.TextureLoader().load('./textures/cb.png');
    ////var texture = new THREE.TextureLoader().load('./textures/racoon.png');
    //textureURL = './textures/checkerboard.png';
    textureURL = TEXTUREPATH + defaultTexture;
    let loader = new THREE.TextureLoader();
    if ((typeof (texture) != "object") || (isNewMesh)) {
        texture = loader.load(
            textureURL, undefined, undefined,
            function (err) {
                console.log('Error in texture loader! ' + err.type);
                alert(err.type);
            }
        );
    }

    //threeMaterial = new THREE.MeshPhongMaterial({ map: texture });
    threeMaterial = new THREE.MeshBasicMaterial({ map: texture });
    threeMaterial.transparent = true;
    threeGeometry = new THREE.BufferGeometry();
    threeMesh = new THREE.Mesh();
    loader = new THREE.OBJLoader2();
    loader.setUseIndices(true);
    let loaderRNode = loader.parse(text);
    loaderRNode.traverse(function (node) {
        if (node.isMesh) {
            console.log("IS MESH:PARSE SUCCESS");
            //node.material = threeMaterial
            threeMesh = node;//.clone();
            threeMesh.material = threeMaterial;
            threeGeometry = threeMesh.geometry;
            if (threeMesh.isMesh) console.log('threeMesh is mesh');

            polygonSoup2 = createPlygonSoupFromThreeMesh();
            mesh = new Mesh();
            if (mesh.build(polygonSoup2)) {
                console.log('Mesh build was sucsessful');
                geometry = new Geometry(mesh, polygonSoup2["v"], false);
                vertexIndex = indexElements(geometry.mesh.vertices);
                // create wireframe
                wireframe = new THREE.LineSegments();
                wireframe.geometry = new THREE.WireframeGeometry(threeGeometry);
                wireframe.material = new THREE.LineBasicMaterial({
                    color: 0x00ffa0,
                    linewidth: 0.95,
                    transparent: true
                });
                isNewMesh = false;
                // toggle wireframe
                toggleWireframe(showWireframe);
                //xPositions = new Float32Array(mesh.vertices.length);
                //for (let i = 0; i < xPositions.length; i++) {
                //    xPositions[i] = geometry.positions[i].x;
                //}
            }
            else {
                alert("Unable to build halfedge mesh");
                console.log("Mesh build failier");
            }
        }
    })
}

function initThreePickMesh() {
    // create geometry object
    let threePickGeometry = new THREE.BufferGeometry();

    // fill position and color buffers
    // picking region for each vertex is the barycentric dual cell
    let C = mesh.corners.length;
    let pickPositions = new Float32Array(C * 6 * 3);
    let pickColors = new Float32Array(C * 6 * 3);
    let elementColor = function (pickId) {
        return new Vector(
            ((pickId & 0x000000ff) >> 0) / 255.0,
            ((pickId & 0x0000ff00) >> 8) / 255.0,
            ((pickId & 0x00ff0000) >> 16) / 255.0);
    }

    for (let c of mesh.corners) {
        let i = 6 * 3 * c.index;
        let v = c.vertex;
        let pickColor = elementColor(v.index + 1); // Hack! dat gui interferes with picking
        // by returning a pickId of 0 on mouse click, shifting indices by 1 seems to avoid this

        // get the three vertex positions in the triangle
        let p1 = geometry.positions[v];
        let p2 = geometry.positions[c.next.vertex];
        let p3 = geometry.positions[c.prev.vertex];

        // get the edge and triangle midpoints
        let m12 = p1.plus(p2).over(2);
        let m13 = p1.plus(p3).over(2);
        let m123 = p1.plus(p2).plus(p3).over(3);

        // give all the triangles the same pick color at this corner
        let tris = [p1, m12, m123, p1, m123, m13];
        for (let j = 0; j < 6; j++) {
            let k = i + 3 * j;

            pickPositions[k + 0] = tris[j].x;
            pickPositions[k + 1] = tris[j].y;
            pickPositions[k + 2] = tris[j].z;

            pickColors[k + 0] = pickColor.x;
            pickColors[k + 1] = pickColor.y;
            pickColors[k + 2] = pickColor.z;
        }
    }

    // set geometry
    threePickGeometry.addAttribute("position", new THREE.BufferAttribute(pickPositions, 3));
    threePickGeometry.addAttribute("color", new THREE.BufferAttribute(pickColors, 3));

    // create material
    let threePickMaterial = new THREE.MeshBasicMaterial({
        vertexColors: THREE.VertexColors
    });

    // create mesh
    threePickMesh = new THREE.Mesh(threePickGeometry, threePickMaterial);
    
}

function initThreeSphereMesh(v, updeteInWorker = true) {
    let createdSphere = false;
    if (!threeSphereMap.has(v.index)) {
        //let threeSphereMesh = new THREE.Mesh(new THREE.SphereGeometry(handleRadius), new THREE.MeshBasicMaterial({ color: 0xff0000, transparent:true, opacity:0.7 }));
        let threeSphereMesh = new THREE.Mesh(new THREE.CircleGeometry(handleRadius), new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 }));
        let center = geometry.positions[v];
        threeSphereMesh.position.set(center.x, center.y, (center.z+0.01));
        scene.add(threeSphereMesh);
        threeSphereMap.set(v.index, threeSphereMesh);
        controlPoints.push(threeSphereMesh);
        controlPointsVertices.push(v);
        if (updeteInWorker)
            worker.postMessage([2, vertexIndex[v], center.x, center.y]); //send to worker the new vertex with handle
        if (enableLogs)
            console.log('added handles position:' + center.x + ',' + center.y);
        createdSphere = true;
        if (isToucheble)
            window.navigator.vibrate(200);
    }
    return createdSphere;
}

function deleteThreeSphereMesh(v, updeteInWorker = true) {
    let deletedSphere = false;
    if (threeSphereMap.has(v.index)) {
        let threeSphereMesh = threeSphereMap.get(v.index);
        //NEED TO REMOVE FROM CONTROL POINTS
        let vIndex = controlPoints.indexOf(threeSphereMesh);
        controlPoints.splice(vIndex, 1);
        controlPointsVertices.splice(vIndex, 1);
        dragControls = new THREE.DragControls(controlPoints, camera, renderer.domElement);
        scene.remove(threeSphereMesh);
        threeSphereMap.delete(v.index);
        if (updeteInWorker)
            worker.postMessage([5, vIndex]);

        deletedSphere = true;
        if (isToucheble)
            window.navigator.vibrate([0,10,60,50,50]);

    }

    return deletedSphere;
}



function initControls() {
    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.noRotate = true;
}
//AG: DragControls for draging control points and shape deformation
function initDragControls() {
    dragControls = new THREE.DragControls(controlPoints, camera, renderer.domElement);
    dragControls.addEventListener('dragstart', function (e) {
        controls.enabled = false;
        GuiWireFrameController.setValue(false);
        showWireframe = false;
        pickedVertex = controlPointsVertices[controlPoints.indexOf(e.object)];
        if (enableLogs)
            console.log('in dragstart: pos = ' + e.object.position.x + ',' + e.object.position.y);
    });

    dragControls.addEventListener('dragend', function (e) {
        /*AG: Every time after updatig the mesh by dragging the control pionts
         *AG: Remove threePickMesh and create new one with updated positions */
        //pickScene.remove(threePickMesh);
        //initThreePickMesh();
        //pickScene.add(threePickMesh);

        //console.log('in "dragend":' + targetVertexPosition[0] + ',' + targetVertexPosition[1]);

        //pickedVertex = controlPointsVertices[controlPoints.indexOf(e.object)];
        pickedVertex = controlPoints.indexOf(e.object);
        if (enableLogs) {
            console.log('in dragend: pos = ' + e.object.position.x + ',' + e.object.position.y);
            console.log('PickedVertex = ' + pickedVertex);
        }
        worker.postMessage([3, pickedVertex, e.object.position.x, e.object.position.y, 1]);
        pickedVertex = undefined;
        controls.enabled = true;
    });

    dragControls.addEventListener('dragdelete', function (e) {
        if (isToucheble)
            drag_check = false;
        let picked = controlPointsVertices[controlPoints.indexOf(e.object)];
        if (enableLogs)
            console.log('in dragdelete: pos = ' + e.object.position.x + ',' + e.object.position.y + ' picked vertex ' + picked);
        if (deleteThreeSphereMesh(picked)) {
            if (selectedVertex === picked) selectedVertex = undefined;
            setTimer = setTimeout(function () { drag_check = true; }, 500);
        }
    });
}

function addEventListeners() {
    window.addEventListener("click", onMouseClick, false);
    window.addEventListener("touchstart", onTouchStart, false);
    window.addEventListener("touchend", onTouchEnd, false);
    //window.addEventListener("touchmove", onTouchMove, false);
    //window.addEventListener("touchcancel", onTouchMove, false);
    window.addEventListener("resize", onWindowResize, false);
    dragControls.addEventListener("drag", onMyDrag, false);
    threeMesh.addEventListener("updateMesh", animate2, false);
}

function onTouchEnd(event) {
    //clearTimeout(setTimer);
    t_add_2 = performance.now();
    if ((t_add_2 - t_add_1) < 200) {
        t_add_check = true;
    }
}

//function onTouchMove(event) {
//    //clearTimeout(setTimer);
//    addP2P = false;
//    //t_add_check = false;

//}


function onTouchStart(event) {
    addP2P = false;
    //t_add_check = true;
    if (event.touches[0].clientX >= 0 && event.touches[0].clientX <= window.innerWidth &&
        event.touches[0].clientY >= 0 && event.touches[0].clientY <= window.innerHeight) {
        if (event.touches.length < 2) {

            t_add_1 = performance.now();
            if (t_add_check) {
                if ((t_add_1 - t_add_2) < 200) {
                    t_add_check = false;
                    addP2P = true;
                    pick(event.touches[0].clientX, event.touches[0].clientY);
                }
            }

        //    setTimer = setTimeout(function () {
        //        addP2P = true;
        //        pick(event.touches[0].clientX, event.touches[0].clientY);
        //    }, 900);
        }
        
        //if ((addP2P)) {
        //    pick(event.touches[0].clientX, event.touches[0].clientY);
        //}
    }
}

function onMyDrag(e) {
    pickedVertex = controlPoints.indexOf(e.object);
    worker.postMessage([3, pickedVertex, e.object.position.x, e.object.position.y, 0]);

    //pickedVertex = undefined;
    //window.addEventListener("mousemove", function () {
    //    let xC = window.event.screenX;
    //}, false);

    /*I can use HERE selectedVertex from pick function*/
    //updateThreeMesh();
}

function onMouseClick(event) {
    if (event.clientX >= 0 && event.clientX <= window.innerWidth &&
        event.clientY >= 0 && event.clientY <= window.innerHeight) {
        shiftClick = event.shiftKey;
        //altClick = event.altKey;

        if ((shiftClick)) {// || (addP2P)) {// || (altClick)) {
            pick(event.clientX, event.clientY);
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
    render();
}

function pick(clickX, clickY) {
    // draw
    let pickTexture = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    pickTexture.texture.generateMipmaps = false;
    pickRenderer.render(pickScene, camera, pickTexture);

    // read color
    let pixelBuffer = new Uint8Array(4);
    pickRenderer.readRenderTargetPixels(pickTexture, clickX, pickTexture.height - clickY, 1, 1, pixelBuffer);
    // convert color to id
    let pickId = pixelBuffer[0] + pixelBuffer[1] * 256 + pixelBuffer[2] * 256 * 256;
    if (pickId !== 0 && pickId !== 0x00ffffff) {
        addOrRemoveControlPoint(mesh.vertices[pickId - 1]);
    }
}

function addOrRemoveControlPoint(v) {
    if ((shiftClick) || (addP2P && drag_check)) {
        if (!threeSphereMap.has(v.index)) {
            selectedVertex = v;
            initThreeSphereMesh(v);
            addP2P = false;
        }
        //if (deleteThreeSphereMesh(v)) {
        //    if (selectedVertex === v) selectedVertex = undefined;
        //}
        //else {
        //    selectedVertex = v;
        //    initThreeSphereMesh(v);
        //}
    }
    else {
        selectedVertex = v;
    }
        //if (altClick) {
        //    //if (deleteThreeSphereMesh(v)) {
        //    //    if (selectedVertex === v) selectedVertex = undefined;
        //    //}
        //}
        //else {
        //    selectedVertex = v;
        //}
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    //if (posUpdateFlag) {
    //    let V = mesh.vertices.length;
    //    let positions = new Float32Array(V * 3);
    //    for (let v of mesh.vertices) {
    //        let position = geometry.positions[v];
    //        let i = v.index;
    //        positions[3 * i + 0] = position.x;
    //        positions[3 * i + 1] = position.y;
    //        positions[3 * i + 2] = 0;
    //        //threeGeometry.attributes.position.copyArray(positions);
    //        //threeGeometry.getAttribute("position")
    //        //threeMesh.position.set(position.x, position.y, position.z);
    //    }
    //    threeGeometry.attributes.position.copyArray(positions);
    //    posUpdateFlag = false;
    //    threeGeometry.attributes.position.needsUpdate = true;
    //}
    render();
}

function animate2() {
    threeGeometry.attributes.position.copyArray(positions);
    threeGeometry.attributes.position.needsUpdate = true;

    render();
}

function render() {
    renderer.render(scene, camera);
}

//function exportFile(text) {
//    console.log('IN EXPORT FILE');
//    let blob = new Blob([text], { type: "text/plain;charset=utf-8" });
//    saveAs(blob, "savedMatrix.txt");
//    //let element = document.createElement("a");
//    //element.setAttribute("href", "data:text/plain;charset=utf-8" + encodeURIComponent(text));
//    //element.setAttribute("download", filename);

//    //element.style.display = "none";
//    //document.body.appendChild(element);

//    //element.click();

//    //document.body.removeChild(element);
//}

//function createOutputFile() {
//    console.log('IN CREATE EXPORT FILE');
//    let output = "";

//    // write positions
//    //let faces = threeGeometry.attributes.faces.array;
//    //let uvs = threeGeometry.attributes.faceVertexUvs.array;
//    for (let i = 0; i < positions.length / 3; i++) {
//        output += "v " + positions[3 * i + 0] + " " + positions[3 * i + 1] + " " + positions[3 * i + 2] + "\n";
//        //if (uvs) output += "vt " + uvs[3 * i + 0] + " " + uvs[3 * i + 1] + "\n";
//        //if (normals) output += "vn " + normals[3 * i + 0] + " " + normals[3 * i + 1] + " " + normals[3 * i + 2] + "\n";
//    }

//    //// write indices
//    //let indices = polygonSoup["f"];
//    //for (let i = 0; i < indices.length; i += 3) {
//    //    output += "f ";
//    //    for (let j = 0; j < 3; j++) {
//    //        let index = indices[i + j] + 1;
//    //        output += index;
//    //        if (uvs) output += "/" + index;
//    //        if (!uvs && normals) output += "/";
//    //        if (normals) output += "/" + index;
//    //        output += " ";
//    //    }
//    //    output += "\n";
//    //}
//    console.log('output length = ' + output.length)
//    return output;
//}

/////**
//// * Save matrix as .txt file
//// * */
//function saveToText() {
//    let blob = new Blob([saveStr], { type: "text/plain;charset=utf-8" });
//    saveAs(blob, "savedMatrix.txt");
//}

    //"Preprocessing+Change": function () {

    //    worker.postMessage([0, threeGeometry.attributes.position.array, new THREE.BufferAttribute(threeGeometry.getIndex())]);

    //    //let exportSolvedHarmonic = HarmonicOut.writeFile(harmonicSolve);
    //    //var blob = new Blob(["Hello, world!"], {type: "text/plain;charset=utf-8"});
    //    //FileSaver.saveAs(blob, "hello world.txt");
    //    //let element = document.createElement("a");
    //    //element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(exportSolvedHarmonic));
    //    //element.setAttribute("download", "small_disk_harmonic");

    //    //element.style.display = "none";
    //    //document.body.appendChild(element);

    //    //element.click();

    //    //document.body.removeChild(element);

    //    //myEnergy.run();

    //    //memoryManager.deleteExcept([harmonicSubspace.H, harmonicSubspace.X, harmonicSubspace.L, harmonicSubspace.smallL, myEnergy.HForRealW, myEnergy.ones, myEnergy.BB, myEnergy.BbarGrad, myEnergy.BBbar, myEnergy.BGrad, myEnergy.transferMatrixForFz, myEnergy.SumUpGradientElements, myEnergy.PumpingMatrixForAlpha, myEnergy.gradientElementsToOriginalStructure, myEnergy.W, myEnergy.XForReal]);

    //    //memoryManager.deleteExcept([]);
    //    //changeMesh();

    //},

///******************************************************************************************* */
//function updateThreeMesh() {
//    let position = 0;

//    /*I can use HERE selectedVertex from pick function*/

//    for (let v of mesh.vertices) {
//        position = geometry.positions[v];
//        position.y = position.y + 0.01;
//    }
//    updateControlPoints();
//    posUpdateFlag = true;
//}
///******************************************************************************************* */
///**
// * Updete the positions of control handles if one of them moved. 
// * This function was for debuging. Needs to be updated...
// * */
//function updateControlPoints() {
//    for (let i = 0; i < controlPoints.length; i++) {
//        if (controlPointsVertices[i] !== selectedVertex) {
//            let center = geometry.positions[controlPointsVertices[i]];
//            controlPoints[i].position.set(center.x, center.y, center.z);
//        }
//    }
//}
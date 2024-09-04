"use strict";

//import { setTimeout } from "timers";

let harmonicSubspace = undefined;
let myEnergy = undefined;
let memoryManager = undefined;
let mesh = undefined;
let geometry = undefined;
let polygonSoup = undefined;
let currentPickedVertexIndex = undefined;
let isDragEnd = 0;
let cRate = 0;
let countLSExceed = 0;
let countTotal = 0;
let countItrExceed = 0;
let convergedW = undefined;
let t = undefined;
let sampleRate = undefined;
let MTKMi = undefined;
let staticLambda = undefined;
let enableLogs = false;
let setTimer = undefined;
//User modified values
let maxIter = undefined;// 3000;
let renderFreq = undefined;//10;
let lambda = undefined;//1000;
let precision = undefined;//0.0001;
let currentPrecision = undefined;
let currentLambda = undefined;

//line search values
let c = 0.00001;
let maxLSItr = undefined;//30;
let tInitVal = undefined;//0.001;

let countEnergyConv = 0;
//let temp = [];
//let tMinValues = [];
//let tMaxValues = [];
//let Yx = undefined;
//let Yy = undefined;
//let cInc = 0;
//let cDec = 0;
//let countDlessThen = 0;
//let countDGreaterThen = 0;
//let countNegA1 = 0;

//let time0 = undefined;
//let time1 = undefined;
//let difTime = 0;

if ('function' === typeof importScripts) {

    importScripts('./linear-algebra-asm.js');
    importScripts('./emscripten-memory-manager.js');
    importScripts('./dense-matrix.js');
    importScripts('./vector.js');
    importScripts('./complex-dense-matrix.js');
    importScripts('./complex.js');
    importScripts('./sparse-matrix.js');
    importScripts('./complex-sparse-matrix.js');

    importScripts('./geometry-js-core/vertex.js');
    importScripts('./geometry-js-core/corner.js');
    importScripts('./geometry-js-core/edge.js');
    importScripts('./geometry-js-core/face.js');
    importScripts('./geometry-js-core/halfedge.js');
    importScripts('./geometry-js-core/geometry.js');
    importScripts('./geometry-js-core/mesh.js');

    importScripts('../solve-harmonic-subspace.js');

    console.log('energySD: importScripts is successful');

    memoryManager = new EmscriptenMemoryManager();

    addEventListener("message", onMessage);
    function onMessage(m) {
        
        switch (m.data[0]) {
            case 0://if mesh first time loaded => run preprocessing (harmonic subspace and energy matrices)
                startPreprocessing(m.data[1], m.data[2]);
                break;
            case 2: //add handle for p2p energy
                    //1'st argument - vertex index; 2'nd argument - x-coordinate; 3'd argument - y-coordinate;
                if (myEnergy == typeof 'undefined')
                    console.log('energySD: Error! myEnergy is not defined!');
                else {
                    myEnergy.addHandleVertex(m.data[1],m.data[2],m.data[3]);
                    clearMemory();
                }
                //if (myEnergy.Q.nRows() == 4) {
                //    //console.log('2 p2p handles');
                //    myEnergy.run();
                //    clearMemory();
                //}
                break;
            case 3: //the p2p position update from main
                    //1'st argument - vertex index; 2'nd argument - x-coordinate; 3'd argument - y-coordinate; 4'th argument - is dragEnd event 
                myEnergy.p2pUpdateQ(m.data[1], m.data[2], m.data[3]);
                currentPickedVertexIndex = m.data[1];
                isDragEnd = m.data[4];
                cRate++;
                if (!(cRate % sampleRate) || (isDragEnd)) {
                    //console.log('cRate = ' + cRate);
                    currentPrecision = (isDragEnd) ? precision * 0.00001 : precision;
                    currentLambda = ((isDragEnd) || (staticLambda)) ? lambda : lambda * 0.01;
                    runSolver();
                }

                //runSolver();
                break;
            case 4: //set user values
                switch (m.data[1]) {
                    case 0: maxIter = m.data[2]; console.log('max # of iter updated to: ' + maxIter); break;
                    case 1: tInitVal = m.data[2]; console.log('t val updated to: ' + tInitVal); break;
                    case 2: maxLSItr = m.data[2]; console.log('max # of LS iterations updated to: ' + maxLSItr); break;
                    case 3: lambda = m.data[2]; console.log('p2p weight val updated to: ' + lambda); if (!myEnergy.isHp2pEmpty) {
                        isDragEnd = 1; currentPrecision = precision * 0.00001;
                        currentLambda = lambda; runSolver(); }break;
                    //case 4: precision = (m.data[2] * 1000); console.log('precision val updated to: ' + m.data[2]); break;
                    //case 5: renderFreq = m.data[2]; console.log('render freq. val updated to: ' + renderFreq); break;
                    case 4: sampleRate = m.data[2]; console.log('sample rate val updated to:: ' + sampleRate); break;
                    case 7:
                        maxIter = m.data[2];
                        tInitVal = m.data[3];
                        maxLSItr = m.data[4];
                        lambda = m.data[5];
                        precision = 1;//(m.data[6]*1000);
                        //renderFreq = m.data[7];
                        sampleRate = m.data[6];
                        staticLambda = m.data[7];
                        console.log('energySD: default Options values: ' + maxIter + ', ' + tInitVal + ', ' + maxLSItr + ', ' + lambda + ', ' + (precision * 1000) + ', ' + sampleRate + ', ' + staticLambda);
                        break;
                    default: console.log('energySD: Error in Options update value data');
                }
                break; 
            case 5: //remove handle for p2p energy
                if (myEnergy == typeof 'undefined')
                    console.log('energySD: Error! myEnergy is not defined!');
                else {
                    if (!myEnergy.removeHandleVertex(m.data[1])) {
                        console.log('energySD: Error in removeHandleVertex!');
                    }
                    if (!myEnergy.isHp2pEmpty) {
                        isDragEnd = 1;
                        currentPrecision = precision * 0.00001;
                        currentLambda = lambda;
                        runSolver();
                    }
                    clearMemory();
                }
                break;
            case 6: //reset from main
                console.log('energySD: Received Reset from main');
                if (myEnergy == typeof 'undefined')
                    console.log('energySD: Error! myEnergy is not defined!');
                else {
                    myEnergy.removeAllHandles();
                    myEnergy.getPositionsForW();
                    console.log('energySD: Reset sucsessful!');
                    clearMemory();
                }
                break;
            case 7: //enable-disable logs
                if (m.data[1]) {
                    console.log('energySD: Logs enabled!');
                    enableLogs = true;
                }
                else {
                    console.log('energySD: Logs disabled!');
                    enableLogs = false;
                }
                break;
            case 10: //Close worker, clear memory.
                console.log('energySD: Removing current energySD');
                memoryManager.deleteFromExceptList();
                break;
            case 99://run energy optimization solution (Reverse)
                //Optimization problem solver
                myEnergy.getPositionsForW();
                myEnergy.Hp2p = DenseMatrix.zeros(1, myEnergy.W.nRows());
                myEnergy.Q = DenseMatrix.zeros(1, 1);
                let t1 = performance.now();
                runSolver();
                //console.log('AFTER Reverse:');
                //myEnergy.run();
                let t2 = performance.now();
                console.log('energySD: Reverse time: ' + (t2 - t1));
                break;
            default:
                console.log('energySD: Error in first argument of Worker!');
                break;
        }
    }
}

/**
 * Creates Polygoun soup from the threePositions and threePositions from main
 * Creates mesh and geometry based on this polygon souop
 * Runs the preprocessing methods for Harmonic Subspace and Energy matrices
 * @param {any} threePositions
 * @param {any} threeIndices
 */
function startPreprocessing(threePositions, threeIndices) {
    //setTimeout(function () {
    //    polygonSoup = createPlygonSoupFromThreeMesh(threePositions, threeIndices);
    //    buildMesh();
    //    harmonicSubspace = new SolveHarmonicSubspace(geometry);
    //    harmonicSubspace.run();
    //    memoryManager.deleteExcept([harmonicSubspace.H, harmonicSubspace.X]);//, harmonicSubspace.L, harmonicSubspace.smallL]);
    //    console.log('energySD: Harmonic Sub-Space is finished');
    //    myEnergy = new EnergySD(harmonicSubspace);
    //    myEnergy.getPositionsForW();
    //    console.log('energySD: EnergySD is finished');
    //    myEnergy.solve = myEnergy.NewtonSolver;
    //    //myEnergy.solve = myEnergy.GradientDecent;

    //    clearMemory();
    //    postMessage([0, 'Preprocessing is finished!', myEnergy.boundaryLength]);
    //}, 1750);
    polygonSoup = createPlygonSoupFromThreeMesh(threePositions, threeIndices);
    buildMesh();
    function tryInit() {
        setTimer = setTimeout(function () {
            try {
                harmonicSubspace = new SolveHarmonicSubspace(geometry);
                harmonicSubspace.run();
                memoryManager.deleteExcept([harmonicSubspace.H, harmonicSubspace.X]);//, harmonicSubspace.L, harmonicSubspace.smallL]);
                console.log('energySD: Harmonic Sub-Space is finished');
                myEnergy = new EnergySD(harmonicSubspace);
                myEnergy.getPositionsForW();
                console.log('energySD: EnergySD is finished');
                myEnergy.solve = myEnergy.NewtonSolver;
                clearMemory();
                postMessage([0, 'Preprocessing is finished!', myEnergy.boundaryLength]);
            }
            catch (e) {
                tryNum++;
                console.log(e);
                console.log("Try num = " + tryNum);
                if (tryNum >= 20) {
                    console.log('Error: too many attempts for preprocessing');
                    alert('Error: too many attempts for preprocessing');
                }
                else {
                    tryInit();
                }
            }
        }, 750);
    }
    let tryNum = 0;
    tryInit();

    //myEnergy.solve = myEnergy.GradientDecent;



    //console.log('BEFORE Deformation:');
    ////myEnergy.run();
    //changeMesh();
    ////console.log('AFTER Deformation:');
    //myEnergy.getPositionsForW();
    ////clearMemory();

    ////t1 = performance.now();
    //myEnergy.run();
    ////t2 = performance.now();
    ////console.log('One run() time: ' + (t2-t1) + 'ms.');
    //console.log('Negative a1 count: ' + countNegA1);

    //clearMemory();
}


function buildMesh() {
    mesh = new Mesh();
    if (mesh.build(polygonSoup)) {
        console.log('energySD: Mesh build was sucsessful');
        geometry = new Geometry(mesh, polygonSoup["v"], false);
    }
    else {
        alert("Unable to build halfedge mesh");
        console.log("energySD: Mesh build failier");
    }
}

function createPlygonSoupFromThreeMesh(threePositions, threeIndices) {
    let positions = [];
    let indices = [];

    for (let i = 0; i < threePositions.length / 3; i++) {
        positions.push(new Vector(threePositions[i * 3 + 0], threePositions[i * 3 + 1], threePositions[i * 3 + 2]));
    }

    for (let i = 0; i < threeIndices.array.count; i++) {
        indices.push(threeIndices.array.array[i]);
    }
    return {
        "v": positions,
        "f": indices
    };
}

function runSolver() {
    let count = 0;
    //let c_render = 0;
    let isDone = false;
    //time0 = performance.now();
    while (!isDone) {
        isDone = myEnergy.solve();
        //isDone = myEnergy.p2pGradientDecent();
        count++;
        countTotal++;
        if (count > maxIter) {
            console.log('energySD: Exceeded max number of iterations!');
            console.log('energySD: SD gradient (sum) final value: ' + myEnergy.gradient.norm(1));
            countItrExceed++;
            break;
        }

        //if (!(count % renderFreq)) {
        //    //c_render++;
        //    //Y = myEnergy.XForReal.timesDense(myEnergy.W);
        //    let Yx = myEnergy.X.timesDense(myEnergy.W.subMatrix(0, myEnergy.boundaryLength, 0, 1));
        //    let Yy = myEnergy.X.timesDense(myEnergy.W.subMatrix(myEnergy.boundaryLength, myEnergy.W.nRows(), 0, 1));
        //    let V = mesh.vertices.length;
        //    let positions = new Float32Array(V * 3);
        //    for (let i = 0; i < Yx.nRows(); i++) {
        //        positions[3 * i + 0] = Yx.get(i, 0);
        //        positions[3 * i + 1] = Yy.get(i, 0);
        //        positions[3 * i + 2] = geometry.positions[i].x*0.001;
        //    }
        //    //update threeMesh in main and render
        //    postMessage([1, positions]);
        //}
        clearMemory();
    }
    //time1 = performance.now();
    //difTime += (time1 - time0);
    if (enableLogs) {
        //console.log('energySD: total converge time: ' + (t2 - t1));
        //console.log('energySD: harmonic matrix total mult time: ' + difTime);
        //console.log('energySD: precentage: ' + ((difTime / (t2 - t1) * 100)) + '%');
        //difTime = 0;
        console.log('Total iterations: ' + countTotal);
        console.log('Total Energy Converges: ' + countEnergyConv);
        console.log('Total Line-Search Exceeded: ' + countLSExceed);
        console.log('Total Exceeded ItrMax times: ' + countItrExceed); 
        console.log('Total iterations for this step: ' + count);
        ////console.log('Total c_render: ' + c_render);
        console.log('Last Energy Sum: ' + myEnergy.EnergySum);
        ////console.log('P2P Energy ' + myEnergy.p2pEn);
        ////console.log('last norm of SD gradient = ' + myEnergy.normL1OfSDGradient);
        ////console.log('last norm of P2P gradient = ' + myEnergy.normL1OfP2PGradient);
        console.log('last total gradient norm = ' + myEnergy.normL1OfGradients);
        ////console.log('t values: ' + temp);
        ////console.log('abs min t values = ' + tMinValues);
        ////console.log('Negative alpha1 count : ' + countNegA1);
    }

    ////temp = [];
    ////tMinValues = [];

    let Yx = myEnergy.X.timesDense(myEnergy.W.subMatrix(0, myEnergy.boundaryLength, 0, 1));
    let Yy = myEnergy.X.timesDense(myEnergy.W.subMatrix(myEnergy.boundaryLength, myEnergy.W.nRows(), 0, 1));
    let V = mesh.vertices.length;
    let positions = new Float32Array(V * 3);
    for (let i = 0; i < Yx.nRows(); i++) {
        positions[3 * i + 0] = Yx.get(i, 0);
        positions[3 * i + 1] = Yy.get(i, 0);
        positions[3 * i + 2] = geometry.positions[i].x * 0.001;
    }
    cRate = 0;
    postMessage([2, positions, currentPickedVertexIndex, isDragEnd]);
    clearMemory();
}

/**Clears allocated memory for matrices except the preprocessed ones */
function clearMemory() {//myEnergy.onesForDet, myEnergy.viForDet,   
    memoryManager.deleteExcept([myEnergy.H, harmonicSubspace.H, harmonicSubspace.X, myEnergy.TransferFunction, myEnergy.ones, myEnergy.BB, myEnergy.BbarGrad, myEnergy.BBbar, myEnergy.BGrad, myEnergy.transferMatrixForFz, myEnergy.SumUpGradientElements, myEnergy.PumpingMatrixForAlpha, myEnergy.gradientElementsToOriginalStructure, myEnergy.W, myEnergy.boundaryFacesAreas, myEnergy.Hp2p, myEnergy.Q, myEnergy.X, myEnergy.M, myEnergy.MT, myEnergy.shiftMatrixForFz, myEnergy.TransformMatrixForHessian]);
}

/**

 */
class EnergySD {
    constructor(harmonicSubspace) {
        this.solve = undefined;
        this.X = harmonicSubspace.X;
        this.vertexIndex = harmonicSubspace.vertexIndex;
        this.geometry = geometry;
        this.H = harmonicSubspace.H;
        this.boundaryVertexIndices = harmonicSubspace.boundaryVertexIndices;
        this.boundaryLength = this.boundaryVertexIndices.length;
        this.cageVertices = harmonicSubspace.cageVertices;
        this.cageLength = this.cageVertices.length;
        this.boundaryFaces = [];
        this.totalAreaOfBoundryFaces = 0;
        this.BB = undefined;//For Fz (and Energy)
        this.BBbar = undefined;//For Fzbar (and Energy)
        this.BbarGrad = undefined;//For gradient
        this.BGrad = undefined;//For gradient
        this.M = undefined;//For Hessian
        this.transferMatrixForFz = undefined;
        this.PumpingMatrixForAlpha = undefined;
        this.boundaryFacesAreas = undefined;
        this.ones = undefined;
        this.SumUpGradientElements = undefined;
        this.gradient = undefined;
        this.EnergySum = undefined;
        this.viIndices = [];
        this.W = DenseMatrix.zeros(this.boundaryVertexIndices.length * 2, 1);
        this.shiftMatrixForFz = undefined;
        this.TransformMatrixForHessian = undefined;

        let HUp = this.H.hcat(DenseMatrix.zeros(this.H.nRows(), this.H.nCols()));
        let HLow = DenseMatrix.zeros(this.H.nRows(), this.H.nCols()).hcat(this.H);
        this.TransferFunction = HUp.vcat(HLow);
        //Area of boundary triangles
        for (let j = 0; j < this.geometry.mesh.faces.length; j++) {
            let f = this.geometry.mesh.faces[j];
            for (let v of f.adjacentVertices()) {
                if (v.onBoundary()) {
                    this.boundaryFaces.push(j);
                    this.totalAreaOfBoundryFaces += this.geometry.area(f);
                    break;
                }
            }
        }

        this.boundaryFacesLength = this.boundaryFaces.length;
        this.boundaryFacesAreas = DenseMatrix.zeros(this.boundaryFacesLength, 1);
        this.ones = DenseMatrix.ones(this.boundaryFacesLength, 1);
        this.Hp2p = undefined;//DenseMatrix.ze(1, this.boundaryLength * 2);
        this.Q = undefined;
        this.p2pGradient = undefined;
        this.p2pHessian = undefined;
        this.p2pEn = undefined;
        this.isHp2pEmpty = true;
        this.handleVertices = [];

        //this.Hw = harmonicSubspace.Hw;
        //this.viForDet = undefined;
        //this.onesForDet = undefined;
        //this.MT = undefined;// = M^T
        //this.XForReal = DenseMatrix.zeros(this.X.nRows() * 2, this.X.nCols() * 2);

        console.log('energySD: In EnergySD constructor.');
        console.log('energySD: Num of Boundary Faces = ' + this.boundaryFacesLength);
        console.log('energySD: Area of Boundary Faces = ' + this.totalAreaOfBoundryFaces);
        console.log('energySD: Total Area of Faces = ' + this.geometry.totalArea());
        this.buildPrepocessingElements();

    }

    //For debug
    //run() {
    //    let t00 = performance.now();
    //    //P2P part
    //    let p2p = this.Hp2p.timesDense(this.W).minus(this.Q);
    //    this.p2pEn = p2p.abs2CWise().sum();
    //    this.p2pEn *= 0.5;
    //    this.p2pGradient = this.Hp2p.transpose().timesDense(p2p);
    //    this.p2pHessian = this.Hp2p.transpose().timesDense(this.Hp2p);
    //    this.p2pHessian.scaleBy(lambda);
    //    //this.p2pHessian = this.TransferFunction.timesDense(this.p2pHessian.timesDense(this.TransferFunction.transpose()));
    //    //this.p2pGradient = this.TransferFunction.timesDense(this.p2pGradient);

    //    //SD part
    //    let Fz = this.BB.timesDense(this.W);//Fz
    //    let Fz_e2 = Fz.abs2CWise();//Fz^2
    //    let FzAbsSquare = this.transferMatrixForFz.timesDense(Fz_e2);//(Fz.abs2CWise());//timesCWise(Fz)); // = |Fz|^2
    //    let FzShiftUp = this.shiftMatrixForFz.timesDense(Fz);//Y-values of Fz shifted up, zeros instead of y's previous values
    //    let FzFzSU = Fz.timesCWise(FzShiftUp);//Fz*Fz_ShiftedUp. Y-values are zeroed!
    //    let Fzbar = this.BBbar.timesDense(this.W);//Fzbar
    //    let Fzbar_e2 = Fzbar.abs2CWise();//Fzbar^2
    //    let FzbarAbsSquare = this.transferMatrixForFz.timesDense(Fzbar_e2);//(Fzbar.abs2CWise());//timesCWise(Fzbar)); // = |Fzbar|^2
    //    let FzbarShiftUp = this.shiftMatrixForFz.timesDense(Fzbar);//Shifted up Fzbar (same as Fz)
    //    let FzbarFzbarSU = Fzbar.timesCWise(FzbarShiftUp);// Fzbar * Fzbar_ShiftedUp
    //    let FzFzbar = Fz.timesCWise(Fzbar);//Fz*Fzbar
    //    let FzFzbarSU = Fz.timesCWise(FzbarShiftUp);//Fz*Fzbar_ShiftedUp
    //    let FzbarFzSU = Fzbar.timesCWise(FzShiftUp);//Fzbar*Fz_ShiftedUp

    //    let XPlusY = FzAbsSquare.plus(FzbarAbsSquare);
    //    let XMinusY = FzAbsSquare.minus(FzbarAbsSquare);
    //    let XMinusYe2 = XMinusY.abs2CWise();
    //    let XMinusYe3 = XMinusYe2.timesCWise(XMinusY);
    //    let XMinusYe4 = XMinusYe2.abs2CWise();

    //    //SD - Energy
    //    let EnergySD = XPlusY.plus(XPlusY.overCWise(XMinusYe2));
    //    let sumESDNormalized = EnergySD.transpose().timesDense(this.boundaryFacesAreas);
    //    let EnergySum = sumESDNormalized.get(0, 0);
    //    console.log('SD Energy sum = ' + EnergySum);

    //    //Alpha 1 and 2
    //    let alpha1 = this.ones.minus(FzAbsSquare.plus(FzbarAbsSquare.timesReal(3)).overCWise(XMinusYe3))//.timesCWise(this.boundaryFacesAreas);
    //    let alpha2 = this.ones.plus(FzbarAbsSquare.plus(FzAbsSquare.timesReal(3)).overCWise(XMinusYe3))//.timesCWise(this.boundaryFacesAreas);

    //    let alpha1Pumped = this.PumpingMatrixForAlpha.timesDense(alpha1)//.timesCWise(this.boundaryFacesAreas));
    //    let alpha2Pumped = this.PumpingMatrixForAlpha.timesDense(alpha2)//.timesCWise(this.boundaryFacesAreas));

    //    let element1OfGrad = this.BGrad.timesDense(this.W);
    //    let element2OfGrad = this.BbarGrad.timesDense(this.W);

    //    let element1 = this.SumUpGradientElements.timesDense(element1OfGrad.timesCWise(alpha1Pumped));
    //    let element2 = this.SumUpGradientElements.timesDense(element2OfGrad.timesCWise(alpha2Pumped));

    //    //SD - Gradient
    //    this.gradient = this.TransferFunction.transpose().timesDense(element1.plus(element2));
    //    let Gradient = this.gradient;
    //    //let Gradient = element1.plus(element2)
        
    //    console.log('Dim of gradient: ' + this.gradient.nRows() + 'x' + this.gradient.nCols());
    //    console.log('gradient sum = ' + this.gradient.norm(1));

    //    //Betha 1,2,3
    //    let betha1 = FzAbsSquare.plus(FzbarAbsSquare.timesReal(5)).overCWise(XMinusYe4);
    //    betha1.scaleBy(2);
    //    let betha2 = FzAbsSquare.timesReal(5).plus(FzbarAbsSquare).overCWise(XMinusYe4);
    //    betha2.scaleBy(2);
    //    let betha3 = XPlusY.overCWise(XMinusYe4);
    //    betha3.scaleBy(-6);
    //    let t01 = performance.now();
    //    console.log('Before Hessian time = ' + (t01 - t00));
    //    //Hessian Part
    //    //let TK = new Triplet(4 * this.boundaryFacesLength, 4 * this.boundaryFacesLength);
    //    //let k_11 = undefined;
    //    //let k_22 = undefined;
    //    //let k_12 = undefined;
    //    //console.log('boundaryFacesLength = ' + this.boundaryFacesLength);
    //    //console.log('alpha 2 dim = ' + alpha2.nRows());
    //    //console.log('alpha 1 dim = ' + alpha1.nRows());
    //    //console.log('betha 1 dim = ' + betha1.nRows());
    //    //console.log('this.gradient dim = ' + this.gradient.nRows());
    //    //console.log('this.BGrad dim = ' + this.BGrad.nRows() + 'x' + this.BGrad.nCols());
    //    let time1 = performance.now();
    //    let Ki = DenseMatrix.zeros(4, 4);
    //    //let Mi = DenseMatrix.zeros(4, 6);
        
    //    //let H = DenseMatrix.zeros(this.cageLength * 2, this.cageLength * 2);

    //    let H_00 = DenseMatrix.zeros(this.cageLength, this.cageLength);
    //    let H_01 = DenseMatrix.zeros(this.cageLength, this.cageLength);
    //    let H_10 = DenseMatrix.zeros(this.cageLength, this.cageLength);
    //    let H_11 = DenseMatrix.zeros(this.cageLength, this.cageLength);
    //    //let TH = new Triplet(this.cageLength * 2, this.cageLength * 2);
    //    //let H = SparseMatrix.fromTriplet(TH);
    //    let t1 = performance.now();
    //    for (let i = 0; i < this.boundaryFacesLength; i++) {
    //        let i4 = i * 4;
    //        let i2 = i * 2;
    //        let a = alpha1.get(i, 0);
    //        let a1 = (a > 0) ? (2 * a) : 0;
    //        let b = betha1.get(i, 0);
    //        let b1 = (a < 0) ? (b + 0.5 * a / FzAbsSquare.get(i, 0)) : (b);
    //        b1 *= 4;
    //        //if (a < 0) countNegA1++;
    //        let a2 = 2 * alpha2.get(i, 0);
    //        let b2 = 4 * betha2.get(i, 0);
    //        let b3 = 4 * betha3.get(i, 0);


    //        let k_11 = a1 + b1 * Fz_e2.get(i2, 0);
    //        let k_22 = a1 + b1 * Fz_e2.get(i2 + 1, 0);
    //        let k_12 = b1 * FzFzSU.get(i2, 0); // = k_21

    //        let k_13 = b3 * FzFzbar.get(i2, 0); // = k_31
    //        let k_24 = b3 * FzFzbar.get(i2 + 1, 0); // = k_42
    //        let k_14 = b3 * FzFzbarSU.get(i2, 0); // = k_41
    //        let k_23 = b3 * FzbarFzSU.get(i2, 0); // = k_32

    //        let k_33 = a2 + b2 * Fzbar_e2.get(i2, 0);
    //        let k_44 = a2 + b2 * Fzbar_e2.get(i2 + 1, 0);
    //        let k_34 = b2 * FzbarFzbarSU.get(i2, 0); // = k_43

    //        Ki.set(k_11, 0, 0);
    //        Ki.set(k_12, 0, 1);
    //        Ki.set(k_12, 1, 0);
    //        Ki.set(k_22, 1, 1);

    //        Ki.set(k_13, 0, 2);
    //        Ki.set(k_14, 0, 3);
    //        Ki.set(k_23, 1, 2);
    //        Ki.set(k_24, 1, 3);

    //        Ki.set(k_13, 2, 0);
    //        Ki.set(k_23, 2, 1);
    //        Ki.set(k_14, 3, 0);
    //        Ki.set(k_24, 3, 1);

    //        Ki.set(k_33, 2, 2);
    //        Ki.set(k_34, 2, 3);
    //        Ki.set(k_34, 3, 2);
    //        Ki.set(k_44, 3, 3);


    //        //TK.addEntry(k_11, i4 + 0, i4 + 0);
    //        //TK.addEntry(k_12, i4 + 0, i4 + 1);
    //        //TK.addEntry(k_12, i4 + 1, i4 + 0);
    //        //TK.addEntry(k_22, i4 + 1, i4 + 1);

    //        //TK.addEntry(k_13, i4 + 0, i4 + 2);
    //        //TK.addEntry(k_14, i4 + 0, i4 + 3);
    //        //TK.addEntry(k_23, i4 + 1, i4 + 2);
    //        //TK.addEntry(k_24, i4 + 1, i4 + 3);

    //        //TK.addEntry(k_13, i4 + 2, i4 + 0);
    //        //TK.addEntry(k_23, i4 + 2, i4 + 1);
    //        //TK.addEntry(k_14, i4 + 3, i4 + 0);
    //        //TK.addEntry(k_24, i4 + 3, i4 + 1);

    //        //TK.addEntry(k_33, i4 + 2, i4 + 2);
    //        //TK.addEntry(k_34, i4 + 2, i4 + 3);
    //        //TK.addEntry(k_34, i4 + 3, i4 + 2);
    //        //TK.addEntry(k_44, i4 + 3, i4 + 3);

    //        //for (let l = 0; l < 4; l++) {
    //        //    for (let j = 0; j < 6; j++) {
    //        //        Mi.set(this.M.get(i4 + l, j), l, j);
    //        //    }
    //        //}

    //        let Mi = this.M.subMatrix(i4, i4 + 4, 0, 6);

    //        MTKMi = Mi.transpose().timesDense(Ki.timesDense(Mi));
    //        MTKMi.scaleBy(this.boundaryFacesAreas.get(i, 0));

    //        for (let l = 0; l < 3; l++) {
    //            for (let j = 0; j < 3; j++) {
    //                //H.set((H.get(this.viIndices[i][l], this.viIndices[i][j]) + MTKMi.get(l, j)), this.viIndices[i][l], this.viIndices[i][j]);
    //                //H.set((H.get(this.viIndices[i][l], this.viIndices[i][j] + this.cageLength) + MTKMi.get(l, j + 3)), this.viIndices[i][l], this.viIndices[i][j] + this.cageLength);
    //                //H.set((H.get(this.viIndices[i][l] + this.cageLength, this.viIndices[i][j]) + MTKMi.get(l + 3, j)), this.viIndices[i][l] + this.cageLength, this.viIndices[i][j]);
    //                //H.set((H.get(this.viIndices[i][l] + this.cageLength, this.viIndices[i][j] + this.cageLength) + MTKMi.get(l + 3, j + 3)), this.viIndices[i][l] + this.cageLength, this.viIndices[i][j] + this.cageLength);

    //                H_00.set((H_00.get(this.viIndices[i][l], this.viIndices[i][j]) + MTKMi.get(l, j)), this.viIndices[i][l], this.viIndices[i][j]);
    //                H_01.set((H_01.get(this.viIndices[i][l], this.viIndices[i][j]) + MTKMi.get(l, j + 3)), this.viIndices[i][l], this.viIndices[i][j]);
    //                H_10.set((H_10.get(this.viIndices[i][l], this.viIndices[i][j]) + MTKMi.get(l + 3, j)), this.viIndices[i][l], this.viIndices[i][j]);
    //                H_11.set((H_11.get(this.viIndices[i][l], this.viIndices[i][j]) + MTKMi.get(l + 3, j + 3)), this.viIndices[i][l], this.viIndices[i][j]);

    //            }
    //        }
    //    }


    //    let HEl_00 = (this.H.transpose().timesDense(H_00)).timesDense(this.H);
    //    let HEl_01 = (this.H.transpose().timesDense(H_01)).timesDense(this.H);
    //    let HElUp = HEl_00.hcat(HEl_01);
    //    let HEl_10 = (this.H.transpose().timesDense(H_10)).timesDense(this.H);
    //    let HEl_11 = (this.H.transpose().timesDense(H_11)).timesDense(this.H);
    //    let HElLo = HEl_10.hcat(HEl_11);
    //    let HessianEl = HElUp.vcat(HElLo);


    //    //let Hessian = this.TransferFunction.transpose().timesDense(H.timesDense(this.TransferFunction));

    //    let Hessian = HessianEl.plus(this.p2pHessian);
    //    Gradient = Gradient.plus(this.p2pGradient);
    //    //let Hessian = H.plus(this.p2pHessian);
    //    let dense_chol = Hessian.chol();
    //    let dense_d = dense_chol.solvePositiveDefinite(Gradient);
    //    //dense_d = this.TransferFunction.transpose().timesDense(dense_d);
    //    let time4 = performance.now();
    //    console.log('H solve time = ' + (time4 - t00));

    //    //console.log('dense d dim = ' + dense_d.nRows() + 'x' + dense_d.nCols());
    //    //for (let i = 0; i < dense_d.nRows(); i++) {
    //    //    console.log('d = ' + d.get(i, 0) + '   d_dense = ' + dense_d.get(i, 0));
    //    //}
    //    //let HEl = this.TransferFunction.transpose().timesDense(H.timesDense(this.TransferFunction));
    //    //console.log('SD-Hessian dim (eleminated) = ' + HEl.nRows() + 'x' + HEl.nCols());
    //    ////let HTot = HEl.plus(this.p2pHessian);
    //    //sendMatrixForSave(this.TransferFunction);

    //}

    NewtonSolver() {
        //P2P part
        let p2p = this.Hp2p.timesDense(this.W).minus(this.Q);
        this.p2pEn = p2p.abs2CWise().sum();
        this.p2pEn *= 0.5;
        this.p2pGradient = this.Hp2p.transpose().timesDense(p2p);
        this.p2pHessian = this.Hp2p.transpose().timesDense(this.Hp2p);
        this.p2pHessian.scaleBy(currentLambda);

        //SD part
        let Fz = this.BB.timesDense(this.W);//Fz
        let Fz_e2 = Fz.abs2CWise();//Fz^2
        let FzAbsSquare = this.transferMatrixForFz.timesDense(Fz_e2);//(Fz.abs2CWise());//timesCWise(Fz)); // = |Fz|^2
        let Fzbar = this.BBbar.timesDense(this.W);//Fzbar
        let Fzbar_e2 = Fzbar.abs2CWise();//Fzbar^2
        let FzbarAbsSquare = this.transferMatrixForFz.timesDense(Fzbar_e2);//(Fzbar.abs2CWise());//timesCWise(Fzbar)); // = |Fzbar|^2
        let FzFzbar = Fz.timesCWise(Fzbar);//Fz*Fzbar

        let XPlusY = FzAbsSquare.plus(FzbarAbsSquare);
        let XMinusY = FzAbsSquare.minus(FzbarAbsSquare);
        let XMinusYe2 = XMinusY.abs2CWise();
        let XMinusYe3 = XMinusYe2.timesCWise(XMinusY);

        //SD - Energy
        let EnergySD = XPlusY.plus(XPlusY.overCWise(XMinusYe2));
        let sumESDNormalized = EnergySD.transpose().timesDense(this.boundaryFacesAreas);

        //Energy - total
        this.EnergySum = sumESDNormalized.get(0, 0) + this.p2pEn * currentLambda;

        //alpha1 alpha2
        let alpha1 = this.ones.minus(FzAbsSquare.plus(FzbarAbsSquare.timesReal(3)).overCWise(XMinusYe3))//.timesCWise(this.boundaryFacesAreas);
        let alpha2 = this.ones.plus(FzbarAbsSquare.plus(FzAbsSquare.timesReal(3)).overCWise(XMinusYe3))//.timesCWise(this.boundaryFacesAreas);

        let alpha1Pumped = this.PumpingMatrixForAlpha.timesDense(alpha1)//.timesCWise(this.boundaryFacesAreas));
        let alpha2Pumped = this.PumpingMatrixForAlpha.timesDense(alpha2)//.timesCWise(this.boundaryFacesAreas));

        //Gradient
        let element1OfGrad = this.BGrad.timesDense(this.W);
        let element2OfGrad = this.BbarGrad.timesDense(this.W);

        let element1 = this.SumUpGradientElements.timesDense(element1OfGrad.timesCWise(alpha1Pumped));
        let element2 = this.SumUpGradientElements.timesDense(element2OfGrad.timesCWise(alpha2Pumped));

        //SD-Gradient
        this.gradient = this.TransferFunction.transpose().timesDense((element1.plus(element2)));

        //For debug
        //this.normL1OfSDGradient = this.gradient.norm(1);
        //this.normL1OfP2PGradient = this.p2pGradient.norm(1);

        //Total Gradient
        //let d = this.gradient.plus(this.p2pGradient.timesReal(lambda)); //FOR GRADIENT DECENT
        let Gradient = this.gradient.plus(this.p2pGradient.timesReal(currentLambda));
        this.normL1OfGradients = Gradient.norm(1);
        if (this.normL1OfGradients < currentPrecision) {
            if (enableLogs)
                console.log('energySD: THE ENERGY IS IN MINIMUM');
            countEnergyConv++;
            return (true);
        }

        //Hessian pre-computations
        let FzShiftUp = this.shiftMatrixForFz.timesDense(Fz);//Y-values of Fz shifted up, zeros instead of y's previous values
        let FzFzSU = Fz.timesCWise(FzShiftUp);//Fz*Fz_ShiftedUp. Y-values are zeroed!
        let FzbarShiftUp = this.shiftMatrixForFz.timesDense(Fzbar);//Shifted up Fzbar (same as Fz)
        let FzbarFzbarSU = Fzbar.timesCWise(FzbarShiftUp);// Fzbar * Fzbar_ShiftedUp
        let FzFzbarSU = Fz.timesCWise(FzbarShiftUp);//Fz*Fzbar_ShiftedUp
        let FzbarFzSU = Fzbar.timesCWise(FzShiftUp);//Fzbar*Fz_ShiftedUp

        let XMinusYe4 = XMinusYe2.abs2CWise();

        //Betha 1,2,3
        let betha1 = FzAbsSquare.plus(FzbarAbsSquare.timesReal(5)).overCWise(XMinusYe4);
        betha1.scaleBy(2);
        //betha1.timesCWise(this.boundaryFacesAreas);
        let betha2 = FzAbsSquare.timesReal(5).plus(FzbarAbsSquare).overCWise(XMinusYe4);
        betha2.scaleBy(2);
        //betha2.timesCWise(this.boundaryFacesAreas);
        let betha3 = XPlusY.overCWise(XMinusYe4);
        betha3.scaleBy(-6);
        //betha3.timesCWise(this.boundaryFacesAreas);

        //Hessian computation
        let Ki = DenseMatrix.zeros(4, 4);
        //let Mi = DenseMatrix.zeros(4, 6);
        //let H = DenseMatrix.zeros(this.cageLength * 2, this.cageLength * 2);
        let H_00 = DenseMatrix.zeros(this.cageLength, this.cageLength);
        let H_01 = DenseMatrix.zeros(this.cageLength, this.cageLength);
        let H_10 = DenseMatrix.zeros(this.cageLength, this.cageLength);
        let H_11 = DenseMatrix.zeros(this.cageLength, this.cageLength);

        for (let i = 0; i < this.boundaryFacesLength; i++) {
            let i4 = i * 4;
            let i2 = i * 2;
            let a = alpha1.get(i, 0);
            let a1 = (a > 0) ? (2 * a) : 0;
            //a1 *= 2;
            let b = betha1.get(i, 0);
            let b1 = (a < 0) ? (b + 0.5 * a / FzAbsSquare.get(i, 0)) : (b);
            b1 *= 4;
            //if (a < 0) countNegA1++;
            let a2 = 2 * alpha2.get(i, 0);
            let b2 = 4 * betha2.get(i, 0);
            let b3 = 4 * betha3.get(i, 0);


            let k_11 = a1 + b1 * Fz_e2.get(i2, 0);
            let k_22 = a1 + b1 * Fz_e2.get(i2 + 1, 0);
            let k_12 = b1 * FzFzSU.get(i2, 0); // = k_21

            let k_13 = b3 * FzFzbar.get(i2, 0); // = k_31
            let k_24 = b3 * FzFzbar.get(i2 + 1, 0); // = k_42
            let k_14 = b3 * FzFzbarSU.get(i2, 0); // = k_41
            let k_23 = b3 * FzbarFzSU.get(i2, 0); // = k_32

            let k_33 = a2 + b2 * Fzbar_e2.get(i2, 0);
            let k_44 = a2 + b2 * Fzbar_e2.get(i2 + 1, 0);
            let k_34 = b2 * FzbarFzbarSU.get(i2, 0); // = k_43

            Ki.set(k_11, 0, 0);
            Ki.set(k_12, 0, 1);
            Ki.set(k_12, 1, 0);
            Ki.set(k_22, 1, 1);

            Ki.set(k_13, 0, 2);
            Ki.set(k_14, 0, 3);
            Ki.set(k_23, 1, 2);
            Ki.set(k_24, 1, 3);

            Ki.set(k_13, 2, 0);
            Ki.set(k_23, 2, 1);
            Ki.set(k_14, 3, 0);
            Ki.set(k_24, 3, 1);

            Ki.set(k_33, 2, 2);
            Ki.set(k_34, 2, 3);
            Ki.set(k_34, 3, 2);
            Ki.set(k_44, 3, 3);
            //for (let l = 0; l < 4; l++) {
            //    for (let j = 0; j < 6; j++) {
            //        Mi.set(this.M.get(i4 + l, j), l, j);
            //    }
            //}
            let Mi = this.M.subMatrix(i4, i4 + 4, 0, 6);
            MTKMi = Mi.transpose().timesDense(Ki.timesDense(Mi));
            MTKMi.scaleBy(this.boundaryFacesAreas.get(i, 0));
            for (let l = 0; l < 3; l++) {
                for (let j = 0; j < 3; j++) {
                    H_00.set((H_00.get(this.viIndices[i][l], this.viIndices[i][j]) + MTKMi.get(l, j)), this.viIndices[i][l], this.viIndices[i][j]);
                    H_01.set((H_01.get(this.viIndices[i][l], this.viIndices[i][j]) + MTKMi.get(l, j+3)), this.viIndices[i][l], this.viIndices[i][j]);
                    H_10.set((H_10.get(this.viIndices[i][l], this.viIndices[i][j]) + MTKMi.get(l+3, j)), this.viIndices[i][l], this.viIndices[i][j]);
                    H_11.set((H_11.get(this.viIndices[i][l], this.viIndices[i][j]) + MTKMi.get(l + 3, j + 3)), this.viIndices[i][l], this.viIndices[i][j]);

                    //H.set((H.get(this.viIndices[i][l], this.viIndices[i][j]) + MTKMi.get(l, j)), this.viIndices[i][l], this.viIndices[i][j]);
                    //H.set((H.get(this.viIndices[i][l], this.viIndices[i][j] + this.cageLength) + MTKMi.get(l, j + 3)), this.viIndices[i][l], this.viIndices[i][j] + this.cageLength);
                    //H.set((H.get(this.viIndices[i][l] + this.cageLength, this.viIndices[i][j]) + MTKMi.get(l + 3, j)), this.viIndices[i][l] + this.cageLength, this.viIndices[i][j]);
                    //H.set((H.get(this.viIndices[i][l] + this.cageLength, this.viIndices[i][j] + this.cageLength) + MTKMi.get(l + 3, j + 3)), this.viIndices[i][l] + this.cageLength, this.viIndices[i][j] + this.cageLength);
                }
            }
        }
        //time0 = performance.now();

        let HEl_00 = (this.H.transpose().timesDense(H_00)).timesDense(this.H);
        let HEl_01 = (this.H.transpose().timesDense(H_01)).timesDense(this.H);
        let HElUp = HEl_00.hcat(HEl_01);
        let HEl_10 = (this.H.transpose().timesDense(H_10)).timesDense(this.H);
        let HEl_11 = (this.H.transpose().timesDense(H_11)).timesDense(this.H);
        let HElLo = HEl_10.hcat(HEl_11);
        let Hessian = HElUp.vcat(HElLo);


        //let Hessian = this.TransferFunction.transpose().timesDense(H.timesDense(this.TransferFunction));

        //time1 = performance.now();
        //difTime += (time1 - time0);

        Hessian.incrementBy(this.p2pHessian);
        let chol = Hessian.chol();
        let d = chol.solvePositiveDefinite(Gradient);

        //line search part
        /**
         * A = |Fz(d)|^2 - |Fzbar(d)|^2
         * B = -2(FzFz(d) - FzbarFzbar(d))
         * C = |Fz|^2 - |Fzbar|^2 
         * d = unit step
         * */

        let Fz_d = this.BB.timesDense(d);
        let Fzbar_d = this.BBbar.timesDense(d);
        let A = this.transferMatrixForFz.timesDense(Fz_d.abs2CWise().minus(Fzbar_d.abs2CWise()));
        let C = XMinusY;
        //let _B = this.transferMatrixForFz.timesDense(Fzbar.timesCWise(Fzbar_d).minus(Fz.timesCWise(Fz_d)));//.timesReal(2));
        let _B = this.transferMatrixForFz.timesDense(Fz.timesCWise(Fz_d).minus(Fzbar.timesCWise(Fzbar_d)));
        _B.scaleBy(2);
        let sqrtDiscr = _B.abs2CWise().minus(A.timesCWise(C).timesReal(4)).sqrtCWise();

        let t1 = _B.plus(sqrtDiscr).overCWise(A);//DON'T FORGET TO MULT BY 0.5!
        let t2 = _B.minus(sqrtDiscr).overCWise(A);//DON'T FORGET TO MULT BY 0.5!
        let maxT1 = t1.maxCoeff();
        let maxT2 = t2.maxCoeff();

        let maxT = (maxT1 > maxT2) ? maxT1 : maxT2;
        //maxT *= 0.5;
        let minT = (maxT > 0) ? maxT : tInitVal;
        for (let i = 0; i < t1.nRows(); i++) {
            let currentT = t1.get(i, 0);
            if ((currentT > 0) && (currentT < minT))
                minT = currentT;
            currentT = t2.get(i, 0);
            if ((currentT > 0) && (currentT < minT))
                minT = currentT;
        }
        minT *= 0.45;
        //tMinValues.push(minT);

        //tMaxValues.push(maxT);

        
        if (isNaN(minT)) {
            t = tInitVal;
        }
        else {
            t = (tInitVal < minT) ? tInitVal : minT ;
        } 

        //let t = tInitVal;

        //countTotal++;
        let itr = 0;
        let newEnergySum = 0;
        while (itr < maxLSItr) {
            //Wk
            let newW = this.W.minus(d.timesReal(t));

            //P2P part
            let newP2P = this.Hp2p.timesDense(newW).minus(this.Q);
            let newP2PEn = newP2P.abs2CWise().sum();
            newP2PEn *= 0.5;
            
            //SD part
            let fzbar = this.BBbar.timesDense(newW);
            let fz = this.BB.timesDense(newW);
            let fzbarAbsSquare = this.transferMatrixForFz.timesDense(fzbar.abs2CWise());
            let fzAbsSquare = this.transferMatrixForFz.timesDense(fz.abs2CWise());
            let newXPlusY = fzAbsSquare.plus(fzbarAbsSquare);
            let newXMinusY = fzAbsSquare.minus(fzbarAbsSquare);
            let newXMinusYe2 = newXMinusY.abs2CWise();
            let newEnergySD = newXPlusY.plus(newXPlusY.overCWise(newXMinusYe2));
            let newSumESDNormalized = newEnergySD.transpose().timesDense(this.boundaryFacesAreas);
            
            newEnergySum = newSumESDNormalized.get(0, 0) + newP2PEn * currentLambda;
            //if (newEnergySum < (this.EnergySum + d.norm(1) * t * c)) { //for gradient decent
            if (newEnergySum < (this.EnergySum + Math.abs((d.transpose().timesDense(Gradient)).get(0,0) * t * c))) {
                this.W = newW;
                break;
            }
            t *= 0.5;
            itr++;
        }
        if (itr == maxLSItr) {
            console.log('energySD: EXCEEDED max # of t iterations!!! Last value of t:' + t);
            console.log('energySD: Energy = ' + this.EnergySum);
            console.log('energySD: Energy (new) = ' + newEnergySum);
            countLSExceed++;
            return true;
        }

        return (false);
        
    }



    /**
    * Add the rows from X corresponding to the f(x) for this handle-vertex to Hp2p matrix
    * Add to Q matrix the positions of the handles 
    * @param {any} pickedVertexIndex
    * @param {any} qPosX
    * @param {any} qPosY
    */
    addHandleVertex(vertexIndex, xPos, yPos) {//index in geometry
        let subMatrixX = this.X.subMatrix(vertexIndex, vertexIndex + 1, 0, this.X.nCols()).hcat(DenseMatrix.zeros(1, this.X.nCols()));
        let subMatrixY = DenseMatrix.zeros(1,this.X.nCols()).hcat(this.X.subMatrix(vertexIndex, vertexIndex + 1, 0, this.X.nCols()));
        if (this.isHp2pEmpty) {
            this.Hp2p = DenseMatrix.zeros(2, subMatrixX.nCols());
            for (let i = 0; i < subMatrixX.nCols(); i++) {
                this.Hp2p.set(subMatrixX.get(0, i), 0, i);
                this.Hp2p.set(subMatrixY.get(0, i), 1, i);
            }
            this.Q = DenseMatrix.zeros(2, 1);
            this.Q.set(xPos, 0, 0);
            this.Q.set(yPos, 1, 0);
            this.isHp2pEmpty = false;
            //console.log('q position:            ' + geometry.positions[vertexIndex].x + 'x' + geometry.positions[vertexIndex].y);
            if (enableLogs) {
                console.log('energySD: Handle vertex index: ' + vertexIndex);
                console.log('energySD: Hp2p and Q size: ' + this.Hp2p.nRows() + ', ' + this.Q.nRows());
            }
            return;
        }
        this.Hp2p = this.Hp2p.vcat(subMatrixX);
        this.Hp2p = this.Hp2p.vcat(subMatrixY);
        let q = DenseMatrix.zeros(2, 1);
        q.set(xPos, 0, 0);
        q.set(yPos, 1, 0);
        this.Q = this.Q.vcat(q);
        //console.log('q position:            ' + geometry.positions[vertexIndex].x + 'x' + geometry.positions[vertexIndex].y);
        if (enableLogs) {
            console.log('energySD: Handle vertex index: ' + vertexIndex);
            console.log('energySD: Hp2p and Q num of rows: ' + this.Hp2p.nRows() + ', ' + this.Q.nRows());
        }
    }

    removeHandleVertex(vertexIndex) {//vertex index as it in HP2P and Q matrices
        //If there is no handles - error
        if (this.isHp2pEmpty) {
            console.log('energySD: Error: there is no handles to remove!')
            return false;
        }
        //if there is only one handle - remove p2p energy matrices
        if (this.Hp2p.nRows() == 2) {
            this.Hp2p = undefined;
            this.Q = undefined;
            this.isHp2pEmpty = true;
            if (enableLogs)
                console.log('energySD: The last handale has been removed.');
            return true;
        }
        //case of the first index to be removed
        if (vertexIndex == 0) {
            this.Hp2p = this.Hp2p.subMatrix(2, this.Hp2p.nRows(), 0, this.Hp2p.nCols());
            this.Q = this.Q.subMatrix(2, this.Q.nRows(), 0, this.Q.nCols());
            if (enableLogs) {
                console.log('energySD: Handale in the first index has been removed.');
                console.log('energySD: Hp2p and Q size: ' + this.Hp2p.nRows() + ', ' + this.Q.nRows());
            }
            return true;
        }
        //case of last index to be removed
        if (vertexIndex == this.Hp2p.nRows()/2-1) {
            this.Hp2p = this.Hp2p.subMatrix(0, this.Hp2p.nRows() - 2, 0, this.Hp2p.nCols());
            this.Q = this.Q.subMatrix(0, this.Q.nRows() - 2, 0, this.Q.nCols());
            if (enableLogs) {
                console.log('energySD: Handale in the last index has been removed.');
                console.log('energySD: Hp2p and Q size: ' + this.Hp2p.nRows() + ', ' + this.Q.nRows());
            }
            return true;
        }
        let HUp = this.Hp2p.subMatrix(0, vertexIndex * 2, 0, this.Hp2p.nCols());
        let HLow = this.Hp2p.subMatrix(vertexIndex * 2 + 2, this.Hp2p.nRows(), 0, this.Hp2p.nCols());
        this.Hp2p = HUp.vcat(HLow);

        let QUp = this.Q.subMatrix(0, vertexIndex * 2, 0, this.Q.nCols());
        let QLow = this.Q.subMatrix(vertexIndex * 2 + 2, this.Q.nRows(), 0, this.Q.nCols());
        this.Q = QUp.vcat(QLow);
        if (enableLogs) {
            console.log('energySD: Handale of index = ' + vertexIndex + ' has been removed.');
            console.log('energySD: Hp2p and Q size: ' + this.Hp2p.nRows() + ', ' + this.Q.nRows());
        }
        return true;
    }

    /**Removes all handles. For mesh reload */
    removeAllHandles() {
        if (!this.isHp2pEmpty) {
            console.log('energySD: Removing p2p-handles');
            this.Hp2p = undefined;
            this.Q = undefined;
            this.isHp2pEmpty = true;
        }
    }

    /**
     * Updates the position of an active handele.
     * Activated every time user picks a handle and moves it.
     * @param {any} pickedVertexIndex
     * @param {any} qPosX
     * @param {any} qPosY
     */
    p2pUpdateQ(pickedVertexIndex, qPosX, qPosY) {
        this.Q.set(qPosX, pickedVertexIndex * 2, 0);
        this.Q.set(qPosY, pickedVertexIndex * 2 + 1, 0);
    }

    /**
     * Build all preprocessing matrices for future computations.
     * */
    buildPrepocessingElements() {
        this.buildPumpingMatrixForAlpha();
        this.createShiftMatrix();
        this.createTransformMatrixForHessian();
        let cols = this.cageVertices.length;
        let TZ1Mat = new Triplet(this.boundaryFacesLength * 2, cols * 2);
        let TZ2Mat = new Triplet(this.boundaryFacesLength * 2, cols * 2);
        let DTriangleMat = DenseMatrix.zeros(this.boundaryFacesLength * 2, 2 * 3);
        let DbarTriangleMat = DenseMatrix.zeros(this.boundaryFacesLength * 2, 2 * 3);
        let TDTD = new Triplet(this.boundaryFacesLength * 6, cols * 2);
        let TDbarTDbar = new Triplet(this.boundaryFacesLength * 6, cols * 2);
        let TSumUp = new Triplet(this.cageVertices.length * 2, this.boundaryFacesLength * 6);
        this.M = DenseMatrix.zeros(this.boundaryFacesLength * 4, 2 * 3);

        for (let i = 0; i < this.boundaryFacesLength; i++) {
            //let iBoundaryOffset = 2 * i * this.boundaryFacesLength;
            let iLarge = i * 6;
            let ii = i * 2;
            let i4 = i * 4;
            let faceIndex = this.boundaryFaces[i];//faceIndex = face global index (in the mesh object)
            let f = this.geometry.mesh.faces[faceIndex];
            let curQArea = 1 / (4 * this.geometry.area(f));
            this.boundaryFacesAreas.set(this.geometry.area(f), i, 0);//for summing up the energy (to get E = 2 for undeformed mesh)
            let zix = [];
            let ziy = [];
            let vi = [];
            let dzx = [];
            let dzy = [];
            for (let h of f.adjacentHalfedges()) {
                let currentV = this.vertexIndex[h.vertex];
                zix.push(this.geometry.positions[currentV].x);
                ziy.push(this.geometry.positions[currentV].y);
                vi.push(this.cageVertices.indexOf(currentV));
            }
            
            this.viIndices.push(vi);
            //Compute triangle sides
            dzy[0] = curQArea * (ziy[1] - ziy[2]);
            dzy[1] = curQArea * (ziy[2] - ziy[0]);
            dzy[2] = curQArea * (ziy[0] - ziy[1]);
            dzx[0] = curQArea * (zix[1] - zix[2]);
            dzx[1] = curQArea * (zix[2] - zix[0]);
            dzx[2] = curQArea * (zix[0] - zix[1]);

            //D[Fx3]
            DTriangleMat.set(dzy[0], ii, 0);
            DTriangleMat.set(dzy[1], ii, 1);
            DTriangleMat.set(dzy[2], ii, 2);

            DTriangleMat.set(-(dzx[0]), ii, 3);
            DTriangleMat.set(-(dzx[1]), ii, 4);
            DTriangleMat.set(-(dzx[2]), ii, 5);

            DTriangleMat.set(dzx[0], ii + 1, 0);
            DTriangleMat.set(dzx[1], ii + 1, 1);
            DTriangleMat.set(dzx[2], ii + 1, 2);

            DTriangleMat.set(dzy[0], ii + 1, 3);
            DTriangleMat.set(dzy[1], ii + 1, 4);
            DTriangleMat.set(dzy[2], ii + 1, 5);

            //Dbar[Fx3]
            DbarTriangleMat.set(dzy[0], ii, 0);
            DbarTriangleMat.set(dzy[1], ii, 1);
            DbarTriangleMat.set(dzy[2], ii, 2);

            DbarTriangleMat.set(dzx[0], ii, 3);
            DbarTriangleMat.set(dzx[1], ii, 4);
            DbarTriangleMat.set(dzx[2], ii, 5);

            DbarTriangleMat.set(-(dzx[0]), ii + 1, 0);
            DbarTriangleMat.set(-(dzx[1]), ii + 1, 1);
            DbarTriangleMat.set(-(dzx[2]), ii + 1, 2);

            DbarTriangleMat.set(dzy[0], ii + 1, 3);
            DbarTriangleMat.set(dzy[1], ii + 1, 4);
            DbarTriangleMat.set(dzy[2], ii + 1, 5);


            //M-Mat construction with small M-matrix
            //D-part
            this.M.set(dzy[0], i4, 0);
            this.M.set(dzy[1], i4, 1);
            this.M.set(dzy[2], i4, 2);

            this.M.set(-(dzx[0]), i4, 3);
            this.M.set(-(dzx[1]), i4, 4);
            this.M.set(-(dzx[2]), i4, 5);

            this.M.set(dzx[0], i4 + 1, 0);
            this.M.set(dzx[1], i4 + 1, 1);
            this.M.set(dzx[2], i4 + 1, 2);

            this.M.set(dzy[0], i4 + 1, 3);
            this.M.set(dzy[1], i4 + 1, 4);
            this.M.set(dzy[2], i4 + 1, 5);
            //Dbar-part
            this.M.set(dzy[0], i4+2, 0);
            this.M.set(dzy[1], i4+2, 1);
            this.M.set(dzy[2], i4+2, 2);

            this.M.set(dzx[0], i4+2, 3);
            this.M.set(dzx[1], i4+2, 4);
            this.M.set(dzx[2], i4+2, 5);

            this.M.set(-(dzx[0]), i4 + 3, 0);
            this.M.set(-(dzx[1]), i4 + 3, 1);
            this.M.set(-(dzx[2]), i4 + 3, 2);

            this.M.set(dzy[0], i4 + 3, 3);
            this.M.set(dzy[1], i4 + 3, 4);
            this.M.set(dzy[2], i4 + 3, 5);


            //D-Mat construction
            TZ1Mat.addEntry(dzy[0], ii, vi[0]);
            TZ1Mat.addEntry(dzy[1], ii, vi[1]);
            TZ1Mat.addEntry(dzy[2], ii, vi[2]);

            TZ1Mat.addEntry(-(dzx[0]), ii, vi[0] + cols);
            TZ1Mat.addEntry(-(dzx[1]), ii, vi[1] + cols);
            TZ1Mat.addEntry(-(dzx[2]), ii, vi[2] + cols);

            TZ1Mat.addEntry(dzx[0], ii + 1, vi[0]);
            TZ1Mat.addEntry(dzx[1], ii + 1, vi[1]);
            TZ1Mat.addEntry(dzx[2], ii + 1, vi[2]);

            TZ1Mat.addEntry(dzy[0], ii + 1, vi[0] + cols);
            TZ1Mat.addEntry(dzy[1], ii + 1, vi[1] + cols);
            TZ1Mat.addEntry(dzy[2], ii + 1, vi[2] + cols);

            //Dbar-Mat construction
            TZ2Mat.addEntry(dzy[0], ii, vi[0]);
            TZ2Mat.addEntry(dzy[1], ii, vi[1]);
            TZ2Mat.addEntry(dzy[2], ii, vi[2]);

            TZ2Mat.addEntry(dzx[0], ii, vi[0] + cols);
            TZ2Mat.addEntry(dzx[1], ii, vi[1] + cols);
            TZ2Mat.addEntry(dzx[2], ii, vi[2] + cols);

            TZ2Mat.addEntry(-(dzx[0]), ii + 1, vi[0]);
            TZ2Mat.addEntry(-(dzx[1]), ii + 1, vi[1]);
            TZ2Mat.addEntry(-(dzx[2]), ii + 1, vi[2]);

            TZ2Mat.addEntry(dzy[0], ii + 1, vi[0] + cols);
            TZ2Mat.addEntry(dzy[1], ii + 1, vi[1] + cols);
            TZ2Mat.addEntry(dzy[2], ii + 1, vi[2] + cols);


            //Final Gradient = (g1x,g2x,g3x...gkx,g1y,g2y,g3y...gky)^T, k = |cage vertices|
            TSumUp.addEntry(1, vi[0], iLarge);
            TSumUp.addEntry(1, vi[0] + cols, iLarge + 3);
            TSumUp.addEntry(1, vi[1], iLarge + 1);
            TSumUp.addEntry(1, vi[1] + cols, iLarge + 4);
            TSumUp.addEntry(1, vi[2], iLarge + 2);
            TSumUp.addEntry(1, vi[2] + cols, iLarge + 5);

            ////M-Mat construction with big M-matrix
            ////D-part
            //TM.addEntry(dzy[0], i4, iLarge + 0);
            //TM.addEntry(dzy[1], i4, iLarge + 1);
            //TM.addEntry(dzy[2], i4, iLarge + 2);

            //TM.addEntry(-(dzx[0]), i4, iLarge + 3);
            //TM.addEntry(-(dzx[1]), i4, iLarge + 4);
            //TM.addEntry(-(dzx[2]), i4, iLarge + 5);

            //TM.addEntry(dzx[0], i4 + 1, iLarge + 0);
            //TM.addEntry(dzx[1], i4 + 1, iLarge + 1);
            //TM.addEntry(dzx[2], i4 + 1, iLarge + 2);

            //TM.addEntry(dzy[0], i4 + 1, iLarge + 3);
            //TM.addEntry(dzy[1], i4 + 1, iLarge + 4);
            //TM.addEntry(dzy[2], i4 + 1, iLarge + 5);
            ////Dbar-part
            //TM.addEntry(dzy[0], i4 + 2, iLarge + 0);
            //TM.addEntry(dzy[1], i4 + 2, iLarge + 1);
            //TM.addEntry(dzy[2], i4 + 2, iLarge + 2);

            //TM.addEntry(dzx[0], i4 + 2, iLarge + 3);
            //TM.addEntry(dzx[1], i4 + 2, iLarge + 4);
            //TM.addEntry(dzx[2], i4 + 2, iLarge + 5);

            //TM.addEntry(-(dzx[0]), i4 + 3, iLarge + 0);
            //TM.addEntry(-(dzx[1]), i4 + 3, iLarge + 1);
            //TM.addEntry(-(dzx[2]), i4 + 3, iLarge + 2);

            //TM.addEntry(dzy[0], i4 + 3, iLarge + 3);
            //TM.addEntry(dzy[1], i4 + 3, iLarge + 4);
            //TM.addEntry(dzy[2], i4 + 3, iLarge + 5);
        }
        this.boundaryFacesAreas.scaleBy(1 / this.boundaryFacesAreas.sum()); //Normalize Boundary Triangles Areas
        console.log('energySD: M Dim: ' + this.M.nRows() + 'x' + this.M.nCols());
        let DFromT = SparseMatrix.fromTriplet(TZ1Mat);
        let DbarFromT = SparseMatrix.fromTriplet(TZ2Mat);

        for (let i = 0; i < this.boundaryFacesLength; i++) {
            let ii = 2 * i;
            let i6 = i * 6;
            let DSub = DTriangleMat.subMatrix(ii, ii + 2, 0, 6);
            let DTD = DSub.transpose().timesDense(DSub);
            for (let k = 0; k < 6; k++) {
                for (let l = 0; l < 3; l++) {
                    //TDTD.addEntry(DTD.get(k, l), i6 + k, this.viIndices[i][l]);
                    //TDTD.addEntry(DTD.get(k, l + 3), i6 + k, this.viIndices[i][l] + cols);
                    TDTD.addEntry(DTD.get(k, l) * this.boundaryFacesAreas.get(i, 0), i6 + k, this.viIndices[i][l]);
                    TDTD.addEntry(DTD.get(k, l + 3) * this.boundaryFacesAreas.get(i, 0), i6 + k, this.viIndices[i][l] + cols);
                }
            }
        }
        for (let i = 0; i < this.boundaryFacesLength; i++) {
            let ii = 2 * i;
            let i6 = i * 6;
            let DbarSub = DbarTriangleMat.subMatrix(ii, ii + 2, 0, 6);
            let DbarTD = DbarSub.transpose().timesDense(DbarSub);
            for (let k = 0; k < 6; k++) {
                for (let l = 0; l < 3; l++) {
                    //TDbarTDbar.addEntry(DbarTD.get(k, l), i6 + k, this.viIndices[i][l]);
                    //TDbarTDbar.addEntry(DbarTD.get(k, l + 3), i6 + k, this.viIndices[i][l] + cols);
                    TDbarTDbar.addEntry(DbarTD.get(k, l) * this.boundaryFacesAreas.get(i, 0), i6 + k, this.viIndices[i][l]);
                    TDbarTDbar.addEntry(DbarTD.get(k, l + 3) * this.boundaryFacesAreas.get(i, 0), i6 + k, this.viIndices[i][l] + cols);
                }
            }
        }
        let DDTransposeDDFromT = SparseMatrix.fromTriplet(TDTD);
        let DDbarTransposeDDbarFromT = SparseMatrix.fromTriplet(TDbarTDbar);

        //BB and BBbar are for Energy, Fz and Fzbar
        this.BBbar = DbarFromT.timesDense(this.TransferFunction);
        console.log('energySD: DIM BBbar=' + this.BBbar.nRows() + 'x' + this.BBbar.nCols());
        this.BB = DFromT.timesDense(this.TransferFunction);
        console.log('energySD: DIM BB=' + this.BB.nRows() + 'x' + this.BB.nCols());

        //Fz(and Fzbar) is real valued now, therefore it has x's and then y's. to make |Fz|, the next matrix is created, it sums x's and y's of the |Fz|
        let T1 = new Triplet(this.boundaryFacesLength, this.boundaryFacesLength * 2); 
        for (let i = 0; i < this.boundaryFacesLength; i++) {
            T1.addEntry(1, i, i * 2);
            T1.addEntry(1, i, i * 2 + 1);
        }
        this.transferMatrixForFz = SparseMatrix.fromTriplet(T1);
        console.log(`energySD: transferMatrixForFz Dim = ${this.transferMatrixForFz.nRows()} x ${this.transferMatrixForFz.nCols()}`);

        //Now back to DDbarTransposeDbar and DDTransposeD
        this.SumUpGradientElements = SparseMatrix.fromTriplet(TSumUp);
        console.log('energySD: DDbarTransposeDDbarFromT dimension = ' + DDbarTransposeDDbarFromT.nRows() + 'x' + DDbarTransposeDDbarFromT.nCols());
        console.log('energySD: DDTransposeDDFromT dimension = ' + DDTransposeDDFromT.nRows() + 'x' + DDTransposeDDFromT.nCols());
        console.log('energySD: SumUpGradientElements Matrix dimension = ' + this.SumUpGradientElements.nRows() + 'x' + this.SumUpGradientElements.nCols());

        //BGrad and BbarGrad are for Gradient
        this.BbarGrad = DDbarTransposeDDbarFromT.timesDense(this.TransferFunction);
        this.BbarGrad.scaleBy(2);
        console.log(`energySD: BbarGrad dimension = ${this.BbarGrad.nRows()}x${this.BbarGrad.nCols()}`);

        this.BGrad = DDTransposeDDFromT.timesDense(this.TransferFunction);
        this.BGrad.scaleBy(2);
        console.log(`energySD: BGrad dimension = ${this.BGrad.nRows()}x${this.BGrad.nCols()}`);
    }

    /**Get current x,y-positions of the boundary
    */
    getPositionsForW() {
        for (let i = 0; i < this.boundaryLength; i++) {
            this.W.set(this.geometry.positions[this.boundaryVertexIndices[i]].x, i, 0);
            this.W.set(this.geometry.positions[this.boundaryVertexIndices[i]].y, i + this.boundaryLength, 0);
        }
    }

    buildPumpingMatrixForAlpha() {
        let T = new Triplet(this.boundaryFacesLength * 6, this.boundaryFacesLength);
        /* 1000...
         * 1000...
         * 1000...
         * 1000...
         * 1000...
         * 1000...
         * 0100...
         * Making: xxxyyyxxxyyyxxxyyy...
         */
        for (let i = 0; i < this.boundaryFacesLength; i++) {
            T.addEntry(1, i * 6, i);
            T.addEntry(1, i * 6 + 1, i);
            T.addEntry(1, i * 6 + 2, i);
            T.addEntry(1, i * 6 + 3, i);
            T.addEntry(1, i * 6 + 4, i);
            T.addEntry(1, i * 6 + 5, i);
        }
        this.PumpingMatrixForAlpha = SparseMatrix.fromTriplet(T);
        console.log('energySD: PumpingMatrixForAlpha dim = ' + this.PumpingMatrixForAlpha.nRows() + 'x' + this.PumpingMatrixForAlpha.nCols());
    }

    createTransformMatrixForHessian() {
        let cageLength = this.cageVertices.length;
        let T = new Triplet(2 * cageLength * this.boundaryFacesLength, 2 * cageLength);
        for (let j = 0; j < cageLength*2; j++) {
            for (let i = 0; i < this.boundaryFacesLength; i++) {
                T.addEntry(1, i * cageLength * 2 + j, j);
                //T.addEntry(1, i * cageLength * 2 + j, j + cageLength);
            }
        }
        this.TransformMatrixForHessian = SparseMatrix.fromTriplet(T);
    }

    createShiftMatrix() {
        let T = new Triplet(this.boundaryFacesLength * 2, this.boundaryFacesLength * 2);
        for (let i = 0; i < this.boundaryFacesLength; i++) {
            T.addEntry(1, i*2, i*2 + 1);
        }
        this.shiftMatrixForFz = SparseMatrix.fromTriplet(T);
    }

    p2pEnergy() {//for debug purpeses
        //this.getPositionsForW();
        let p2p = this.Hp2p.timesDense(this.W).minus(this.Q);
        let p2pEn = p2p.abs2CWise().sum();//timesCWise(p2p).sum();
        p2pEn *= 0.5;
        console.log('energySD: p2pEn ' + p2pEn);

        //console.log('p2p energy: energy = ' + this.p2pEn);
        let p2pGradient = this.Hp2p.transpose().timesDense(p2p);
        console.log('energySD: p2p energy = ' + p2pEn);
        //for (let i = 0; i < p2pGradient.nRows(); i++)
        //    console.log('p2p gradient[' + i + '] = ' + p2pGradient.get(i, 0));

        let p2pHessian = this.Hp2p.transpose().timesDense(this.Hp2p);
        console.log('energySD: p2p Hessian dim = ' + p2pHessian.nRows() + 'x' + p2pHessian.nCols());
    }

}

//function sendMatrixForSave(M) {//for debug
//    console.log('energySD: in sendMatrixForSave!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
//    let rows = M.nRows();
//    let cols = M.nCols();
//    console.log('energySD: M # of rows = ' + rows);
//    console.log('energySD: M # of cols = ' + cols);
//    let arr = [];
//    for (let i = 0; i < rows; i++) {
//        for (let j = 0; j < cols; j++) {
//            arr.push(M.get(i, j));
//        }
//        arr.push('\n');
//    }
//    postMessage([3, arr, rows, cols]);
//}


///**
// * Debug function
// * Changes the mesh
// * Then I ma run Newton solver to see if it works...
// * */
//function changeMesh() {
//    let V = mesh.vertices.length;
//    let positions = new Float32Array(V * 3);
//    let position = undefined;
//    let transformMatrix = DenseMatrix.identity(2, 2);
//    let currentVertex = DenseMatrix.zeros(2, 1);

//                                          //Scale mesh
//    transformMatrix.set(5+Math.cos(3.1415 / 2), 0, 0);
//    transformMatrix.set(-(Math.sin(3.1415 / 2)), 0, 1);
//    transformMatrix.set(Math.sin(3.1415 / 2), 1, 0);
//    transformMatrix.set(3+Math.cos(3.1415 / 2), 1, 1);

//    //transformMatrix.set(5, 0, 0);
//    //transformMatrix.set(3, 1, 1);

//    //                                      Change one vertex
//    //let v = mesh.vertices[0];
//    //position = geometry.positions[v];
//    //position.x = position.x - 0.1;
//    //position.y = position.y - 0.1;

//    //v = mesh.vertices[0];
//    //position = geometry.positions[v];
//    //position.x = position.x - 0.1;
//    //position.y = position.y - 0.1;
//    //v = mesh.vertices[111];
//    //position = geometry.positions[v];
//    //position.x = position.x - 0.1;
//    //position.y = position.y + 0.1;



//    for (let v of mesh.vertices) {
//        position = geometry.positions[v];
//        currentVertex.set(position.x, 0, 0);
//        currentVertex.set(position.y, 1, 0);
//        let newPos = transformMatrix.timesDense(currentVertex);
//        position.x = newPos.get(0, 0);
//        position.y = newPos.get(1, 0);
//        //position.x = position.x + 1;
//        //position.y = position.y + 1;
//        let i = v.index;
//        positions[3 * i + 0] = position.x;
//        positions[3 * i + 1] = position.y;
//        positions[3 * i + 2] = 0;
//    }
//    postMessage([1, positions]);
//}

    //Gradient Decent Algorithm - there is a bug I'll need to find...

    //GradientDecent() {
    //    //P2P part
    //    let p2p = this.Hp2p.timesDense(this.W).minus(this.Q);
    //    this.p2pEn = p2p.abs2CWise().sum();
    //    this.p2pEn *= 0.5;
    //    this.p2pGradient = this.Hp2p.transpose().timesDense(p2p);

    //    //SD part
    //    let Fz = this.BB.timesDense(this.W);//Fz
    //    let Fz_e2 = Fz.abs2CWise();//Fz^2
    //    let FzAbsSquare = this.transferMatrixForFz.timesDense(Fz_e2);//(Fz.abs2CWise());//timesCWise(Fz)); // = |Fz|^2
    //    let Fzbar = this.BBbar.timesDense(this.W);//Fzbar
    //    let Fzbar_e2 = Fzbar.abs2CWise();//Fzbar^2
    //    let FzbarAbsSquare = this.transferMatrixForFz.timesDense(Fzbar_e2);//(Fzbar.abs2CWise());//timesCWise(Fzbar)); // = |Fzbar|^2


    //    let XPlusY = FzAbsSquare.plus(FzbarAbsSquare);
    //    let XMinusY = FzAbsSquare.minus(FzbarAbsSquare);
    //    let XMinusYe2 = XMinusY.abs2CWise();
    //    let XMinusYe3 = XMinusYe2.timesCWise(XMinusY);

    //    //SD - Energy
    //    let EnergySD = XPlusY.plus(XPlusY.overCWise(XMinusYe2));
    //    let sumESDNormalized = EnergySD.transpose().timesDense(this.boundaryFacesAreas);

    //    //Energy - total
    //    this.EnergySum = sumESDNormalized.get(0, 0) + this.p2pEn * lambda;

    //    //alpha1 alpha2
    //    let alpha1 = this.ones.minus(FzAbsSquare.plus(FzbarAbsSquare.timesReal(3)).overCWise(XMinusYe3));
    //    let alpha2 = this.ones.plus(FzbarAbsSquare.plus(FzAbsSquare.timesReal(3)).overCWise(XMinusYe3));

    //    let alpha1Pumped = this.PumpingMatrixForAlpha.timesDense(alpha1);
    //    let alpha2Pumped = this.PumpingMatrixForAlpha.timesDense(alpha2);

    //    //Gradient
    //    let element1OfGrad = this.BGrad.timesDense(this.W);
    //    let element2OfGrad = this.BbarGrad.timesDense(this.W);

    //    let element1 = this.SumUpGradientElements.timesDense(element1OfGrad.timesCWise(alpha1Pumped));
    //    let element2 = this.SumUpGradientElements.timesDense(element2OfGrad.timesCWise(alpha2Pumped));

    //    //SD-Gradient
    //    this.gradient = this.TransferFunction.transpose().timesDense((element1.plus(element2)));

    //    //this.normL1OfSDGradient = this.gradient.norm(1);
    //    //this.normL1OfP2PGradient = this.p2pGradient.norm(1);

    //    //Total Gradient
    //    let d = this.gradient.plus(this.p2pGradient.timesReal(lambda)); //FOR GRADIENT DECENT
    //    //let Gradient = this.gradient.plus(this.p2pGradient.timesReal(lambda));
    //    this.normL1OfGradients = d.norm(1);
    //    if (this.normL1OfGradients < precision) {
    //        console.log('energySD: THE ENERGY IS IN MINIMUM');
    //        countEnergyConv++;
    //        return (true);
    //    }

    //    //line search part
    //    /**
    //     * A = |Fz(d)|^2 - |Fzbar(d)|^2
    //     * B = -2(FzFz(d) - FzbarFzbar(d))
    //     * C = |Fz|^2 - |Fzbar|^2 
    //     * d = unit step
    //     * */
    //    let Fz_d = this.BB.timesDense(d);
    //    let Fzbar_d = this.BBbar.timesDense(d);
    //    let A = this.transferMatrixForFz.timesDense(Fz_d.abs2CWise().minus(Fzbar_d.abs2CWise()));
    //    let C = XMinusY;
    //    //let _B = this.transferMatrixForFz.timesDense(Fzbar.timesCWise(Fzbar_d).minus(Fz.timesCWise(Fz_d)));//.timesReal(2));
    //    let _B = this.transferMatrixForFz.timesDense(Fz.timesCWise(Fz_d).minus(Fzbar.timesCWise(Fzbar_d)));
    //    _B.scaleBy(2);
    //    let sqrtDiscr = _B.abs2CWise().minus(A.timesCWise(C).timesReal(4)).sqrtCWise();

    //    let t1 = _B.plus(sqrtDiscr).overCWise(A);//DON'T FORGET TO MULT BY 0.5!
    //    let t2 = _B.minus(sqrtDiscr).overCWise(A);//DON'T FORGET TO MULT BY 0.5!
    //    let maxT1 = t1.maxCoeff();
    //    let maxT2 = t2.maxCoeff();

    //    let maxT = (maxT1 > maxT2) ? maxT1 : maxT2;
    //    //maxT *= 0.5;
    //    let minT = (maxT > 0) ? maxT : tInitVal;
    //    for (let i = 0; i < t1.nRows(); i++) {
    //        let currentT = t1.get(i, 0);
    //        if ((currentT > 0) && (currentT < minT))
    //            minT = currentT;
    //        currentT = t2.get(i, 0);
    //        if ((currentT > 0) && (currentT < minT))
    //            minT = currentT;
    //    }
    //    minT *= 0.1;
    //    if (isNaN(minT)) {
    //        t = tInitVal/10;
    //    }
    //    else {
    //        t = (tInitVal < minT) ? (tInitVal/10) : minT;
    //    }
    //    let itr = 0;
    //    let newEnergySum = 0;
    //    while (itr < maxLSItr) {
    //        //Wk
    //        let newW = this.W.minus(d.timesReal(t));

    //        //P2P part
    //        let newP2P = this.Hp2p.timesDense(newW).minus(this.Q);
    //        let newP2PEn = newP2P.abs2CWise().sum();
    //        newP2PEn *= 0.5;

    //        //SD part
    //        let fzbar = this.BBbar.timesDense(newW);
    //        let fz = this.BB.timesDense(newW);
    //        let fzbarAbsSquare = this.transferMatrixForFz.timesDense(fzbar.abs2CWise());
    //        let fzAbsSquare = this.transferMatrixForFz.timesDense(fz.abs2CWise());
    //        let newXPlusY = fzAbsSquare.plus(fzbarAbsSquare);
    //        let newXMinusY = fzAbsSquare.minus(fzbarAbsSquare);
    //        let newXMinusYe2 = newXMinusY.abs2CWise();
    //        let newEnergySD = newXPlusY.plus(newXPlusY.overCWise(newXMinusYe2));
    //        let newSumESDNormalized = newEnergySD.transpose().timesDense(this.boundaryFacesAreas);

    //        newEnergySum = newSumESDNormalized.get(0, 0) + newP2PEn * lambda;
    //        if (newEnergySum < (this.EnergySum + d.norm(1) * t * c)) { //for gradient decent
    //        //if (newEnergySum < (this.EnergySum + (d.transpose().timesDense(Gradient)).get(0, 0) * t * c)) {
    //            this.W = newW;
    //            break;
    //        }
    //        t *= 0.1;
    //        itr++;
    //    }
    //    if (itr == maxLSItr) {
    //        console.log('energySD: EXCEEDED max # of t iterations!!! Last value of t:' + t);
    //        console.log('energySD: Energy = ' + this.EnergySum);
    //        console.log('energySD: Energy (new) = ' + newEnergySum);
    //        countLSExceed++;
    //        return true;
    //    }
    //    return (false);
    //}

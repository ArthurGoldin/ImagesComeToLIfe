"use strict";

class SolveHarmonicSubspace {
    /**
     * This class solves Harmonic Subspace problem: builds harmonic subspace with constrained boundary
     * @param {any} geometry
     */
    
    constructor (geometry) {
        console.log('in HS constructor');   
        this.geometry = geometry;
        this.vertexIndex = indexElements(geometry.mesh.vertices);//index vertices
        this.boundaryVertexIndices = [];//array of boundary vertices indices, each element appears as it appears in geometry object [mx1]
        this.cageVertices = [];//array of cage vertices indices, i.e. boundary vertices and their neighbours [kx1]
        this.internalVertices = [];//array of indices of internal vertices (All vertices\boundary vertices) [lx1]
        this.X = undefined;//the x = L^(-1) * b solution. X is a matrix where each column is a solution for each b. [nxm]
        this.L = undefined;//Laplacian Matrix [nxn]
        this.smallL = undefined;//"Reduced" Laplacian Matrix - rows and columns corresponding to the boundary vertices are eliminated [lxl]
        this.H = undefined;//The H Matrix contains the only rows that correspond to the Cage vertices [kxm]
        this.Y = undefined;//The solution of Y = HW. [kx1] ([kx2])
        this.V = this.geometry.mesh.vertices.length;
    }

    run() {

        console.log('In HS run()');
        this.L = this.realNSLaplaceMatrixWithConstrainedBoundary();
        console.log('Laplace Matrix dimension: ' + this.L.nRows() + 'x' + this.L.nCols());
        this.smallL = this.realNSSmallLaplaceMatrixWithConstrainedBoundary();
        console.log('SMALL Laplace Matrix dimension: ' + this.smallL.nRows() + 'x' + this.smallL.nCols());
        console.log('Num of Boundary Vertices = ' + this.boundaryVertexIndices.length);
        //console.log('Boundary Vertices Indices : ' + this.boundaryVertexIndices);
        console.log('Num of Cage Vertices = ' + this.cageVertices.length);
        //console.log('Cage Vertices Indices : ' + this.cageVertices);
        console.log('Num of Internal Vertices = ' + this.internalVertices.length);
        ////console.log('Internal Vertices Indices : ' + this.internalVertices);
        console.log('Total num of Vertices = ' + this.V);


        ////Cholesky Method
        //let lltSmall = this.smallL.chol();
        //let bSmall = this.realCorrectedSmallB(this.boundaryVertexIndices[0]);
        //let XSmall = lltSmall.solvePositiveDefinite(bSmall);
        //this.X = DenseMatrix.zeros(this.V, this.boundaryVertexIndices.length);
        //this.X.set(1, this.boundaryVertexIndices[0], 0);
        //for (let i = 0; i < this.internalVertices.length; i++) {
        //    this.X.set(XSmall.get(i, 0), this.internalVertices[i], 0);
        //}
        //for (let i = 1; i < this.boundaryVertexIndices.length; i++) {
        //    bSmall = this.realCorrectedSmallB(this.boundaryVertexIndices[i]);
        //    XSmall = lltSmall.solvePositiveDefinite(bSmall);
        //    this.X.set(1, this.boundaryVertexIndices[i], i);
        //    for (let j = 0; j < this.internalVertices.length; j++) {
        //        this.X.set(XSmall.get(j, 0), this.internalVertices[j], i);
        //    }
        //}

        //console.log('The dimension of X is: ' + this.X.nRows() + 'x' + this.X.nCols());
        //this.H = this.createMatrixWithCageVertexPositions(this.V).timesDense(this.X);
        //console.log('H built successful');
        //console.log('The dimension of H is: ' + this.H.nRows() + 'x' + this.H.nCols());

    
        //LU METHOD
        let b = DenseMatrix.zeros(this.V, this.boundaryVertexIndices.length);
        for (let i = 0; i < this.boundaryVertexIndices.length; i++) {
            b.set(1, this.boundaryVertexIndices[i], i);
        }
        let LUF = this.L.lu();
        let Xx = DenseMatrix.zeros(this.V, this.boundaryVertexIndices.length);
        for (let i = 0; i < this.boundaryVertexIndices.length; i++) {
            let x = LUF.solveSquare(b.subMatrix(0, b.nRows(), i, i + 1));
            for (let j = 0; j < this.V; j++) {
                Xx.set(x.get(j, 0), j, i);
            }
        }   
        this.X = Xx;
        this.H = this.createMatrixWithCageVertexPositions(this.V).timesDense(this.X);
        console.log('The dimension of X is: ' + this.X.nRows() + 'x' + this.X.nCols());
        console.log('H built successful');
        console.log('The dimension of H is: ' + this.H.nRows() + 'x' + this.H.nCols());



        //////// saving logic
        //////let flatMatrix = [];
        //////for (let i = 0; i < this.Y.nRows(); i++) {
        //////    for (let j = 0; j < this.Y.nCols(); j++) {
        //////        flatMatrix.push(this.Y.get(i, j));
        //////    }
        //////}

        //////let strToSave = JSON.stringify(flatMatrix);
        //////localStorage.setItem('myMatrix', strToSave);
        //////localStorage.setItem('myMatrixCols', this.Y.nCols());
        //////localStorage.setItem('myMatrixRows', this.Y.nRows());


        //////// load savedData;
        //////let strLoaded = localStorage.getItem('myMatrix');
        //////if (strLoaded) {
        //////    let flatMatrix = JSON.parse(strLoaded);
        //////    let cols = localStorage.getItem('myMatrixCols');
        //////    let rows = localStorage.getItem('myMatrixRows');

        //////    let matrix = DenseMatrix.zeros(rows, cols);
        //////    for (let i = rows - 1; i >= 0; i--) {
        //////        for (let j = cols - 1; j >= 0; j--) {
        //////            let value = flatMatrix.pop();
        //////            matrix.set(value, i, j);
        //////        }
        //////    }
        //////}
    }


    /**
    * Builds a real sparse Laplace matrix with boundary weights constrained to 1 in one position and 0 in all others.
    * The boundary vertices weights constrained to 1.
    * Also create an array with boundary vertices indices, an array with boundary vertices and their neighbors (cage vertices) indices and an array with inner vertices indices.
    * @param {any} geometry
    * @returns {module:LinearAlgebra.ComplexSparseMatrix}
    */
    realNSLaplaceMatrixWithConstrainedBoundary() {
        //let V = this.geometry.mesh.vertices.length;
        let T = new Triplet(this.V, this.V);
        for (let v of this.geometry.mesh.vertices) {
            if (!v.onBoundary()) {
                let i = this.vertexIndex[v];
                this.internalVertices.push(i);
                let sum = 0;
                let onlyOnce = false;
                for (let h of v.adjacentHalfedges()) {
                    let j = this.vertexIndex[h.twin.vertex];
                    let weight = (this.geometry.cotan(h) + this.geometry.cotan(h.twin)) / 2;
                    sum += weight;

                    T.addEntry(weight, i, j);
                    //AG: Add cage vertices indices to the array
                    if ((this.geometry.mesh.vertices[j].onBoundary()) && (!onlyOnce)) {
                        this.cageVertices.push(i);
                        onlyOnce = true;
                    }
                }

                T.addEntry(-sum, i, i);
            }
            //AG: Add cage and boundry vertices indices to the arrays
            else {
                let i = this.vertexIndex[v];
                this.boundaryVertexIndices.push(i);
                this.cageVertices.push(i);
                T.addEntry(1, i, i);
            }
        }
        return SparseMatrix.fromTriplet(T);
    }

    /**
     * Builds a "reduced" (for Cholesky decomposition) real sparse Laplace Matrix, where each raw and column corresponds to internal vertex
     * The rhs is corrected manualy according to boundry vertices values
     * @param {any} geometry
     */
    realNSSmallLaplaceMatrixWithConstrainedBoundary() {
        let internalV = this.internalVertices.length;
        let T = new Triplet(internalV, internalV);//Triplet (and small L) has size of the number of internal vertices
        for (let i = 0; i < internalV; i++) {
            let k = this.internalVertices[i];//extract the index of current internal vertex
            let v = this.geometry.mesh.vertices[k]
            if (!v.onBoundary()) {//must be always true
                let sum = 0;
                for (let h of v.adjacentHalfedges()) {
                    let j = this.vertexIndex[h.twin.vertex];
                    let weight = (this.geometry.cotan(h) + this.geometry.cotan(h.twin)) / 2;
                    sum += weight;
                    if (!h.twin.vertex.onBoundary()) {
                        T.addEntry(weight, i, this.internalVertices.indexOf(j));
                    }
                }
                T.addEntry(-sum, i, i);
            }
            else {
                console.log('Error: vertex ' + k + ' is on a boundary!');
            }
        }
        return SparseMatrix.fromTriplet(T);
    }

    /**
    * Builds a rhs real vector where each entry corresponds to "eleminated" weight of a boundary vertex that is added to the vector in the correspondig index
    * @param {any} index
    */
    realCorrectedSmallB(index) {
        //console.log('index of current boundry vertex:' + index);
        let b = DenseMatrix.zeros(this.internalVertices.length, 1);
        for (let i = 0; i < this.internalVertices.length; i++) {
            let vRIndex = this.internalVertices[i];//vertex real index as it is in the geometry object
            let weightOfVInTheRow = this.L.get(vRIndex, index);
            if (weightOfVInTheRow != 0) {
                b.set(-(weightOfVInTheRow), i, 0);
            }
        }
        return b;
    }
    /**
     * Builds a kxn matrix, each raw corresponds to H[kxm] matrix and has 1 in the index of the CageVertex indexed with the raw number
     * @param {any} V
     */
    createMatrixWithCageVertexPositions(V) {
        let VCage = this.cageVertices.length;
        let T = new Triplet(VCage, V);
        for (let i = 0; i < VCage; i++) {
            T.addEntry(1, i, this.cageVertices[i]);
        }
        return SparseMatrix.fromTriplet(T);
    }

    createMatrixWithInternalVertexPositions(V) {
        let VInt = this.internalVertices.length;
        let T = new Triplet(V, VInt);
        for (let i = 0; i < VInt; i++) {
            T.addEntry(1, this.internalVertices[i], i)
        }
        return SparseMatrix.fromTriplet(T);
    }

    ///**
    //* Builds a complex sparse Laplace matrix with boundary weights constrained to 1 in one position and 0 in all others.
    //* The boundary vertices weights constrained to 1.
    //* Also create an array with boundary vertices indices, an array with boundary vertices and their neighbors (cage vertices) indices and an array with inner vertices indices.
    //* @param {any} geometry
    //* @returns {module:LinearAlgebra.ComplexSparseMatrix}
    //*/
    //complexNSLaplaceMatrixWithConstrainedBoundary(geometry) {
    //    let V = geometry.mesh.vertices.length;
    //    let T = new ComplexTriplet(V, V);
    //    for (let v of geometry.mesh.vertices) {
    //        if (!v.onBoundary()) {
    //            let i = this.vertexIndex[v];
    //            this.internalVertices.push(i);
    //            let sum = new Complex(0);
    //            let onlyOnce = false;
    //            for (let h of v.adjacentHalfedges()) {
    //                let j = this.vertexIndex[h.twin.vertex];
    //                let weight = (geometry.cotan(h) + geometry.cotan(h.twin)) / 2;
    //                sum += weight;

    //                T.addEntry(new Complex(weight), i, j);
    //                //AG: Add cage vertices indices to the array
    //                if ((geometry.mesh.vertices[j].onBoundary()) && (!onlyOnce)) {
    //                    this.cageVertices.push(i);
    //                    onlyOnce = true;
    //                }
    //            }

    //            T.addEntry(new Complex(-sum), i, i);
    //        }
    //        //AG: Add cage and boundry vertices indices to the arrays
    //        else {
    //            let i = this.vertexIndex[v];
    //            this.boundaryVertexIndices.push(i);
    //            this.cageVertices.push(i);
    //            T.addEntry(new Complex(1), i, i);
    //        }
    //    }
    //    return ComplexSparseMatrix.fromTriplet(T);
    //}

    ///**
    // * Builds a "reduced" complex sparse Laplace Matrix, where each raw and column corresponds to internal vertex
    // * The rhs is corrected manualy according to boundry vertices values
    // * @param {any} geometry
    // */
    //complexNSSmallLaplaceMatrixWithConstrainedBoundary(geometry) {
    //    let internalV = this.internalVertices.length;
    //    //let count = 0;
    //    let T = new ComplexTriplet(internalV, internalV);//Triplet (and small L) is of size of the number of internal vertices
    //    for (let i = 0; i < internalV; i++) {
    //        let k = this.internalVertices[i];//extract the index of current internal vertex
    //        let v = geometry.mesh.vertices[k]
    //        if (!v.onBoundary()) {//must be always true. probably there is no need for this condition
    //            let sum = new Complex(0);
    //            for (let h of v.adjacentHalfedges()) {
    //                let j = this.vertexIndex[h.twin.vertex];
    //                let weight = (geometry.cotan(h) + geometry.cotan(h.twin)) / 2;
    //                sum += weight;
    //                if (!h.twin.vertex.onBoundary()) {
    //                    //count++;
    //                    T.addEntry(new Complex(weight), i, this.internalVertices.indexOf(j));
    //                }
    //            }
    //            T.addEntry(new Complex(-sum), i, i);
    //        }
    //        else {
    //            console.log('Error: vertex ' + k + ' is on a boundary!');
    //        }
    //    }
    //    //console.log('COUNT = ' + count);
    //    return ComplexSparseMatrix.fromTriplet(T);
    //}

    ///**
    // * Builds a rhs complex vector where each entry corresponds to "eleminated" weight of a boundary vertex that is added to the vector in the correspondig index
    // * @param {any} index
    // */
    //complexCorrectedSmallB(index) {
    //    //console.log('index of current boundry vertex:' + index);
    //    let b = ComplexDenseMatrix.zeros(this.internalVertices.length, 1);
    //    for (let i = 0; i < this.internalVertices.length; i++) {
    //        let vRIndex = this.internalVertices[i];//vertex real index as it is in geometry object
    //        let extractFromSparse = this.L.subMatrix(vRIndex, vRIndex + 1, index, index + 1);//to get the value of sparse matrix in index [vertex index][boundary vertex index]
    //        let weightOfVInTheRow = extractFromSparse.toDense();                             //the 1x1 sub sparse matrix extracted and then converted to dense matrix
    //        if (weightOfVInTheRow.get(0, 0) != 0) {
    //            //console.log('The weight of CURRENT Boundary vertex: ' + weightOfVInTheRow.get(0, 0).re);
    //            b.set(new Complex(-weightOfVInTheRow.get(0, 0).re), i, 0);
    //            //console.log('The updated weight in B[' + i + '] is: ' + b.get(i, 0).re);
    //        }
    //        extractFromSparse.delete();
    //        weightOfVInTheRow.delete();
    //    }
    //    return b;
    //}

}          
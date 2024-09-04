"use strict";

class DenseMatrix {
	/**
	 * This class represents a real m by n real matrix where every entry, including
	 * zero-valued entries, is stored explicitly. Do not create a DenseMatrix
	 * from its constructor, instead use static factory methods such as zeros,
	 * identity, ones, constant and random.
	 * @constructor module:LinearAlgebra.DenseMatrix
	 * @example
	 * let A = DenseMatrix.zeros(20, 5);
	 * let B = DenseMatrix.identity(10, 10);
	 * let C = DenseMatrix.ones(100, 1);
	 * let D = DenseMatrix.constant(4.6, 5, 5);
	 * let E = DenseMatrix.random(5, 20);
	 */
	constructor(data) {
		this.data = data;
		memoryManager.objectList.push(this);
	}

	/**
	 * Deletes the emscripten heap allocated data of this dense matrix.
	 * @ignore
	 * @method module:LinearAlgebra.DenseMatrix#delete
	 */
	delete() {
		this.data.delete();
	}

	/**
	 * Initializes a m by n matrix of zeros.
	 * @method module:LinearAlgebra.DenseMatrix.zeros
	 * @param {number} m The number of rows in this dense matrix.
	 * @param {number} n The number of columns in this dense matrix.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	static zeros(m, n = 1) {
		return new DenseMatrix(new Module.DenseMatrix(m, n));
	}

	/**
	 * Initializes a m by n identity matrix.
	 * @method module:LinearAlgebra.DenseMatrix.identity
	 * @param {number} m The number of rows in this dense matrix.
	 * @param {number} n The number of columns in this dense matrix.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	static identity(m, n = 1) {
		return new DenseMatrix(Module.DenseMatrix.identity(m, n));
	}

	/**
	 * Initializes a m by n matrix of ones.
	 * @method module:LinearAlgebra.DenseMatrix.ones
	 * @param {number} m The number of rows in this dense matrix.
	 * @param {number} n The number of columns in this dense matrix.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	static ones(m, n = 1) {
		return new DenseMatrix(Module.DenseMatrix.ones(m, n));
	}

	/**
	 * Initializes a m by n constant matrix.
	 * @method module:LinearAlgebra.DenseMatrix.constant
	 * @param {number} x The constant value stored in every entry of this dense matrix.
	 * @param {number} m The number of rows in this dense matrix.
	 * @param {number} n The number of columns in this dense matrix.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	static constant(x, m, n = 1) {
		return new DenseMatrix(Module.DenseMatrix.constant(m, n, x));
	}

	/**
	 * Initializes a m by n random matrix.
	 * @method module:LinearAlgebra.DenseMatrix.random
	 * @param {number} m The number of rows in this dense matrix.
	 * @param {number} n The number of columns in this dense matrix.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	static random(m, n = 1) {
		return new DenseMatrix(Module.DenseMatrix.random(m, n));
	}

	/**
	 * Returns the transpose of this dense matrix.
	 * @method module:LinearAlgebra.DenseMatrix#transpose
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	transpose() {
		return new DenseMatrix(this.data.transpose());
	}

	/**
	 * Returns the number of rows in this dense matrix.
	 * @method module:LinearAlgebra.DenseMatrix#nRows
	 * @returns {number}
	 */
	nRows() {
		return this.data.nRows();
	}

	/**
	 * Returns the number of columns in this dense matrix.
	 * @method module:LinearAlgebra.DenseMatrix#nCols
	 * @returns {number}
	 */
	nCols() {
		return this.data.nCols();
	}

	/**
	 * Computes the lInfinity, l1 or l2 norm of this dense matrix.
	 * @method module:LinearAlgebra.DenseMatrix#norm
	 * @param {number} n Computes the lInfinity norm if n = 0, l1 norm if n = 1
	 * and l2 norm if n = 2.
	 * @returns {number}
	 */
	norm(n = 2) {
		return this.data.norm(n);
	}

	/**
	 * Returns the rank of this dense matrix.
	 * @method module:LinearAlgebra.DenseMatrix#rank
	 * @returns {number}
	 */
	rank() {
		return this.data.rank();
	}

	/**
	 * Sums all the entries in this dense matrix.
	 * @method module:LinearAlgebra.DenseMatrix#sum
	 * @returns {number}
	 */
	sum() {
		return this.data.sum();
	}

	/**
	 * Extracts a sub-matrix in the range [r0, r1) x [c0, c1), i.e., a matrix
	 * of size (r1 - r0) x (c1 - c0) starting at indices (r0, c0).
	 * @method module:LinearAlgebra.DenseMatrix#subMatrix
	 * @param {number} r0 The start row index.
	 * @param {number} r1 The end row index (not included).
	 * @param {number} c0 The start column index.
	 * @param {number} c1 The end column index (not included).
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	subMatrix(r0, r1, c0 = 0, c1 = 1) {
		return new DenseMatrix(this.data.subMatrix(r0, r1, c0, c1));
	}

	/**
	 * A += B
	 * @method module:LinearAlgebra.DenseMatrix#incrementBy
	 * @param {module:LinearAlgebra.DenseMatrix} B The dense matrix added to this dense matrix.
	 */
	incrementBy(B) {
		this.data.incrementBy(B.data);
	}

	/**
	 * A -= B
	 * @method module:LinearAlgebra.DenseMatrix#decrementBy
	 * @param {module:LinearAlgebra.DenseMatrix} B The dense matrix subtracted from this dense matrix.
	 */
	decrementBy(B) {
		this.data.decrementBy(B.data);
	}

	/**
	 * A *= s
	 * @method module:LinearAlgebra.DenseMatrix#scaleBy
	 * @param {number} s The number this dense matrix is scaled by.
	 */
	scaleBy(s) {
		this.data.scaleBy(s);
	}

	/**
	 * Returns A + B
	 * @method module:LinearAlgebra.DenseMatrix#plus
	 * @param {module:LinearAlgebra.DenseMatrix} B The dense matrix added to this dense matrix.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	plus(B) {
		return new DenseMatrix(this.data.plus(B.data));
	}

	/**
	 * Returns A - B
	 * @method module:LinearAlgebra.DenseMatrix#minus
	 * @param {module:LinearAlgebra.DenseMatrix} B The dense matrix subtracted from this dense matrix.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	minus(B) {
		return new DenseMatrix(this.data.minus(B.data));
	}

	/**
	 * Returns A * s
	 * @method module:LinearAlgebra.DenseMatrix#timesReal
	 * @param {number} s The number this dense matrix is multiplied by.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	timesReal(s) {
		return new DenseMatrix(this.data.timesReal(s));
	}

	/**
	 * Returns A * B
	 * @method module:LinearAlgebra.DenseMatrix#timesDense
	 * @param {module:LinearAlgebra.DenseMatrix} B The dense matrix this dense matrix is multiplied by.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
	timesDense(B) {
		return new DenseMatrix(this.data.timesDense(B.data));
    }

    /**
     * Returns A .* B (the coef. product)
	 * @method module:LinearAlgebra.DenseMatrix#timesCWise
	 * @param {module:LinearAlgebra.DenseMatrix} B The dense matrix this dense matrix is coef. multiplied by.
	 * @returns {module:LinearAlgebra.DenseMatrix}
     */
    timesCWise(B) {
        return new DenseMatrix(this.data.timesCWise(B.data));
    }

    /**
     * Returns A ./ B (the coef. quotient)
     * @method module:LinearAlgebra.DenseMatrix#timesCWise
     * @param {module:LinearAlgebra.DenseMatrix} B The dense matrix this dense matrix is coef. quotient by.
     * @returns {module:LinearAlgebra.DenseMatrix}
     */
    overCWise(B) {
        return new DenseMatrix(this.data.overCWise(B.data));
    }

    /**
    * Returns an expression of the Schur product (coefficient wise product) of *this and other
    * @method module:LinearAlgebra.DenseMatrix#absCWise
    * @returns {module:LinearAlgebra.DenseMatrix}
    */
    absCWise() {
        return new DenseMatrix(this.data.absCWise());
    }

    /**

    * Returns an expression of the coefficient-wise squared absolute value of the matrix
    * @method module:LinearAlgebra.DenseMatrix#abs2CWise
    * @returns {module:LinearAlgebra.DenseMatrix}
    */
    abs2CWise() {
        return new DenseMatrix(this.data.abs2CWise());
    }

	/**
	 * Returns -A
	 * @method module:LinearAlgebra.DenseMatrix#negated
	 * @return {module:LinearAlgebra.DenseMatrix}
	 */
	negated() {
		return new DenseMatrix(this.data.negated());
    }

    /**
     * sqr(A)
     * Returns matrix with of the coefficient-wise square roots.
     * @method module:LinearAlgebra.DenseMatrix#sqrtCWise
     * @return {module:LinearAlgebra.DenseMatrix}
     */
    sqrtCWise() {
        return new DenseMatrix(this.data.sqrtCWise());
    }

    /**
     * det(A)
     * Returns the determinant of this matrix.
     * @method module:LinearAlgebra.DenseMatrix#det
     * @return {module:LinearAlgebra.DenseMatrix}
     */
    det() {
        return this.data.det();
    }

    /**
     * Returns matrix with inversed coeffs.
     * @method module:LinearAlgebra.DenseMatrix#inverseCWise
     * @return {module:LinearAlgebra.DenseMatrix}
     */
    inverseCWise() {
        return new DenseMatrix(this.data.inverseCWise());
    }

    /**
     * Returns the Min value of the matrix
     * @method module:LinearAlgebra.DenseMatrix#minCoeff
     * @return {number}
     */
    minCoeff() {
        return this.data.minCoeff();
    }

    /**
     * Returns the Max value of the matrix
     * @method module:LinearAlgebra.DenseMatrix#maxCoeff
     * @return {number}
     */
    maxCoeff() {
        return this.data.maxCoeff();
    }

	/**
	 * Returns A(i, j)
	 * @method module:LinearAlgebra.DenseMatrix#get
	 * @param {number} i The ith row of this dense matrix.
	 * @param {number} j The jth column of this dense matrix.
	 * @return {number}
	 */
	get(i, j = 0) {
		return this.data.get(i, j);
	}

	/**
	 * A(i, j) = x
	 * @method module:LinearAlgebra.DenseMatrix#set
	 * @param {number} x The real value the (i, j)th entry of this dense matrix is set to.
	 * @param {number} i The ith row of this dense matrix.
	 * @param {number} j The jth column of this dense matrix.
	 */
	set(x, i, j = 0) {
		this.data.set(i, j, x);
	}

	/**
	 * Concatenates two dense matrices horizontally.
	 * @method module:LinearAlgebra.DenseMatrix#hcat
	 * @param {module:LinearAlgebra.DenseMatrix} B The dense matrix that is concatenated horizontally
	 * with this dense matrix.
	 * @return {module:LinearAlgebra.DenseMatrix}
	 */
	hcat(B) {
		return new DenseMatrix(this.data.hcat(B.data));
	}

	/**
	 * Concatenates two dense matrices vertically.
	 * @method module:LinearAlgebra.DenseMatrix#vcat
	 * @param {module:LinearAlgebra.DenseMatrix} B The dense matrix that is concatenated vertically
	 * with this dense matrix.
	 * @return {module:LinearAlgebra.DenseMatrix}
	 */
	vcat(B) {
		return new DenseMatrix(this.data.vcat(B.data));
    }

    /**
    * Returns a sparse {@link module:LinearAlgebra.Cholesky Cholesky} factorization of this sparse matrix.
    * @method module:LinearAlgebra.SparseMatrix#chol
    * @returns {module:LinearAlgebra.Cholesky}
    */
    chol() {
        return new DenseCholesky(this.data.chol());
    }
}
class DenseCholesky {
	/**
	 * This class represents a Choleksy LL^T factorization of a square positive definite
	 * {@link module:LinearAlgebra.SparseMatrix SparseMatrix}. The factorization is computed on the first call to solvePositiveDefinite,
	 * and is reused in subsequent calls to solvePositiveDefinite (e.g. when only the
	 * right hand side b of the linear system Ax = b changes) unless the sparse matrix
	 * itself is altered through operations such as *=, += and -=. Do not use the constructor
	 * to initialize this class, instead access the Choleksy factorization of a sparse
	 * matrix directly from the matrix itself.
	 * @constructor module:LinearAlgebra.Cholesky
	 * @example
	 * // solve the linear system Ax = b, where A is a square positive definite sparse matrix
	 * let A = DenseMatrix.identity(5, 5);
	 * let b = DenseMatrix.ones(5, 1);
	 *
	 * let llt = A.chol();
	 * let x = llt.solvePositiveDefinite(b);
	 *
	 * b.scaleBy(5);
	 * x = llt.solvePositiveDefinite(b); // factorization is reused
	 */
    constructor(data) {
        this.data = data;
    }

	/**
	 * Solves the linear system Ax = b, where A is a square positive definite sparse matrix.
	 * @method module:LinearAlgebra.Cholesky#solvePositiveDefinite
	 * @param {module:LinearAlgebra.DenseMatrix} b The dense right hand side of the linear system Ax = b.
	 * @returns {module:LinearAlgebra.DenseMatrix}
	 */
    solvePositiveDefinite(b) {
        return new DenseMatrix(this.data.solvePositiveDefinite(b.data));
    }
}
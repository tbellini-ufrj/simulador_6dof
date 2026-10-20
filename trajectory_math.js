(function (root, factory) {
    const api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    root.TrajectoryMath = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    function assertFinite(value, name) {
        if (!Number.isFinite(value)) {
            throw new TypeError(`${name} deve ser um numero finito.`);
        }
    }

    function calculateCubicCoefficients(q0, qf, v0, vf, duration) {
        assertFinite(q0, "q0");
        assertFinite(qf, "qf");
        assertFinite(v0, "v0");
        assertFinite(vf, "vf");
        assertFinite(duration, "duration");

        if (duration <= 0) {
            throw new RangeError("A duracao do trecho deve ser maior que zero.");
        }

        const displacement = qf - q0;
        const durationSquared = duration * duration;
        const durationCubed = durationSquared * duration;

        return {
            a0: q0,
            a1: v0,
            a2: (3 * displacement - (2 * v0 + vf) * duration) / durationSquared,
            a3: (-2 * displacement + (v0 + vf) * duration) / durationCubed
        };
    }

    function evaluateCubic(coefficients, time) {
        const { a0, a1, a2, a3 } = coefficients;
        [a0, a1, a2, a3].forEach((value, index) => assertFinite(value, `a${index}`));
        assertFinite(time, "time");

        const timeSquared = time * time;
        return {
            position: a0 + a1 * time + a2 * timeSquared + a3 * timeSquared * time,
            velocity: a1 + 2 * a2 * time + 3 * a3 * timeSquared,
            acceleration: 2 * a2 + 6 * a3 * time
        };
    }

    function suggestIntermediateVelocity(qPrevious, qCurrent, qNext, durationPrevious, durationNext) {
        assertFinite(qPrevious, "qPrevious");
        assertFinite(qCurrent, "qCurrent");
        assertFinite(qNext, "qNext");
        assertFinite(durationPrevious, "durationPrevious");
        assertFinite(durationNext, "durationNext");

        if (durationPrevious <= 0 || durationNext <= 0) {
            throw new RangeError("As duracoes vizinhas devem ser maiores que zero.");
        }

        const previousSlope = (qCurrent - qPrevious) / durationPrevious;
        const nextSlope = (qNext - qCurrent) / durationNext;

        if (previousSlope * nextSlope <= 0) {
            return 0;
        }

        return (
            durationNext * previousSlope + durationPrevious * nextSlope
        ) / (durationPrevious + durationNext);
    }

    return {
        calculateCubicCoefficients,
        evaluateCubic,
        suggestIntermediateVelocity
    };
});

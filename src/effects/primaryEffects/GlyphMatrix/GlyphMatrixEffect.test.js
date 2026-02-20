function computeHeadPos(cascadeProgress, cascadeSpeedFactor, cascadeOffset, rowCount, trailLength) {
    return ((cascadeProgress * cascadeSpeedFactor + cascadeOffset) % 1) * (rowCount + trailLength);
}

describe('GlyphMatrix loop continuity', () => {
    const numberOfFrames = 120;
    const cascadeSpeed = 2;
    const rowCount = 20;
    const trailLength = 6;

    it('should produce identical head positions at frame 0 and wrap-around with integer cascadeSpeedFactor', () => {
        const cascadeOffset = 0.37;
        const cascadeSpeedFactor = 1.0;

        const progressFrame0 = 0 / numberOfFrames;
        const cascadeFrame0 = progressFrame0 * cascadeSpeed;
        const headFrame0 = computeHeadPos(cascadeFrame0, cascadeSpeedFactor, cascadeOffset, rowCount, trailLength);

        const progressFrameN = numberOfFrames / numberOfFrames;
        const cascadeFrameN = progressFrameN * cascadeSpeed;
        const headFrameN = computeHeadPos(cascadeFrameN, cascadeSpeedFactor, cascadeOffset, rowCount, trailLength);

        expect(Math.abs(headFrameN - headFrame0)).toBeLessThan(0.001);
    });

    it('should break loop continuity with non-integer cascadeSpeedFactor (demonstrates the bug)', () => {
        const cascadeOffset = 0.37;
        const cascadeSpeedFactor = 0.85;

        const progressFrame0 = 0 / numberOfFrames;
        const cascadeFrame0 = progressFrame0 * cascadeSpeed;
        const headFrame0 = computeHeadPos(cascadeFrame0, cascadeSpeedFactor, cascadeOffset, rowCount, trailLength);

        const progressFrameN = numberOfFrames / numberOfFrames;
        const cascadeFrameN = progressFrameN * cascadeSpeed;
        const headFrameN = computeHeadPos(cascadeFrameN, cascadeSpeedFactor, cascadeOffset, rowCount, trailLength);

        expect(Math.abs(headFrameN - headFrame0)).toBeGreaterThan(0.001);
    });

    it('should loop seamlessly when cascadeSpeedFactor is removed (fix applied)', () => {
        const testCases = [
            {cascadeOffset: 0.0, cascadeSpeed: 1},
            {cascadeOffset: 0.37, cascadeSpeed: 2},
            {cascadeOffset: 0.99, cascadeSpeed: 3},
            {cascadeOffset: 0.5, cascadeSpeed: 1},
        ];

        for (const tc of testCases) {
            const progressFrame0 = 0 / numberOfFrames;
            const cascadeFrame0 = progressFrame0 * tc.cascadeSpeed;
            const headFrame0 = computeHeadPos(cascadeFrame0, 1.0, tc.cascadeOffset, rowCount, trailLength);

            const progressFrameN = numberOfFrames / numberOfFrames;
            const cascadeFrameN = progressFrameN * tc.cascadeSpeed;
            const headFrameN = computeHeadPos(cascadeFrameN, 1.0, tc.cascadeOffset, rowCount, trailLength);

            expect(Math.abs(headFrameN - headFrame0)).toBeLessThan(0.001);
        }
    });

    it('should have smooth inter-frame transitions (no jumps larger than expected)', () => {
        const cascadeOffset = 0.37;

        let maxDelta = 0;
        for (let f = 1; f < numberOfFrames; f++) {
            const prevProgress = ((f - 1) % numberOfFrames) / numberOfFrames;
            const curProgress = (f % numberOfFrames) / numberOfFrames;
            const prevHead = computeHeadPos(prevProgress * cascadeSpeed, 1.0, cascadeOffset, rowCount, trailLength);
            const curHead = computeHeadPos(curProgress * cascadeSpeed, 1.0, cascadeOffset, rowCount, trailLength);
            const delta = Math.abs(curHead - prevHead);
            maxDelta = Math.max(maxDelta, delta);
        }

        const lastProgress = ((numberOfFrames - 1) % numberOfFrames) / numberOfFrames;
        const wrapProgress = 0 / numberOfFrames;
        const lastHead = computeHeadPos(lastProgress * cascadeSpeed, 1.0, cascadeOffset, rowCount, trailLength);
        const wrapHead = computeHeadPos(wrapProgress * cascadeSpeed, 1.0, cascadeOffset, rowCount, trailLength);
        const wrapDelta = Math.abs(lastHead - wrapHead);

        expect(wrapDelta).toBeLessThanOrEqual(maxDelta + 0.001);
    });
});

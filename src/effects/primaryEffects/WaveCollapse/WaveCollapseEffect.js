import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';

import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {WaveCollapseConfig} from './WaveCollapseConfig.js';

export class WaveCollapseEffect extends LayerEffect {
    static _name_ = 'wave-collapse';
    static _displayName_ = 'Wave Collapse';
    static _description_ = 'Wave function collapse tileset visualization with cascading probability resolution and fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'wave', 'collapse', 'tileset', 'procedural', 'animated'];

    constructor({
                    name = WaveCollapseEffect._name_,
                    requiresLayer = true,
                    config = new WaveCollapseConfig({}),
                    additionalEffects = [],
                    ignoreAdditionalEffects = false,
                    settings = new Settings({}),
                } = {}) {
        super({name, requiresLayer, config, additionalEffects, ignoreAdditionalEffects, settings});
        this.#generate(settings);
    }

    #generateTilePattern(patternIndex) {
        const edges = [];
        for (let e = 0; e < 4; e++) {
            edges.push(getRandomIntInclusive(0, 2));
        }

        const innerLines = [];
        const lineCount = getRandomIntInclusive(1, 4);
        for (let l = 0; l < lineCount; l++) {
            const fromEdge = getRandomIntInclusive(0, 3);
            let toEdge = (fromEdge + getRandomIntInclusive(1, 3)) % 4;
            const fromT = randomNumber(0.2, 0.8);
            const toT = randomNumber(0.2, 0.8);
            innerLines.push({fromEdge, toEdge, fromT, toT});
        }

        const hasDot = randomNumber(0, 1) > 0.6;
        const dotPos = {x: randomNumber(0.3, 0.7), y: randomNumber(0.3, 0.7)};
        const dotRadius = randomNumber(0.05, 0.12);

        return {edges, innerLines, hasDot, dotPos, dotRadius, patternIndex};
    }

    #getEdgePoint(edge, t, cellX, cellY, cellSize) {
        switch (edge) {
            case 0: return {x: cellX + t * cellSize, y: cellY};
            case 1: return {x: cellX + cellSize, y: cellY + t * cellSize};
            case 2: return {x: cellX + (1 - t) * cellSize, y: cellY + cellSize};
            case 3: return {x: cellX, y: cellY + (1 - t) * cellSize};
            default: return {x: cellX, y: cellY};
        }
    }

    #generate(settings) {
        const width = this.finalSize?.width || 1080;
        const height = this.finalSize?.height || 1920;

        const gridSize = getRandomIntInclusive(this.config.gridSize.lower(this.finalSize), this.config.gridSize.upper(this.finalSize));
        const cellCount = getRandomIntInclusive(this.config.cellCount.lower, this.config.cellCount.upper);
        const tilePatternCount = getRandomIntInclusive(this.config.tilePatterns.lower, this.config.tilePatterns.upper);

        const patterns = [];
        for (let p = 0; p < tilePatternCount; p++) {
            patterns.push(this.#generateTilePattern(p));
        }

        const cells = [];
        for (let row = 0; row < cellCount; row++) {
            for (let col = 0; col < cellCount; col++) {
                const patternIdx = getRandomIntInclusive(0, tilePatternCount - 1);
                const collapseOrder = randomNumber(0, 1);
                cells.push({
                    row,
                    col,
                    patternIdx,
                    collapseOrder,
                    rotation: getRandomIntInclusive(0, 3) * 90,
                    rotationSpeed: getRandomIntInclusive(-1, 1),
                    scalePhase: randomNumber(0, Math.PI * 2),
                    jitterPhaseX: randomNumber(0, Math.PI * 2),
                    jitterPhaseY: randomNumber(0, Math.PI * 2),
                    jitterAmp: randomNumber(1, 5),
                });
            }
        }

        cells.sort((a, b) => a.collapseOrder - b.collapseOrder);

        this.data = {
            width,
            height,
            center: this.config.center,
            invertLayers: this.config.invertLayers,
            layerOpacity: this.config.layerOpacity,
            underLayerOpacity: this.config.underLayerOpacity,
            stroke: this.config.stroke,
            thickness: this.config.thickness,
            innerColor: this.config.innerColor.getColor(settings),
            outerColor: this.config.outerColor.getColor(settings),
            gridSize,
            cellCount,
            patterns,
            cells,
            collapseSpeed: getRandomIntInclusive(this.config.collapseSpeed.lower, this.config.collapseSpeed.upper),
            waveFrequency: getRandomIntInclusive(this.config.waveFrequency.lower, this.config.waveFrequency.upper),
            accentRange: {
                lower: getRandomIntInclusive(this.config.accentRange.bottom.lower, this.config.accentRange.bottom.upper),
                upper: getRandomIntInclusive(this.config.accentRange.top.lower, this.config.accentRange.top.upper),
            },
            blurRange: {
                lower: getRandomIntInclusive(this.config.blurRange.bottom.lower, this.config.blurRange.bottom.upper),
                upper: getRandomIntInclusive(this.config.blurRange.top.lower, this.config.blurRange.top.upper),
            },
            featherTimes: getRandomIntInclusive(this.config.featherTimes.lower, this.config.featherTimes.upper),
        };
    }

    async #drawCollapseLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const lineWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;

        const progress = (currentFrame % numberOfFrames) / numberOfFrames;
        const collapseProgress = (progress * this.data.collapseSpeed) % 1;
        const wavePulse = findValue(0.8, 1.2, this.data.waveFrequency, numberOfFrames, currentFrame);

        const cellSize = (this.data.gridSize * wavePulse) / this.data.cellCount;
        const gridOriginX = centerPos.x - (this.data.gridSize * wavePulse) / 2;
        const gridOriginY = centerPos.y - (this.data.gridSize * wavePulse) / 2;

        for (let i = 0; i < this.data.cells.length; i++) {
            const cell = this.data.cells[i];
            const collapseWave = (collapseProgress * this.data.cells.length) % this.data.cells.length;
            const distFromWave = Math.abs(i - collapseWave) / this.data.cells.length;
            const collapsed = distFromWave < 0.5;

            const cellRotation = progress * cell.rotationSpeed * 360;
            const cellScale = 0.8 + 0.3 * Math.sin(cell.scalePhase + progress * Math.PI * 2 * 2) + 0.15 * Math.sin(cell.scalePhase * 1.5 + progress * Math.PI * 2 * 4);
            const scaledCellSize = cellSize * cellScale;
            const jitterX = cell.jitterAmp * Math.sin(cell.jitterPhaseX + progress * Math.PI * 2 * 3);
            const jitterY = cell.jitterAmp * Math.sin(cell.jitterPhaseY + progress * Math.PI * 2 * 3);
            const cellCenterX = gridOriginX + cell.col * cellSize + cellSize / 2 + jitterX;
            const cellCenterY = gridOriginY + cell.row * cellSize + cellSize / 2 + jitterY;
            const cellX = cellCenterX - scaledCellSize / 2;
            const cellY = cellCenterY - scaledCellSize / 2;

            if (collapsed) {
                const pattern = this.data.patterns[cell.patternIdx];
                const glow = isUnderlay ? theAccentGaston * 0.25 : 0;
                const rotRad = cellRotation * Math.PI / 180;
                const cosR = Math.cos(rotRad);
                const sinR = Math.sin(rotRad);

                for (const line of pattern.innerLines) {
                    const from = this.#getEdgePoint(line.fromEdge, line.fromT, cellX, cellY, scaledCellSize);
                    const to = this.#getEdgePoint(line.toEdge, line.toT, cellX, cellY, scaledCellSize);
                    const rfx = cosR * (from.x - cellCenterX) - sinR * (from.y - cellCenterY) + cellCenterX;
                    const rfy = sinR * (from.x - cellCenterX) + cosR * (from.y - cellCenterY) + cellCenterY;
                    const rtx = cosR * (to.x - cellCenterX) - sinR * (to.y - cellCenterY) + cellCenterX;
                    const rty = sinR * (to.x - cellCenterX) + cosR * (to.y - cellCenterY) + cellCenterY;
                    await canvas.drawLine2d({x: rfx, y: rfy}, {x: rtx, y: rty}, lineWidth, color, glow, color);
                }

                if (pattern.hasDot) {
                    const dotCenter = {
                        x: cellX + pattern.dotPos.x * scaledCellSize,
                        y: cellY + pattern.dotPos.y * scaledCellSize,
                    };
                    const rdx = cosR * (dotCenter.x - cellCenterX) - sinR * (dotCenter.y - cellCenterY) + cellCenterX;
                    const rdy = sinR * (dotCenter.x - cellCenterX) + cosR * (dotCenter.y - cellCenterY) + cellCenterY;
                    const dotR = pattern.dotRadius * scaledCellSize;
                    await canvas.drawRing2d({x: rdx, y: rdy}, dotR, lineWidth * 0.5, color, glow, color);
                }
            } else {
                const cornerTL = {x: cellX, y: cellY};
                const cornerTR = {x: cellX + scaledCellSize, y: cellY};
                const cornerBR = {x: cellX + scaledCellSize, y: cellY + scaledCellSize};
                const cornerBL = {x: cellX, y: cellY + scaledCellSize};

                const thinLine = lineWidth * 0.3;
                const dimGlow = isUnderlay ? theAccentGaston * 0.1 : 0;

                await canvas.drawLine2d(cornerTL, cornerTR, thinLine, color, dimGlow, color);
                await canvas.drawLine2d(cornerTR, cornerBR, thinLine, color, dimGlow, color);
                await canvas.drawLine2d(cornerBR, cornerBL, thinLine, color, dimGlow, color);
                await canvas.drawLine2d(cornerBL, cornerTL, thinLine, color, dimGlow, color);

                const diagGlow = isUnderlay ? theAccentGaston * 0.05 : 0;
                await canvas.drawLine2d(cornerTL, cornerBR, thinLine * 0.5, color, diagGlow, color);
                await canvas.drawLine2d(cornerTR, cornerBL, thinLine * 0.5, color, diagGlow, color);
            }

            await canvas.drawLine2d(
                {x: cellX, y: cellY},
                {x: cellX + scaledCellSize, y: cellY},
                lineWidth * 0.4,
                color,
                0,
                color
            );
            await canvas.drawLine2d(
                {x: cellX, y: cellY},
                {x: cellX, y: cellY + scaledCellSize},
                lineWidth * 0.4,
                color,
                0,
                color
            );
        }
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawCollapseLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawCollapseLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

        const topLayer = await topCanvas.convertToLayer();
        const bottomLayer = await bottomCanvas.convertToLayer();

        await bottomLayer.blur(theBlurGaston);
        await bottomLayer.adjustLayerOpacity(this.data.underLayerOpacity);
        await topLayer.adjustLayerOpacity(this.data.layerOpacity);

        if (!this.data.invertLayers) {
            await layer.compositeLayerOver(bottomLayer);
            await layer.compositeLayerOver(topLayer);
        } else {
            await layer.compositeLayerOver(topLayer);
            await layer.compositeLayerOver(bottomLayer);
        }

        await super.invoke(layer, currentFrame, numberOfFrames);
    }

    getInfo() {
        return `${WaveCollapseEffect._displayName_}: cells=${this.data.cellCount}x${this.data.cellCount}, patterns=${this.data.patterns.length}`;
    }
}

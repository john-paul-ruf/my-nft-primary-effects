import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';
import {findOneWayValue} from 'my-nft-gen/src/core/math/findOneWayValue.js';
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

        const collapseProgress = findOneWayValue(0, this.data.collapseSpeed, 1, numberOfFrames, currentFrame, false) % 1;
        const wavePulse = findValue(0.97, 1.03, this.data.waveFrequency, numberOfFrames, currentFrame);

        const cellSize = (this.data.gridSize * wavePulse) / this.data.cellCount;
        const gridOriginX = centerPos.x - (this.data.gridSize * wavePulse) / 2;
        const gridOriginY = centerPos.y - (this.data.gridSize * wavePulse) / 2;

        for (let i = 0; i < this.data.cells.length; i++) {
            const cell = this.data.cells[i];
            const cellProgress = (i / this.data.cells.length);
            const collapseWave = (collapseProgress * this.data.cells.length) % this.data.cells.length;
            const distFromWave = Math.abs(i - collapseWave) / this.data.cells.length;
            const collapsed = distFromWave < 0.5;

            const cellX = gridOriginX + cell.col * cellSize;
            const cellY = gridOriginY + cell.row * cellSize;

            if (collapsed) {
                const pattern = this.data.patterns[cell.patternIdx];
                const glow = isUnderlay ? theAccentGaston * 0.25 : 0;

                for (const line of pattern.innerLines) {
                    const from = this.#getEdgePoint(line.fromEdge, line.fromT, cellX, cellY, cellSize);
                    const to = this.#getEdgePoint(line.toEdge, line.toT, cellX, cellY, cellSize);
                    await canvas.drawLine2d(from, to, lineWidth, color, glow, color);
                }

                if (pattern.hasDot) {
                    const dotCenter = {
                        x: cellX + pattern.dotPos.x * cellSize,
                        y: cellY + pattern.dotPos.y * cellSize,
                    };
                    const dotR = pattern.dotRadius * cellSize;
                    await canvas.drawEllipse2d(dotCenter, dotR, dotR, 0, lineWidth * 0.5, color, glow, color);
                }
            } else {
                const cornerTL = {x: cellX, y: cellY};
                const cornerTR = {x: cellX + cellSize, y: cellY};
                const cornerBR = {x: cellX + cellSize, y: cellY + cellSize};
                const cornerBL = {x: cellX, y: cellY + cellSize};

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
                {x: cellX + cellSize, y: cellY},
                lineWidth * 0.4,
                color,
                0,
                color
            );
            await canvas.drawLine2d(
                {x: cellX, y: cellY},
                {x: cellX, y: cellY + cellSize},
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

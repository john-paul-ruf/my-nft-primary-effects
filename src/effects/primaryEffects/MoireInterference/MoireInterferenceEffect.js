import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';

import {findPointByAngleAndCircle} from 'my-nft-gen/src/core/math/drawingMath.js';
import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {MoireInterferenceConfig} from './MoireInterferenceConfig.js';

export class MoireInterferenceEffect extends LayerEffect {
    static _name_ = 'moire-interference';
    static _displayName_ = 'Moiré Interference';
    static _description_ = 'Overlapping rotated line grids creating moiré interference patterns with phase animation and fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'moire', 'interference', 'grid', 'lines', 'animated'];

    constructor({
                    name = MoireInterferenceEffect._name_,
                    requiresLayer = true,
                    config = new MoireInterferenceConfig({}),
                    additionalEffects = [],
                    ignoreAdditionalEffects = false,
                    settings = new Settings({}),
                } = {}) {
        super({name, requiresLayer, config, additionalEffects, ignoreAdditionalEffects, settings});
        this.#generate(settings);
    }

    #generate(settings) {
        const width = this.finalSize?.width || 1080;
        const height = this.finalSize?.height || 1920;

        const numberOfGrids = getRandomIntInclusive(this.config.numberOfGrids.lower, this.config.numberOfGrids.upper);
        const lineSpacing = getRandomIntInclusive(this.config.lineSpacing.lower, this.config.lineSpacing.upper);
        const gridRadius = getRandomIntInclusive(this.config.gridRadius.lower(this.finalSize), this.config.gridRadius.upper(this.finalSize));
        const rotationRange = getRandomIntInclusive(this.config.rotationRange.lower, this.config.rotationRange.upper);

        const grids = [];
        for (let i = 0; i < numberOfGrids; i++) {
            const baseAngle = (180 / numberOfGrids) * i;
            const numberOfLines = Math.floor((gridRadius * 2) / lineSpacing);

            grids.push({
                baseAngle,
                numberOfLines,
                phaseOffset: randomNumber(0, Math.PI * 2),
                rotationDirection: Math.random() > 0.5 ? 1 : -1,
            });
        }

        const useConcentricMode = this.config.concentricMode || Math.random() > 0.6;
        const concentricRingCount = useConcentricMode
            ? getRandomIntInclusive(this.config.concentricRingCount.lower, this.config.concentricRingCount.upper)
            : 0;

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
            grids,
            gridRadius,
            lineSpacing,
            rotationRange,
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
            useConcentricMode,
            concentricRingCount,
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

    async #drawGrid(canvas, grid, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const progress = (currentFrame % numberOfFrames) / numberOfFrames;
        const rotOffset = progress * this.data.speed * this.data.rotationRange * grid.rotationDirection;
        const angle = grid.baseAngle + rotOffset;
        const angleRad = angle * Math.PI / 180;

        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const lineWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;

        const cosA = Math.cos(angleRad);
        const sinA = Math.sin(angleRad);
        const perpCos = Math.cos(angleRad + Math.PI / 2);
        const perpSin = Math.sin(angleRad + Math.PI / 2);

        for (let i = -grid.numberOfLines; i <= grid.numberOfLines; i++) {
            const offset = i * this.data.lineSpacing;
            const lineCenterX = centerPos.x + perpCos * offset;
            const lineCenterY = centerPos.y + perpSin * offset;

            const startX = lineCenterX - cosA * this.data.gridRadius;
            const startY = lineCenterY - sinA * this.data.gridRadius;
            const endX = lineCenterX + cosA * this.data.gridRadius;
            const endY = lineCenterY + sinA * this.data.gridRadius;

            await canvas.drawLine2d(
                {x: startX, y: startY},
                {x: endX, y: endY},
                lineWidth,
                color,
                isUnderlay ? theAccentGaston * 0.3 : 0,
                color
            );
        }
    }

    async #drawConcentricRings(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const lineWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;
        const breathe = findValue(0.95, 1.05, this.data.speed, numberOfFrames, currentFrame);

        for (let r = 1; r <= this.data.concentricRingCount; r++) {
            const radius = (this.data.gridRadius / this.data.concentricRingCount) * r * breathe;
            await canvas.drawRing2d(
                centerPos,
                radius,
                lineWidth,
                color,
                isUnderlay ? theAccentGaston * 0.3 : 0,
                color
            );
        }
    }

    async #drawMoireLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        for (const grid of this.data.grids) {
            await this.#drawGrid(canvas, grid, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston);
        }

        if (this.data.useConcentricMode) {
            await this.#drawConcentricRings(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston);
        }
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawMoireLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawMoireLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${MoireInterferenceEffect._displayName_}: grids=${this.data.grids.length}, concentric=${this.data.useConcentricMode}`;
    }
}

import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';

import {findPointByAngleAndCircle} from 'my-nft-gen/src/core/math/drawingMath.js';
import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {GravityWellConfig} from './GravityWellConfig.js';

export class GravityWellEffect extends LayerEffect {
    static _name_ = 'gravity-well';
    static _displayName_ = 'Gravity Well';
    static _description_ = 'Spacetime curvature visualization with grid distortion around orbiting mass points and fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'gravity', 'spacetime', 'distortion', 'grid', 'animated'];

    constructor({
                    name = GravityWellEffect._name_,
                    requiresLayer = true,
                    config = new GravityWellConfig({}),
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

        const fieldRadius = getRandomIntInclusive(this.config.fieldRadius.lower(this.finalSize), this.config.fieldRadius.upper(this.finalSize));
        const gridLines = getRandomIntInclusive(this.config.gridLines.lower, this.config.gridLines.upper);
        const wellCount = getRandomIntInclusive(this.config.wellCount.lower, this.config.wellCount.upper);

        const wells = [];
        for (let i = 0; i < wellCount; i++) {
            wells.push({
                angle: (360 / wellCount) * i + randomNumber(-20, 20),
                orbitRadius: randomNumber(this.config.wellOrbitRadius.lower, this.config.wellOrbitRadius.upper),
                strength: randomNumber(this.config.wellStrength.lower, this.config.wellStrength.upper),
                orbitSpeed: getRandomIntInclusive(1, 3),
                phaseOffset: randomNumber(0, 360),
                strengthPhase: randomNumber(0, Math.PI * 2),
                strengthFreq: getRandomIntInclusive(1, 3),
            });
        }

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
            fieldRadius,
            gridLines,
            wells,
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
            pulseFrequency: getRandomIntInclusive(this.config.pulseFrequency.lower, this.config.pulseFrequency.upper),
            showConcentricRings: this.config.showConcentricRings,
            concentricRingCount: getRandomIntInclusive(this.config.concentricRingCount.lower, this.config.concentricRingCount.upper),
            showEventHorizon: this.config.showEventHorizon,
            wellPolarity: this.config.wellPolarity,
            gridPointsPerLine: gridLines * 2,
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

    #getWellPositions(centerPos, currentFrame, numberOfFrames) {
        const progress = numberOfFrames <= 1 ? 0 : currentFrame / (numberOfFrames - 1);
        const rotOffset = progress * this.data.speed * 360;
        const pulse = findValue(0.8, 1.2, this.data.pulseFrequency, numberOfFrames, currentFrame);

        return this.data.wells.map((well, idx) => {
            const angle = well.angle + rotOffset * well.orbitSpeed + well.phaseOffset;
            const strengthMod = 0.6 + 0.5 * Math.sin(well.strengthPhase + progress * Math.PI * 2 * well.strengthFreq) + 0.3 * Math.sin(well.strengthPhase * 1.5 + progress * Math.PI * 2 * well.strengthFreq * 2);
            const pos = findPointByAngleAndCircle(centerPos, angle, well.orbitRadius * pulse);
            let polarity = 1;
            if (this.data.wellPolarity === 'repel') polarity = -1;
            else if (this.data.wellPolarity === 'mixed') polarity = idx % 2 === 0 ? 1 : -1;
            return {...pos, strength: well.strength * pulse * strengthMod, polarity};
        });
    }

    #distortPoint(px, py, wellPositions) {
        let dx = 0;
        let dy = 0;
        for (const well of wellPositions) {
            const distX = px - well.x;
            const distY = py - well.y;
            const dist = Math.sqrt(distX * distX + distY * distY) + 1;
            const force = well.strength / dist;
            const polarity = well.polarity || 1;
            dx -= (distX / dist) * force * polarity;
            dy -= (distY / dist) * force * polarity;
        }
        return {x: px + dx, y: py + dy};
    }

    async #drawGravityLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const lineWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;

        const wellPositions = this.#getWellPositions(centerPos, currentFrame, numberOfFrames);
        const r = this.data.fieldRadius;
        const lines = this.data.gridLines;
        const pts = this.data.gridPointsPerLine;

        const glow = isUnderlay ? theAccentGaston * 0.3 : 0;
        const progress = numberOfFrames <= 1 ? 0 : currentFrame / (numberOfFrames - 1);
        const gridRotAngle = Math.sin(progress * Math.PI * 2 * this.data.speed) * 15 * Math.PI / 180;
        const cosG = Math.cos(gridRotAngle);
        const sinG = Math.sin(gridRotAngle);

        for (let i = 0; i <= lines; i++) {
            const t = (i / lines) * 2 - 1;
            const lineThickMod = 0.5 + 0.7 * Math.sin(i * 0.8 + progress * Math.PI * 2 * 2);
            const lineW = lineWidth * lineThickMod;

            const hPoints = [];
            const vPoints = [];

            for (let j = 0; j <= pts; j++) {
                const s = (j / pts) * 2 - 1;

                const rawHx = s * r;
                const rawHy = t * r;
                const hx = centerPos.x + rawHx * cosG - rawHy * sinG;
                const hy = centerPos.y + rawHx * sinG + rawHy * cosG;
                hPoints.push(this.#distortPoint(hx, hy, wellPositions));

                const rawVx = t * r;
                const rawVy = s * r;
                const vx = centerPos.x + rawVx * cosG - rawVy * sinG;
                const vy = centerPos.y + rawVx * sinG + rawVy * cosG;
                vPoints.push(this.#distortPoint(vx, vy, wellPositions));
            }

            await canvas.drawSpline(hPoints, 0.5, lineW, color, glow, color, false);
            await canvas.drawSpline(vPoints, 0.5, lineW, color, glow, color, false);
        }

        if (this.data.showConcentricRings) {
            const ringSpacing = r / (this.data.concentricRingCount + 1);
            for (let ci = 1; ci <= this.data.concentricRingCount; ci++) {
                await canvas.drawDashedRing2d(centerPos, ringSpacing * ci, lineWidth * 0.5, color, [6, 4]);
            }
        }

        for (const well of wellPositions) {
            const dotSize = isUnderlay ? this.data.thickness * 3 + theAccentGaston : this.data.thickness * 3;
            await canvas.drawRing2d(well, dotSize, dotSize * 0.5, color, isUnderlay ? theAccentGaston : 0, color);

            if (this.data.showEventHorizon) {
                const horizonRadius = well.strength * 0.5;
                await canvas.drawRing2d(well, horizonRadius, lineWidth * 1.5, color, isUnderlay ? theAccentGaston * 0.5 : 0, color);
            }
        }
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawGravityLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawGravityLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${GravityWellEffect._displayName_}: wells=${this.data.wells.length}, grid=${this.data.gridLines}`;
    }
}

import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';
import {findOneWayValue} from 'my-nft-gen/src/core/math/findOneWayValue.js';
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
                orbitSpeed: randomNumber(0.5, 1.5),
                phaseOffset: randomNumber(0, 360),
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
        const rotOffset = findOneWayValue(0, this.data.speed * 360, 1, numberOfFrames, currentFrame, false);
        const pulse = findValue(0.9, 1.1, this.data.pulseFrequency, numberOfFrames, currentFrame);

        return this.data.wells.map(well => {
            const angle = well.angle + rotOffset * well.orbitSpeed + well.phaseOffset;
            const pos = findPointByAngleAndCircle(centerPos, angle, well.orbitRadius * pulse);
            return {...pos, strength: well.strength * pulse};
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
            dx -= (distX / dist) * force;
            dy -= (distY / dist) * force;
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

        for (let i = 0; i <= lines; i++) {
            const t = (i / lines) * 2 - 1;

            let prevH = null;
            let prevV = null;

            for (let j = 0; j <= pts; j++) {
                const s = (j / pts) * 2 - 1;

                const hx = centerPos.x + s * r;
                const hy = centerPos.y + t * r;
                const hDistorted = this.#distortPoint(hx, hy, wellPositions);

                if (prevH) {
                    await canvas.drawLine2d(prevH, hDistorted, lineWidth, color, isUnderlay ? theAccentGaston * 0.3 : 0, color);
                }
                prevH = hDistorted;

                const vx = centerPos.x + t * r;
                const vy = centerPos.y + s * r;
                const vDistorted = this.#distortPoint(vx, vy, wellPositions);

                if (prevV) {
                    await canvas.drawLine2d(prevV, vDistorted, lineWidth, color, isUnderlay ? theAccentGaston * 0.3 : 0, color);
                }
                prevV = vDistorted;
            }
        }

        for (const well of wellPositions) {
            const dotSize = isUnderlay ? this.data.thickness * 3 + theAccentGaston : this.data.thickness * 3;
            await canvas.drawRing2d(well, dotSize, dotSize * 0.5, color, isUnderlay ? theAccentGaston : 0, color);
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

import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';

import {findPointByAngleAndCircle} from 'my-nft-gen/src/core/math/drawingMath.js';
import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {RadiolariaSkeletonConfig} from './RadiolariaSkeletonConfig.js';

export class RadiolariaSkeletonEffect extends LayerEffect {
    static _name_ = 'radiolaria-skeleton';
    static _displayName_ = 'Radiolaria Skeleton';
    static _description_ = 'Radiolarian microscopic organism skeletal geometry with concentric shells, lattice, and spines with fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'radiolaria', 'skeleton', 'lattice', 'microscopic', 'animated'];

    constructor({
                    name = RadiolariaSkeletonEffect._name_,
                    requiresLayer = true,
                    config = new RadiolariaSkeletonConfig({}),
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

        const shellRadius = getRandomIntInclusive(this.config.shellRadius.lower(this.finalSize), this.config.shellRadius.upper(this.finalSize));
        const shellCount = getRandomIntInclusive(this.config.shellCount.lower, this.config.shellCount.upper);
        const spineCount = getRandomIntInclusive(this.config.spineCount.lower, this.config.spineCount.upper);
        const spineLength = getRandomIntInclusive(this.config.spineLength.lower, this.config.spineLength.upper);
        const latticeSegments = getRandomIntInclusive(this.config.latticeSegments.lower, this.config.latticeSegments.upper);
        const symmetryFold = getRandomIntInclusive(this.config.symmetryFold.lower, this.config.symmetryFold.upper);

        const shells = [];
        for (let s = 0; s < shellCount; s++) {
            const radiusFactor = (s + 1) / shellCount;
            const poreSides = getRandomIntInclusive(5, 8);
            shells.push({
                radiusFactor,
                poreSides,
                poreOffset: randomNumber(0, 360),
                wobblePhase: randomNumber(0, Math.PI * 2),
                wobbleAmp: randomNumber(0.05, 0.15),
                rotationDirection: s % 2 === 0 ? 1 : -1,
                rotationSpeedMult: 0.5 + randomNumber(0, 1),
            });
        }

        const spines = [];
        for (let i = 0; i < spineCount; i++) {
            const angle = (360 / spineCount) * i + randomNumber(-5, 5);
            spines.push({
                angle,
                lengthFactor: 0.7 + randomNumber(0, 0.6),
                thicknessFactor: 0.5 + randomNumber(0, 0.5),
                barbs: getRandomIntInclusive(0, 3),
                extensionPhase: randomNumber(0, Math.PI * 2),
                extensionFreq: randomNumber(1, 3),
                wobbleAnglePhase: randomNumber(0, Math.PI * 2),
                wobbleAngleAmp: randomNumber(3, 12),
                barbLengthPhase: randomNumber(0, Math.PI * 2),
                barbLengthFreq: randomNumber(1, 3),
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
            shellRadius,
            shells,
            spines,
            spineLength,
            latticeSegments,
            symmetryFold,
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
            breathFrequency: getRandomIntInclusive(this.config.breathFrequency.lower, this.config.breathFrequency.upper),
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

    async #drawRadiolariaLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const lineWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;
        const progress = (currentFrame % numberOfFrames) / numberOfFrames;
        const rotAngle = progress * this.data.speed * 360;
        const breathe = findValue(0.85, 1.15, this.data.breathFrequency, numberOfFrames, currentFrame);

        for (const shell of this.data.shells) {
            const r = this.data.shellRadius * shell.radiusFactor * breathe;
            const wobble = shell.wobbleAmp * Math.sin(shell.wobblePhase + progress * Math.PI * 2 * this.data.breathFrequency) + shell.wobbleAmp * 0.5 * Math.sin(shell.wobblePhase * 1.7 + progress * Math.PI * 2 * this.data.breathFrequency * 2.3);
            const shellR = r * (1 + wobble);
            const shellRotAngle = rotAngle * shell.rotationDirection * shell.rotationSpeedMult;

            await canvas.drawPolygon2d(
                shellR,
                centerPos,
                shell.poreSides * this.data.symmetryFold,
                shellRotAngle + shell.poreOffset,
                lineWidth,
                color,
                isUnderlay ? theAccentGaston * 0.3 : 0,
                color
            );

            for (let seg = 0; seg < this.data.latticeSegments; seg++) {
                const segAngle = (360 / this.data.latticeSegments) * seg + shellRotAngle;
                const latticeThickness = lineWidth * (0.4 + 0.4 * Math.sin(seg * 1.7 + progress * Math.PI * 2 * 2 + shell.wobblePhase));
                const inner = findPointByAngleAndCircle(centerPos, segAngle, shellR * 0.85);
                const outer = findPointByAngleAndCircle(centerPos, segAngle, shellR);
                await canvas.drawLine2d(inner, outer, latticeThickness, color, 0, color);
            }
        }

        for (let s = 1; s < this.data.shells.length; s++) {
            const innerR = this.data.shellRadius * this.data.shells[s - 1].radiusFactor * breathe;
            const outerR = this.data.shellRadius * this.data.shells[s].radiusFactor * breathe;

            for (let seg = 0; seg < this.data.symmetryFold; seg++) {
                const angle = (360 / this.data.symmetryFold) * seg + rotAngle;
                const innerPos = findPointByAngleAndCircle(centerPos, angle, innerR);
                const outerPos = findPointByAngleAndCircle(centerPos, angle, outerR);
                await canvas.drawLine2d(innerPos, outerPos, lineWidth * 0.7, color, isUnderlay ? theAccentGaston * 0.2 : 0, color);
            }
        }

        for (const spine of this.data.spines) {
            const wobbleAngle = spine.wobbleAngleAmp * Math.sin(spine.wobbleAnglePhase + progress * Math.PI * 2 * 2);
            const angle = spine.angle + rotAngle + wobbleAngle;
            const extension = 0.5 + 0.5 * Math.sin(spine.extensionPhase + progress * Math.PI * 2 * spine.extensionFreq);
            const basePos = findPointByAngleAndCircle(centerPos, angle, this.data.shellRadius * breathe);
            const tipPos = findPointByAngleAndCircle(centerPos, angle, this.data.shellRadius * breathe + this.data.spineLength * spine.lengthFactor * extension);
            const spineWidth = lineWidth * spine.thicknessFactor;

            await canvas.drawLine2d(basePos, tipPos, spineWidth, color, isUnderlay ? theAccentGaston * 0.3 : 0, color);

            for (let b = 0; b < spine.barbs; b++) {
                const t = 0.4 + (b / Math.max(spine.barbs, 1)) * 0.5;
                const barbBase = {
                    x: basePos.x + (tipPos.x - basePos.x) * t,
                    y: basePos.y + (tipPos.y - basePos.y) * t,
                };
                const barbLengthMod = 0.5 + 0.5 * Math.sin(spine.barbLengthPhase + progress * Math.PI * 2 * spine.barbLengthFreq + b * 1.5);
                const barbAngle = angle + (b % 2 === 0 ? 30 : -30);
                const barbTip = findPointByAngleAndCircle(barbBase, barbAngle, this.data.spineLength * 0.15 * barbLengthMod);
                await canvas.drawLine2d(barbBase, barbTip, spineWidth * 0.5, color, 0, color);
            }
        }
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawRadiolariaLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawRadiolariaLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${RadiolariaSkeletonEffect._displayName_}: shells=${this.data.shells.length}, spines=${this.data.spines.length}`;
    }
}

import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';

import {findPointByAngleAndCircle} from 'my-nft-gen/src/core/math/drawingMath.js';
import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {CelticKnotworkConfig} from './CelticKnotworkConfig.js';

export class CelticKnotworkEffect extends LayerEffect {
    static _name_ = 'celtic-knotwork';
    static _displayName_ = 'Celtic Knotwork';
    static _description_ = 'Interlaced Celtic knot patterns with over/under weaving and animated flow with fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'celtic', 'knot', 'weave', 'interlace', 'animated'];

    constructor({
                    name = CelticKnotworkEffect._name_,
                    requiresLayer = true,
                    config = new CelticKnotworkConfig({}),
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

        const knotRadius = getRandomIntInclusive(this.config.knotRadius.lower(this.finalSize), this.config.knotRadius.upper(this.finalSize));
        const lobeCount = getRandomIntInclusive(this.config.lobeCount.lower, this.config.lobeCount.upper);
        const bandCount = getRandomIntInclusive(this.config.bandCount.lower, this.config.bandCount.upper);
        const weaveGap = getRandomIntInclusive(this.config.weaveGap.lower, this.config.weaveGap.upper);
        const lobeDepth = getRandomIntInclusive(this.config.lobeDepth.lower, this.config.lobeDepth.upper);

        const pathSegments = [];
        const stepsPerLobe = 24;
        const totalSteps = lobeCount * stepsPerLobe;

        const lobeAnimData = [];
        for (let l = 0; l < lobeCount; l++) {
            lobeAnimData.push({
                depthPhase: randomNumber(0, Math.PI * 2),
                depthFreq: getRandomIntInclusive(1, 3),
            });
        }

        for (let step = 0; step < totalSteps; step++) {
            const t = step / totalSteps;
            const angle = t * 360;
            const lobePhase = (step % stepsPerLobe) / stepsPerLobe;
            const lobeWave = Math.sin(lobePhase * Math.PI * 2);
            const lobeIndex = Math.floor(step / stepsPerLobe);
            const r = knotRadius + lobeDepth * lobeWave;
            pathSegments.push({
                angle,
                radius: r,
                lobeWave,
                lobeIndex,
                phaseOffset: randomNumber(0, 0.1),
            });
        }

        const bands = [];
        for (let b = 0; b < bandCount; b++) {
            bands.push({
                offset: (b - (bandCount - 1) / 2) * weaveGap,
                phaseShift: randomNumber(0, Math.PI * 2),
                speedMult: getRandomIntInclusive(1, 2),
                gapPhase: randomNumber(0, Math.PI * 2),
                gapOscAmp: randomNumber(0.2, 0.6),
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
            knotRadius,
            lobeCount,
            bandCount,
            weaveGap,
            lobeDepth,
            pathSegments,
            bands,
            lobeAnimData,
            totalSteps,
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
            pulseFrequency: getRandomIntInclusive(this.config.pulseFrequency.lower, this.config.pulseFrequency.upper),
            showCrossingGap: this.config.showCrossingGap,
            crossingGapSize: getRandomIntInclusive(this.config.crossingGapSize.lower, this.config.crossingGapSize.upper),
            useSmoothPath: this.config.useSmoothPath,
            lobeOrnament: this.config.lobeOrnament,
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

    #getPathPoint(segIdx, centerPos, rotAngle, pulse, bandOffset, progress) {
        const seg = this.data.pathSegments[segIdx % this.data.totalSteps];
        const lobeAnim = this.data.lobeAnimData[seg.lobeIndex % this.data.lobeAnimData.length];
        const lobeDepthMod = 0.6 + 0.5 * Math.sin(lobeAnim.depthPhase + progress * Math.PI * 2 * lobeAnim.depthFreq) + 0.3 * Math.sin(lobeAnim.depthPhase * 1.4 + progress * Math.PI * 2 * lobeAnim.depthFreq * 2);
        const angle = seg.angle + rotAngle;
        const animatedRadius = this.data.knotRadius + this.data.lobeDepth * seg.lobeWave * lobeDepthMod;
        const r = animatedRadius * pulse;
        const angleRad = (angle * Math.PI) / 180;
        const normalAngle = angleRad + Math.PI / 2;
        const basePos = findPointByAngleAndCircle(centerPos, angle, r);

        return {
            x: basePos.x + Math.cos(normalAngle) * bandOffset,
            y: basePos.y + Math.sin(normalAngle) * bandOffset,
        };
    }

    async #drawKnotLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const lineWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;
        const progress = numberOfFrames <= 1 ? 0 : currentFrame / (numberOfFrames - 1);
        const rotAngle = progress * this.data.speed * 360;
        const pulse = findValue(0.85, 1.15, this.data.pulseFrequency, numberOfFrames, currentFrame);

        const stepsPerLobe = this.data.totalSteps / this.data.lobeCount;

        for (const band of this.data.bands) {
            const weaveGapAnim = 1 + band.gapOscAmp * Math.sin(band.gapPhase + progress * Math.PI * 2 * 2);
            const weaveOffset = band.offset * weaveGapAnim;
            const bandWavePhase = band.phaseShift + progress * Math.PI * 2 * this.data.speed * band.speedMult;

            if (this.data.useSmoothPath) {
                const bandPoints = [];
                for (let i = 0; i < this.data.totalSteps; i++) {
                    const segWave = 1 + 0.2 * Math.sin(bandWavePhase + (i / this.data.totalSteps) * Math.PI * 2 * 3);
                    bandPoints.push(this.#getPathPoint(i, centerPos, rotAngle, pulse * segWave, weaveOffset, progress));
                }
                await canvas.drawSpline(bandPoints, 0.5, lineWidth, color, isUnderlay ? theAccentGaston * 0.3 : 0, color, true);
            } else {
                for (let i = 0; i < this.data.totalSteps; i++) {
                    const next = (i + 1) % this.data.totalSteps;

                    const crossingIndex = i % (this.data.lobeCount * 2);
                    const isOver = crossingIndex % 2 === 0;

                    if (this.data.showCrossingGap && !isOver) {
                        const crossingMid = Math.floor(stepsPerLobe / 2);
                        const distFromMid = Math.abs((i % stepsPerLobe) - crossingMid);
                        if (distFromMid < this.data.crossingGapSize) continue;
                    }

                    const segWave = 1 + 0.2 * Math.sin(bandWavePhase + (i / this.data.totalSteps) * Math.PI * 2 * 3);
                    const p1 = this.#getPathPoint(i, centerPos, rotAngle, pulse * segWave, weaveOffset, progress);
                    const p2 = this.#getPathPoint(next, centerPos, rotAngle, pulse * segWave, weaveOffset, progress);

                    const segThickness = isOver ? lineWidth * 1.1 : lineWidth * 0.7;
                    const glow = isUnderlay ? theAccentGaston * (isOver ? 0.4 : 0.15) : 0;

                    await canvas.drawLine2d(p1, p2, segThickness, color, glow, color);
                }
            }
        }

        for (let i = 0; i < this.data.lobeCount; i++) {
            const angle = (360 / this.data.lobeCount) * i + rotAngle;
            const tipPos = findPointByAngleAndCircle(centerPos, angle, (this.data.knotRadius + this.data.lobeDepth) * pulse);

            if (this.data.lobeOrnament) {
                const ornSize = lineWidth * 1.2;
                await canvas.drawFilledCircle2d(tipPos, ornSize + (isUnderlay ? theAccentGaston * 0.3 : 0), color);
            } else {
                const dotSize = lineWidth * 1.5;
                await canvas.drawRing2d(tipPos, dotSize, lineWidth * 0.4, color, isUnderlay ? theAccentGaston * 0.3 : 0, color);
            }
        }
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawKnotLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawKnotLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${CelticKnotworkEffect._displayName_}: lobes=${this.data.lobeCount}, bands=${this.data.bandCount}`;
    }
}

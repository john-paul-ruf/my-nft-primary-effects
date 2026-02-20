import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';
import {findOneWayValue} from 'my-nft-gen/src/core/math/findOneWayValue.js';
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

        for (let step = 0; step < totalSteps; step++) {
            const t = step / totalSteps;
            const angle = t * 360;
            const lobePhase = (step % stepsPerLobe) / stepsPerLobe;
            const lobeWave = Math.sin(lobePhase * Math.PI * 2);
            const r = knotRadius + lobeDepth * lobeWave;
            pathSegments.push({
                angle,
                radius: r,
                lobeWave,
                phaseOffset: randomNumber(0, 0.1),
            });
        }

        const bands = [];
        for (let b = 0; b < bandCount; b++) {
            bands.push({
                offset: (b - (bandCount - 1) / 2) * weaveGap,
                phaseShift: randomNumber(0, Math.PI * 2),
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
            totalSteps,
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
            pulseFrequency: getRandomIntInclusive(this.config.pulseFrequency.lower, this.config.pulseFrequency.upper),
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

    #getPathPoint(segIdx, centerPos, rotAngle, pulse, bandOffset) {
        const seg = this.data.pathSegments[segIdx % this.data.totalSteps];
        const angle = seg.angle + rotAngle;
        const r = seg.radius * pulse;
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
        const rotAngle = findOneWayValue(0, this.data.speed * 360, 1, numberOfFrames, currentFrame, false);
        const pulse = findValue(0.95, 1.05, this.data.pulseFrequency, numberOfFrames, currentFrame);

        for (const band of this.data.bands) {
            const weaveOffset = band.offset;

            for (let i = 0; i < this.data.totalSteps; i++) {
                const next = (i + 1) % this.data.totalSteps;

                const crossingIndex = i % (this.data.lobeCount * 2);
                const isOver = crossingIndex % 2 === 0;

                const p1 = this.#getPathPoint(i, centerPos, rotAngle, pulse, weaveOffset);
                const p2 = this.#getPathPoint(next, centerPos, rotAngle, pulse, weaveOffset);

                const segThickness = isOver ? lineWidth * 1.1 : lineWidth * 0.7;
                const glow = isUnderlay ? theAccentGaston * (isOver ? 0.4 : 0.15) : 0;

                await canvas.drawLine2d(p1, p2, segThickness, color, glow, color);
            }
        }

        for (let i = 0; i < this.data.lobeCount; i++) {
            const angle = (360 / this.data.lobeCount) * i + rotAngle;
            const tipPos = findPointByAngleAndCircle(centerPos, angle, (this.data.knotRadius + this.data.lobeDepth) * pulse);
            const dotSize = lineWidth * 1.5;
            await canvas.drawEllipse2d(tipPos, dotSize, dotSize, 0, lineWidth * 0.4, color, isUnderlay ? theAccentGaston * 0.3 : 0, color);
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

import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';

import {findPointByAngleAndCircle} from 'my-nft-gen/src/core/math/drawingMath.js';
import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {ToroidalFlowConfig} from './ToroidalFlowConfig.js';

export class ToroidalFlowEffect extends LayerEffect {
    static _name_ = 'toroidal-flow';
    static _displayName_ = 'Toroidal Flow';
    static _description_ = 'Toroidal particle flow field viewed from above with spiraling streamlines and fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'toroid', 'flow', 'spiral', 'particle', 'animated'];

    constructor({
                    name = ToroidalFlowEffect._name_,
                    requiresLayer = true,
                    config = new ToroidalFlowConfig({}),
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

        const outerRadius = getRandomIntInclusive(this.config.outerRadius.lower(this.finalSize), this.config.outerRadius.upper(this.finalSize));
        const innerRadius = getRandomIntInclusive(this.config.innerRadius.lower(this.finalSize), this.config.innerRadius.upper(this.finalSize));
        const streamlineCount = getRandomIntInclusive(this.config.streamlineCount.lower, this.config.streamlineCount.upper);
        const pointsPerStream = getRandomIntInclusive(this.config.pointsPerStream.lower, this.config.pointsPerStream.upper);
        const spiralTightness = getRandomIntInclusive(this.config.spiralTightness.lower, this.config.spiralTightness.upper);

        const streamlines = [];
        for (let i = 0; i < streamlineCount; i++) {
            const startAngle = (360 / streamlineCount) * i + randomNumber(-10, 10);
            const startRadiusFactor = randomNumber(0.3, 1);
            const wobblePhase = randomNumber(0, Math.PI * 2);
            const wobbleAmp = randomNumber(
                this.config.wobbleAmplitude.lower,
                this.config.wobbleAmplitude.upper
            );
            const wobbleFreq = randomNumber(
                this.config.wobbleFrequency.lower,
                this.config.wobbleFrequency.upper
            );

            streamlines.push({
                startAngle,
                startRadiusFactor,
                wobblePhase,
                wobbleAmp,
                wobbleFreq,
                breathPhase: randomNumber(0, Math.PI * 2),
                breathFreq: getRandomIntInclusive(1, 3),
                flowHeadPhase: randomNumber(0, 1),
                flowSpeedMult: getRandomIntInclusive(1, 2),
                spiralTightnessPhase: randomNumber(0, Math.PI * 2),
                spiralTightnessAmp: randomNumber(0.3, 0.8),
                thicknessPhase: randomNumber(0, Math.PI * 2),
                thicknessFreq: getRandomIntInclusive(1, 3),
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
            outerRadius,
            innerRadius,
            pointsPerStream,
            spiralTightness,
            streamlines,
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
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

    #computeStreamPoints(stream, centerPos, currentFrame, numberOfFrames) {
        const progress = numberOfFrames <= 1 ? 0 : currentFrame / (numberOfFrames - 1);
        const rotOffset = progress * this.data.speed * stream.flowSpeedMult * 360;
        const globalBreathe = findValue(0.8, 1.2, this.data.speed, numberOfFrames, currentFrame);
        const streamBreathe = 0.75 + 0.35 * Math.sin(stream.breathPhase + progress * Math.PI * 2 * stream.breathFreq) + 0.2 * Math.sin(stream.breathPhase * 1.5 + progress * Math.PI * 2 * stream.breathFreq * 2);
        const breathe = globalBreathe * streamBreathe;
        const points = [];
        const tubeRadius = (this.data.outerRadius - this.data.innerRadius) / 2;
        const toroidCenter = this.data.innerRadius + tubeRadius;
        const spiralMod = 1 + stream.spiralTightnessAmp * Math.sin(stream.spiralTightnessPhase + progress * Math.PI * 2 * 2);

        for (let p = 0; p < this.data.pointsPerStream; p++) {
            const t = p / this.data.pointsPerStream;
            const majorAngle = stream.startAngle + rotOffset + t * 360 * this.data.spiralTightness * spiralMod;
            const minorAngle = t * 360 * 2;

            const majorAngleRad = majorAngle * Math.PI / 180;
            const minorAngleRad = minorAngle * Math.PI / 180;

            const r = toroidCenter + tubeRadius * Math.cos(minorAngleRad) * stream.startRadiusFactor;
            const wobble = stream.wobbleAmp * Math.sin(t * stream.wobbleFreq * Math.PI * 2 + stream.wobblePhase);

            const px = centerPos.x + (r * breathe + wobble) * Math.cos(majorAngleRad);
            const py = centerPos.y + (r * breathe + wobble) * Math.sin(majorAngleRad);

            points.push({x: px, y: py});
        }
        return points;
    }

    async #drawFlowLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const lineWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;

        const progress = numberOfFrames <= 1 ? 0 : currentFrame / (numberOfFrames - 1);
        for (const stream of this.data.streamlines) {
            const points = this.#computeStreamPoints(stream, centerPos, currentFrame, numberOfFrames);
            const thicknessMod = 0.6 + 0.8 * Math.sin(stream.thicknessPhase + progress * Math.PI * 2 * stream.thicknessFreq);
            const streamLineWidth = lineWidth * thicknessMod;

            await canvas.drawSpline(
                points,
                0.5,
                streamLineWidth,
                color,
                isUnderlay ? theAccentGaston * 0.3 : 0,
                color,
                false
            );
        }

        const breathe = findValue(0.8, 1.2, this.data.speed, numberOfFrames, currentFrame);
        await canvas.drawRing2d(centerPos, this.data.outerRadius * breathe, lineWidth * 0.5, color, isUnderlay ? theAccentGaston * 0.2 : 0, color);
        await canvas.drawRing2d(centerPos, this.data.innerRadius * breathe, lineWidth * 0.5, color, isUnderlay ? theAccentGaston * 0.2 : 0, color);
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawFlowLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawFlowLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${ToroidalFlowEffect._displayName_}: streams=${this.data.streamlines.length}, spiral=${this.data.spiralTightness}`;
    }
}

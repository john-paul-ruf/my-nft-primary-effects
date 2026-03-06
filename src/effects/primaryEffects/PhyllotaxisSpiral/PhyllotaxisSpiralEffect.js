import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';

import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {PhyllotaxisSpiralConfig} from './PhyllotaxisSpiralConfig.js';

const GOLDEN_ANGLE = 137.508;

export class PhyllotaxisSpiralEffect extends LayerEffect {
    static _name_ = 'phyllotaxis-spiral';
    static _displayName_ = 'Phyllotaxis Spiral';
    static _description_ = 'Fibonacci golden-angle phyllotaxis dot spiral with size and color gradients and fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'phyllotaxis', 'fibonacci', 'golden', 'spiral', 'animated'];

    constructor({
                    name = PhyllotaxisSpiralEffect._name_,
                    requiresLayer = true,
                    config = new PhyllotaxisSpiralConfig({}),
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

        const dotCount = getRandomIntInclusive(this.config.dotCount.lower, this.config.dotCount.upper);
        const spiralRadius = getRandomIntInclusive(this.config.spiralRadius.lower(this.finalSize), this.config.spiralRadius.upper(this.finalSize));
        const dotMinRadius = getRandomIntInclusive(this.config.dotMinRadius.lower, this.config.dotMinRadius.upper);
        const dotMaxRadius = getRandomIntInclusive(this.config.dotMaxRadius.lower, this.config.dotMaxRadius.upper);
        const goldenAngleOffset = randomNumber(this.config.goldenAngleOffset.lower, this.config.goldenAngleOffset.upper);

        const dots = [];
        for (let i = 0; i < dotCount; i++) {
            dots.push({
                index: i,
                radiusJitter: randomNumber(0.9, 1.1),
                sizeJitter: randomNumber(0.8, 1.2),
                pulsePhase: randomNumber(0, Math.PI * 2),
                pulseFreq: randomNumber(1, 3),
                angularDriftPhase: randomNumber(0, Math.PI * 2),
                angularDriftAmp: randomNumber(2, 12),
                radialPushPhase: randomNumber(0, Math.PI * 2),
                radialPushFreq: randomNumber(0.5, 2),
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
            spiralRadius,
            dotCount,
            dotMinRadius,
            dotMaxRadius,
            goldenAngle: GOLDEN_ANGLE + goldenAngleOffset,
            dots,
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
            breathFrequency: getRandomIntInclusive(this.config.breathFrequency.lower, this.config.breathFrequency.upper),
            breathAmplitude: this.config.breathAmplitude,
            dotShape: this.config.dotShape,
            polygonSides: getRandomIntInclusive(this.config.polygonSides.lower, this.config.polygonSides.upper),
            showSpiralArms: this.config.showSpiralArms,
            spiralArmCount: getRandomIntInclusive(this.config.spiralArmCount.lower, this.config.spiralArmCount.upper),
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

    async #drawSpiralLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const progress = (currentFrame % numberOfFrames) / numberOfFrames;
        const rotOffset = progress * this.data.speed * 360;
        const breathAmp = Math.max(this.data.breathAmplitude, 0.15);
        const breathe = findValue(
            1 - breathAmp,
            1 + breathAmp,
            this.data.breathFrequency,
            numberOfFrames,
            currentFrame
        );
        const wavePhase = progress * Math.PI * 2 * this.data.speed;

        const dotPositions = [];

        for (const dot of this.data.dots) {
            const n = dot.index;
            const t = n / this.data.dotCount;
            const radialWave = 0.9 + 0.2 * Math.sin(wavePhase - t * Math.PI * 2 * 3);
            const angularDrift = dot.angularDriftAmp * Math.sin(dot.angularDriftPhase + progress * Math.PI * 2 * 2);
            const angle = n * this.data.goldenAngle + rotOffset + angularDrift;
            const radialPush = 1 + 0.15 * Math.sin(dot.radialPushPhase + progress * Math.PI * 2 * dot.radialPushFreq);
            const dist = Math.sqrt(t) * this.data.spiralRadius * breathe * dot.radiusJitter * radialWave * radialPush;

            const angleRad = angle * Math.PI / 180;
            const px = centerPos.x + Math.cos(angleRad) * dist;
            const py = centerPos.y + Math.sin(angleRad) * dist;
            const pos = {x: px, y: py};
            dotPositions.push(pos);

            const dotPulse = 0.7 + 0.4 * Math.sin(dot.pulsePhase + progress * Math.PI * 2 * dot.pulseFreq) + 0.2 * Math.sin(dot.pulsePhase * 1.5 + progress * Math.PI * 2 * dot.pulseFreq * 2.5);
            const dotRadius = (this.data.dotMinRadius + (this.data.dotMaxRadius - this.data.dotMinRadius) * t) * dot.sizeJitter * breathe * dotPulse;
            const ringWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;
            const accentSz = isUnderlay ? theAccentGaston * 0.3 : 0;

            if (this.data.dotShape === 'filled') {
                await canvas.drawFilledCircle2d(pos, dotRadius + accentSz, color);
            } else if (this.data.dotShape === 'polygon') {
                await canvas.drawFilledPolygon2d(dotRadius + accentSz, pos, this.data.polygonSides, angle, color);
            } else if (this.data.dotShape === 'star') {
                await canvas.drawStar2d(pos, dotRadius + accentSz, (dotRadius + accentSz) * 0.4, 5, angle, ringWidth, color);
            } else {
                await canvas.drawRing2d(pos, dotRadius, ringWidth, color, accentSz, color);
            }
        }

        if (this.data.showSpiralArms && dotPositions.length > this.data.spiralArmCount) {
            const lineWidth = isUnderlay ? this.data.thickness * 0.5 + theAccentGaston * 0.2 : this.data.thickness * 0.5;
            for (let arm = 0; arm < this.data.spiralArmCount; arm++) {
                const armPoints = [];
                for (let i = arm; i < dotPositions.length; i += this.data.spiralArmCount) {
                    armPoints.push(dotPositions[i]);
                }
                if (armPoints.length >= 3) {
                    await canvas.drawSpline(armPoints, 0.5, lineWidth, color, 0, color, false);
                }
            }
        }
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawSpiralLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawSpiralLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${PhyllotaxisSpiralEffect._displayName_}: dots=${this.data.dotCount}, angle=${this.data.goldenAngle.toFixed(2)}`;
    }
}

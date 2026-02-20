import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';
import {findOneWayValue} from 'my-nft-gen/src/core/math/findOneWayValue.js';
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
        const rotOffset = findOneWayValue(0, this.data.speed * 360, 1, numberOfFrames, currentFrame, false);
        const breathe = findValue(
            1 - this.data.breathAmplitude,
            1 + this.data.breathAmplitude,
            this.data.breathFrequency,
            numberOfFrames,
            currentFrame
        );

        for (const dot of this.data.dots) {
            const n = dot.index;
            const t = n / this.data.dotCount;
            const angle = n * this.data.goldenAngle + rotOffset;
            const dist = Math.sqrt(t) * this.data.spiralRadius * breathe * dot.radiusJitter;

            const angleRad = angle * Math.PI / 180;
            const px = centerPos.x + Math.cos(angleRad) * dist;
            const py = centerPos.y + Math.sin(angleRad) * dist;

            const dotRadius = (this.data.dotMinRadius + (this.data.dotMaxRadius - this.data.dotMinRadius) * t) * dot.sizeJitter * breathe;
            const ringWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;

            await canvas.drawRing2d(
                {x: px, y: py},
                dotRadius,
                ringWidth,
                color,
                isUnderlay ? theAccentGaston * 0.3 : 0,
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

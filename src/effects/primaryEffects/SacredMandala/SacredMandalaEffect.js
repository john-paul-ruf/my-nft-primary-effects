import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';
import {findOneWayValue} from 'my-nft-gen/src/core/math/findOneWayValue.js';
import {findPointByAngleAndCircle} from 'my-nft-gen/src/core/math/drawingMath.js';
import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {SacredMandalaConfig} from './SacredMandalaConfig.js';

export class SacredMandalaEffect extends LayerEffect {
    static _name_ = 'sacred-mandala';
    static _displayName_ = 'Sacred Mandala';
    static _description_ = 'Layered rotating mandala with petal geometry, dot arrays, concentric ornamental rings with fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'mandala', 'sacred', 'geometric', 'symmetry', 'animated'];

    constructor({
                    name = SacredMandalaEffect._name_,
                    requiresLayer = true,
                    config = new SacredMandalaConfig({}),
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

        const symmetryFold = getRandomIntInclusive(this.config.symmetryFold.lower, this.config.symmetryFold.upper);
        const concentricRings = getRandomIntInclusive(this.config.concentricRings.lower, this.config.concentricRings.upper);
        const maxRadius = getRandomIntInclusive(this.config.maxRadius.lower(this.finalSize), this.config.maxRadius.upper(this.finalSize));
        const petalLayers = getRandomIntInclusive(this.config.petalLayers.lower, this.config.petalLayers.upper);
        const dotCount = getRandomIntInclusive(this.config.dotCount.lower, this.config.dotCount.upper);

        const ringData = [];
        for (let r = 0; r < concentricRings; r++) {
            ringData.push({
                radiusFactor: (r + 1) / concentricRings,
                dotOffset: randomNumber(0, 360),
                petalScale: 0.5 + randomNumber(0, 0.5),
            });
        }

        const petalData = [];
        for (let p = 0; p < petalLayers; p++) {
            petalData.push({
                radiusFactor: 0.3 + (p / petalLayers) * 0.7,
                elongation: 1.5 + randomNumber(0, 2),
                widthFactor: 0.15 + randomNumber(0, 0.2),
                rotationOffset: randomNumber(0, 360 / symmetryFold),
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
            symmetryFold,
            concentricRings,
            maxRadius,
            petalLayers,
            dotCount,
            dotRadius: getRandomIntInclusive(this.config.dotRadius.lower, this.config.dotRadius.upper),
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
            breathFrequency: getRandomIntInclusive(this.config.breathFrequency.lower, this.config.breathFrequency.upper),
            breathAmplitude: this.config.breathAmplitude,
            ringData,
            petalData,
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

    async #drawMandalaLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const rotAngle = findOneWayValue(0, this.data.speed * 360, 1, numberOfFrames, currentFrame, false);
        const breath = findValue(1 - this.data.breathAmplitude, 1 + this.data.breathAmplitude, this.data.breathFrequency, numberOfFrames, currentFrame);

        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const strokeWidth = isUnderlay ? this.data.stroke + this.data.thickness + theAccentGaston : this.data.thickness;

        for (const ring of this.data.ringData) {
            const ringRadius = this.data.maxRadius * ring.radiusFactor * breath;
            await canvas.drawRing2d(centerPos, ringRadius, strokeWidth, color, isUnderlay ? theAccentGaston : 0, color);

            for (let d = 0; d < this.data.dotCount; d++) {
                const dotAngle = (360 / this.data.dotCount) * d + ring.dotOffset + rotAngle;
                const dotPos = findPointByAngleAndCircle(centerPos, dotAngle, ringRadius);
                await canvas.drawRing2d(dotPos, this.data.dotRadius * breath, strokeWidth * 0.5, color, 0, color);
            }
        }

        for (const petal of this.data.petalData) {
            const petalRadius = this.data.maxRadius * petal.radiusFactor * breath;

            for (let s = 0; s < this.data.symmetryFold; s++) {
                const baseAngle = (360 / this.data.symmetryFold) * s + petal.rotationOffset + rotAngle;

                const tipPos = findPointByAngleAndCircle(centerPos, baseAngle, petalRadius * petal.elongation);
                const leftAngle = baseAngle - 90;
                const rightAngle = baseAngle + 90;
                const leftBase = findPointByAngleAndCircle(centerPos, leftAngle, petalRadius * petal.widthFactor);
                const rightBase = findPointByAngleAndCircle(centerPos, rightAngle, petalRadius * petal.widthFactor);

                await canvas.drawLine2d(leftBase, tipPos, strokeWidth, color, 0, color);
                await canvas.drawLine2d(rightBase, tipPos, strokeWidth, color, 0, color);
                await canvas.drawLine2d(leftBase, rightBase, strokeWidth * 0.5, color, 0, color);
            }
        }

        for (let s = 0; s < this.data.symmetryFold; s++) {
            const spokeAngle = (360 / this.data.symmetryFold) * s + rotAngle;
            const innerPos = findPointByAngleAndCircle(centerPos, spokeAngle, this.data.maxRadius * 0.1 * breath);
            const outerPos = findPointByAngleAndCircle(centerPos, spokeAngle, this.data.maxRadius * breath);
            await canvas.drawLine2d(innerPos, outerPos, strokeWidth * 0.5, color, 0, color);
        }

        await canvas.drawPolygon2d(
            this.data.maxRadius * breath,
            centerPos,
            this.data.symmetryFold,
            rotAngle,
            strokeWidth,
            color,
            isUnderlay ? theAccentGaston : 0,
            color
        );
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawMandalaLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawMandalaLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${SacredMandalaEffect._displayName_}: fold=${this.data.symmetryFold}, rings=${this.data.concentricRings}`;
    }
}

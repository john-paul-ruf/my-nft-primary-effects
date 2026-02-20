import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';
import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {VoronoiShatterConfig} from './VoronoiShatterConfig.js';

export class VoronoiShatterEffect extends LayerEffect {
    static _name_ = 'voronoi-shatter';
    static _displayName_ = 'Voronoi Shatter';
    static _description_ = 'Voronoi tessellation with animated cell drift and boundary rendering with fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'voronoi', 'tessellation', 'shatter', 'cells', 'animated'];

    constructor({
                    name = VoronoiShatterEffect._name_,
                    requiresLayer = true,
                    config = new VoronoiShatterConfig({}),
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

        const numberOfSeeds = getRandomIntInclusive(this.config.numberOfSeeds.lower, this.config.numberOfSeeds.upper);
        const fieldRadius = getRandomIntInclusive(this.config.fieldRadius.lower(this.finalSize), this.config.fieldRadius.upper(this.finalSize));
        const driftAmplitude = getRandomIntInclusive(this.config.driftAmplitude.lower, this.config.driftAmplitude.upper);

        const seeds = [];
        for (let i = 0; i < numberOfSeeds; i++) {
            const angle = randomNumber(0, 360);
            const dist = randomNumber(0, fieldRadius);
            seeds.push({
                offsetX: Math.cos(angle * Math.PI / 180) * dist,
                offsetY: Math.sin(angle * Math.PI / 180) * dist,
                driftPhaseX: randomNumber(0, Math.PI * 2),
                driftPhaseY: randomNumber(0, Math.PI * 2),
                driftAmpX: randomNumber(driftAmplitude * 0.5, driftAmplitude),
                driftAmpY: randomNumber(driftAmplitude * 0.5, driftAmplitude),
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
            seeds,
            fieldRadius,
            cellEdgeResolution: this.config.cellEdgeResolution,
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

    #getSeedPositions(centerPos, currentFrame, numberOfFrames) {
        const pulse = findValue(0.95, 1.05, this.data.pulseFrequency, numberOfFrames, currentFrame);
        const progress = (currentFrame % numberOfFrames) / numberOfFrames;

        return this.data.seeds.map(seed => {
            const driftX = seed.driftAmpX * Math.sin(seed.driftPhaseX + progress * Math.PI * 2 * this.data.speed);
            const driftY = seed.driftAmpY * Math.sin(seed.driftPhaseY + progress * Math.PI * 2 * this.data.speed);
            return {
                x: centerPos.x + (seed.offsetX + driftX) * pulse,
                y: centerPos.y + (seed.offsetY + driftY) * pulse,
            };
        });
    }

    #findVoronoiEdges(seedPositions) {
        const edges = [];
        const res = this.data.cellEdgeResolution;
        const scanW = this.data.fieldRadius * 2.5;
        const scanH = this.data.fieldRadius * 2.5;
        const cx = this.data.width / 2;
        const cy = this.data.height / 2;

        for (let gy = 0; gy < res; gy++) {
            for (let gx = 0; gx < res; gx++) {
                const px = cx - scanW / 2 + (gx / res) * scanW;
                const py = cy - scanH / 2 + (gy / res) * scanH;

                const closest = this.#findClosestTwo(px, py, seedPositions);
                if (!closest) continue;

                const diff = Math.abs(closest.dist1 - closest.dist2);
                if (diff < scanW / res * 1.2) {
                    edges.push({x: px, y: py});
                }
            }
        }
        return edges;
    }

    #findClosestTwo(px, py, seeds) {
        if (seeds.length < 2) return null;
        let dist1 = Infinity, dist2 = Infinity;
        for (const s of seeds) {
            const d = Math.sqrt((px - s.x) ** 2 + (py - s.y) ** 2);
            if (d < dist1) {
                dist2 = dist1;
                dist1 = d;
            } else if (d < dist2) {
                dist2 = d;
            }
        }
        return {dist1, dist2};
    }

    async #drawVoronoiLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const seedPositions = this.#getSeedPositions(centerPos, currentFrame, numberOfFrames);
        const edges = this.#findVoronoiEdges(seedPositions);

        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const dotSize = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;

        for (const edge of edges) {
            await canvas.drawRing2d(edge, dotSize * 0.5, dotSize, color, isUnderlay ? theAccentGaston * 0.5 : 0, color);
        }

        const seedDotSize = isUnderlay ? this.data.thickness * 2 + theAccentGaston : this.data.thickness * 2;
        for (const seed of seedPositions) {
            await canvas.drawRing2d(seed, seedDotSize, seedDotSize * 0.5, color, isUnderlay ? theAccentGaston : 0, color);
        }
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawVoronoiLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawVoronoiLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${VoronoiShatterEffect._displayName_}: seeds=${this.data.seeds.length}`;
    }
}

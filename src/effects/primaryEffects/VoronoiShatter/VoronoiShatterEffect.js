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
                driftAmpX: randomNumber(driftAmplitude * 0.8, driftAmplitude * 1.5),
                driftAmpY: randomNumber(driftAmplitude * 0.8, driftAmplitude * 1.5),
                scalePhase: randomNumber(0, Math.PI * 2),
                scaleFreq: randomNumber(1, 3),
                orbitPhase: randomNumber(0, Math.PI * 2),
                orbitSpeed: randomNumber(0.5, 2),
                orbitRadius: randomNumber(5, 25),
                driftSpeedMult: randomNumber(0.5, 2),
                dotPulsePhase: randomNumber(0, Math.PI * 2),
                dotPulseFreq: randomNumber(1, 3),
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
            cellEdgeResolution: getRandomIntInclusive(this.config.cellEdgeResolution.lower, this.config.cellEdgeResolution.upper),
            showDelaunayEdges: this.config.showDelaunayEdges,
            edgeStyle: this.config.edgeStyle,
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
        const pulse = findValue(0.8, 1.2, this.data.pulseFrequency, numberOfFrames, currentFrame);
        const progress = (currentFrame % numberOfFrames) / numberOfFrames;

        return this.data.seeds.map(seed => {
            const speedMult = seed.driftSpeedMult;
            const driftX = seed.driftAmpX * Math.sin(seed.driftPhaseX + progress * Math.PI * 2 * this.data.speed * speedMult);
            const driftY = seed.driftAmpY * Math.sin(seed.driftPhaseY + progress * Math.PI * 2 * this.data.speed * speedMult);
            const orbitAngle = seed.orbitPhase + progress * Math.PI * 2 * seed.orbitSpeed;
            const orbitDx = Math.cos(orbitAngle) * seed.orbitRadius;
            const orbitDy = Math.sin(orbitAngle) * seed.orbitRadius;
            const seedScale = 0.8 + 0.3 * Math.sin(seed.scalePhase + progress * Math.PI * 2 * seed.scaleFreq) + 0.15 * Math.sin(seed.scalePhase * 1.4 + progress * Math.PI * 2 * seed.scaleFreq * 2.3);
            return {
                x: centerPos.x + (seed.offsetX + driftX + orbitDx) * pulse * seedScale,
                y: centerPos.y + (seed.offsetY + driftY + orbitDy) * pulse * seedScale,
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

        if (this.data.edgeStyle === 'connected' && edges.length >= 3) {
            const sorted = [...edges].sort((a, b) => {
                const aa = Math.atan2(a.y - centerPos.y, a.x - centerPos.x);
                const ba = Math.atan2(b.y - centerPos.y, b.x - centerPos.x);
                return aa - ba;
            });
            await canvas.drawSpline(sorted, 0.5, dotSize, color, 0, color, true);
        } else if (this.data.edgeStyle === 'rings') {
            for (const edge of edges) {
                await canvas.drawRing2d(edge, dotSize, dotSize * 0.5, color, isUnderlay ? theAccentGaston * 0.5 : 0, color);
            }
        } else {
            for (const edge of edges) {
                await canvas.drawRing2d(edge, dotSize * 0.5, dotSize, color, isUnderlay ? theAccentGaston * 0.5 : 0, color);
            }
        }

        if (this.data.showDelaunayEdges) {
            const lineThickness = isUnderlay ? dotSize * 0.3 + theAccentGaston * 0.3 : dotSize * 0.3;
            for (let i = 0; i < seedPositions.length; i++) {
                let closest = {idx: -1, dist: Infinity};
                let secondClosest = {idx: -1, dist: Infinity};
                for (let j = 0; j < seedPositions.length; j++) {
                    if (i === j) continue;
                    const d = Math.sqrt((seedPositions[i].x - seedPositions[j].x) ** 2 + (seedPositions[i].y - seedPositions[j].y) ** 2);
                    if (d < closest.dist) {
                        secondClosest = {...closest};
                        closest = {idx: j, dist: d};
                    } else if (d < secondClosest.dist) {
                        secondClosest = {idx: j, dist: d};
                    }
                }
                if (closest.idx >= 0) {
                    await canvas.drawLine2d(seedPositions[i], seedPositions[closest.idx], lineThickness, color, 0, color);
                }
                if (secondClosest.idx >= 0) {
                    await canvas.drawLine2d(seedPositions[i], seedPositions[secondClosest.idx], lineThickness * 0.6, color, 0, color);
                }
            }
        }

        const progress = (currentFrame % numberOfFrames) / numberOfFrames;
        const baseSeedDotSize = isUnderlay ? this.data.thickness * 2 + theAccentGaston : this.data.thickness * 2;
        for (let si = 0; si < seedPositions.length; si++) {
            const seed = seedPositions[si];
            const seedData = this.data.seeds[si];
            const dotPulse = 0.5 + 0.8 * Math.sin(seedData.dotPulsePhase + progress * Math.PI * 2 * seedData.dotPulseFreq);
            const seedDotSize = baseSeedDotSize * dotPulse;
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

import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';
import {findOneWayValue} from 'my-nft-gen/src/core/math/findOneWayValue.js';
import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {PenroseTilingConfig} from './PenroseTilingConfig.js';

const PHI = (1 + Math.sqrt(5)) / 2;

export class PenroseTilingEffect extends LayerEffect {
    static _name_ = 'penrose-tiling';
    static _displayName_ = 'Penrose Tiling';
    static _description_ = 'Aperiodic Penrose tiling with kites and darts, pulsing color waves, and fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'penrose', 'tiling', 'aperiodic', 'geometric', 'animated'];

    constructor({
                    name = PenroseTilingEffect._name_,
                    requiresLayer = true,
                    config = new PenroseTilingConfig({}),
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

        const tileRadius = getRandomIntInclusive(this.config.tileRadius.lower(this.finalSize), this.config.tileRadius.upper(this.finalSize));
        const subdivisions = getRandomIntInclusive(this.config.subdivisions.lower, this.config.subdivisions.upper);

        let triangles = [];
        for (let i = 0; i < 10; i++) {
            const angle1 = (2 * Math.PI / 10) * i;
            const angle2 = (2 * Math.PI / 10) * (i + 1);

            const a = {x: 0, y: 0};
            const b = {x: Math.cos(angle1), y: Math.sin(angle1)};
            const c = {x: Math.cos(angle2), y: Math.sin(angle2)};

            if (i % 2 === 0) {
                triangles.push({type: 0, a: a, b: b, c: c});
            } else {
                triangles.push({type: 0, a: a, b: c, c: b});
            }
        }

        for (let s = 0; s < subdivisions; s++) {
            triangles = this.#subdivide(triangles);
        }

        const edges = [];
        const edgeSet = new Set();
        for (const tri of triangles) {
            const pairs = [[tri.a, tri.b], [tri.b, tri.c], [tri.c, tri.a]];
            for (const [p1, p2] of pairs) {
                const key1 = `${p1.x.toFixed(6)},${p1.y.toFixed(6)}-${p2.x.toFixed(6)},${p2.y.toFixed(6)}`;
                const key2 = `${p2.x.toFixed(6)},${p2.y.toFixed(6)}-${p1.x.toFixed(6)},${p1.y.toFixed(6)}`;
                if (!edgeSet.has(key1) && !edgeSet.has(key2)) {
                    edgeSet.add(key1);
                    edges.push({
                        x1: p1.x,
                        y1: p1.y,
                        x2: p2.x,
                        y2: p2.y,
                        dist: Math.sqrt(p1.x * p1.x + p1.y * p1.y),
                    });
                }
            }
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
            tileRadius,
            subdivisions,
            edges,
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
            pulseFrequency: getRandomIntInclusive(this.config.pulseFrequency.lower, this.config.pulseFrequency.upper),
            rotationSpeed: getRandomIntInclusive(this.config.rotationSpeed.lower, this.config.rotationSpeed.upper),
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

    #subdivide(triangles) {
        const result = [];
        for (const tri of triangles) {
            if (tri.type === 0) {
                const p = {
                    x: tri.a.x + (tri.b.x - tri.a.x) / PHI,
                    y: tri.a.y + (tri.b.y - tri.a.y) / PHI,
                };
                result.push({type: 0, a: tri.c, b: p, c: tri.a});
                result.push({type: 1, a: tri.c, b: tri.b, c: p});
            } else {
                const q = {
                    x: tri.b.x + (tri.a.x - tri.b.x) / PHI,
                    y: tri.b.y + (tri.a.y - tri.b.y) / PHI,
                };
                const r = {
                    x: tri.b.x + (tri.c.x - tri.b.x) / PHI,
                    y: tri.b.y + (tri.c.y - tri.b.y) / PHI,
                };
                result.push({type: 1, a: r, b: tri.c, c: tri.a});
                result.push({type: 1, a: q, b: r, c: tri.b});
                result.push({type: 0, a: r, b: q, c: tri.a});
            }
        }
        return result;
    }

    async #drawTilingLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const lineWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;

        const rotAngle = findOneWayValue(0, this.data.rotationSpeed * 360, 1, numberOfFrames, currentFrame, false);
        const pulse = findValue(0.95, 1.05, this.data.pulseFrequency, numberOfFrames, currentFrame);
        const rotRad = rotAngle * Math.PI / 180;
        const cosR = Math.cos(rotRad);
        const sinR = Math.sin(rotRad);

        for (const edge of this.data.edges) {
            const rx1 = edge.x1 * cosR - edge.y1 * sinR;
            const ry1 = edge.x1 * sinR + edge.y1 * cosR;
            const rx2 = edge.x2 * cosR - edge.y2 * sinR;
            const ry2 = edge.x2 * sinR + edge.y2 * cosR;

            const start = {
                x: centerPos.x + rx1 * this.data.tileRadius * pulse,
                y: centerPos.y + ry1 * this.data.tileRadius * pulse,
            };
            const end = {
                x: centerPos.x + rx2 * this.data.tileRadius * pulse,
                y: centerPos.y + ry2 * this.data.tileRadius * pulse,
            };

            await canvas.drawLine2d(start, end, lineWidth, color, isUnderlay ? theAccentGaston * 0.3 : 0, color);
        }
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawTilingLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawTilingLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${PenroseTilingEffect._displayName_}: edges=${this.data.edges.length}, subdivisions=${this.data.subdivisions}`;
    }
}

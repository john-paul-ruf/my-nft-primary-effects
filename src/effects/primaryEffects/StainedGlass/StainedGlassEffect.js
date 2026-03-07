import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';
import {findPointByAngleAndCircle} from 'my-nft-gen/src/core/math/drawingMath.js';
import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {StainedGlassConfig} from './StainedGlassConfig.js';

export class StainedGlassEffect extends LayerEffect {
    static _name_ = 'stained-glass';
    static _displayName_ = 'Stained Glass';
    static _description_ = 'Irregular polygon mosaic with thick leading lines and luminous gradient fills with fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'stained', 'glass', 'mosaic', 'polygon', 'animated'];

    constructor({
                    name = StainedGlassEffect._name_,
                    requiresLayer = true,
                    config = new StainedGlassConfig({}),
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

        const cellCount = getRandomIntInclusive(this.config.cellCount.lower, this.config.cellCount.upper);
        const fieldRadius = getRandomIntInclusive(this.config.fieldRadius.lower(this.finalSize), this.config.fieldRadius.upper(this.finalSize));
        const leadingThickness = getRandomIntInclusive(this.config.leadingThickness.lower, this.config.leadingThickness.upper);

        const cells = [];
        for (let i = 0; i < cellCount; i++) {
            const angle = randomNumber(0, 360);
            const dist = randomNumber(0, fieldRadius * 0.85);
            const sides = getRandomIntInclusive(this.config.shardSides.lower, this.config.shardSides.upper);
            const shardRadius = randomNumber(fieldRadius * 0.05, fieldRadius * 0.18);
            const rotOffset = randomNumber(0, 360);
            const shimmerPhase = randomNumber(0, Math.PI * 2);

            const vertices = [];
            for (let s = 0; s < sides; s++) {
                const vertAngle = (360 / sides) * s + rotOffset;
                const jitter = randomNumber(0.6, 1.3);
                vertices.push({
                    angle: vertAngle,
                    radiusFactor: jitter,
                    wobblePhase: randomNumber(0, Math.PI * 2),
                    wobbleAmp: randomNumber(0.05, 0.2),
                    wobbleFreq: getRandomIntInclusive(1, 3),
                });
            }

            cells.push({
                offsetAngle: angle,
                offsetDist: dist,
                shardRadius,
                vertices,
                shimmerPhase,
                orbitPhase: randomNumber(0, Math.PI * 2),
                orbitSpeed: getRandomIntInclusive(1, 2),
                orbitRadius: randomNumber(3, 15),
                rotationSpeed: getRandomIntInclusive(-2, 2),
                scalePhase: randomNumber(0, Math.PI * 2),
                scaleFreq: getRandomIntInclusive(1, 3),
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
            fieldRadius,
            leadingThickness,
            cells,
            shimmerFrequency: getRandomIntInclusive(this.config.shimmerFrequency.lower, this.config.shimmerFrequency.upper),
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
            fillCells: this.config.fillCells,
            fillAlpha: getRandomIntInclusive(this.config.fillAlpha.lower, this.config.fillAlpha.upper) / 100,
            showLeading: this.config.showLeading,
            cellCornerDots: this.config.cellCornerDots,
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

    async #drawGlassLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const lineWidth = isUnderlay ? this.data.leadingThickness + theAccentGaston : this.data.leadingThickness;
        const shimmer = findValue(0.85, 1.15, this.data.shimmerFrequency, numberOfFrames, currentFrame);
        const progress = (currentFrame % numberOfFrames) / numberOfFrames;

        const cellCenters = [];

        for (const cell of this.data.cells) {
            const cellAngleRad = cell.offsetAngle * Math.PI / 180;
            const orbitAngle = cell.orbitPhase + progress * Math.PI * 2 * cell.orbitSpeed;
            const orbitDx = Math.cos(orbitAngle) * cell.orbitRadius;
            const orbitDy = Math.sin(orbitAngle) * cell.orbitRadius;
            const cellCenter = {
                x: centerPos.x + Math.cos(cellAngleRad) * cell.offsetDist + orbitDx,
                y: centerPos.y + Math.sin(cellAngleRad) * cell.offsetDist + orbitDy,
            };
            cellCenters.push(cellCenter);

            const cellScale = 0.85 + 0.2 * Math.sin(cell.scalePhase + progress * Math.PI * 2 * cell.scaleFreq) + 0.12 * Math.sin(cell.scalePhase * 1.6 + progress * Math.PI * 2 * cell.scaleFreq * 2);
            const scaledRadius = cell.shardRadius * shimmer * cellScale;
            const cellRotation = progress * cell.rotationSpeed * 360;
            const verts = cell.vertices.map(v => {
                const vertWobble = 1 + v.wobbleAmp * Math.sin(v.wobblePhase + progress * Math.PI * 2 * v.wobbleFreq);
                const a = (v.angle + cellRotation) * Math.PI / 180;
                return {
                    x: cellCenter.x + Math.cos(a) * scaledRadius * v.radiusFactor * vertWobble,
                    y: cellCenter.y + Math.sin(a) * scaledRadius * v.radiusFactor * vertWobble,
                };
            });

            if (this.data.fillCells && !isUnderlay) {
                await canvas.drawFilledCustomPolygon2d(verts, color, this.data.fillAlpha);
            }

            for (let i = 0; i < verts.length; i++) {
                const next = (i + 1) % verts.length;
                const edgeThick = 0.6 + 0.8 * Math.sin(cell.shimmerPhase + progress * Math.PI * 2 * 2 + i * 1.5);
                await canvas.drawLine2d(
                    verts[i],
                    verts[next],
                    lineWidth * edgeThick,
                    color,
                    isUnderlay ? theAccentGaston * 0.3 : 0,
                    color
                );
            }

            if (this.data.cellCornerDots) {
                for (const v of verts) {
                    await canvas.drawDot(v, lineWidth * 0.4, color);
                }
            }

            const innerDotSize = isUnderlay ? this.data.thickness + theAccentGaston * 0.5 : this.data.thickness;
            await canvas.drawRing2d(cellCenter, innerDotSize, innerDotSize * 0.3, color, 0, color);
        }

        if (this.data.showLeading && cellCenters.length >= 2) {
            const leadWidth = lineWidth * 0.3;
            for (let i = 0; i < cellCenters.length; i++) {
                let closestDist = Infinity;
                let closestIdx = -1;
                for (let j = 0; j < cellCenters.length; j++) {
                    if (i === j) continue;
                    const d = Math.sqrt((cellCenters[i].x - cellCenters[j].x) ** 2 + (cellCenters[i].y - cellCenters[j].y) ** 2);
                    if (d < closestDist) {
                        closestDist = d;
                        closestIdx = j;
                    }
                }
                if (closestIdx >= 0) {
                    await canvas.drawLine2d(cellCenters[i], cellCenters[closestIdx], leadWidth, color, 0, color);
                }
            }
        }

        await canvas.drawRing2d(centerPos, this.data.fieldRadius * shimmer, lineWidth, color, isUnderlay ? theAccentGaston * 0.2 : 0, color);
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawGlassLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawGlassLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${StainedGlassEffect._displayName_}: cells=${this.data.cells.length}`;
    }
}

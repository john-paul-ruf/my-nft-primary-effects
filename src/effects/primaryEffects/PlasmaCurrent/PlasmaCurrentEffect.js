import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';

import {findPointByAngleAndCircle} from 'my-nft-gen/src/core/math/drawingMath.js';
import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {PlasmaCurrentConfig} from './PlasmaCurrentConfig.js';

export class PlasmaCurrentEffect extends LayerEffect {
    static _name_ = 'plasma-current';
    static _displayName_ = 'Plasma Current';
    static _description_ = 'Forking electric plasma arcs between charged nodes with lightning-bolt geometry and oscillating glow fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'plasma', 'lightning', 'electric', 'arc', 'animated'];

    constructor({
                    name = PlasmaCurrentEffect._name_,
                    requiresLayer = true,
                    config = new PlasmaCurrentConfig({}),
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

        const numberOfArcs = getRandomIntInclusive(this.config.numberOfArcs.lower, this.config.numberOfArcs.upper);
        const arcRadius = getRandomIntInclusive(this.config.arcRadius.lower(this.finalSize), this.config.arcRadius.upper(this.finalSize));

        const arcs = [];
        for (let i = 0; i < numberOfArcs; i++) {
            const startAngle = (360 / numberOfArcs) * i;
            const endAngle = startAngle + 180 + randomNumber(-60, 60);
            const segments = getRandomIntInclusive(this.config.segmentsPerArc.lower, this.config.segmentsPerArc.upper);
            const jaggedness = getRandomIntInclusive(this.config.jaggedness.lower, this.config.jaggedness.upper);
            const forkDepth = getRandomIntInclusive(this.config.forkDepth.lower, this.config.forkDepth.upper);

            const jags = [];
            for (let s = 0; s < segments; s++) {
                jags.push({
                    offsetX: randomNumber(-jaggedness, jaggedness),
                    offsetY: randomNumber(-jaggedness, jaggedness),
                    phaseX: randomNumber(0, Math.PI * 2),
                    phaseY: randomNumber(0, Math.PI * 2),
                });
            }

            const forks = [];
            this.#generateForks(forks, forkDepth, jaggedness, segments);

            arcs.push({
                startAngle,
                endAngle,
                segments,
                jaggedness,
                jags,
                forks,
                radius: arcRadius * (0.6 + randomNumber(0, 0.4)),
                speedMult: randomNumber(0.5, 2),
                radiusBreathPhase: randomNumber(0, Math.PI * 2),
                radiusBreathFreq: randomNumber(1, 3),
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
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
            pulseFrequency: getRandomIntInclusive(this.config.pulseFrequency.lower, this.config.pulseFrequency.upper),
            useSplineArcs: this.config.useSplineArcs,
            showArcNodes: this.config.showArcNodes,
            thicknessDecay: this.config.thicknessDecay,
            accentRange: {
                lower: getRandomIntInclusive(this.config.accentRange.bottom.lower, this.config.accentRange.bottom.upper),
                upper: getRandomIntInclusive(this.config.accentRange.top.lower, this.config.accentRange.top.upper),
            },
            blurRange: {
                lower: getRandomIntInclusive(this.config.blurRange.bottom.lower, this.config.blurRange.bottom.upper),
                upper: getRandomIntInclusive(this.config.blurRange.top.lower, this.config.blurRange.top.upper),
            },
            featherTimes: getRandomIntInclusive(this.config.featherTimes.lower, this.config.featherTimes.upper),
            arcs,
        };
    }

    #generateForks(forks, depth, jaggedness, segments) {
        if (depth <= 0) return;
        const forkSegments = Math.max(3, Math.floor(segments * 0.6));
        const forkJags = [];
        for (let s = 0; s < forkSegments; s++) {
            forkJags.push({
                offsetX: randomNumber(-jaggedness * 0.7, jaggedness * 0.7),
                offsetY: randomNumber(-jaggedness * 0.7, jaggedness * 0.7),
                phaseX: randomNumber(0, Math.PI * 2),
                phaseY: randomNumber(0, Math.PI * 2),
            });
        }
        forks.push({
            branchPoint: randomNumber(0.3, 0.7),
            angleDelta: randomNumber(-40, 40),
            lengthFactor: randomNumber(0.3, 0.6),
            segments: forkSegments,
            jags: forkJags,
        });
        this.#generateForks(forks, depth - 1, jaggedness * 0.7, forkSegments);
    }

    #computeArcPath(arc, centerPos, currentFrame, numberOfFrames) {
        const progress = (currentFrame % numberOfFrames) / numberOfFrames;
        const rotAngle = progress * this.data.speed * arc.speedMult * 360;
        const pulse = findValue(0.6, 1.4, this.data.pulseFrequency, numberOfFrames, currentFrame);
        const radiusBreath = 0.8 + 0.3 * Math.sin(arc.radiusBreathPhase + progress * Math.PI * 2 * arc.radiusBreathFreq) + 0.15 * Math.sin(arc.radiusBreathPhase * 1.7 + progress * Math.PI * 2 * arc.radiusBreathFreq * 2.5);
        const arcRadius = arc.radius * pulse * radiusBreath;

        const startPos = findPointByAngleAndCircle(centerPos, arc.startAngle + rotAngle, arcRadius);
        const endPos = findPointByAngleAndCircle(centerPos, arc.endAngle + rotAngle, arcRadius);

        const points = [];
        for (let s = 0; s <= arc.segments; s++) {
            const t = s / arc.segments;
            const baseX = startPos.x + (endPos.x - startPos.x) * t;
            const baseY = startPos.y + (endPos.y - startPos.y) * t;

            if (s > 0 && s < arc.segments && arc.jags[s]) {
                const jag = arc.jags[s];
                const wobbleX = jag.offsetX * 1.5 * Math.sin(jag.phaseX + progress * Math.PI * 2 * this.data.speed);
                const wobbleY = jag.offsetY * 1.5 * Math.cos(jag.phaseY + progress * Math.PI * 2 * this.data.speed);
                points.push({x: baseX + wobbleX * pulse, y: baseY + wobbleY * pulse});
            } else {
                points.push({x: baseX, y: baseY});
            }
        }
        return points;
    }

    async #drawArcOnCanvas(canvas, arc, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const points = this.#computeArcPath(arc, centerPos, currentFrame, numberOfFrames);
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const baseThickness = isUnderlay
            ? this.data.stroke + this.data.thickness + theAccentGaston
            : this.data.thickness;

        if (this.data.useSplineArcs && points.length >= 3) {
            await canvas.drawSpline(points, 0.5, baseThickness, color, 0, color, false);
        } else {
            for (let i = 1; i < points.length; i++) {
                const t = i / (points.length - 1);
                const decay = 1 - this.data.thicknessDecay * t;
                const segThickness = baseThickness * Math.max(0.2, decay);
                await canvas.drawLine2d(points[i - 1], points[i], segThickness, color, 0, color);
            }
        }

        if (this.data.showArcNodes && points.length >= 2) {
            const progress = (currentFrame % numberOfFrames) / numberOfFrames;
            const nodePulse1 = 0.6 + 0.8 * Math.sin(arc.radiusBreathPhase + progress * Math.PI * 2 * 3);
            const nodePulse2 = 0.6 + 0.8 * Math.sin(arc.radiusBreathPhase + Math.PI + progress * Math.PI * 2 * 3);
            const nodeSize1 = baseThickness * 2 * nodePulse1;
            const nodeSize2 = baseThickness * 2 * nodePulse2;
            await canvas.drawRing2d(points[0], nodeSize1, baseThickness * 0.5, color, isUnderlay ? theAccentGaston * 0.3 : 0, color);
            await canvas.drawRing2d(points[points.length - 1], nodeSize2, baseThickness * 0.5, color, isUnderlay ? theAccentGaston * 0.3 : 0, color);
        }

        for (const fork of arc.forks) {
            const branchIdx = Math.floor(fork.branchPoint * points.length);
            const branchStart = points[Math.min(branchIdx, points.length - 1)];
            const mainEnd = points[points.length - 1];

            const forkEndX = branchStart.x + (mainEnd.x - branchStart.x) * fork.lengthFactor;
            const forkEndY = branchStart.y + (mainEnd.y - branchStart.y) * fork.lengthFactor;
            const forkAngleRad = fork.angleDelta * Math.PI / 180;
            const dx = forkEndX - branchStart.x;
            const dy = forkEndY - branchStart.y;
            const rotX = dx * Math.cos(forkAngleRad) - dy * Math.sin(forkAngleRad);
            const rotY = dx * Math.sin(forkAngleRad) + dy * Math.cos(forkAngleRad);
            const forkEnd = {x: branchStart.x + rotX, y: branchStart.y + rotY};

            const forkPoints = [];
            const pulse = findValue(0.7, 1.3, this.data.pulseFrequency, numberOfFrames, currentFrame);
            const forkProgress = (currentFrame % numberOfFrames) / numberOfFrames;
            for (let s = 0; s <= fork.segments; s++) {
                const t = s / fork.segments;
                const bx = branchStart.x + (forkEnd.x - branchStart.x) * t;
                const by = branchStart.y + (forkEnd.y - branchStart.y) * t;
                if (s > 0 && s < fork.segments && fork.jags[s]) {
                    const jag = fork.jags[s];
                    const wx = jag.offsetX * 1.5 * Math.sin(jag.phaseX + forkProgress * Math.PI * 2 * this.data.speed);
                    const wy = jag.offsetY * 1.5 * Math.cos(jag.phaseY + forkProgress * Math.PI * 2 * this.data.speed);
                    forkPoints.push({x: bx + wx * pulse, y: by + wy * pulse});
                } else {
                    forkPoints.push({x: bx, y: by});
                }
            }

            const forkThickness = baseThickness * 0.6;
            if (this.data.useSplineArcs && forkPoints.length >= 3) {
                await canvas.drawSpline(forkPoints, 0.5, forkThickness, color, 0, color, false);
            } else {
                for (let i = 1; i < forkPoints.length; i++) {
                    const t = i / (forkPoints.length - 1);
                    const decay = 1 - this.data.thicknessDecay * t;
                    await canvas.drawLine2d(forkPoints[i - 1], forkPoints[i], forkThickness * Math.max(0.2, decay), color, 0, color);
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

        for (const arc of this.data.arcs) {
            await this.#drawArcOnCanvas(topCanvas, arc, centerPos, currentFrame, numberOfFrames, false, 0);
            await this.#drawArcOnCanvas(bottomCanvas, arc, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);
        }

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
        return `${PlasmaCurrentEffect._displayName_}: arcs=${this.data.arcs.length}`;
    }
}

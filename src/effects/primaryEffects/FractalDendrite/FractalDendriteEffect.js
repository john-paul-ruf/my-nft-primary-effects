import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, getRandomFromArray, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';

import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {FractalDendriteConfig} from './FractalDendriteConfig.js';

export class FractalDendriteEffect extends LayerEffect {
    static _name_ = 'fractal-dendrite';
    static _displayName_ = 'Fractal Dendrite';
    static _description_ = 'Recursive fractal tree growth with branching dendrite patterns, animated branch extension and retraction with fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'fractal', 'dendrite', 'tree', 'branching', 'animated'];

    constructor({
                    name = FractalDendriteEffect._name_,
                    requiresLayer = true,
                    config = new FractalDendriteConfig({}),
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
            maxDepth: getRandomIntInclusive(this.config.maxDepth.lower, this.config.maxDepth.upper),
            branchCount: getRandomIntInclusive(this.config.branchCount.lower, this.config.branchCount.upper),
            trunkLength: getRandomIntInclusive(this.config.trunkLength.lower(this.finalSize), this.config.trunkLength.upper(this.finalSize)),
            branchShrink: this.config.branchShrink,
            branchAngleSpread: getRandomIntInclusive(this.config.branchAngleSpread.lower, this.config.branchAngleSpread.upper),
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
            growthOscillation: getRandomIntInclusive(this.config.growthOscillation.lower, this.config.growthOscillation.upper),
            useCurvedBranches: this.config.useCurvedBranches,
            tipStyle: Array.isArray(this.config.tipStyle) ? getRandomFromArray(this.config.tipStyle) : this.config.tipStyle,
            tipSize: getRandomIntInclusive(this.config.tipSize.lower, this.config.tipSize.upper),
            accentRange: {
                lower: getRandomIntInclusive(this.config.accentRange.bottom.lower, this.config.accentRange.bottom.upper),
                upper: getRandomIntInclusive(this.config.accentRange.top.lower, this.config.accentRange.top.upper),
            },
            blurRange: {
                lower: getRandomIntInclusive(this.config.blurRange.bottom.lower, this.config.blurRange.bottom.upper),
                upper: getRandomIntInclusive(this.config.blurRange.top.lower, this.config.blurRange.top.upper),
            },
            featherTimes: getRandomIntInclusive(this.config.featherTimes.lower, this.config.featherTimes.upper),
            branches: [],
        };

        this.#generateBranches(0, -90, this.data.trunkLength, 0);
    }

    #generateBranches(startAngle, direction, length, depth, pathKey = '0') {
        if (depth >= this.data.maxDepth || length < 2) return;

        const branch = {
            startAngle,
            direction,
            length,
            depth,
            pathKey,
            thicknessFactor: 1 - (depth / this.data.maxDepth) * 0.7,
            phaseOffset: randomNumber(0, Math.PI * 2),
            curveBend: randomNumber(-0.3, 0.3),
            growthPhase: randomNumber(0, Math.PI * 2),
            growthFreq: getRandomIntInclusive(1, 3),
            swayPhase: randomNumber(0, Math.PI * 2),
            swayAmp: randomNumber(3, 15),
            swayFreq: getRandomIntInclusive(1, 3),
            bendAnimPhase: randomNumber(0, Math.PI * 2),
            bendAnimAmp: randomNumber(0.1, 0.4),
        };
        this.data.branches.push(branch);

        const childLength = length * this.data.branchShrink;
        for (let i = 0; i < this.data.branchCount; i++) {
            const spread = this.data.branchAngleSpread;
            const angleOffset = ((i / (this.data.branchCount - 1 || 1)) - 0.5) * 2 * spread;
            this.#generateBranches(startAngle, direction + angleOffset, childLength, depth + 1, `${pathKey}-${i}`);
        }
    }

    async #drawLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const rootBranches = this.data.branches.filter(b => b.depth === 0);
        const angleStep = 360 / (rootBranches.length || 1);

        for (let r = 0; r < rootBranches.length; r++) {
            const rotProgress = numberOfFrames <= 1 ? 0 : currentFrame / (numberOfFrames - 1);
            const rotationAngle = rotProgress * this.data.speed * 360;
            const baseAngle = r * angleStep + rotationAngle;
            const growthProgress = findValue(0, 1, this.data.growthOscillation, numberOfFrames, currentFrame);

            await this.#drawTreeRecursive(canvas, centerPos, baseAngle - 90, this.data.trunkLength, 0, growthProgress, currentFrame, numberOfFrames, isUnderlay, theAccentGaston);
        }
    }

    async #drawTreeRecursive(canvas, pos, angle, length, depth, growthProgress, currentFrame, numberOfFrames, isUnderlay, theAccentGaston, pathKey = '0') {
        if (depth >= this.data.maxDepth || length < 2) return;

        const progress = numberOfFrames <= 1 ? 0 : currentFrame / (numberOfFrames - 1);
        const branch = this.data.branches.find(b => b.pathKey === pathKey);
        const branchGrowth = branch
            ? 0.5 + 0.35 * Math.sin(branch.growthPhase + progress * Math.PI * 2 * branch.growthFreq) + 0.2 * Math.sin(branch.growthPhase * 1.5 + progress * Math.PI * 2 * branch.growthFreq * 2)
            : growthProgress;
        const effectiveGrowth = (growthProgress + branchGrowth) / 2;
        const depthNorm = depth / this.data.maxDepth;
        const visibleLength = length * (1 - depthNorm * (1 - effectiveGrowth));
        if (visibleLength < 1) return;

        const sway = branch ? branch.swayAmp * Math.sin(branch.swayPhase + progress * Math.PI * 2 * branch.swayFreq) * depthNorm : 0;
        const angleRad = (angle + sway) * Math.PI / 180;
        const endX = pos.x + Math.cos(angleRad) * visibleLength;
        const endY = pos.y + Math.sin(angleRad) * visibleLength;

        const thicknessFactor = 1 - depthNorm * 0.7;
        const lineThickness = isUnderlay
            ? this.data.stroke + this.data.thickness * thicknessFactor + theAccentGaston
            : this.data.thickness * thicknessFactor;
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;

        const endPos = {x: endX, y: endY};

        if (this.data.useCurvedBranches && branch) {
            const perpAngle = angleRad + Math.PI / 2;
            const animatedBend = branch.curveBend + branch.bendAnimAmp * Math.sin(branch.bendAnimPhase + progress * Math.PI * 2 * 2);
            const bendOffset = visibleLength * animatedBend;
            const midX = (pos.x + endX) / 2 + Math.cos(perpAngle) * bendOffset;
            const midY = (pos.y + endY) / 2 + Math.sin(perpAngle) * bendOffset;
            const ctrl1 = {x: pos.x + (midX - pos.x) * 0.6, y: pos.y + (midY - pos.y) * 0.6};
            const ctrl2 = {x: endX + (midX - endX) * 0.6, y: endY + (midY - endY) * 0.6};
            await canvas.drawCubicBezier(pos, ctrl1, ctrl2, endPos, lineThickness, color, 0, color);
        } else {
            await canvas.drawLine2d(pos, endPos, lineThickness, color, 0, color);
        }

        const isLeaf = depth === this.data.maxDepth - 1 || (length * this.data.branchShrink) < 2;
        if (isLeaf && this.data.tipStyle !== 'none') {
            const tipSz = this.data.tipSize * thicknessFactor;
            const accentSz = isUnderlay ? tipSz + theAccentGaston : tipSz;
            if (this.data.tipStyle === 'dot') {
                await canvas.drawFilledCircle2d(endPos, accentSz, color);
            } else if (this.data.tipStyle === 'ring') {
                await canvas.drawRing2d(endPos, accentSz, lineThickness * 0.5, color, isUnderlay ? theAccentGaston * 0.3 : 0, color);
            } else if (this.data.tipStyle === 'star') {
                await canvas.drawStar2d(endPos, accentSz, accentSz * 0.4, 5, angle, lineThickness * 0.5, color);
            }
        }

        const childLength = visibleLength * this.data.branchShrink;
        for (let i = 0; i < this.data.branchCount; i++) {
            const spread = this.data.branchAngleSpread;
            const angleOffset = ((i / (this.data.branchCount - 1 || 1)) - 0.5) * 2 * spread;
            await this.#drawTreeRecursive(canvas, endPos, angle + angleOffset, childLength, depth + 1, growthProgress, currentFrame, numberOfFrames, isUnderlay, theAccentGaston, `${pathKey}-${i}`);
        }
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${FractalDendriteEffect._displayName_}: depth=${this.data.maxDepth}, branches=${this.data.branchCount}`;
    }
}

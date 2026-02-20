import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';
import {findOneWayValue} from 'my-nft-gen/src/core/math/findOneWayValue.js';
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

    #generateBranches(startAngle, direction, length, depth) {
        if (depth >= this.data.maxDepth || length < 2) return;

        const branch = {
            startAngle,
            direction,
            length,
            depth,
            thicknessFactor: 1 - (depth / this.data.maxDepth) * 0.7,
            phaseOffset: randomNumber(0, Math.PI * 2),
        };
        this.data.branches.push(branch);

        const childLength = length * this.data.branchShrink;
        for (let i = 0; i < this.data.branchCount; i++) {
            const spread = this.data.branchAngleSpread;
            const angleOffset = ((i / (this.data.branchCount - 1 || 1)) - 0.5) * 2 * spread;
            this.#generateBranches(startAngle, direction + angleOffset, childLength, depth + 1);
        }
    }

    async #drawBranch(canvas, branch, centerPos, currentFrame, numberOfFrames) {
        const growthProgress = findValue(0, 1, this.data.growthOscillation, numberOfFrames, currentFrame);
        const rotationAngle = findOneWayValue(0, this.data.speed * 360, 1, numberOfFrames, currentFrame, false);

        const depthNormalized = branch.depth / this.data.maxDepth;
        const visibleLength = branch.length * (1 - depthNormalized * (1 - growthProgress));

        if (visibleLength < 1) return;

        const angleRad = (branch.direction + rotationAngle) * Math.PI / 180;

        let parentX = centerPos.x;
        let parentY = centerPos.y;

        const ancestors = this.data.branches.filter(b => b.depth < branch.depth);
        for (const ancestor of ancestors) {
            if (ancestor.depth < branch.depth) {
                const aAngle = (ancestor.direction + rotationAngle) * Math.PI / 180;
                const aGrowth = findValue(0, 1, this.data.growthOscillation, numberOfFrames, currentFrame);
                const aDepthNorm = ancestor.depth / this.data.maxDepth;
                const aLen = ancestor.length * (1 - aDepthNorm * (1 - aGrowth));
                if (ancestor.depth === branch.depth - 1) {
                    parentX = centerPos.x + Math.cos(aAngle) * aLen;
                    parentY = centerPos.y + Math.sin(aAngle) * aLen;
                }
            }
        }

        const endX = parentX + Math.cos(angleRad) * visibleLength;
        const endY = parentY + Math.sin(angleRad) * visibleLength;

        return {
            start: {x: parentX, y: parentY},
            end: {x: endX, y: endY},
            thickness: this.data.thickness * branch.thicknessFactor,
        };
    }

    async #drawLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const rootBranches = this.data.branches.filter(b => b.depth === 0);
        const angleStep = 360 / (rootBranches.length || 1);

        for (let r = 0; r < rootBranches.length; r++) {
            const rotationAngle = findOneWayValue(0, this.data.speed * 360, 1, numberOfFrames, currentFrame, false);
            const baseAngle = r * angleStep + rotationAngle;
            const growthProgress = findValue(0, 1, this.data.growthOscillation, numberOfFrames, currentFrame);

            await this.#drawTreeRecursive(canvas, centerPos, baseAngle - 90, this.data.trunkLength, 0, growthProgress, currentFrame, numberOfFrames, isUnderlay, theAccentGaston);
        }
    }

    async #drawTreeRecursive(canvas, pos, angle, length, depth, growthProgress, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        if (depth >= this.data.maxDepth || length < 2) return;

        const depthNorm = depth / this.data.maxDepth;
        const visibleLength = length * (1 - depthNorm * (1 - growthProgress));
        if (visibleLength < 1) return;

        const angleRad = angle * Math.PI / 180;
        const endX = pos.x + Math.cos(angleRad) * visibleLength;
        const endY = pos.y + Math.sin(angleRad) * visibleLength;

        const thicknessFactor = 1 - depthNorm * 0.7;
        const lineThickness = isUnderlay
            ? this.data.stroke + this.data.thickness * thicknessFactor + theAccentGaston
            : this.data.thickness * thicknessFactor;
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;

        await canvas.drawLine2d(pos, {x: endX, y: endY}, lineThickness, color, 0, color);

        const childLength = visibleLength * this.data.branchShrink;
        for (let i = 0; i < this.data.branchCount; i++) {
            const spread = this.data.branchAngleSpread;
            const angleOffset = ((i / (this.data.branchCount - 1 || 1)) - 0.5) * 2 * spread;
            await this.#drawTreeRecursive(canvas, {x: endX, y: endY}, angle + angleOffset, childLength, depth + 1, growthProgress, currentFrame, numberOfFrames, isUnderlay, theAccentGaston);
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

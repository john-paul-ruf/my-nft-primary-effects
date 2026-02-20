import {LayerEffect} from 'my-nft-gen/src/core/layer/LayerEffect.js';
import {Canvas2dFactory} from 'my-nft-gen/src/core/factory/canvas/Canvas2dFactory.js';
import {getRandomIntInclusive, randomNumber} from 'my-nft-gen/src/core/math/random.js';
import {findValue} from 'my-nft-gen/src/core/math/findValue.js';
import {Settings} from 'my-nft-gen/src/core/Settings.js';
import {NeuralMeshConfig} from './NeuralMeshConfig.js';

export class NeuralMeshEffect extends LayerEffect {
    static _name_ = 'neural-mesh';
    static _displayName_ = 'Neural Mesh';
    static _description_ = 'Neural network visualization with pulsing neurons and weighted synaptic connections with fuzz';
    static _version_ = '1.0.0';
    static _author_ = 'Zencoder';
    static _tags_ = ['effect', 'primary', 'neural', 'network', 'mesh', 'synapse', 'animated'];

    constructor({
                    name = NeuralMeshEffect._name_,
                    requiresLayer = true,
                    config = new NeuralMeshConfig({}),
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

        const neuronCount = getRandomIntInclusive(this.config.neuronCount.lower, this.config.neuronCount.upper);
        const fieldRadius = getRandomIntInclusive(this.config.fieldRadius.lower(this.finalSize), this.config.fieldRadius.upper(this.finalSize));
        const connectionMaxDist = getRandomIntInclusive(this.config.connectionMaxDist.lower, this.config.connectionMaxDist.upper);
        const maxConnections = getRandomIntInclusive(this.config.maxConnections.lower, this.config.maxConnections.upper);

        const neurons = [];
        for (let i = 0; i < neuronCount; i++) {
            const angle = randomNumber(0, 360);
            const dist = randomNumber(0, fieldRadius);
            neurons.push({
                offsetX: Math.cos(angle * Math.PI / 180) * dist,
                offsetY: Math.sin(angle * Math.PI / 180) * dist,
                radius: randomNumber(this.config.neuronRadius.lower, this.config.neuronRadius.upper),
                pulsePhase: randomNumber(0, Math.PI * 2),
                driftPhaseX: randomNumber(0, Math.PI * 2),
                driftPhaseY: randomNumber(0, Math.PI * 2),
                driftAmp: randomNumber(2, 8),
            });
        }

        const connections = [];
        for (let i = 0; i < neuronCount; i++) {
            const dists = [];
            for (let j = 0; j < neuronCount; j++) {
                if (i === j) continue;
                const dx = neurons[i].offsetX - neurons[j].offsetX;
                const dy = neurons[i].offsetY - neurons[j].offsetY;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < connectionMaxDist) {
                    dists.push({index: j, dist: d});
                }
            }
            dists.sort((a, b) => a.dist - b.dist);
            const count = Math.min(maxConnections, dists.length);
            for (let c = 0; c < count; c++) {
                const key = [Math.min(i, dists[c].index), Math.max(i, dists[c].index)].join('-');
                if (!connections.find(conn => conn.key === key)) {
                    connections.push({
                        key,
                        from: i,
                        to: dists[c].index,
                        weight: randomNumber(0.3, 1),
                        signalPhase: randomNumber(0, Math.PI * 2),
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
            neurons,
            connections,
            fieldRadius,
            pulseFrequency: getRandomIntInclusive(this.config.pulseFrequency.lower, this.config.pulseFrequency.upper),
            speed: getRandomIntInclusive(this.config.speed.lower, this.config.speed.upper),
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

    #getNeuronPos(neuron, centerPos, currentFrame, numberOfFrames) {
        const progress = (currentFrame % numberOfFrames) / numberOfFrames;
        const driftX = neuron.driftAmp * Math.sin(neuron.driftPhaseX + progress * Math.PI * 2 * this.data.speed);
        const driftY = neuron.driftAmp * Math.sin(neuron.driftPhaseY + progress * Math.PI * 2 * this.data.speed);
        return {
            x: centerPos.x + neuron.offsetX + driftX,
            y: centerPos.y + neuron.offsetY + driftY,
        };
    }

    async #drawMeshLayer(canvas, centerPos, currentFrame, numberOfFrames, isUnderlay, theAccentGaston) {
        const color = isUnderlay ? this.data.outerColor : this.data.innerColor;
        const lineWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;
        const pulse = findValue(0.7, 1.3, this.data.pulseFrequency, numberOfFrames, currentFrame);

        for (const conn of this.data.connections) {
            const fromPos = this.#getNeuronPos(this.data.neurons[conn.from], centerPos, currentFrame, numberOfFrames);
            const toPos = this.#getNeuronPos(this.data.neurons[conn.to], centerPos, currentFrame, numberOfFrames);
            const connWidth = lineWidth * conn.weight;

            await canvas.drawLine2d(fromPos, toPos, connWidth, color, isUnderlay ? theAccentGaston * 0.2 : 0, color);
        }

        for (const neuron of this.data.neurons) {
            const pos = this.#getNeuronPos(neuron, centerPos, currentFrame, numberOfFrames);
            const neuronPulse = 0.8 + 0.4 * Math.sin(neuron.pulsePhase + ((currentFrame % numberOfFrames) / numberOfFrames) * Math.PI * 2 * this.data.pulseFrequency);
            const r = neuron.radius * neuronPulse * pulse;
            const ringWidth = isUnderlay ? this.data.thickness + theAccentGaston : this.data.thickness;

            await canvas.drawRing2d(pos, r, ringWidth, color, isUnderlay ? theAccentGaston * 0.5 : 0, color);
        }
    }

    async invoke(layer, currentFrame, numberOfFrames) {
        const centerPos = this.data.center.getPosition(currentFrame, numberOfFrames);
        const theAccentGaston = findValue(this.data.accentRange.lower, this.data.accentRange.upper, this.data.featherTimes, numberOfFrames, currentFrame);
        const theBlurGaston = Math.ceil(findValue(this.data.blurRange.lower, this.data.blurRange.upper, this.data.featherTimes, numberOfFrames, currentFrame));

        const topCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);
        const bottomCanvas = await Canvas2dFactory.getNewCanvas(this.data.width, this.data.height);

        await this.#drawMeshLayer(topCanvas, centerPos, currentFrame, numberOfFrames, false, 0);
        await this.#drawMeshLayer(bottomCanvas, centerPos, currentFrame, numberOfFrames, true, theAccentGaston);

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
        return `${NeuralMeshEffect._displayName_}: neurons=${this.data.neurons.length}, connections=${this.data.connections.length}`;
    }
}

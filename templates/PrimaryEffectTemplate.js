/**
 * Primary Effect Template
 * 
 * Copy this file and the accompanying [EffectName]Config.js to create new primary effects.
 * Primary effects form the foundation of generated artwork.
 * 
 * This template demonstrates:
 * - Extending LayerEffect for integration with my-nft-gen framework
 * - Proper static metadata (_name_, _displayName_, etc.)
 * - Frame-by-frame rendering via the invoke() method
 * - Configuration management with EffectConfig
 * - Error handling and validation
 * 
 * File naming convention: 
 *   - [EffectName]Effect.js (this file)
 *   - [EffectName]Config.js (companion file)
 *   - Located in: src/effects/primaryEffects/[EffectName]/
 */

import { LayerEffect } from 'my-nft-gen/src/core/layer/LayerEffect.js';
import { Settings } from 'my-nft-gen/src/core/Settings.js';

/**
 * YourEffectNameEffect - A description of what your effect does
 * 
 * @class YourEffectNameEffect
 * @extends LayerEffect
 * @description This is a template for creating primary effects. Replace "YourEffectName"
 *              with your actual effect name and customize the implementation.
 *              
 * @example
 * // Basic usage
 * const effect = new YourEffectNameEffect({
 *   config: new YourEffectNameConfig({ intensity: 0.8 }),
 *   settings: new Settings()
 * });
 * await effect.invoke(layer, 0, 100);
 */
export class YourEffectNameEffect extends LayerEffect {
  // Static metadata - required for registration
  static _name_ = 'your-effect-name';
  static _displayName_ = 'Your Effect Name';
  static _description_ = 'A description of what your effect does';
  static _version_ = '1.0.0';
  static _author_ = 'Your Name';
  static _tags_ = ['effect', 'primary', 'custom'];
  
  // Presets - predefined configurations for common use cases
  static presets = [];
  
  /**
   * Get all available presets for this effect
   * 
   * @static
   * @returns {Array<Object>} Array of preset definitions
   * 
   * @example
   * const presets = YourEffectNameEffect.getPresets();
   * // Returns: [{ name: 'intense', effect: 'your-effect-name', percentChance: 100, currentEffectConfig: {...} }]
   */
  static getPresets() {
    return this.presets || [];
  }
  
  /**
   * Get a specific preset by name
   * 
   * @static
   * @param {string} presetName - Name of the preset
   * @returns {Object|null} Preset definition or null if not found
   * 
   * @example
   * const preset = YourEffectNameEffect.getPreset('intense');
   * if (preset) {
   *   const effect = new YourEffectNameEffect({ config: preset.currentEffectConfig });
   * }
   */
  static getPreset(presetName) {
    return this.presets?.find(p => p.name === presetName) || null;
  }
  
  /**
   * Get a random preset based on percentChance weights
   * Useful for procedural generation with weighted randomness
   * 
   * @static
   * @returns {Object|null} Randomly selected preset or null if no presets
   * 
   * @example
   * const randomPreset = YourEffectNameEffect.getRandomPreset();
   * // 50% chance to get 'intense', 50% chance to get 'subtle'
   */
  static getRandomPreset() {
    if (!this.presets || this.presets.length === 0) return null;
    
    const totalChance = this.presets.reduce((sum, p) => sum + (p.percentChance || 0), 0);
    let random = Math.random() * totalChance;
    
    for (const preset of this.presets) {
      random -= (preset.percentChance || 0);
      if (random <= 0) return preset;
    }
    
    return this.presets[this.presets.length - 1];
  }

  /**
   * Creates an instance of YourEffectNameEffect
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.name - Effect name (defaults to _name_)
   * @param {YourEffectNameConfig} options.config - Effect configuration
   * @param {Settings} options.settings - Framework settings
   * @param {number} options.frameNumber - Current frame number (0-based)
   * @param {number} options.totalFrames - Total number of frames in sequence
   * @param {Array<LayerEffect>} options.additionalEffects - Chained effects (optional)
   * @param {boolean} options.ignoreAdditionalEffects - Skip additional effects (default: false)
   */
  constructor({
    name = YourEffectNameEffect._name_,
    config,
    settings = new Settings({}),
    frameNumber = 0,
    totalFrames = 1,
    additionalEffects = [],
    ignoreAdditionalEffects = false,
    ...rest
  } = {}) {
    super({
      name,
      config,
      settings,
      additionalEffects,
      ignoreAdditionalEffects,
      ...rest
    });

    this.frameNumber = frameNumber;
    this.totalFrames = totalFrames;
  }

  /**
   * Calculate animation progress (0 to 1)
   * Useful for animating parameters across frames
   * 
   * @returns {number} Progress from 0 to 1
   * @protected
   */
  getProgress() {
    if (this.totalFrames <= 1) return 0;
    return this.frameNumber / (this.totalFrames - 1);
  }

  /**
   * Apply the effect to a layer
   * 
   * This is the main entry point called by the framework for each frame.
   * Override this to implement your effect logic.
   * 
   * @async
   * @param {Object} layer - The layer being rendered (contains canvas/image context)
   * @param {number} currentFrame - Current frame number (0-based)
   * @param {number} numberOfFrames - Total number of frames
   * @returns {Promise<void>}
   * @throws {Error} If configuration is invalid
   * 
   * @example
   * async invoke(layer, currentFrame, numberOfFrames) {
   *   const progress = this.getProgress();
   *   // Implement your effect logic here
   *   // Draw patterns, manipulate pixels, etc.
   *   await super.invoke(layer, currentFrame, numberOfFrames);
   * }
   */
  async invoke(layer, currentFrame, numberOfFrames) {
    try {
      // Validate configuration before applying
      const validation = YourEffectNameConfig.validate(this.config);
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      const progress = this.getProgress();

      // Implement your effect logic here
      // Example: draw patterns, manipulate pixels, etc.
      console.log(this.getInfo());

      // Always call super.invoke() at the end to support chained effects
      await super.invoke(layer, currentFrame, numberOfFrames);

    } catch (error) {
      console.error(`Error in ${this._name_}:`, error);
      throw error;
    }
  }

  /**
   * Get a human-readable description of the effect's current state
   * Useful for debugging and logging
   * 
   * @returns {string} Description including effect name and key config values
   */
  getInfo() {
    return `${this._displayName_} (${this._name_}): intensity=${this.config.intensity || 'N/A'}`;
  }

  /**
   * Validate the effect configuration
   * 
   * @static
   * @param {YourEffectNameConfig} config - Configuration to validate
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  static validate(config) {
    const errors = [];

    if (!config) {
      errors.push('Configuration is required');
      return { valid: false, errors };
    }

    // Add your validation logic here
    // Example:
    // if (config.intensity !== undefined && (config.intensity < 0 || config.intensity > 1)) {
    //   errors.push('intensity must be between 0 and 1');
    // }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Configuration class for YourEffectNameEffect
 * Manages all effect parameters and their validation
 */
export class YourEffectNameConfig {
  /**
   * Creates a configuration instance
   * 
   * @param {Object} options - Configuration options
   * @param {number} options.intensity - Effect intensity (0-1), default: 0.5
   * @param {string} options.color - Hex color code, default: '#FF0000'
   */
  constructor({
    intensity = 0.5,
    color = '#FF0000'
  } = {}) {
    this.intensity = intensity;
    this.color = color;
  }

  /**
   * Validate this configuration instance
   * 
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  validate() {
    return YourEffectNameConfig.validate(this);
  }

  /**
   * Static validation method
   * 
   * @static
   * @param {YourEffectNameConfig} config - Configuration to validate
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  static validate(config) {
    const errors = [];

    if (config.intensity !== undefined) {
      if (typeof config.intensity !== 'number' || config.intensity < 0 || config.intensity > 1) {
        errors.push('intensity must be a number between 0 and 1');
      }
    }

    if (config.color !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(config.color)) {
        errors.push('color must be a valid hex color code (#RRGGBB)');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}